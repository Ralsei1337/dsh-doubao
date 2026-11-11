/**
 * 设置页背后的同源 HTTP 接口。
 *
 *   GET  /doubao-style/state    当前生效配置 + 词库规模 + 一段示例
 *   POST /doubao-style/config   只合并本页拥有的字段，写回 profile 并重载插件
 *   POST /doubao-style/preview  用草稿配置试渲染（不落盘）
 *   POST /doubao-style/reset    恢复默认值
 */
import { DEFAULTS, LIMITS, MODES, normalizeConfig } from './config.js';
import { lexiconStats } from './lexicon.js';
import { templateStats } from './templates.js';
import { previewSample } from './render.js';

const ENTRY_ID = 'dsh-doubao';
const MAX_BODY_BYTES = 128 * 1024;

const BOOLEAN_KEYS = ['enabled', 'promptEnabled', 'transformEnabled', 'skipCodeBlocks', 'skipToolTurns'];
const STRING_KEYS = ['customIntensifiers', 'customNegations', 'customClosers', 'skipPurposes'];

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw Object.assign(new Error('请求体过大'), { status: 413 });
    chunks.push(chunk);
  }
  if (total === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw badRequest('请求体不是合法 JSON');
  }
}

/** 同源校验：只放行本 GUI 的页面与不带 Origin 的本地调用。 */
function allowedRequest(ctx, req) {
  let origin;
  try { origin = ctx.webServer.getOrigin(); } catch { return true; }
  const requestOrigin = req.headers?.origin;
  if (typeof requestOrigin === 'string' && requestOrigin && requestOrigin !== origin) return false;
  const site = req.headers?.['sec-fetch-site'];
  if (typeof site === 'string' && site && site !== 'same-origin' && site !== 'none') return false;
  return true;
}

function findEntry(ctx) {
  const rows = ctx.configEditor.configuration();
  return rows.find(({ entry }) => entry?.options?.id === ENTRY_ID)
    ?? rows.find(({ entry }) => entry?.options?.name === ENTRY_ID)
    ?? null;
}

/** 只接受本页拥有的字段，其他键原样保留。 */
function applyPatch(current, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw badRequest('配置必须是对象');
  // 配置里可能出现函数等不可克隆值（!!js 表达式），退化成 JSON 深拷贝
  let next;
  try {
    next = structuredClone(current && typeof current === 'object' ? current : {});
  } catch {
    next = JSON.parse(JSON.stringify(current && typeof current === 'object' ? current : {}));
  }
  for (const key of BOOLEAN_KEYS) {
    if (patch[key] === undefined) continue;
    if (typeof patch[key] !== 'boolean') throw badRequest(`${key} 必须是布尔值`);
    next[key] = patch[key];
  }
  for (const key of STRING_KEYS) {
    if (patch[key] === undefined) continue;
    if (typeof patch[key] !== 'string') throw badRequest(`${key} 必须是字符串`);
    if (patch[key].length > 20000) throw badRequest(`${key} 过长`);
    next[key] = patch[key];
  }
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if (patch[key] === undefined) continue;
    const value = patch[key];
    if (!Number.isInteger(value) || value < min || value > max) {
      throw badRequest(`${key} 必须是 ${min}-${max} 的整数`);
    }
    next[key] = value;
  }
  if (patch.mode !== undefined) {
    if (!MODES.includes(patch.mode)) throw badRequest(`mode 只能是 ${MODES.join(' / ')}`);
    next.mode = patch.mode;
  }
  return next;
}

function publicState(raw) {
  return {
    config: normalizeConfig(raw),
    raw: raw && typeof raw === 'object' ? raw : {},
    defaults: DEFAULTS,
    limits: LIMITS,
    modes: MODES,
    lexicon: lexiconStats(),
    templates: templateStats(),
  };
}

export function registerRoutes(ctx) {
  const handler = async (req, res) => {
    try {
      if (!allowedRequest(ctx, req)) return sendJson(res, 403, { ok: false, error: 'forbidden' });
      const url = new URL(req.url || '/', 'http://localhost');
      const row = findEntry(ctx);
      const current = row?.entry?.options?.config ?? {};

      if (req.method === 'GET' && url.pathname === '/doubao-style/state') {
        if (!row) return sendJson(res, 404, { ok: false, error: '未找到 dsh-doubao 配置行' });
        const state = publicState(current);
        return sendJson(res, 200, {
          ok: true,
          entry: {
            id: row.entry?.options?.id ?? ENTRY_ID,
            name: row.entry?.options?.name ?? ENTRY_ID,
            overridden: Object.keys(row.override ?? {}).length > 0,
          },
          ...state,
          sample: previewSample(state.config),
        });
      }

      if (req.method === 'POST' && url.pathname === '/doubao-style/preview') {
        const body = await readJson(req);
        const draft = normalizeConfig({ ...normalizeConfig(current), ...(body?.config ?? {}) });
        return sendJson(res, 200, { ok: true, sample: previewSample(draft), config: draft });
      }

      if (req.method === 'POST' && url.pathname === '/doubao-style/config') {
        if (!row) return sendJson(res, 404, { ok: false, error: '未找到 dsh-doubao 配置行' });
        const body = await readJson(req);
        const next = applyPatch(current, body?.config ?? body ?? {});
        await ctx.configEditor.edit(row.entry, () => next);
        return sendJson(res, 200, { ok: true, reloaded: true, ...publicState(next) });
      }

      if (req.method === 'POST' && url.pathname === '/doubao-style/reset') {
        if (!row) return sendJson(res, 404, { ok: false, error: '未找到 dsh-doubao 配置行' });
        const next = applyPatch(current, { ...DEFAULTS });
        await ctx.configEditor.edit(row.entry, () => next);
        return sendJson(res, 200, { ok: true, reloaded: true, ...publicState(next) });
      }

      return sendJson(res, 404, { ok: false, error: 'not found' });
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 500;
      return sendJson(res, status, { ok: false, error: String(error?.message || error) });
    }
  };

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/doubao-style',
    handler,
  }), 'dsh-doubao.routes');
}
