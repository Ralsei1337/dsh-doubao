/**
 * 设置页结构测试：用一套极小的 React 垫片把 client.js 真跑一遍。
 * 目的不是像素级验证，而是抓「组件返回错东西」「标签丢失」「hook 用错」这类硬伤。
 * 运行：node test/client-render.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* ---------- 极小 React 垫片 ---------- */
const hooks = [];
let hookIndex = 0;
let pending = false;

function createElement(type, props, ...children) {
  const flat = children.flat(Infinity).filter((child) => child !== undefined && child !== null && child !== false);
  return { type, props: { ...(props ?? {}), children: flat } };
}

class Component {
  constructor(props) { this.props = props; this.state = {}; }
  setState(patch) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
  }
}

const React = {
  createElement,
  Component,
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
    const set = (value) => {
      hooks[index] = typeof value === 'function' ? value(hooks[index]) : value;
      pending = true;
    };
    return [hooks[index], set];
  },
  useCallback(fn) { hookIndex += 1; return fn; },
  useEffect(fn) { hookIndex += 1; effects.push(fn); },
  useRef(initial) { hookIndex += 1; return { current: initial ?? null }; },
};
const effects = [];

/* ---------- 假的浏览器环境 ---------- */
const STATE = {
  ok: true,
  entry: { id: 'dsh-doubao', name: 'dsh-doubao', overridden: true },
  config: {
    enabled: false, promptEnabled: false, transformEnabled: false, mode: 'smart',
    level: 'medium', intensity: 50, barrage: 8, negationCount: 15, negationRounds: 2,
    openers: 1, transitions: 1, diagnoses: 2, boundaries: 2, fillers: 3,
    serviceClosers: 1, refusalChance: 8, dilate: 2, streamGuardChars: 120,
    skipCodeBlocks: true, skipToolTurns: true, customIntensifiers: '',
    customNegations: '', customClosers: '', seed: 0,
    skipPurposes: 'session-title,compaction,auto-review',
  },
  raw: {},
  defaults: {},
  limits: {
    barrage: [0, 40], negationCount: [0, 80], negationRounds: [1, 6],
    openers: [0, 3], transitions: [0, 3], diagnoses: [0, 4], boundaries: [0, 4],
    fillers: [0, 8], serviceClosers: [0, 3], refusalChance: [0, 100], dilate: [0, 4],
    streamGuardChars: [20, 2000], seed: [0, 2147483647],
  },
  modes: ['smart', 'always', 'buffer'],
  lexicon: { total: 855, intensifiers: 134, negation_items: 248, diagnosis_lines: 94 },
  sample: '示例',
};

const calls = [];
globalThis.fetch = async (url, init) => {
  calls.push([String(url), init?.method ?? 'GET']);
  if (String(url).includes('/preview')) return { ok: true, json: async () => ({ ok: true, sample: '预览文本' }) };
  if (String(url).includes('/config') || String(url).includes('/reset')) {
    return { ok: true, json: async () => ({ ...STATE, reloaded: true }) };
  }
  return { ok: true, json: async () => STATE };
};

/* ---------- 装载 client.js ---------- */
let registration = null;
const sandbox = {
  window: { __ModuleLoader__: { load: (value) => { registration = value; } } },
  fetch: globalThis.fetch,
  console,
  setTimeout,
  clearTimeout,
};
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), sandbox);
assert.ok(registration, 'client.js 没有调用 __ModuleLoader__.load');

const moduleExports = registration.factory((name) => {
  if (name === 'react') return React;
  throw new Error(`未知依赖 ${name}`);
});
assert.equal(moduleExports.name, 'dsh-doubao');

/* ---------- 假 ctx，抓注册面 ---------- */
let sectionRenderer = null;
let iconRenderer = null;
const ctx = {
  effect: (fn) => fn(),
  locale: {
    register: () => {},
    bind: () => (key) => key,
  },
  slots: {
    inject: (_name, fn) => fn(),
    register: (meta, render) => {
      if (meta.name === 'settings.section') sectionRenderer = render;
      if (meta.name === 'settings.section.icon') iconRenderer = render;
      return () => {};
    },
  },
};
moduleExports.apply(ctx);
assert.ok(sectionRenderer, '没有注册 settings.section');
assert.ok(iconRenderer, '没有注册 settings.section.icon');

/* ---------- 渲染 ---------- */
function renderRoot() {
  hookIndex = 0;
  hooks.length = 0;
  effects.length = 0;
  const element = sectionRenderer({});
  return element;
}

function renderFunctionComponent(element) {
  hookIndex = 0;
  const saved = hooks.slice();
  hooks.length = 0;
  const out = element.type(element.props);
  const produced = hooks.slice();
  hooks.length = 0;
  hooks.push(...saved);
  return { out, produced };
}

/** 把树摊平成节点列表；函数组件就地展开。 */
function flatten(node, out = [], depth = 0) {
  if (node === null || node === undefined || node === false) return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push({ kind: 'text', value: String(node), depth }); return out; }
  if (Array.isArray(node)) { for (const item of node) flatten(item, out, depth); return out; }
  if (typeof node.type === 'function') {
    if (node.type.prototype?.render) {
      const instance = new node.type(node.props);
      flatten(instance.render(), out, depth + 1);
      return out;
    }
    hookIndex = 0;
    const child = node.type(node.props);
    flatten(child, out, depth + 1);
    return out;
  }
  out.push({ kind: 'element', type: node.type, props: node.props, depth });
  for (const child of node.props.children ?? []) flatten(child, out, depth + 1);
  return out;
}

