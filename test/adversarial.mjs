/**
 * 对抗测试：专挑边界与协议畸形输入。
 * 运行：node test/adversarial.mjs
 */
import assert from 'node:assert/strict';
import { DEFAULTS, normalizeConfig, scaleByIntensity, splitLines, splitPurposes } from '../lib/config.js';
import { expandText, previewSample } from '../lib/render.js';
import { transformStream } from '../lib/transform.js';

let passed = 0;
const fails = [];
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    fails.push([name, error]);
    console.log(`FAIL  ${name}: ${error.message}`);
  }
}
async function checkAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    fails.push([name, error]);
    console.log(`FAIL  ${name}: ${error.message}`);
  }
}

const base = (over = {}) => normalizeConfig({ ...DEFAULTS, seed: 7, ...over });

async function* gen(items) {
  for (const item of items) yield item;
}
async function collect(stream) {
  const out = [];
  for await (const chunk of stream) out.push(chunk);
  return out;
}
/** 按 BlockAssembler 语义还原最终文本。 */
function assemble(chunks) {
  const partials = new Map();
  const order = [];
  const closed = new Set();
  let finish;
  for (const chunk of chunks) {
    if (chunk.type === 'block-start') {
      if (!partials.has(chunk.index)) { order.push(chunk.index); partials.set(chunk.index, { text: '' }); }
    } else if (chunk.type === 'text-delta') {
      assert.ok(!closed.has(chunk.index), `text-delta after block-end at ${chunk.index}`);
      if (!partials.has(chunk.index)) { order.push(chunk.index); partials.set(chunk.index, { text: '' }); }
      partials.get(chunk.index).text += chunk.text;
    } else if (chunk.type === 'block-end') {
      closed.add(chunk.index);
      partials.set(chunk.index, { text: chunk.block.text ?? '' });
    } else if (chunk.type === 'finish') {
      finish = chunk.reason;
    }
  }
  return { text: order.map((i) => partials.get(i)?.text ?? '').join(''), finish };
}

const textBlock = (parts, { tool = false, reason = 'stop' } = {}) => {
  const chunks = [{ type: 'block-start', index: 0, blockType: 'text' }];
  for (const part of parts) chunks.push({ type: 'text-delta', index: 0, text: part });
  chunks.push({ type: 'block-end', index: 0, block: { type: 'text', text: parts.join('') } });
  if (tool) chunks.push({ type: 'tool-call-delta', index: 1, id: 'c1', name: 'bash', argumentsDelta: '{}' });
  chunks.push({ type: 'usage', usage: { inputTokens: 1, outputTokens: 1 } });
  chunks.push({ type: 'finish', reason: { kind: reason } });
  return chunks;
};

console.log('\n[transform]');
await checkAsync('T01 纯文本：前缀同时进入 delta 与 block.text', async () => {
  const out = await collect(transformStream(() => gen(textBlock(['你好世界。'])), base()));
  const msg = assemble(out);
  assert.ok(msg.text.startsWith('我') || msg.text.includes('最'), '前缀缺失');
  const end = out.find((c) => c.type === 'block-end' && c.index === 0);
  assert.ok(end.block.text.includes('最'), 'block.text 未改，会被覆盖');
  assert.equal(msg.finish.kind, 'stop');
});

