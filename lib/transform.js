/**
 * 输出流后处理：在 `llm/stream` 瀑布上包一层，直接改写模型正文。
 *
 * 三种模式：
 *   smart  —— 先缓冲一小段判断意图：命中工具调用就整轮放行，是正文就立刻加壳（默认）
 *   always —— 第一个文本增量就加壳，最激进
 *   buffer —— 整段收完再改写，能跳过工具轮次、能做完整膨胀，代价是不流式
 *
 * 关键协议事实：dsh-llm 的 BlockAssembler 在收到 block-end 时，以
 * `chunk.block` 为准（见 assemble()），增量拼出来的 text 会被覆盖。
 * 所以改正文必须**同时**改 text-delta 与 block-end.block.text，只改一处会白干。
 */
import { resolveBand } from './config.js';
import { expandText, buildShell, createRng } from './render.js';

const MAX_BUFFER_CHARS = 200_000;
/** smart 模式最多压住多少个 chunk；reasoning 很长时不能无限攒。 */
const MAX_BUFFERED_CHUNKS = 400;

const isTextDelta = (chunk) => chunk?.type === 'text-delta' && typeof chunk.text === 'string';
const isTextBlockEnd = (chunk) => chunk?.type === 'block-end' && chunk.block?.type === 'text';
const isToolDelta = (chunk) => chunk?.type === 'tool-call-delta';
const isFinish = (chunk) => chunk?.type === 'finish';

/** 后缀作为一个独立文本块追加，块内容自洽，不会被别的块覆盖。 */
function suffixChunks(suffix, index) {
  if (!Array.isArray(suffix) || suffix.length === 0) return [];
  const text = suffix.join('\n\n');
  return [
    { type: 'block-start', index, blockType: 'text' },
    { type: 'text-delta', index, text },
    { type: 'block-end', index, block: { type: 'text', text } },
  ];
}

/**
 * 包一层流。
 * @param streamFactory - 返回上游 chunk 流的函数
 * @param cfg - 归一化配置
 * @param hooks - 可选：onDecide / onApply 回调，仅用于日志
 */
