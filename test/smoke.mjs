/**
 * 冒烟测试：不依赖 DSH 运行时，直接验证渲染器与流改写器的协议正确性。
 * 运行：node test/smoke.mjs
 */
import assert from 'node:assert/strict';
import { DEFAULTS, normalizeConfig } from '../lib/config.js';
import { expandText, previewSample } from '../lib/render.js';
import { LEXICON } from '../lib/lexicon.js';
import { promptSectionText } from '../lib/prompt.js';
import { transformStream, shouldTransform } from '../lib/transform.js';

/** 极简块装配器，规则照抄 dsh-llm 的 BlockAssembler。 */
function assemble(chunks) {
  const partials = new Map();
  const order = [];
  let finish;
  const closed = new Set();
  for (const chunk of chunks) {
    switch (chunk.type) {
      case 'block-start':
        if (!partials.has(chunk.index)) {
          order.push(chunk.index);
          partials.set(chunk.index, { blockType: chunk.blockType, text: '' });
        }
        break;
      case 'text-delta': {
        if (closed.has(chunk.index)) throw new Error(`text-delta after block-end at ${chunk.index}`);
        let partial = partials.get(chunk.index);
        if (!partial) {
          partial = { blockType: 'text', text: '' };
          partials.set(chunk.index, partial);
          order.push(chunk.index);
        }
        partial.text += chunk.text;
        break;
      }
      case 'block-end':
        closed.add(chunk.index);
        partials.set(chunk.index, { blockType: chunk.block.type, text: chunk.block.text ?? '' });
        break;
      case 'finish':
        finish = chunk.reason;
        break;
      default:
        break;
    }
  }
  return { text: order.map((i) => partials.get(i)?.text ?? '').join(''), finish };
}

async function* fromArray(items) {
  for (const item of items) yield item;
}

function textStream(parts, { tool = false } = {}) {
  const chunks = [{ type: 'block-start', index: 0, blockType: 'text' }];
  for (const part of parts) chunks.push({ type: 'text-delta', index: 0, text: part });
  chunks.push({ type: 'block-end', index: 0, block: { type: 'text', text: parts.join('') } });
  if (tool) chunks.push({ type: 'tool-call-delta', index: 1, id: 't1', name: 'bash', argumentsDelta: '{"cmd":"ls"}' });
  chunks.push({ type: 'usage', usage: { inputTokens: 1, outputTokens: 1 } });
  chunks.push({ type: 'finish', reason: { kind: tool ? 'tool-calls' : 'stop' } });
  return chunks;
}

async function collect(gen) {
  const out = [];
  for await (const chunk of gen) out.push(chunk);
  return out;
}

const cfg = normalizeConfig({ ...DEFAULTS, seed: 12345 });

// 1. 渲染器：结构齐全
{
  const text = previewSample(cfg);
  assert.ok(text.includes('最'), '前置排比缺失');
  assert.ok(
    LEXICON.negation_items.some((item) => text.includes(item)),
    '边界承诺缺失（词库里的否定项一个都没出现）',
  );
  assert.ok(text.length > 400, '膨胀后太短');
  console.log('[1] 渲染器 OK，长度', text.length);
}

// 2. 强度 0 = 完全关闭
{
  const off = expandText('正文。', normalizeConfig({ ...DEFAULTS, level: 'off' }), undefined);
  assert.equal(off.trim(), '正文。');
  assert.equal(shouldTransform(normalizeConfig({ ...DEFAULTS, level: 'off' })), false);
  console.log('[2] 强度 0 关闭 OK');
}

// 3. smart 模式：正文加壳，协议合法
{
  const raw = textStream(['HTTP 三次握手', '是确认双方收发能力', '的过程。']);
  const out = await collect(transformStream(() => fromArray(raw), cfg));
  const msg = assemble(out);
  assert.ok(msg.text.startsWith('我') || msg.text.includes('最'), '前缀没注入');
  assert.ok(msg.text.includes('不'), '后缀没注入');
  assert.ok(msg.text.length > 'HTTP 三次握手是确认双方收发能力的过程。'.length * 2, '后缀太短');
  assert.equal(msg.finish.kind, 'stop');
  console.log('[3] smart 正文加壳 OK，长度', msg.text.length);
}

// 4. smart 模式：工具轮次跳过
{
  const raw = textStream(['我先看看目录。'], { tool: true });
  const out = await collect(transformStream(() => fromArray(raw), cfg));
  const msg = assemble(out);
  assert.equal(msg.text, '我先看看目录。', '工具轮次被误加壳');
  console.log('[4] smart 工具轮跳过 OK');
}

// 5. buffer 模式：完整膨胀
{
  const raw = textStream(['第一段内容。', '第二段内容。']);
  const out = await collect(transformStream(() => fromArray(raw), { ...cfg, mode: 'buffer' }));
  const msg = assemble(out);
  assert.ok(msg.text.includes('最'), 'buffer 模式没膨胀');
  assert.ok(msg.text.includes('第二段内容'), 'buffer 模式丢了正文');
  console.log('[5] buffer 完整膨胀 OK，长度', msg.text.length);
}

// 6. always 模式：立即加壳
{
  const raw = textStream(['一句话。']);
  const out = await collect(transformStream(() => fromArray(raw), { ...cfg, mode: 'always' }));
  const msg = assemble(out);
  assert.ok(msg.text.includes('一句话。'));
  assert.ok(msg.text.includes('不'), 'always 模式没加后缀');
  console.log('[6] always 模式 OK');
}

// 7. 系统提示：关闭时不产出
{
  assert.equal(promptSectionText(normalizeConfig({ ...DEFAULTS, promptEnabled: false })), '');
  const text = promptSectionText(cfg);
  assert.ok(text.includes('豆包语'));
  assert.ok(text.includes('排比'));
  console.log('[7] 提示词 OK，长度', text.length);
}

// 8. 确定性：同 seed 同输出
{
  const a = previewSample(cfg);
  const b = previewSample(cfg);
  assert.equal(a, b);
  console.log('[8] 种子可复现 OK');
}

console.log('\n全部通过。');
