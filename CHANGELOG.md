# Changelog

All notable changes to this skill are documented here. The version here must match `version:` in
`skills/powpop-two-stories/SKILL.md` and in every file under `locales/`.

## 1.1.0 — 2026-10-28

Multilingual release, and the skill now lives in its own repository.

**Added**

- English full text at `locales/en/SKILL.md` — an equivalent rendering, not a summary. Same tools,
  same 500 m threshold, same 5-row cap, same 18 hard rules.
- `locales/README.md`: the i18n contract. Lists what is behaviour and therefore untranslatable
  (tool names, thresholds, rule numbering, the hard numbers) and what may be localised
  (headings, example place names, the fixed wording of the like question — as long as it keeps
  both disclosures: liking notifies nobody, and liking can extend an expired post by 24 hours).
- `scripts/check-locales.mjs`: parity check comparing version, the 7 tool names, the 6 hard
  numbers (500 / 1000 / 657 / 273 / 97 / 23%), the hard-rule count, and the section count across
  every locale. Exits non-zero on drift; wired into CI for every push.
- `language: zh-CN` + `locales: [en]` in the canonical frontmatter, and a "语言 · Languages"
  section so an agent picks the right file instead of mixing two languages mid-answer.
- `display_name_en` / `description_zh` / `description_en` frontmatter fields, which is how
  ClawHub renders a bilingual listing.

**Changed**

- Repository moved to a dedicated repo (`durenzidu/powpop-two-stories`); no behaviour change in
  the skill body itself.

## 1.0.0 — 2026-10-28

First release.

- Find other posts at the same place within 500 m, **never** filtered by time; widen to 1000 m
  only when fewer than 3 rows come back, and label those separately.
- Place decided by distance; the place name only has to be *not contradictory* (core-word
  containment check), because the platform writes one place a dozen different ways.
- Normalise and de-duplicate bodies, keeping the earliest copy — 23% of the live corpus is the
  same sentence seeded across several locations.
- Show at most 5 rows: 4 by distance tier then plain-text length, plus 1 earliest; present in
  ascending date order.
- Always fetch bodies through `get_post_detail` (server strips rich text, 4000-character cap),
  with a local `<...>`-stripping fallback. Reading HTML tags aloud is an implementation bug.
- One question at the end: like all / pick some / like none. Only after an explicit answer, only
  the rows already shown, never the user's own post.
- Named the honest limits in the skill itself: no like counts, no who-liked-me, no comments, no
  DMs, no notifications, no reliable identity — and an empty result means "I can't see anything",
  never "you're the first".
