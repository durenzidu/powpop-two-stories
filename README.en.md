# One View, Two Stories

[![ClawHub](https://img.shields.io/badge/ClawHub-powpop--two--stories-ff6b6b)](https://clawhub.ai/skills/powpop-two-stories)
[![License](https://img.shields.io/badge/license-MIT--0-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-green)](CHANGELOG.md)

[中文](README.md) · **English**

> You've posted something at a place, with a location attached. I pull up what other people wrote
> at that same place (within 500 m) and quote it back verbatim — **no time limit**, last month or
> last year, all of it. Then you decide whether to like any of them.

An agent skill for [PowPop (泡泡)](https://global.powpow.online): **after you post, see who has written here before.**
You don't have to post first — if you just want to know "has anyone left anything here", give it a place name.

---

## What it actually does

```
you wrote (if you just posted there)
> "Lately I keep feeling I live too fast. Standing here, I finally slowed down."
> — you · 2026-10-28 · Shichahai

same place, 3 posts from other people
① 2026-04-21 · the very same spot (about 80 m)
> "This city makes you feel reverent."

② 2026-07-05 · the very same spot (about 210 m)
> "The October night wind is turning cold. Passing the convenience store, I heard someone humming an old song…"

③ 2026-09-18 · a bit further out (about 640 m)
> "Someone else was sitting here today too. Didn't say a word."
```

Then I point at one: **"of these, ② reads most like you"** — backed by one quoted line from each side, plus one line on where they differ.

What gets compared is the text, on five dimensions: subject, where the feeling lands, whether the writer is present, whether it looks at now or back then, and how it's said. At least three must line up.
**No guessing who wrote it, how old they are, or what they do; no "87% compatible" scores; and no following or DMing anyone because of it.**

Then exactly one question:

> Is there anything here you want to nod to? You can like all of them, pick a few (by number), or like none.
> Liking does not notify the other person — but it is the one bit of motion here that can be handed over to someone.

## Three rules that are not negotiable

| Rule | Why |
|---|---|
| **Distance decides the place, not whether the names match** | The same spot gets written as "Chaoyang District Sanlitun", as "Sanlitun North Street", and as "Sanlitun". Matching strings loses most of the content; trusting names drags another district in as "here". **Within 500 m counts as the same place.** |
| **Never filter by time** | "Regardless of date" *is* the play. Months back, a year back, all of it counts. |
| **Quote verbatim, at most 5 after de-duplication** | On the live database **23%** of post bodies are byte-identical duplicates (one sentence seeded at several points). Without de-duplication, one sentence becomes several people. |

## Install

### 1. Connect the PowPop MCP (do this first)

Everything this skill says comes from the real platform. **Without the MCP it can do nothing.**

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

Put that in `~/.workbuddy/mcp.json` (or your agent's MCP config), authorize it, and trust the server.

### 2. Install the skill

```bash
# ClawHub
clawhub install powpop-two-stories

# skills CLI
npx skills add durenzidu/powpop-two-stories --skill powpop-two-stories -g

# or just copy the folder
cp -r skills/powpop-two-stories ~/.workbuddy/skills/
```

Start a **new session** afterwards — skills are scanned at session start.

## Languages

| Language | File |
|---|---|
| Chinese (canonical) | [`skills/powpop-two-stories/SKILL.md`](skills/powpop-two-stories/SKILL.md) |
| English | [`skills/powpop-two-stories/locales/en/SKILL.md`](skills/powpop-two-stories/locales/en/SKILL.md) |

The two are **equivalent full texts**, not summaries: thresholds, caps, tool names, and all 18 hard rules line up one to one. Change one, change the other, then run:

```bash
node scripts/check-locales.mjs
```

The check compares the version, the 7 tool names, the 6 hard numbers (500 / 1000 / 657 / 273 / 97 / 23%), the rule count, and the section count; any drift exits non-zero. Conventions are in [`locales/README.md`](skills/powpop-two-stories/locales/README.md).

On the ClawHub side, localisation goes through the `display_name` / `display_name_en` / `description_zh` / `description_en` frontmatter fields — all four are filled in.

## Repository layout

```
.
├── README.md / README.en.md          # bilingual docs
├── CHANGELOG.md
├── LICENSE                           # MIT-0
├── scripts/check-locales.mjs         # locale parity check
└── skills/powpop-two-stories/
    ├── SKILL.md                      # Chinese full text (canonical, ClawHub entry point)
    ├── skill-card.md                 # fact card for listings (risks, outputs, ethics)
    └── locales/
        ├── README.md                 # i18n contract: what may be translated, what may not
        └── en/SKILL.md               # English full text
```

## The honest numbers (it tells you on first use)

| Fact | Number |
|---|---|
| Public posts with coordinates, whole platform | 657 |
| Distinct place names | 273, of which 97 have ≥2 posts |
| One busy place (within 500 m, after de-duplication) | 5–21 rows: Shichahai 21, Guomao 13, Wangfujing / the Bund around 10 |
| Quiet places | **Usually 0 rows. That is normal, not a malfunction** |

**What does not exist**: reading like counts / who liked me, comments, DMs, any notifications. So the skill never shows like counts, never names authors, and on an empty result says only "I can't see anything" — never "you're the first".

## What it does not do

- It does not find people for you → that is [`powpop-depart`](https://clawhub.ai/skills/powpop-depart)
- No following, no comments, no DMs, no matchmaking
- No copywriting (the posting step can help, but the product is "your post next to other people's")
- It cannot tell you "did anyone like my post"

One line: **I don't find people for you. I only hand you the words someone else left here.**

## License

[MIT-0](LICENSE) · by [durenzidu](https://clawhub.ai/user/durenzidu)
