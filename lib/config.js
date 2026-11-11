/**
 * dsh-doubao 的配置层：默认值、边界、归一化。
 * 设置页与宿主插件共用同一份归一化逻辑，避免两边默认值漂移。
 */

/**
 * 总强度档位。每一档就是一组具体参数，不是一个连续旋钮。
 * 选档位 = 套一组数值；之后还可以单独微调，微调不会改档位。
 */
export const LEVELS = Object.freeze(['off', 'light', 'medium', 'heavy', 'max']);

export const LEVEL_PRESETS = Object.freeze({
  off: Object.freeze({
    barrage: 0, negationCount: 0, negationRounds: 1, diagnoses: 0, boundaries: 0,
    fillers: 0, dilate: 0, openers: 0, transitions: 0, serviceClosers: 0,
    refusalChance: 0, templateShare: 0,
  }),
  light: Object.freeze({
    barrage: 3, negationCount: 4, negationRounds: 1, diagnoses: 1, boundaries: 1,
    fillers: 1, dilate: 0, openers: 0, transitions: 0, serviceClosers: 1,
    refusalChance: 0, templateShare: 25,
  }),
  medium: Object.freeze({
    barrage: 5, negationCount: 8, negationRounds: 2, diagnoses: 1, boundaries: 1,
    fillers: 2, dilate: 1, openers: 1, transitions: 1, serviceClosers: 1,
    refusalChance: 3, templateShare: 40,
  }),
  heavy: Object.freeze({
    barrage: 10, negationCount: 18, negationRounds: 3, diagnoses: 2, boundaries: 2,
    fillers: 3, dilate: 2, openers: 2, transitions: 2, serviceClosers: 2,
    refusalChance: 8, templateShare: 60,
  }),
  max: Object.freeze({
    barrage: 20, negationCount: 45, negationRounds: 4, diagnoses: 3, boundaries: 3,
    fillers: 5, dilate: 3, openers: 3, transitions: 3, serviceClosers: 3,
    refusalChance: 15, templateShare: 100,
  }),
});

/** 档位 → 一个便于显示的百分数（只用于展示，不再参与计算）。 */
export const LEVEL_PERCENT = Object.freeze({ off: 0, light: 25, medium: 50, heavy: 75, max: 100 });

/** 数值旋钮的合法区间，设置页直接用这张表生成滑块。 */
export const LIMITS = Object.freeze({
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
  // 总强度档位：off / light / medium / heavy / max
  level: 'medium',
  // 各段长度默认值 = 标准档，改档位表就够了
  ...LEVEL_PRESETS.medium,
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

/**
 * 把任意输入收敛成一份完整配置。
 * 档位决定各段的默认值；显式传入的数值优先于档位。
 * 旧配置里的 intensity 会被折算成最近的档位，不会失效。
 */
export function normalizeConfig(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = { ...source };

  // 档位：显式 level 优先，其次按旧 intensity 折算，最后用默认档
  let level = LEVELS.includes(source.level) ? source.level : null;
  if (!level && typeof source.intensity === 'number' && Number.isFinite(source.intensity)) {
    const value = Math.min(100, Math.max(0, source.intensity));
    level = value <= 0 ? 'off'
      : value < 38 ? 'light'
        : value < 63 ? 'medium'
          : value < 88 ? 'heavy' : 'max';
  }
  out.level = level ?? DEFAULTS.level;
  const preset = LEVEL_PRESETS[out.level];

  for (const key of BOOLEAN_KEYS) out[key] = pickBool(source[key], DEFAULTS[key]);
  for (const key of STRING_KEYS) out[key] = pickString(source[key], DEFAULTS[key]);
  for (const [key, bounds] of Object.entries(LIMITS)) {
    // 档位 off 就是全关，不接受任何残留参数
    if (out.level === 'off' && preset?.[key] !== undefined) {
      out[key] = clampInt(0, 0, bounds);
      continue;
    }
    // 没显式写就用档位预设，档位也没给才用全局默认
    const fallback = preset?.[key] ?? DEFAULTS[key];
    out[key] = clampInt(source[key], fallback, bounds);
  }
  out.mode = MODES.includes(source.mode) ? source.mode : DEFAULTS.mode;
  // 展示用的百分数，不再参与计算
  out.intensity = LEVEL_PERCENT[out.level] ?? 0;
  return out;
}

/**
 * 这一份配置实际落到哪个强度带（提示词按它选口吻）。
 * 档位是 off 就是 off；其余按排比条数判断，避免「档位说拉满、参数却是 0」的自相矛盾。
 */
export function resolveBand(cfg) {
  if (!cfg || cfg.level === 'off') return 'off';
  const barrage = Number(cfg.barrage) || 0;
  const negation = Number(cfg.negationCount) || 0;
  const closer = Number(cfg.serviceClosers) || 0;
  if (barrage === 0 && negation === 0 && closer === 0) return 'off';
  if (barrage >= 12) return 'full';
  if (barrage >= 5) return 'medium';
  return 'light';
}

/** 某档位的参数快照，设置页点档位时直接套。 */
export function presetFor(level) {
  return { ...(LEVEL_PRESETS[level] ?? LEVEL_PRESETS.medium) };
}

/**
 * 兼容层：档位制之后不再做等比缩放，参数就是最终值。
 * 保留这个名字，避免外部调用方一次性全改。
 */
export function scaleByIntensity(cfg) {
  return cfg;
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