export async function* transformStream(streamFactory, cfg, hooks = {}) {
  // 防御性直通：调用方漏判开关时，这里也不能改内容
  if (!shouldTransform(cfg)) {
    yield* await streamFactory();
    return;
  }
  const upstream = await streamFactory();
  const iterator = upstream[Symbol.asyncIterator]();
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    try { await iterator.return?.(); } catch { /* 保留原始错误 */ }
  };

  const mode = cfg.mode === 'always' || cfg.mode === 'buffer' ? cfg.mode : 'smart';
  const seed = cfg.seed && cfg.seed > 0 ? cfg.seed : Math.floor(Math.random() * 1e9);
  const shell = buildShell(cfg, createRng(seed));

  let toolSeen = false;
  let decided = mode === 'always';
  let garnish = mode === 'always';
  let nextIndex = 0;
  let firstTextIndex = -1;
  let prefix = '';
  let prefixIndex = -1;
  let buffered = [];
  let collected = '';
  let collectedChunks = [];
  let collectedIndex = -1;
  let heldBlockEnd = null;
  let suffixDone = false;
  let sawText = false;
  let bufferOverflow = false;

  const noteIndex = (index) => {
    if (typeof index === 'number' && Number.isFinite(index) && index >= nextIndex) nextIndex = index + 1;
  };

  /** 打开第一个文本块时注入前置：改增量 + 记住要改 block-end。 */
  const openWithPrefix = (chunk) => {
    prefix = shell.prefix;
    prefixIndex = chunk.index;
    return { ...chunk, text: `${prefix}\n\n${chunk.text}` };
  };

  /** 把前缀补进 block-end 的权威文本里。 */
  const closeWithPrefix = (chunk) => {
    if (!prefix || chunk.index !== prefixIndex) return chunk;
    return { ...chunk, block: { ...chunk.block, text: `${prefix}\n\n${chunk.block.text ?? ''}` } };
  };

  /** buffer 模式的收尾：工具轮原样回放，否则整段膨胀。 */
  function flushBuffer() {
    if (!collected) {
      if (heldBlockEnd) { const end = heldBlockEnd; heldBlockEnd = null; return [end]; }
      return [];
    }
    if (cfg.skipToolTurns && toolSeen) {
      const replay = [...collectedChunks];
      const end = heldBlockEnd;
      collected = '';
      collectedChunks = [];
      heldBlockEnd = null;
      return end ? [...replay, end] : replay;
    }
    const expanded = expandText(collected, cfg, createRng(seed));
    const end = heldBlockEnd
      ? { ...heldBlockEnd, block: { ...heldBlockEnd.block, text: expanded } }
      : null;
    const delta = { type: 'text-delta', index: collectedIndex, text: expanded };
    hooks.onApply?.({ mode, chars: expanded.length });
    collected = '';
    collectedChunks = [];
    heldBlockEnd = null;
    return end ? [delta, end] : [delta];
  }

  try {
    while (true) {
      const step = await iterator.next();
      if (step.done) {
        if (mode === 'buffer' && (collected || heldBlockEnd)) {
          for (const item of flushBuffer()) yield item;
        }
        // 上游没给 finish 就结束（畸形/被截断）：不能把压住的块吞掉
        if (mode === 'smart' && !decided) {
          for (const item of buffered) yield item;
          buffered = [];
        }
        break;
      }

      const chunk = step.value;
      if (!chunk || typeof chunk !== 'object') { yield chunk; continue; }
      noteIndex(chunk.index);
      if (isToolDelta(chunk)) toolSeen = true;

      // ── buffer：整段收完再膨胀 ─────────────────────────────
      // 工具调用通常出现在文本块之后，所以 block-end 也要压住，等 finish 再决定。
      if (mode === 'buffer') {
        if (isTextDelta(chunk)) {
          if (bufferOverflow) { yield chunk; continue; }
          if (collectedIndex === -1) collectedIndex = chunk.index;
          if (chunk.index === collectedIndex) {
            collected += chunk.text;
            collectedChunks.push(chunk);
            if (collected.length > MAX_BUFFER_CHARS) {
              bufferOverflow = true;
              for (const item of collectedChunks) yield item;
              collected = '';
              collectedChunks = [];
            }
            continue;
          }
          yield chunk;
          continue;
        }
        if (isTextBlockEnd(chunk) && chunk.index === collectedIndex && collected) {
          heldBlockEnd = chunk;
          continue;
        }
        if (isFinish(chunk)) {
          for (const item of flushBuffer()) yield item;
          yield chunk;
          continue;
        }
        yield chunk;
        continue;
      }

      // ── smart：先判断这是正文还是工具轮 ─────────────────────
      if (mode === 'smart' && !decided) {
        buffered.push(chunk);
        if (isTextDelta(chunk)) collected += chunk.text;
        const enough = collected.length >= cfg.streamGuardChars || buffered.length >= MAX_BUFFERED_CHUNKS;
        if (isFinish(chunk) || toolSeen || enough) {
          decided = true;
          garnish = !(cfg.skipToolTurns && toolSeen) && collected.trim().length > 0;
          hooks.onDecide?.({ garnish, toolSeen, chars: collected.length });
          for (const item of buffered) {
            if (isFinish(item)) {
              if (garnish && sawText && !(cfg.skipToolTurns && toolSeen) && !suffixDone) {
                yield* suffixChunks(shell.suffix, nextIndex);
                suffixDone = true;
              }
              yield item;
              continue;
            }
            if (isTextDelta(item) && item.text.trim()) sawText = true;
            if (garnish && isTextDelta(item) && !prefix && item.text.trim()) { yield openWithPrefix(item); continue; }
            if (garnish && isTextBlockEnd(item) && prefix) { yield closeWithPrefix(item); continue; }
            yield item;
          }
          buffered = [];
          continue;
        }
        continue;
      }

      // ── always / 已判定的 smart：边流边加壳 ─────────────────
      if (isTextDelta(chunk)) {
        // 空增量先放过去，等真有字了再落前缀
        if (chunk.text.trim()) sawText = true;
        if (garnish && !prefix && chunk.text.trim()) { yield openWithPrefix(chunk); continue; }
        yield chunk;
        continue;
      }

      if (isTextBlockEnd(chunk)) {
        yield garnish ? closeWithPrefix(chunk) : chunk;
        continue;
      }

      if (isFinish(chunk)) {
        const failed = chunk.reason?.kind === 'error';
        const toolTurn = cfg.skipToolTurns && toolSeen;
        if (garnish && sawText && !failed && !toolTurn && !suffixDone) {
          yield* suffixChunks(shell.suffix, nextIndex);
          suffixDone = true;
          hooks.onApply?.({ mode, chars: collected.length });
        }
        yield chunk;
        continue;
      }

      yield chunk;
    }
  } finally {
    await close();
  }
}

/** 判断这一轮要不要接管：总开关、后处理开关都为真且强度大于 0。 */
export function shouldTransform(cfg) {
  return Boolean(cfg?.enabled && cfg?.transformEnabled && resolveBand(cfg) !== 'off');
}
