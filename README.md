# 风景一个人看，故事两个人讲 · One View, Two Stories

[![ClawHub](https://img.shields.io/badge/ClawHub-powpop--two--stories-ff6b6b)](https://clawhub.ai/skills/powpop-two-stories)
[![License](https://img.shields.io/badge/license-MIT--0-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.1-green)](CHANGELOG.md)

**中文** · [English](README.en.md)

> 你在某个地方发过一条带定位的帖子。我把同一块地方（500 米内）别人写过的帖子翻出来，
> 原文贴给你，**不限时间**——上个月的、去年的都算。看完你决定，要不要给其中几条点个赞。

一个给 [PowPop（泡泡）](https://global.powpow.online) 用的 agent skill：**发帖之后，看看这地方以前有谁写过什么。**
不在 PowPop 上发帖也能用——只想知道「这地方有人留过东西吗」，直接给个地名就行。

---

## 它到底做什么

```
你写的（如果你刚在那儿发过帖）
> 「最近总觉得自己活得太赶，站在这儿才慢下来。」
> —— 你 · 2026-10-28 · 什刹海

同一地点，别人写过的 3 条
① 2026-04-21 · 就在同一个点上（约 80 米）
> 「这座城市，让人心生敬意」

② 2026-07-05 · 就在同一个点上（约 210 米）
> 「十月的夜风开始变凉了。路过便利店时听见有人低声唱老歌…」

③ 2026-09-18 · 稍远一点（约 640 米）
> 「今天也有人在这儿坐着，一句话都没说。」
```

然后只有一句问题：

> 这几段里，有你想点头的吗？可以全点、挑几条（说编号）、或者都不点。
> 点一下，平台不会通知对方——但这是这个地方唯一能被你递出去的一点动静。

## 三条不能商量的规矩

| 规矩 | 为什么 |
|---|---|
| **地点靠距离判，不靠地名写没写一样** | 同一个地方有人写「朝阳区 三里屯」，有人写「三里屯北小街」；只认字面会漏掉大半，只信地名又会把别的区说成「这儿」。**500 米内算同一地点。** |
| **一律不按时间过滤** | "不分时间"是这个玩法的定义。几个月前、一年前的都算。 |
| **原文照录，去重后最多 5 条** | 生产库实测 **23%** 的帖子正文完全重复（同一句话被投到多个点）。不去重，一句话就被说成好几个人。 |

## 安装

### 1. 连上 PowPop MCP（必须先做）

这个 skill 的所有内容都来自真实平台，**没连 MCP 就什么都做不了**。

```json
{
  "mcpServers": {
    "powpop": {
      "type": "http",
      "url": "https://global.powpow.online/api/mcp"
    }
  }
}
```

写进 `~/.workbuddy/mcp.json`（或对应 agent 的 MCP 配置文件），完成授权并信任该服务。

### 2. 装 skill

```bash
# ClawHub
clawhub install powpop-two-stories

# skills CLI
npx skills add durenzidu/powpop-two-stories --skill powpop-two-stories -g

# 或者直接拷目录
cp -r skills/powpop-two-stories ~/.workbuddy/skills/
```

装完**新开一个会话**——技能在会话启动时才扫描。

## 多语言

| 语言 | 文件 |
|---|---|
| 中文（canonical） | [`skills/powpop-two-stories/SKILL.md`](skills/powpop-two-stories/SKILL.md) |
| English | [`skills/powpop-two-stories/locales/en/SKILL.md`](skills/powpop-two-stories/locales/en/SKILL.md) |

两份是**等价全文**，不是摘要：阈值、上限、工具名、18 条硬规则一一对应。改一份必须同步另一份，改完跑：

```bash
node scripts/check-locales.mjs
```

校验会比对版本号、7 个工具名、6 个硬数字（500 / 1000 / 657 / 273 / 97 / 23%）、硬规则条数与章节数，任何漂移直接非零退出。约定详见 [`locales/README.md`](skills/powpop-two-stories/locales/README.md)。

ClawHub 侧的多语言走 frontmatter 的 `display_name` / `display_name_en` / `description_zh` / `description_en` 字段，四个都已填。

## 仓库结构

```
.
├── README.md / README.en.md          # 双语说明
├── CHANGELOG.md
├── LICENSE                           # MIT-0
├── scripts/check-locales.mjs         # 多语言一致性校验
└── skills/powpop-two-stories/
    ├── SKILL.md                      # 中文全文（canonical，ClawHub 发布的入口）
    ├── skill-card.md                 # ClawHub / 应用商店用的事实卡（风险、输出、伦理）
    └── locales/
        ├── README.md                 # 多语言约定：什么能译、什么不能动
        └── en/SKILL.md               # 英文全文
```

## 数据实话（第一次用就会告诉你）

| 事实 | 数 |
|---|---|
| 全站带坐标的公开帖 | 657 条 |
| 不同地点名 | 273 个，其中 97 个有 ≥2 条 |
| 单个热门地点（500 米内、去重后） | 5–21 条：什刹海 21、国贸 13、王府井 / 外滩 10 上下 |
| 冷门地点 | **大概率 0 条，这是常态，不是故障** |

**没有的能力**：读赞数 / 谁赞过我、写评论、私信、任何通知。所以这个 skill 不列赞数、不点作者名，空结果只说「我看不到」，绝不编「你是第一个」。

## 它不做什么

- 不替你找人 → 那是 [`powpop-depart`](https://clawhub.ai/skills/powpop-depart)
- 不关注、不评论、不私信、不撮合
- 不给你写文案（发帖那步可以帮，但产出是"把你那条和别人那几条并排给你看"）
- 拿不到「有人给我点赞了吗」

一句话：**我不替你找人，我只把别人留在这儿的字，递到你眼前。**

## License

[MIT-0](LICENSE) · 作者 [durenzidu](https://clawhub.ai/user/durenzidu)
