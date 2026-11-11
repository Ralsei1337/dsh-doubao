/**
 * dsh-doubao 宿主入口。
 *
 * 两条通道同时工作：
 *   ① systemPrompt.section —— 让模型自己就用豆包语写正文
 *   ② llm/stream 瀑布      —— 在流上补外壳，保证「一定有排比、一定有否定清单、一定有复读」
 *
 * 设置页通过 configEditor 改写 profile 补丁，重载后 apply() 会带着新配置重新跑一遍，
 * 所以这里所有闭包都读 apply 时的 cfg，不缓存到模块级。
 */
import { normalizeConfig, resolveBand, splitPurposes } from './config.js';
import { PROMPT_SECTION_NAME, promptSectionText } from './prompt.js';
import { registerRoutes } from './routes.js';
import { shouldTransform, transformStream } from './transform.js';

export const name = 'dsh-doubao';

/** 只有 webServer/configEditor 是设置页需要的，缺了也不能拖垮对话。 */
export const inject = [];

export function apply(ctx, rawConfig) {
  const cfg = normalizeConfig(rawConfig);

  // ① 系统提示
  ctx.inject(['systemPrompt'], (promptCtx) => {
    if (!cfg.enabled || !cfg.promptEnabled || resolveBand(cfg) === 'off') return;
    promptCtx.effect(() => promptCtx.systemPrompt.section({
      name: PROMPT_SECTION_NAME,
      order: 165,
      text: () => promptSectionText(cfg),
    }), 'dsh-doubao.prompt');
  });

  // ② 输出流
  const skipPurposes = splitPurposes(cfg.skipPurposes);
  ctx.on('llm/stream', (options, next) => {
    if (!shouldTransform(cfg)) return next(options);
    const purpose = typeof options?.purpose === 'string' ? options.purpose : 'assistant';
    if (skipPurposes.includes(purpose)) return next(options);
    return transformStream(() => next(options), cfg, {
      onDecide: (info) => {
        if (process.env.DSH_DOUBAO_DEBUG) {
          ctx.logger?.debug?.('[dsh-doubao] decide', JSON.stringify(info));
        }
      },
      onApply: (info) => {
        if (process.env.DSH_DOUBAO_DEBUG) {
          ctx.logger?.debug?.('[dsh-doubao] apply', JSON.stringify(info));
        }
      },
    });
  });

  // ③ 设置页接口
  ctx.inject(['webServer', 'configEditor'], (host) => {
    registerRoutes(host);
  });
}