// Boundary 是 class，先手动过一层（要给 children，class 组件靠 props.children 渲染）
// Boundary 的 children 是 [h(Section, ...)]，直接取第一个元素
const boundaryElement = sectionRenderer({});
const boundaryInstance = new boundaryElement.type(boundaryElement.props);
const boundaryRender = boundaryInstance.render();
const boundaryChildren = Array.isArray(boundaryRender) ? boundaryRender : [boundaryRender];
const sectionElement = boundaryChildren.find((item) => item && item.type);
assert.ok(sectionElement, 'Boundary 没有包住 Section');
const sectionInstance = sectionElement;
hookIndex = 0;
hooks.length = 0;
effects.length = 0;
let tree = sectionInstance.type(sectionInstance.props);
for (const effect of effects) effect();
await new Promise((resolve) => setTimeout(resolve, 10));
for (let round = 0; round < 6 && pending; round += 1) {
  pending = false;
  hookIndex = 0;
  effects.length = 0;
  tree = sectionInstance.type(sectionInstance.props);
  for (const effect of effects) effect();
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const nodes = flatten(tree);
const texts = nodes.filter((n) => n.kind === 'text').map((n) => n.value).join(' ');
const textareas = nodes.filter((n) => n.kind === 'element' && n.type === 'textarea');
const ranges = nodes.filter((n) => n.kind === 'element' && n.type === 'input' && n.props.type === 'range');
const switches = nodes.filter((n) => n.kind === 'element' && n.type === 'button' && n.props.role === 'switch');

console.log(`节点 ${nodes.length}，文本块 ${nodes.filter((n) => n.kind === 'text').length}，textarea ${textareas.length}，slider ${ranges.length}，开关 ${switches.length}`);

// 假 locale 的 t() 返回 key 本身，所以这里断言 key
assert.ok(texts.includes('title'), '标题缺失');
assert.ok(texts.includes('level'), '强度档位区缺失');
assert.ok(texts.includes('levelMax'), '档位按钮缺失');
assert.equal(
  nodes.filter((n) => n.kind === 'element' && n.type === 'button' && String(n.props.className).includes('db-level')).length >= 5,
  true,
  '档位按钮数量不足',
);
assert.ok(texts.includes('customIntensifiers'), '自定义区缺失');
assert.ok(texts.includes('skipPurposes'), '高级区缺失');
assert.equal(textareas.length, 3, '自定义词条应为 3 个输入框');
assert.ok(ranges.length >= 12, `滑块数量异常：${ranges.length}`);
assert.equal(switches.length, 5, `开关数量应为 5，实际 ${switches.length}`);

// 每个 textarea 必须和自己的标题在同一个 db-row 容器里（防回归：逗号运算符把标签丢了）
for (const area of textareas) {
  const position = nodes.indexOf(area);
  let parentIndex = position - 1;
  while (parentIndex >= 0 && nodes[parentIndex].depth >= area.depth) parentIndex -= 1;
  assert.ok(parentIndex >= 0, 'textarea 没有父容器');
  const parentDepth = nodes[parentIndex].depth;
  const siblings = [];
  for (let i = parentIndex + 1; i < nodes.length && nodes[i].depth > parentDepth; i += 1) {
    if (nodes[i].kind === 'text') siblings.push(nodes[i].value);
  }
  assert.ok(
    siblings.some((value) => value.startsWith('custom')),
    `textarea 丢了标题，容器内文本：${siblings.join('/')}`,
  );
}
assert.equal(
  nodes.filter((n) => n.kind === 'text' && n.value.startsWith('custom')).length >= 3,
  true,
  '自定义词条标题不全',
);

// 点「拉满」应套上该档参数
{
  const buttons = nodes.filter((n) => n.kind === 'element' && n.type === 'button' && String(n.props.className).includes('db-level'));
  const maxButton = buttons[buttons.length - 1];
  assert.ok(maxButton && typeof maxButton.props.onClick === 'function', '档位按钮不可点');
  maxButton.props.onClick();
  pending = true;
  hookIndex = 0;
  effects.length = 0;
  tree = sectionInstance.type(sectionInstance.props);
  for (const effect of effects) effect();
  const after = flatten(tree);
  const label = after
    .filter((n) => n.kind === 'element' && n.type === 'span' && String(n.props.className).includes('db-num'))
    .map((n) => Number(n.props.children?.[0]));
  assert.ok(label.includes(20), `点拉满后排比条数应为 20，实际 ${label.join(',')}`);
  assert.ok(label.includes(45), `点拉满后否定项应为 45，实际 ${label.join(',')}`);
}

// 预览按钮存在
assert.ok(nodes.some((n) => n.kind === 'element' && n.type === 'pre'), '预览区缺失');
assert.ok(calls.some(([url]) => url.includes('/doubao-style/state')), '没有请求 state');

// 图标
const iconElement = iconRenderer({ size: 16 });
const icon = typeof iconElement.type === 'function' ? iconElement.type(iconElement.props) : iconElement;
assert.equal(icon.type, 'svg', '图标不是 svg');
assert.ok(icon.props.children.length >= 2, '图标内容为空');

console.log('设置页结构测试通过。');
