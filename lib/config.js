/**
 * dsh-doubao 的配置层：默认值、边界、归一化。
 * 设置页与宿主插件共用同一份归一化逻辑，避免两边默认值漂移。
 */

/** 数值旋钮的合法区间，设置页直接用这张表生成滑块。 */
export const LIMITS = Object.freeze({
  intensity: [0, 100],
  barrage: [0, 40],
  negationCount: [0, 80],
  negationRounds: [1, 6],
  openers: [0, 3],
  transitions: [0, 3],
  diagnoses: [0, 4],
  boundaries: [0, 4],
  fillers: [0, 8],
  serviceClosers: [0, 3],
  refusalChance: [0, 100],
  dilate: [0, 4],
  templateShare: [0, 100],
  streamGuardChars: [20, 2000],
  seed: [0, 2147483647],
});

export const MODES = Object.freeze(['smart', 'always', 'buffer']);

export const DEFAULTS = Object.freeze({
  enabled: true,
  // 通道一：往系统提示里注入风格圣经
  promptEnabled: true,
  // 通道二：在 llm/stream 上包一层，直接改写正文
  transformEnabled: true,
  // smart：先缓冲一小段，发现是工具调用轮次就放行；always：立刻加料；buffer：整段收完再改
  mode: 'smart',
  intensity: 70,
  barrage: 12,
  negationCount: 24,
  negationRounds: 2,
  openers: 1,
  transitions: 1,
  diagnoses: 2,
  boundaries: 2,
  fillers: 3,
  serviceClosers: 1,
  refusalChance: 8,
  dilate: 2,
  // 有多大比例用调研来的句式模板，而不是纯拼装
  templateShare: 45,
  streamGuardChars: 120,
  // 代码块 / 表格里不加料，只在外层加壳
  skipCodeBlocks: true,
  // 工具调用轮次不套壳（smart / buffer 模式生效）
  skipToolTurns: true,
  // 不套壳的请求用途：标题、压缩、自动评审都不该变豆包语
  skipPurposes: 'session-title,compaction,auto-review',
  // 自定义词条，一行一条，会并入内置词库
  customIntensifiers: '',
  customNegations: '',
  customClosers: '',
  seed: 0,
});

const BOOLEAN_KEYS = [
  'enabled',
  'promptEnabled',
  'transformEnabled',
  'skipCodeBlocks',
  'skipToolTurns',
];

const STRING_KEYS = ['customIntensifiers', 'customNegations', 'customClosers', 'skipPurposes'];

function clampInt(value, fallback, [min, max]) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function pickBool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function pickString(value, fallback) {
  return typeof value === 'string' ? value : fallback;
}

/** 把任意输入收敛成一份完整配置；未知键原样保留，方便以后加字段不炸。 */
export function normalizeConfig(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = { ...source };
  for (const key of BOOLEAN_KEYS) out[key] = pickBool(source[key], DEFAULTS[key]);
  for (const key of STRING_KEYS) out[key] = pickString(source[key], DEFAULTS[key]);
  for (const [key, bounds] of Object.entries(LIMITS)) {
    out[key] = clampInt(source[key], DEFAULTS[key], bounds);
  }
  out.mode = MODES.includes(source.mode) ? source.mode : DEFAULTS.mode;
  return out;
}

/** 按总强度缩放各段长度：0 = 完全关闭，100 = 满配。 */
export function scaleByIntensity(cfg) {
  const k = Math.max(0, Math.min(100, cfg.intensity)) / 100;
  if (k <= 0) {
    return {
      ...cfg,
      barrage: 0,
      negationCount: 0,
      negationRounds: 1,
      diagnoses: 0,
      boundaries: 0,
      fillers: 0,
      dilate: 0,
      openers: 0,
      transitions: 0,
      serviceClosers: 0,
      refusalChance: 0,
    };
  }
  const scale = (value) => Math.max(0, Math.round(value * (0.35 + 0.65 * k)));
  return {
    ...cfg,
    barrage: scale(cfg.barrage),
    negationCount: scale(cfg.negationCount),
    diagnoses: scale(cfg.diagnoses),
    boundaries: scale(cfg.boundaries),
    fillers: scale(cfg.fillers),
    dilate: scale(cfg.dilate),
  };
}

/** 逗号/换行分隔的用途清单 → 数组。 */
export function splitPurposes(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  return text.split(/[,\s，、;；]+/).map((item) => item.trim()).filter(Boolean);
}

/** 多行文本框 → 去重词条数组。 */
export function splitLines(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const seen = new Set();
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const item = line.trim().replace(/[，,、;；]+$/, '');
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export const CONFIG_VERSION = 1;
