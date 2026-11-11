# dsh-doubao

把 DSH 的模型输出改造成**豆包语**的插件。

> 豆包语 = 排比式真诚 + 清单式边界 + 疗愈式诊断 + 复读式共情 + 服务式收尾：
> 听起来很懂你，细看像模板；情绪价值拉满，信息密度很低。

## 两条通道

| 通道 | 机制 | 作用 |
|---|---|---|
| ① 系统提示注入 | `ctx.systemPrompt.section({ order: 165 })` | 让模型**自己**就用豆包语写正文 |
| ② 输出流后处理 | `ctx.on('llm/stream', …)` | 在流上补外壳，保证一定有排比、否定清单、复读 |

两条可以单独关。只留 ① 更自然，只留 ② 更稳定（外壳 100% 出现）。

## 六段结构

1. **高能前置**：元话语 + 「我给你最A、最B……最Z的结论：」
2. **正文**：序数词分层 + 元话语铺垫，信息原样保留
3. **疗愈诊断**：「你不是A，你只是B」
4. **否定清单**：「我就在这里，不X，不Y……」，分号分组
5. **复读**：把第 4 段原样再念 N 遍
6. **收尾**：服务化询问，或按概率反转成「抱歉，我无法回答你的问题」

## 三种后处理模式

| 模式 | 行为 | 代价 |
|---|---|---|
| `smart`（默认） | 先缓冲 `streamGuardChars` 个字符：命中工具调用就整轮放行，是正文就立刻加壳 | 正文前几十字有轻微延迟 |
| `always` | 第一个文本增量就加壳 | 工具轮次也会被加壳 |
| `buffer` | 整段收完再膨胀，可跳过工具轮次、可做完整正文膨胀 | 不流式 |

## 设置页

`设置 → 豆包语`。所有旋钮实时预览、保存即重载，不需要重启 DSH。

- 总开关 / 提示词 / 后处理 / 模式
- 总强度、排比条数、否定项条数、复读遍数
- 诊断条数、边界承诺条数、共情填充、信息稀释
- 元话语开场/转场、服务化收尾、反转拒答概率
- 自定义排比词 / 否定项 / 收尾（一行一条，并入词库）
- 保护代码块、跳过工具轮次、判定阈值、随机种子
- 不套壳的请求用途（默认 `session-title,compaction,auto-review`）

## 句式模板

调研来的 49 条 `sentence_templates` 里，占位符大小写不一、语义槽没有来源。`lib/templates.js` 做三件事：

1. **归一化槽位**：`{BODY}`→`{body}`；`{A}` 是「表面判断」、`{a}` 是正文内容槽，大小写不合并。
2. **按槽位定角色**：opener / prefix / diagnosis / boundary / transition / closer / refusal / filler。
3. **渲染时缺槽就整条放弃**，绝不留半个花括号。

清洗结果：51 条可用（含补充句式），7 条丢弃（`我陪你{A}`、`你可以不{A}，但请你{B}` 这类填进去是病句）。

`templateShare`（0–100，默认 45）控制有多大比例走模板而不是现场拼装。设为 100 时前置句会明显重复——这是模板感，不是 bug。

## 词库

`lib/lexicon.json`（调研产物）+ `lib/phrase-bank.json`（骨架句）+ `lib/lexicon.js` 里的补充词条。

| 类别 | 条数 |
|---|---|
| 排比词 `intensifiers` | 130+ |
| 否定项 `negation_items` | 240+ |
| 疗愈诊断 `diagnosis_lines` | 90+ |
| 元话语 `meta_openers` / `meta_transitions` | 60+ / 55+ |
| 边界承诺 `boundary_commitments` | 55+ |
| 服务收尾 `service_closers` | 45+ |
| 反转拒答 `refusal_closers` | 35+ |
| 共情填充 `empathy_fillers` | 80+ |
| 句式模板 `sentence_templates` | 49 |

## 实现要点

`dsh-llm` 的 `BlockAssembler` 在收到 `block-end` 时以 `chunk.block` 为准，增量拼出来的 text 会被覆盖。
所以改写正文必须**同时**改 `text-delta` 与 `block-end.block.text`，只改一处等于没改。

## 安装

**直接装发布包（推荐）**

```bash
dsh plugin add https://github.com/Ralsei1337/dsh-doubao/releases/latest/download/dsh-doubao-1.0.0.tgz
```

**从源码 link**


```jsonc
// ~/.dsh/profiles/<profile>/package.json
{
  "dependencies": { "dsh-doubao": "link:/root/DSHA开发/dsh-doubao" },
  "dsh": { "profile": { "bundles": ["…", "dsh-doubao"] } }
}
```

插件自带 `cordis.patch.yml`（`insert` 一行 `dsh-doubao`），profile 的 `cordis.patch.yml` 里可以覆盖 `config`。
`patchReload: startup`，所以**首次安装要重启一次 web**；之后改配置由设置页热重载。

## 测试

```bash
node test/smoke.mjs        # 8 项：基本结构与三种模式
node test/adversarial.mjs  # 30 项：畸形流、边界配置、原型污染
node test/edge-cases.mjs   # 15 项：null chunk、负索引、双 finish、模板残留
node test/client-render.mjs # 设置页结构（用迷你 React 垫片真跑一遍）
```

### 踩过的坑

- `dsh-llm` 的 `BlockAssembler` 以 `block-end.block.text` 为准，只改 `text-delta` 会被覆盖。
- `configEditor.edit` 只重载配置，**不重新 import 模块**（ESM 缓存），改代码必须重启进程。
- `buffer` 模式的工具调用出现在文本块之后，所以 block-end 也要压到 finish 再决定。