await checkAsync('T02 工具轮（先工具后文本）不加壳', async () => {
  const chunks = [
    { type: 'tool-call-delta', index: 0, id: 'c1', name: 'bash', argumentsDelta: '{}' },
    { type: 'block-end', index: 0, block: { type: 'tool-call', id: 'c1', name: 'bash', arguments: '{}' } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  assert.deepEqual(out, chunks);
});

await checkAsync('T03 文本超过阈值后才出现工具调用：后缀应被抑制', async () => {
  const long = '这是一段足够长的正文，用来触发 smart 模式的判定阈值。'.repeat(6);
  const chunks = textBlock([long], { tool: true, reason: 'tool-calls' });
  const out = await collect(transformStream(() => gen(chunks), base()));
  const msg = assemble(out);
  assert.ok(msg.text.includes(long));
  const textBlocks = out.filter((c) => c.type === 'block-end' && c.block?.type === 'text');
  assert.equal(textBlocks.length, 1, '工具轮不该追加后缀文本块');
});

await checkAsync('T04 reasoning 块在前，前缀落在 text 块', async () => {
  const chunks = [
    { type: 'block-start', index: 0, blockType: 'reasoning' },
    { type: 'reasoning-delta', index: 0, text: '先想想。' },
    { type: 'block-end', index: 0, block: { type: 'reasoning', text: '先想想。' } },
    { type: 'block-start', index: 1, blockType: 'text' },
    { type: 'text-delta', index: 1, text: '答案在这里。' },
    { type: 'block-end', index: 1, block: { type: 'text', text: '答案在这里。' } },
    { type: 'finish', reason: { kind: 'stop' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  const textEnd = out.find((c) => c.type === 'block-end' && c.index === 1);
  assert.ok(textEnd.block.text.includes('最'), '前缀没落在 text 块');
  const reasonEnd = out.find((c) => c.type === 'block-end' && c.index === 0);
  assert.equal(reasonEnd.block.text, '先想想。', 'reasoning 被误改');
  const suffix = out.find((c) => c.type === 'block-end' && c.index > 1);
  assert.ok(suffix, '后缀块缺失');
});

await checkAsync('T05 只有增量、没有 block-start/end 的协议', async () => {
  const chunks = [
    { type: 'text-delta', index: 0, text: '裸增量正文。' },
    { type: 'finish', reason: { kind: 'stop' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  const msg = assemble(out);
  assert.ok(msg.text.includes('裸增量正文。'));
  assert.ok(msg.text.length > '裸增量正文。'.length * 2, '后缀缺失');
});

await checkAsync('T06 空文本：不套壳、不加后缀', async () => {
  const chunks = [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'block-end', index: 0, block: { type: 'text', text: '' } },
    { type: 'finish', reason: { kind: 'stop' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  assert.deepEqual(out, chunks);
});

await checkAsync('T07 finish 为 error 时不追加后缀', async () => {
  const chunks = textBlock(['半句话'], { reason: 'error' });
  const out = await collect(transformStream(() => gen(chunks), base()));
  const msg = assemble(out);
  assert.ok(!msg.text.includes('我就在这里'), '错误结束仍追加了后缀');
});

await checkAsync('T08 消费者提前退出不抛异常', async () => {
  const stream = transformStream(() => gen(textBlock(['一二三四五'])), base());
  for await (const chunk of stream) {
    if (chunk.type === 'text-delta') break;
  }
});

await checkAsync('T09 buffer 模式遇工具轮应放行', async () => {
  const chunks = textBlock(['我先看看目录。'], { tool: true, reason: 'tool-calls' });
  const out = await collect(transformStream(() => gen(chunks), { ...base(), mode: 'buffer' }));
  const msg = assemble(out);
  assert.equal(msg.text, '我先看看目录。', 'buffer 模式给工具轮套了壳');
});

await checkAsync('T10 buffer 模式正文完整膨胀且不丢字', async () => {
  const chunks = textBlock(['第一段内容。', '第二段内容。']);
  const out = await collect(transformStream(() => gen(chunks), { ...base(), mode: 'buffer' }));
  const msg = assemble(out);
  assert.ok(msg.text.includes('第一段内容'));
  assert.ok(msg.text.includes('第二段内容'));
  assert.ok(msg.text.includes('最'));
});

await checkAsync('T11 超长正文（buffer）不崩', async () => {
  const huge = '很长的正文。'.repeat(30000);
  const chunks = textBlock([huge]);
  const out = await collect(transformStream(() => gen(chunks), { ...base(), mode: 'buffer' }));
  assert.ok(out.length > 0);
});

await checkAsync('T12 两个文本块只给第一个加前缀', async () => {
  const chunks = [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text: '第一块。' },
    { type: 'block-end', index: 0, block: { type: 'text', text: '第一块。' } },
    { type: 'block-start', index: 1, blockType: 'text' },
    { type: 'text-delta', index: 1, text: '第二块。' },
    { type: 'block-end', index: 1, block: { type: 'text', text: '第二块。' } },
    { type: 'finish', reason: { kind: 'stop' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  const second = out.find((c) => c.type === 'block-end' && c.index === 1);
  assert.equal(second.block.text, '第二块。', '第二块被重复加前缀');
});

await checkAsync('T13 强度 0 完全原样透传', async () => {
  const chunks = textBlock(['原样。']);
  const out = await collect(transformStream(() => gen(chunks), base({ intensity: 0 })));
  assert.deepEqual(out, chunks);
});

await checkAsync('T14 上游无 finish 直接结束：压住的块不能丢', async () => {
  const chunks = [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text: '没有结束标记的正文。' },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  const msg = assemble(out);
  assert.ok(msg.text.includes('没有结束标记的正文。'), '压住的增量被吞了');
});


await checkAsync('T15 always 模式空文本不落前缀', async () => {
  const chunks = [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text: '' },
    { type: 'block-end', index: 0, block: { type: 'text', text: '' } },
    { type: 'finish', reason: { kind: 'stop' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), { ...base(), mode: 'always' }));
  const msg = assemble(out);
  assert.equal(msg.text, '', '空文本被塞了前缀');
});

await checkAsync('T16 畸形索引时后缀不与正文同块', async () => {
  const chunks = [
    { type: 'text-delta', index: -5, text: '负索引正文' },
    { type: 'finish', reason: { kind: 'stop' } },
  ];
  const out = await collect(transformStream(() => gen(chunks), base()));
  const msg = assemble(out);
  assert.ok(msg.text.includes('负索引正文'));
  const ends = out.filter((c) => c.type === 'block-end');
  assert.equal(ends.length, 1, '后缀块索引异常');
  assert.ok(ends[0].index >= 0, '后缀块索引为负');
});

await checkAsync('T17 超长 reasoning 不无限缓冲', async () => {
  const chunks = [];
  for (let i = 0; i < 1200; i += 1) chunks.push({ type: 'reasoning-delta', index: 0, text: '想' });
  chunks.push({ type: 'text-delta', index: 1, text: '正文。' });
  chunks.push({ type: 'finish', reason: { kind: 'stop' } });
  const out = await collect(transformStream(() => gen(chunks), base()));
  assert.ok(out.length >= 1202, '缓冲把 reasoning 吞了');
  const msg = assemble(out);
  assert.ok(msg.text.includes('正文。'));
});

console.log('\n[render]');
check('R01 空字符串返回空', () => {
  assert.equal(expandText('', base()).trim(), '');
});
check('R02 代码块保护', () => {
  const text = '说明：\n\n```js\nconsole.log(1)\n```';
  const out = expandText(text, base({ skipCodeBlocks: true }));
  assert.ok(out.includes('```js\nconsole.log(1)\n```'), '代码块被改动');
});
check('R03 否定项数量超过词库容量不崩', () => {
  const out = expandText('正文。', base({ intensity: 100, negationCount: 80, barrage: 40 }));
  assert.ok(out.length > 100);
});
check('R04 自定义词条并入且优先', () => {
  const out = expandText('正文。', base({ customIntensifiers: '最自定义甲\n最自定义乙', barrage: 40, intensity: 100 }));
  assert.ok(out.includes('最自定义'), '自定义词条没被抽到');
});
check('R05 种子可复现', () => {
  assert.equal(previewSample(base()), previewSample(base()));
});
check('R06 强度 0 时不加任何壳', () => {
  assert.equal(expandText('正文。', base({ intensity: 0 })).trim(), '正文。');
});
check('R07 只有空白字符的正文', () => {
  assert.equal(expandText('   \n\n  ', base()).trim(), '');
});

console.log('\n[config]');
check('C01 非数值回落默认，越界夹到边界', () => {
  const cfg = normalizeConfig({ intensity: 'x', barrage: -5, negationRounds: 99, mode: 'nope' });
  assert.equal(cfg.intensity, DEFAULTS.intensity, '非数值应回落默认');
  assert.equal(cfg.barrage, 0, '越界应夹到下限');
  assert.equal(cfg.negationRounds, 6, '越界应夹到上限');
  assert.equal(cfg.mode, DEFAULTS.mode, '非法模式应回落默认');
});
check('C02 浮点数被截断', () => {
  assert.equal(normalizeConfig({ intensity: 70.9 }).intensity, 70);
});
check('C03 强度 0 时所有段落归零', () => {
  const s = scaleByIntensity(normalizeConfig({ intensity: 0 }));
  assert.equal(s.barrage, 0);
  assert.equal(s.negationCount, 0);
  assert.equal(s.diagnoses, 0);
  assert.equal(s.serviceClosers, 0);
});
check('C04 splitLines 去重去尾逗号', () => {
  assert.deepEqual(splitLines('不催你，\n不催你\n\n不逼你'), ['不催你', '不逼你']);
});
check('C05 splitPurposes 兼容中英文逗号', () => {
  assert.deepEqual(splitPurposes('session-title, compaction，auto-review'), ['session-title', 'compaction', 'auto-review']);
});
check('C06 原型污染不生效', () => {
  const cfg = normalizeConfig(JSON.parse('{"__proto__":{"polluted":true}}'));
  assert.equal({}.polluted, undefined);
  assert.ok(cfg);
});

console.log(`\n通过 ${passed}，失败 ${fails.length}`);
if (fails.length > 0) {
  for (const [name, error] of fails) console.error(`\n${name}\n${error.stack}`);
  process.exit(1);
}
