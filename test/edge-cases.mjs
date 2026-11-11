import assert from 'node:assert/strict';
const root = new URL('..', import.meta.url).href;
const { DEFAULTS, normalizeConfig } = await import(root + 'lib/config.js');
const { transformStream } = await import(root + 'lib/transform.js');
const { expandText, buildShell } = await import(root + 'lib/render.js');
const { analyze, renderTemplate, buildTemplates, templateStats } = await import(root + 'lib/templates.js');

const base = (over={}) => normalizeConfig({...DEFAULTS, seed: 3, ...over});
async function* gen(items){ for (const i of items) yield i; }
async function collect(s){ const out=[]; for await (const c of s) out.push(c); return out; }

let pass=0, fail=0;
async function t(name, fn){ try { await fn(); pass++; console.log('  ok  '+name);} catch(e){ fail++; console.log('FAIL  '+name+': '+e.message);} }

// ---- 畸形 chunk ----
await t('X01 chunk 为 null', async () => {
  const out = await collect(transformStream(()=>gen([null, {type:'finish',reason:{kind:'stop'}}]), base()));
  assert.equal(out[0], null);
});
await t('X02 chunk.index 缺失/负数', async () => {
  const out = await collect(transformStream(()=>gen([
    {type:'text-delta', text:'没有索引'},
    {type:'text-delta', index:-3, text:'负索引'},
    {type:'finish', reason:{kind:'stop'}},
  ]), base()));
  assert.ok(out.length >= 3);
});
await t('X03 text 不是字符串', async () => {
  const out = await collect(transformStream(()=>gen([
    {type:'text-delta', index:0, text:123},
    {type:'finish', reason:{kind:'stop'}},
  ]), base()));
  assert.ok(out.length >= 2);
});
await t('X04 block-end 的 block 为 null', async () => {
  const out = await collect(transformStream(()=>gen([
    {type:'text-delta', index:0, text:'正文'},
    {type:'block-end', index:0, block:null},
    {type:'finish', reason:{kind:'stop'}},
  ]), base()));
  assert.ok(out.length >= 3);
});
await t('X05 两个 finish', async () => {
  const out = await collect(transformStream(()=>gen([
    {type:'text-delta', index:0, text:'正文'},
    {type:'finish', reason:{kind:'stop'}},
    {type:'finish', reason:{kind:'stop'}},
  ]), base()));
  const blocks = out.filter(c=>c.type==='block-end'&&c.block?.type==='text');
  assert.equal(blocks.length, 1, '后缀重复追加');
});
await t('X06 finish 无 reason', async () => {
  const out = await collect(transformStream(()=>gen([
    {type:'text-delta', index:0, text:'正文'},
    {type:'finish'},
  ]), base()));
  assert.ok(out.length >= 2);
});
await t('X07 streamFactory 抛错', async () => {
  let caught = null;
  try {
    for await (const _ of transformStream(()=>{ throw new Error('boom'); }, base())) { /* noop */ }
  } catch (e) { caught = e; }
  assert.equal(caught?.message, 'boom');
});

// ---- 模板 ----
await t('X08 未知槽位被丢弃', async () => {
  assert.equal(analyze('你好{zZz}'), null);
  assert.equal(analyze('你好{未闭合'), null);
});
await t('X09 模板渲染不留花括号', async () => {
  const {roles} = buildTemplates();
  const {createRng} = await import(root + 'lib/render.js');
  const {LEXICON} = await import('/root/DSHA开发/dsh-doubao/lib/lexicon.js');
  const rng = createRng(11);
  const ctx = {intensifiers: LEXICON.intensifiers, negations: LEXICON.negation_items, diagnoses: LEXICON.diagnosis_lines, body:'正文'};
  for (const list of Object.values(roles)) {
    for (const entry of list) {
      const out = renderTemplate(entry, rng, ctx);
      assert.ok(out === null || !/[{}]/.test(out), '残留花括号: '+entry.template+' -> '+out);
    }
  }
});
await t('X10 空正文时模板不产出', async () => {
  const out = expandText('', base({templateShare:100}));
  assert.equal(out.trim(), '');
});

// ---- 渲染 ----
await t('X11 templateShare 边界 0/100 都不炸', async () => {
  for (const share of [0, 100]) {
    const out = expandText('正文一句。', base({templateShare: share, intensity: 100}));
    assert.ok(out.includes('正文一句'));
    assert.ok(!/[{}]/.test(out));
  }
});
await t('X12 正文只有标点', async () => {
  const out = expandText('。。。', base());
  assert.ok(out.length > 0);
});
await t('X13 正文含未闭合代码围栏', async () => {
  const out = expandText('说明：\n```js\nconst a=1;', base({skipCodeBlocks:true}));
  assert.ok(out.includes('const a=1;'));
});
await t('X14 极端配置全开', async () => {
  const cfg = base({intensity:100, barrage:40, negationCount:80, negationRounds:6, diagnoses:4, boundaries:4, fillers:8, serviceClosers:3, dilate:4, templateShare:100, refusalChance:100});
  const out = expandText('正文。', cfg);
  assert.ok(out.length > 300);
  assert.ok(!/[{}]/.test(out));
});
await t('X15 buildShell 不返回 undefined', async () => {
  const shell = buildShell(base(), undefined, {body:'x'});
  assert.equal(typeof shell.prefix, 'string');
  assert.ok(Array.isArray(shell.suffix));
});

console.log(`\n通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
