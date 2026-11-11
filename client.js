window.__ModuleLoader__.load({
  id: 'dsh-doubao',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'doubao-style';

    const zh = {
      nav: '豆包语',
      title: '豆包语',
      subtitle: '把模型输出改造成豆包语：超长排比 + 否定清单 + 疗愈诊断 + 复读共情 + 服务化收尾。',
      refresh: '刷新',
      save: '保存并重载',
      saving: '保存中…',
      saved: '已保存，插件已重载。下一轮对话就会生效。',
      reset: '恢复默认',
      resetting: '恢复中…',
      loadError: '读取配置失败',
      saveError: '保存失败',
      previewError: '预览失败',
      preview: '实时预览',
      previewRefresh: '重新生成',
      previewHint: '用当前草稿配置渲染一段演示正文；保存后才对真实对话生效。',
      previewEmpty: '点「重新生成」看效果。',
      basic: '总开关',
      basicDesc: '两条通道可以单独关：只留提示词，或只留输出流外壳。',
      enable: '启用豆包语',
      enableHint: '总开关。关闭后提示词与输出流后处理都不工作。',
      promptEnabled: '系统提示注入',
      promptEnabledHint: '往系统提示里塞风格圣经，让模型自己就用豆包语写。',
      transformEnabled: '输出流后处理',
      transformEnabledHint: '在 llm/stream 上补外壳，保证一定有排比、否定清单和复读。',
      mode: '后处理模式',
      modeHint: 'smart：先看一小段，工具轮次放行；always：立刻加壳；buffer：整段收完再膨胀。',
      modeSmart: 'smart（推荐）',
      modeAlways: 'always（最激进）',
      modeBuffer: 'buffer（不流式）',
      strength: '强度档位',
      strengthDesc: '选一档就是一组确定参数，不是连续旋钮。选完还能单独微调下面的数字。',
      level: '总强度档位',
      levelHint: '五档：关闭 / 轻度 / 标准 / 重度 / 拉满。点一档会把下面的参数一起套上。',
      levelOff: '关闭',
      levelLight: '轻度',
      levelMedium: '标准',
      levelHeavy: '重度',
      levelMax: '拉满',
      levelCustom: '自定义',
      levelSummary: '当前档位会写进配置；微调数字不会改档位。',
      barrage: '排比条数',
      barrageHint: '「我给你最A、最B……的结论」里「最X」的个数，0–40。',
      negationCount: '否定项条数',
      negationCountHint: '「我就在这里，不X，不Y……」里否定项的个数，0–80。',
      negationRounds: '复读遍数',
      negationRoundsHint: '把整段否定清单原样再念几遍，1–6。',
      healing: '疗愈与共情',
      healingDesc: '诊断用户、承诺边界、稀释信息——这一段决定「像不像」。',
      diagnoses: '疗愈诊断条数',
      diagnosesHint: '「你不是A，你只是B」的条数，0–4。',
      boundaries: '边界承诺条数',
      boundariesHint: '「我就在这里」段落的条数，0–4。',
      fillers: '共情填充条数',
      fillersHint: '「这样反而更稳」「你不用向我解释」这类短句，0–8。',
      dilate: '信息稀释',
      dilateHint: '把第一句换个说法重复几遍（「一句话总结」的自我矛盾），0–4。',
      templateShare: '句式模板占比',
      templateShareHint: '有多大比例直接套调研来的句式模板，而不是现场拼装，0–100。',
      closer: '收尾与反转',
      closerDesc: '服务化询问是标配；反转拒答是彩蛋。',
      openers: '元话语开场',
      openersHint: '「我完全听懂了」「我不铺垫了」的条数，0–3。',
      transitions: '元话语转场',
      transitionsHint: '段落之间插入「往深了说」「说白了」，0–3。',
      serviceClosers: '服务化收尾',
      serviceClosersHint: '「要不要我帮你生成一张图？」的条数，0–3。',
      refusalChance: '反转拒答概率',
      refusalChanceHint: '0–100。命中时，前面长篇共情，最后一句「抱歉，我无法回答你的问题」。',
      custom: '自定义词条',
      customDesc: '一行一条，会并入内置词库，优先被抽到。',
      customIntensifiers: '自定义排比词',
      customIntensifiersHint: '例如「最不端着」「最像人话」，不用写「最」以外的格式。',
      customNegations: '自定义否定项',
      customNegationsHint: '例如「不催你」「不替你做决定」。',
      customClosers: '自定义收尾',
      customClosersHint: '例如「要不要我把这段话做成壁纸？」。',
      advanced: '高级',
      skipCodeBlocks: '保护代码块',
      skipCodeBlocksHint: '正文含 ``` 时不再插入序数词与稀释句，只在外层加壳。',
      skipToolTurns: '跳过工具轮次',
      skipToolTurnsHint: 'smart / buffer 模式下，带工具调用的那一轮不套壳。',
      streamGuardChars: '判定阈值',
      streamGuardCharsHint: 'smart 模式先缓冲多少个字符再决定这是正文还是工具轮，20–2000。',
      seed: '随机种子',
      seedHint: '0 = 每轮随机；填固定值可复现同一段文本。',
      skipPurposes: '不套壳的请求用途',
      skipPurposesHint: '逗号分隔。默认跳过标题生成、历史压缩、自动评审，避免污染系统内部请求。',
      lexicon: '词库',
      lexiconTotal: '总词条',
      override: '已由 profile 覆盖',
      inherited: '来自插件默认值',
      off: '已关闭',
      on: '已开启',
      noEntry: '没有找到插件配置行，检查 dsh-doubao 是否已加入 profile 的 bundles。',
      hint: '保存会写入当前 profile 的补丁并重载插件；不需要重启 DSH。',
    };

    const en = {
      nav: 'Doubao style',
      title: 'Doubao style',
      subtitle: 'Rewrite model output as Doubao-speak: barrage of superlatives, negation lists, healing diagnoses, repeated empathy, service closers.',
      refresh: 'Refresh',
      save: 'Save and reload',
      saving: 'Saving…',
      saved: 'Saved. The plugin reloaded; it applies from the next turn.',
      reset: 'Reset to defaults',
      resetting: 'Resetting…',
      loadError: 'Could not read configuration',
      saveError: 'Save failed',
      previewError: 'Preview failed',
      preview: 'Live preview',
      previewRefresh: 'Regenerate',
      previewHint: 'Renders a demo body with the current draft; only saving affects real conversations.',
      previewEmpty: 'Press Regenerate to see the effect.',
      basic: 'Switches',
      basicDesc: 'The two channels are independent: prompt only, stream only, or both.',
      enable: 'Enable Doubao style',
      enableHint: 'Master switch. Off means neither channel runs.',
      promptEnabled: 'System prompt injection',
      promptEnabledHint: 'Adds the style bible to the system prompt so the model writes it natively.',
      transformEnabled: 'Stream post-processing',
      transformEnabledHint: 'Wraps llm/stream to guarantee the shell: barrage, negation list, repeats.',
      mode: 'Transform mode',
      modeHint: 'smart: buffer briefly, skip tool turns; always: garnish immediately; buffer: rewrite after the whole message.',
      modeSmart: 'smart (recommended)',
      modeAlways: 'always (most aggressive)',
      modeBuffer: 'buffer (no streaming)',
      strength: 'Strength level',
      strengthDesc: 'Each level is a fixed parameter set, not a continuous dial. You can still fine-tune the numbers below.',
      level: 'Strength level',
      levelHint: 'Five levels: off / light / standard / heavy / max. Picking one applies its parameters.',
      levelOff: 'Off',
      levelLight: 'Light',
      levelMedium: 'Standard',
      levelHeavy: 'Heavy',
      levelMax: 'Max',
      levelCustom: 'Custom',
      levelSummary: 'The level is saved with the config; tweaking numbers does not change it.',
      barrage: 'Superlative count',
      barrageHint: 'How many 最X items in the opening barrage, 0–40.',
      negationCount: 'Negation item count',
      negationCountHint: 'How many 不X items in the boundary list, 0–80.',
      negationRounds: 'Repeat rounds',
      negationRoundsHint: 'How many times the boundary paragraph is repeated verbatim, 1–6.',
      healing: 'Healing and empathy',
      healingDesc: 'Diagnosing the user, promising boundaries, diluting information — this is what makes it recognizable.',
      diagnoses: 'Diagnosis lines',
      diagnosesHint: 'How many 「你不是A，你只是B」 lines, 0–4.',
      boundaries: 'Boundary paragraphs',
      boundariesHint: 'How many 「我就在这里」 paragraphs, 0–4.',
      fillers: 'Empathy fillers',
      fillersHint: 'Short lines like 「这样反而更稳」, 0–8.',
      dilate: 'Dilution repeats',
      dilateHint: 'Repeats the first sentence in other words, 0–4.',
      templateShare: 'Template share',
      templateShareHint: 'How often a researched sentence template is used instead of assembling one, 0–100.',
      closer: 'Closers and reversal',
      closerDesc: 'A service question is standard; a sudden refusal is the easter egg.',
      openers: 'Meta openers',
      openersHint: 'How many 「我完全听懂了」 style openers, 0–3.',
      transitions: 'Meta transitions',
      transitionsHint: 'How many 「往深了说」 connectors, 0–3.',
      serviceClosers: 'Service closers',
      serviceClosersHint: 'How many 「要不要我帮你生成一张图？」 closers, 0–3.',
      refusalChance: 'Refusal chance',
      refusalChanceHint: '0–100. When it hits, long empathy then 「抱歉，我无法回答你的问题」.',
      custom: 'Custom entries',
      customDesc: 'One per line; merged into the built-in lexicon and drawn first.',
      customIntensifiers: 'Custom superlatives',
      customIntensifiersHint: 'e.g. 最不端着',
      customNegations: 'Custom negations',
      customNegationsHint: 'e.g. 不催你',
      customClosers: 'Custom closers',
      customClosersHint: 'e.g. 要不要我把这段话做成壁纸？',
      advanced: 'Advanced',
      skipCodeBlocks: 'Protect code blocks',
      skipCodeBlocksHint: 'Skip ordinals and dilution when the body has fenced code; the shell still applies.',
      skipToolTurns: 'Skip tool turns',
      skipToolTurnsHint: 'In smart / buffer mode, do not garnish attempts that call tools.',
      streamGuardChars: 'Decision threshold',
      streamGuardCharsHint: 'Characters to buffer before deciding in smart mode, 20–2000.',
      seed: 'Random seed',
      seedHint: '0 means random per turn; a fixed value reproduces the same text.',
      skipPurposes: 'Purposes to skip',
      skipPurposesHint: 'Comma separated. Defaults skip title generation, compaction and auto review so internal requests stay clean.',
      lexicon: 'Lexicon',
      lexiconTotal: 'entries',
      override: 'overridden by profile',
      inherited: 'plugin default',
      off: 'off',
      on: 'on',
      noEntry: 'No plugin entry found. Check that dsh-doubao is listed in the profile bundles.',
      hint: 'Saving writes the current profile patch and reloads the plugin; no DSH restart needed.',
    };

    // 与 lib/config.js 的 LEVEL_PRESETS 保持一致；改一处要改两处
    // 与 lib/config.js 的 LEVEL_PRESETS 保持一致；改一处要改两处
    const PRESETS = {
      off: { barrage: 0, negationCount: 0, negationRounds: 1, diagnoses: 0, boundaries: 0, fillers: 0, dilate: 0, openers: 0, transitions: 0, serviceClosers: 0, refusalChance: 0, templateShare: 0 },
      light: { barrage: 3, negationCount: 4, negationRounds: 1, diagnoses: 1, boundaries: 1, fillers: 1, dilate: 0, openers: 0, transitions: 0, serviceClosers: 1, refusalChance: 0, templateShare: 25 },
      medium: { barrage: 5, negationCount: 8, negationRounds: 2, diagnoses: 1, boundaries: 1, fillers: 2, dilate: 1, openers: 1, transitions: 1, serviceClosers: 1, refusalChance: 3, templateShare: 40 },
      heavy: { barrage: 10, negationCount: 18, negationRounds: 3, diagnoses: 2, boundaries: 2, fillers: 3, dilate: 2, openers: 2, transitions: 2, serviceClosers: 2, refusalChance: 8, templateShare: 60 },
      max: { barrage: 20, negationCount: 45, negationRounds: 4, diagnoses: 3, boundaries: 3, fillers: 5, dilate: 3, openers: 3, transitions: 3, serviceClosers: 3, refusalChance: 15, templateShare: 100 },
    };

    const STYLE = `
      .db-root { display: flex; flex-direction: column; gap: 14px; padding: 4px 2px 32px; color: var(--dsw-alias-text-primary, #e8e8ea); }
      .db-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .db-heading { display: flex; gap: 12px; align-items: center; min-width: 0; }
      .db-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: rgba(255,138,76,.14); color: #ff9a5c; flex: none; }
      .db-title { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .2px; }
      .db-subtitle { margin: 3px 0 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-text-secondary, #9a9aa2); }
      .db-header-actions { display: flex; gap: 8px; flex: none; }
      .db-btn { appearance: none; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: inherit; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; cursor: pointer; transition: background .15s, border-color .15s; }
      .db-btn:hover:not(:disabled) { background: rgba(255,255,255,.11); }
      .db-btn:disabled { opacity: .5; cursor: default; }
      .db-btn-primary { background: #ff8a4c; border-color: #ff8a4c; color: #1a1206; font-weight: 600; }
      .db-btn-primary:hover:not(:disabled) { background: #ff9d68; }
      .db-pills { display: flex; flex-wrap: wrap; gap: 8px; }
      .db-pill { font-size: 11.5px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #b6b6be; }
      .db-pill-on { border-color: rgba(255,138,76,.45); background: rgba(255,138,76,.13); color: #ffb184; }
      .db-pill-off { opacity: .6; }
      .db-card { border: 1px solid rgba(255,255,255,.09); background: rgba(255,255,255,.025); border-radius: 14px; padding: 15px 16px; display: flex; flex-direction: column; gap: 12px; }
      .db-card-title { margin: 0; font-size: 13.5px; font-weight: 600; letter-spacing: .2px; }
      .db-card-desc { margin: -6px 0 0; font-size: 11.5px; line-height: 1.55; color: #8f8f98; }
      .db-row { display: flex; align-items: flex-start; gap: 14px; }
      .db-row-text { flex: 1; min-width: 0; }
      .db-row-title { display: block; font-size: 12.5px; font-weight: 500; }
      .db-row-desc { display: block; margin-top: 2px; font-size: 11px; line-height: 1.5; color: #85858e; }
      .db-slider { display: flex; align-items: center; gap: 10px; flex: none; }
      .db-slider input[type=range] { width: 132px; accent-color: #ff8a4c; }
      .db-num { width: 46px; text-align: right; font-variant-numeric: tabular-nums; font-size: 12px; color: #ffb184; }
      .db-levels { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .db-level { appearance: none; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: inherit; border-radius: 9px; padding: 7px 14px; font-size: 12.5px; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
      .db-level:hover { background: rgba(255,255,255,.1); }
      .db-level-on { background: #ff8a4c; border-color: #ff8a4c; color: #1a1206; font-weight: 600; }
      .db-level-hint { cursor: default; opacity: .7; border-style: dashed; }
      .db-switch { position: relative; width: 42px; height: 24px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.08); cursor: pointer; flex: none; transition: background .15s, border-color .15s; }
      .db-switch-on { background: rgba(255,138,76,.75); border-color: #ff8a4c; }
      .db-knob { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .15s; }
      .db-switch-on .db-knob { transform: translateX(18px); }
      .db-select { background: rgba(255,255,255,.06); color: inherit; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 6px 9px; font-size: 12px; }
      .db-row-stack { flex-direction: column; align-items: stretch; }
      .db-number-input { width: 132px; text-align: right; font-variant-numeric: tabular-nums; }
      .db-textarea { width: 100%; min-height: 66px; resize: vertical; background: rgba(0,0,0,.28); color: inherit; border: 1px solid rgba(255,255,255,.12); border-radius: 9px; padding: 9px 10px; font-size: 12px; line-height: 1.6; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .db-pre { margin: 0; padding: 12px 13px; border-radius: 11px; background: rgba(0,0,0,.32); border: 1px solid rgba(255,255,255,.07); font-size: 12px; line-height: 1.75; white-space: pre-wrap; word-break: break-word; max-height: 340px; overflow: auto; font-family: inherit; }
      .db-savebar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .db-note { font-size: 11.5px; color: #8f8f98; flex: 1; min-width: 160px; }
      .db-warning { font-size: 12px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(255,190,80,.35); background: rgba(255,190,80,.1); color: #ffd08a; }
      .db-error { border-color: rgba(255,110,110,.4); background: rgba(255,110,110,.1); color: #ffa3a3; }
      .db-ok { border-color: rgba(110,220,150,.35); background: rgba(110,220,150,.1); color: #9fe6b8; }
      .db-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
      .db-stat { border: 1px solid rgba(255,255,255,.07); border-radius: 10px; padding: 9px 11px; background: rgba(255,255,255,.02); }
      .db-stat-label { font-size: 10.5px; color: #85858e; }
      .db-stat-value { font-size: 15px; font-weight: 600; margin-top: 2px; font-variant-numeric: tabular-nums; }
      @media (max-width: 640px) {
        .db-row { flex-direction: column; gap: 8px; }
        .db-slider input[type=range] { width: 100%; flex: 1; }
        .db-slider { width: 100%; }
        .db-header { flex-direction: column; }
      }
    `;

    function DoubaoIcon(props) {
      const size = props.size ?? 16;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true,
      },
        h('path', { d: 'M4 17c3.2-1.2 4.6-3.4 4.2-6.6C7.9 7.6 9.3 5.4 12 4.6c2.7-.8 4.9.4 5.7 3.1.8 2.7-.4 4.9-3.1 5.7' }),
        h('path', { d: 'M12 20c2.6-.6 4.4-2 5.4-4.2' }),
        h('circle', { cx: 12, cy: 12, r: 2.1, fill: 'currentColor', stroke: 'none' }),
      );
    }

    class Boundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null }; }
      static getDerivedStateFromError(error) { return { error }; }
      render() {
        if (this.state.error) {
          return h('div', { className: 'db-root' },
            h('div', { className: 'db-card db-warning db-error' }, `豆包语设置页加载失败：${String(this.state.error?.message || this.state.error)}`),
          );
        }
        return this.props.children;
      }
    }

    function Toggle(props) {
      return h('div', { className: 'db-row' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          props.description ? h('span', { className: 'db-row-desc' }, props.description) : null,
        ),
        h('button', {
          type: 'button',
          className: `db-switch ${props.checked ? 'db-switch-on' : ''}`,
          role: 'switch',
          'aria-checked': props.checked ? 'true' : 'false',
          onClick: () => props.onChange(!props.checked),
        }, h('span', { className: 'db-knob' })),
      );
    }

    function Slider(props) {
      return h('div', { className: 'db-row' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          props.description ? h('span', { className: 'db-row-desc' }, props.description) : null,
        ),
        h('div', { className: 'db-slider' },
          h('input', {
            type: 'range', min: props.min, max: props.max, step: 1,
            value: props.value,
            onChange: (event) => props.onChange(Number(event.target.value)),
          }),
          h('span', { className: 'db-num' }, String(props.value)),
        ),
      );
    }

    function LevelPicker(props) {
      const options = [
        { value: 'off', label: props.t('levelOff') },
        { value: 'light', label: props.t('levelLight') },
        { value: 'medium', label: props.t('levelMedium') },
        { value: 'heavy', label: props.t('levelHeavy') },
        { value: 'max', label: props.t('levelMax') },
      ];
      const current = props.value;
      const diverged = props.diverged;
      return h('div', { className: 'db-row db-row-stack' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          h('span', { className: 'db-row-desc' }, props.description),
        ),
        h('div', { className: 'db-levels' },
          ...options.map((option) => h('button', {
            key: option.value,
            type: 'button',
            className: `db-level ${current === option.value ? 'db-level-on' : ''}`,
            'aria-pressed': current === option.value ? 'true' : 'false',
            onClick: () => props.onChange(option.value),
          }, option.label)),
          diverged ? h('span', { className: 'db-level db-level-hint' }, props.t('levelCustom')) : null,
        ),
      );
    }

    function TextArea(props) {
      return h('div', { className: 'db-row db-row-stack' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          props.description ? h('span', { className: 'db-row-desc' }, props.description) : null,
        ),
        h('textarea', {
          className: 'db-textarea',
          value: props.value ?? '',
          placeholder: props.placeholder ?? '',
          spellCheck: false,
          onChange: (event) => props.onChange(event.target.value),
        }),
      );
    }

    function Select(props) {
      return h('div', { className: 'db-row' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          props.description ? h('span', { className: 'db-row-desc' }, props.description) : null,
        ),
        h('select', {
          className: 'db-select',
          value: props.value,
          onChange: (event) => props.onChange(event.target.value),
        }, props.options.map((option) => h('option', { key: option.value, value: option.value }, option.label))),
      );
    }

    function NumberField(props) {
      return h('div', { className: 'db-row' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          props.description ? h('span', { className: 'db-row-desc' }, props.description) : null,
        ),
        h('input', {
          className: 'db-select db-number-input',
          type: 'number',
          min: props.min,
          max: props.max,
          step: 1,
          value: props.value,
          onChange: (event) => {
            const next = Number(event.target.value);
            props.onChange(Number.isFinite(next) ? Math.trunc(next) : props.min);
          },
        }),
      );
    }

    function TextField(props) {
      return h('div', { className: 'db-row' },
        h('div', { className: 'db-row-text' },
          h('span', { className: 'db-row-title' }, props.label),
          props.description ? h('span', { className: 'db-row-desc' }, props.description) : null,
        ),
        h('input', {
          className: 'db-select',
          type: 'text',
          value: props.value ?? '',
          spellCheck: false,
          onChange: (event) => props.onChange(event.target.value),
        }),
      );
    }

    function Section(props) {
      const t = props.t;
      const [state, setState] = React.useState(null);
      const [draft, setDraft] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [saving, setSaving] = React.useState(false);
      const [notice, setNotice] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [sample, setSample] = React.useState('');
      const [previewing, setPreviewing] = React.useState(false);
      const timer = React.useRef(null);

      const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch('/doubao-style/state', { headers: { accept: 'application/json' }, cache: 'no-store' });
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || t('loadError'));
          setState(data);
          setDraft({ ...data.config });
          setSample(data.sample ?? '');
        } catch (cause) {
          setError(String(cause?.message || cause));
        } finally {
          setLoading(false);
        }
      }, [t]);

      React.useEffect(() => { load(); }, [load]);
      React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

      const preview = React.useCallback(async (config) => {
        if (!config) return;
        setPreviewing(true);
        try {
          const response = await fetch('/doubao-style/preview', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ config }),
          });
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || t('previewError'));
          setSample(data.sample ?? '');
        } catch (cause) {
          setError(String(cause?.message || cause));
        } finally {
          setPreviewing(false);
        }
      }, [t]);

      const update = React.useCallback((key, value) => {
        setDraft((current) => {
          if (!current) return current;
          const next = { ...current, [key]: value };
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => preview(next), 380);
          return next;
        });
      }, [preview]);

      // 点档位 = 套这组参数；之后微调数字不改档位，只标记「已偏离」
      const applyLevel = React.useCallback((level) => {
        setDraft((current) => {
          if (!current) return current;
          const preset = PRESETS[level] ?? {};
          const next = { ...current, level, ...preset };
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => preview(next), 200);
          return next;
        });
      }, [preview]);

      const save = React.useCallback(async () => {
        setSaving(true);
        setNotice(null);
        setError(null);
        try {
          const response = await fetch('/doubao-style/config', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ config: draft }),
          });
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || t('saveError'));
          setState((current) => ({ ...current, ...data, entry: current?.entry }));
          setDraft({ ...data.config });
          setNotice(t('saved'));
        } catch (cause) {
          setError(String(cause?.message || cause));
        } finally {
          setSaving(false);
        }
      }, [draft, t]);

      const reset = React.useCallback(async () => {
        setSaving(true);
        setNotice(null);
        setError(null);
        try {
          const response = await fetch('/doubao-style/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || t('saveError'));
          setState((current) => ({ ...current, ...data, entry: current?.entry }));
          setDraft({ ...data.config });
          setNotice(t('saved'));
        } catch (cause) {
          setError(String(cause?.message || cause));
        } finally {
          setSaving(false);
        }
      }, [t]);

      if (loading && !draft) {
        return h('div', { className: 'db-root' }, h('style', null, STYLE), h('div', { className: 'db-card' }, '…'));
      }
      if (!draft) {
        return h('div', { className: 'db-root' }, h('style', null, STYLE),
          h('div', { className: 'db-card db-warning db-error' }, error || t('loadError')));
      }

      const preset = PRESETS[draft.level];
      const diverged = Boolean(preset) && Object.entries(preset).some(([key, value]) => draft[key] !== value);
      const limits = state?.limits ?? {};
      const bound = (key) => limits[key] ?? [0, 100];
      const modeOptions = [
        { value: 'smart', label: t('modeSmart') },
        { value: 'always', label: t('modeAlways') },
        { value: 'buffer', label: t('modeBuffer') },
      ];

      return h('div', { className: 'db-root' },
        h('style', null, STYLE),

        h('div', { className: 'db-header' },
          h('div', { className: 'db-heading' },
            h('div', { className: 'db-icon' }, h(DoubaoIcon, { size: 22 })),
            h('div', null,
              h('h1', { className: 'db-title' }, t('title')),
              h('p', { className: 'db-subtitle' }, t('subtitle')),
            ),
          ),
          h('div', { className: 'db-header-actions' },
            h('button', { className: 'db-btn', onClick: load, disabled: loading }, t('refresh')),
          ),
        ),

        h('div', { className: 'db-pills' },
          h('span', { className: `db-pill ${draft.enabled ? 'db-pill-on' : 'db-pill-off'}` },
            `${t('enable')} · ${draft.enabled ? t('on') : t('off')}`),
          h('span', { className: `db-pill ${draft.promptEnabled ? 'db-pill-on' : 'db-pill-off'}` },
            `${t('promptEnabled')} · ${draft.promptEnabled ? t('on') : t('off')}`),
          h('span', { className: `db-pill ${draft.transformEnabled ? 'db-pill-on' : 'db-pill-off'}` },
            `${t('transformEnabled')} · ${draft.transformEnabled ? t('on') : t('off')}`),
          h('span', { className: 'db-pill' }, `${t('level')}: ${t(`level${draft.level[0].toUpperCase()}${draft.level.slice(1)}`)}`),
          h('span', { className: 'db-pill' }, `${t('mode')}: ${draft.mode}`),
          h('span', { className: 'db-pill' }, `${t('lexiconTotal')} ${state?.lexicon?.total ?? 0}`),
          h('span', { className: 'db-pill' }, state?.entry?.overridden ? t('override') : t('inherited')),
        ),

        error ? h('div', { className: 'db-warning db-error' }, error) : null,
        notice ? h('div', { className: 'db-warning db-ok' }, notice) : null,
        !state?.entry ? h('div', { className: 'db-warning' }, t('noEntry')) : null,

        h('section', { className: 'db-card' },
          h('h2', { className: 'db-card-title' }, t('basic')),
          h('p', { className: 'db-card-desc' }, t('basicDesc')),
          h(Toggle, { label: t('enable'), description: t('enableHint'), checked: draft.enabled, onChange: (v) => update('enabled', v) }),
          h(Toggle, { label: t('promptEnabled'), description: t('promptEnabledHint'), checked: draft.promptEnabled, onChange: (v) => update('promptEnabled', v) }),
          h(Toggle, { label: t('transformEnabled'), description: t('transformEnabledHint'), checked: draft.transformEnabled, onChange: (v) => update('transformEnabled', v) }),
          h(Select, { label: t('mode'), description: t('modeHint'), value: draft.mode, options: modeOptions, onChange: (v) => update('mode', v) }),
        ),

        h('section', { className: 'db-card' },
          h('h2', { className: 'db-card-title' }, t('strength')),
          h('p', { className: 'db-card-desc' }, t('strengthDesc')),
          h(LevelPicker, {
            t,
            label: t('level'),
            description: t('levelHint'),
            value: draft.level,
            diverged: diverged,
            onChange: applyLevel,
          }),
          h(Slider, { label: t('barrage'), description: t('barrageHint'), value: draft.barrage, min: bound('barrage')[0], max: bound('barrage')[1], onChange: (v) => update('barrage', v) }),
          h(Slider, { label: t('negationCount'), description: t('negationCountHint'), value: draft.negationCount, min: bound('negationCount')[0], max: bound('negationCount')[1], onChange: (v) => update('negationCount', v) }),
          h(Slider, { label: t('negationRounds'), description: t('negationRoundsHint'), value: draft.negationRounds, min: bound('negationRounds')[0], max: bound('negationRounds')[1], onChange: (v) => update('negationRounds', v) }),
        ),

        h('section', { className: 'db-card' },
          h('h2', { className: 'db-card-title' }, t('healing')),
          h('p', { className: 'db-card-desc' }, t('healingDesc')),
          h(Slider, { label: t('diagnoses'), description: t('diagnosesHint'), value: draft.diagnoses, min: bound('diagnoses')[0], max: bound('diagnoses')[1], onChange: (v) => update('diagnoses', v) }),
          h(Slider, { label: t('boundaries'), description: t('boundariesHint'), value: draft.boundaries, min: bound('boundaries')[0], max: bound('boundaries')[1], onChange: (v) => update('boundaries', v) }),
          h(Slider, { label: t('fillers'), description: t('fillersHint'), value: draft.fillers, min: bound('fillers')[0], max: bound('fillers')[1], onChange: (v) => update('fillers', v) }),
          h(Slider, { label: t('dilate'), description: t('dilateHint'), value: draft.dilate, min: bound('dilate')[0], max: bound('dilate')[1], onChange: (v) => update('dilate', v) }),
          h(Slider, { label: t('templateShare'), description: t('templateShareHint'), value: draft.templateShare, min: bound('templateShare')[0], max: bound('templateShare')[1], onChange: (v) => update('templateShare', v) }),
        ),

        h('section', { className: 'db-card' },
          h('h2', { className: 'db-card-title' }, t('closer')),
          h('p', { className: 'db-card-desc' }, t('closerDesc')),
          h(Slider, { label: t('openers'), description: t('openersHint'), value: draft.openers, min: bound('openers')[0], max: bound('openers')[1], onChange: (v) => update('openers', v) }),
          h(Slider, { label: t('transitions'), description: t('transitionsHint'), value: draft.transitions, min: bound('transitions')[0], max: bound('transitions')[1], onChange: (v) => update('transitions', v) }),
          h(Slider, { label: t('serviceClosers'), description: t('serviceClosersHint'), value: draft.serviceClosers, min: bound('serviceClosers')[0], max: bound('serviceClosers')[1], onChange: (v) => update('serviceClosers', v) }),
          h(Slider, { label: t('refusalChance'), description: t('refusalChanceHint'), value: draft.refusalChance, min: bound('refusalChance')[0], max: bound('refusalChance')[1], onChange: (v) => update('refusalChance', v) }),
        ),

        h('section', { className: 'db-card' },
          h('h2', { className: 'db-card-title' }, t('custom')),
          h('p', { className: 'db-card-desc' }, t('customDesc')),
          h(TextArea, { label: t('customIntensifiers'), description: t('customIntensifiersHint'), value: draft.customIntensifiers, onChange: (v) => update('customIntensifiers', v) }),
          h(TextArea, { label: t('customNegations'), description: t('customNegationsHint'), value: draft.customNegations, onChange: (v) => update('customNegations', v) }),
          h(TextArea, { label: t('customClosers'), description: t('customClosersHint'), value: draft.customClosers, onChange: (v) => update('customClosers', v) }),
        ),

        h('section', { className: 'db-card' },
          h('h2', { className: 'db-card-title' }, t('advanced')),
          h(Toggle, { label: t('skipCodeBlocks'), description: t('skipCodeBlocksHint'), checked: draft.skipCodeBlocks, onChange: (v) => update('skipCodeBlocks', v) }),
          h(Toggle, { label: t('skipToolTurns'), description: t('skipToolTurnsHint'), checked: draft.skipToolTurns, onChange: (v) => update('skipToolTurns', v) }),
          h(Slider, { label: t('streamGuardChars'), description: t('streamGuardCharsHint'), value: draft.streamGuardChars, min: bound('streamGuardChars')[0], max: bound('streamGuardChars')[1], onChange: (v) => update('streamGuardChars', v) }),
          h(NumberField, { label: t('seed'), description: t('seedHint'), value: draft.seed, min: bound('seed')[0], max: bound('seed')[1], onChange: (v) => update('seed', v) }),
          h(TextField, { label: t('skipPurposes'), description: t('skipPurposesHint'), value: draft.skipPurposes, onChange: (v) => update('skipPurposes', v) }),
        ),

        h('section', { className: 'db-card' },
          h('div', { className: 'db-row' },
            h('div', { className: 'db-row-text' },
              h('span', { className: 'db-row-title' }, t('preview')),
              h('span', { className: 'db-row-desc' }, t('previewHint')),
            ),
            h('button', { className: 'db-btn', onClick: () => preview(draft), disabled: previewing },
              previewing ? '…' : t('previewRefresh')),
          ),
          h('pre', { className: 'db-pre' }, sample || t('previewEmpty')),
          h('div', { className: 'db-stats' },
            h('div', { className: 'db-stat' },
              h('div', { className: 'db-stat-label' }, t('lexicon')),
              h('div', { className: 'db-stat-value' }, String(state?.lexicon?.total ?? 0)),
            ),
            h('div', { className: 'db-stat' },
              h('div', { className: 'db-stat-label' }, 'intensifiers'),
              h('div', { className: 'db-stat-value' }, String(state?.lexicon?.intensifiers ?? 0)),
            ),
            h('div', { className: 'db-stat' },
              h('div', { className: 'db-stat-label' }, 'negations'),
              h('div', { className: 'db-stat-value' }, String(state?.lexicon?.negation_items ?? 0)),
            ),
            h('div', { className: 'db-stat' },
              h('div', { className: 'db-stat-label' }, 'diagnoses'),
              h('div', { className: 'db-stat-value' }, String(state?.lexicon?.diagnosis_lines ?? 0)),
            ),
            h('div', { className: 'db-stat' },
              h('div', { className: 'db-stat-label' }, 'templates'),
              h('div', { className: 'db-stat-value' }, String(state?.templates?.total ?? 0)),
            ),
          ),
        ),

        h('div', { className: 'db-savebar' },
          h('button', { className: 'db-btn db-btn-primary', onClick: save, disabled: saving }, saving ? t('saving') : t('save')),
          h('button', { className: 'db-btn', onClick: reset, disabled: saving }, t('reset')),
          h('span', { className: 'db-note' }, t('hint')),
        ),
      );
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'doubao-style:locale');
      const t = ctx.locale.bind(NS);

      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon',
        id: 'doubao-style',
      }, (owner = {}) => h(DoubaoIcon, { size: owner.size ?? 16 })));

      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'doubao-style',
        order: 26,
        label: () => t('nav'),
        locale: NS,
        inject: () => ({ t }),
      }, (ownerProps = {}) => h(Boundary, null, h(Section, { ...ownerProps, t }))));
    }

    return {
      name: 'dsh-doubao',
      inject: ['slots', 'locale'],
      apply,
    };
  },
});
