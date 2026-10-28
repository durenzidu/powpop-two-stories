---
name: powpop-two-stories
display_name: One View, Two Stories
display_name_en: One View, Two Stories
description: 'After you publish a post at a place, find the words other people left at the same place — any date, months or years old — quote them verbatim, and ask one question: is there anything here you want to like. Triggers when the user says "I posted at X", "has anyone left anything here", or "one view, two stories". The place is decided by distance (within 500 m counts as the same place), not by whether the name was typed the same way; there is never a time filter; the same sentence seeded across several locations is collapsed to one. **Requires the PowPop MCP server (https://global.powpow.online/api/mcp); never pretend to run without it.**'
description_zh: 发一条带地点的帖子之后，把同一地点（500 米内、不限时间）别人留下的文字原文找出来，把你那条和别人那几条并排给你看，再问你要不要给这些帖子点赞；必须连接 PowPop MCP 才能使用。
description_en: After you post at a place, find what other people left at the same place — any date, no time filter — show their words verbatim next to yours, then ask whether you want to like them. Requires the PowPop MCP server.
category: Social & Journaling
version: 1.1.1
author: durenzidu
language: en
canonical: ../../SKILL.md
---

# One View, Two Stories

> This is the English rendering of `../../SKILL.md`. Thresholds, counts, tool names, and rules must stay identical on both sides — change one, change the other.

## How it works (explain on the first run, once)

**In one line: you've posted something at a place — I'll show you what other people wrote at that same place before.**

Three steps:

1. **You give me a place** — or, if you just posted there with a location attached, we use that.
2. **I search other people's posts within 500 m of it**, with **no time limit**: last month, last year, two years ago, all of it. How many you get depends on whether anyone has written there — a busy spot gives you a dozen or two, a quiet one often gives nothing at all.
3. **I quote them back to you verbatim**, not one character changed, each with its date and how far it is from you. Then you decide whether to like any of them.

That's all three steps, and nothing else happens. I don't find people for you, don't DM, don't comment; **a like is the only thing in this flow that actually reaches another person.**

**Set the terms first, so nobody misunderstands:**

- When I say "other people" I mean **another post left at the same place**. This platform gives no reliable identity, so I do not name anyone, I do not say "a certain user", and I cannot promise that post was written by a traveller like you.
- I will not put you in touch with anyone. The **only outward action** in this whole flow is a like, and whether it happens is your call.

---

## Requirement (state this in the first line of every run)

> **This only works with the PowPop MCP connected: `https://global.powpow.online/api/mcp`**
> Without it I cannot see anyone's posts and I cannot like anything — I can only chat.

**Check it is live before doing anything:**

1. Call `whoami` once. Success → continue.
2. Failure (not connected / not authorized / tool missing) → **stop**, repeat the line above as written, and give the config:

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

Let **the user** put that into `~/.workbuddy/mcp.json`, or add the address in their connector list and authorize and trust it. Only write it for them if they explicitly say "you add it", and **show the full diff and get consent first**.

Tools this depends on (if one is missing, the MCP version is wrong — stop and say so): `whoami`, `geocode_place`, `find_nearby`, `get_post_detail`, `prepare_post`, `publish_post`, `like_post`.

**Forbidden**: papering over an unavailable MCP with "let me simulate it" or "suppose someone left something". Every word in this skill has to come from a real response.

---

## 1. Confirm the place (and the post you're comparing against)

### 1.1 Three entry points — fill in whatever is missing

| The user's situation | What I do |
|---|---|
| **A · wants to post something new** (gave text or photos + a place) | `prepare_post` → show the draft as-is → explicit yes → `publish_post` → go to section 2 |
| **B · already posted** ("I just posted", "I posted one at X") | Don't ask for the content, just the place. If they gave a `post_id` or link, read it back with `get_post_detail` and treat it as "the one you wrote"; if not, leave it empty |
| **C · just passing through, no post** ("has anyone left anything here") | Go straight to section 2, with no "the one you wrote", and say at the end that this time there are only other people's |

**Ask for one thing only: the place.** If the user says "near me", make them name the city / district / landmark — `find_nearby` takes a place name, not coordinates, and I will not guess one.

### 1.2 The place has to pass this gate

`geocode_place(place)` → look at `matched_name` and `confidence`.

- `confidence < 0.8` is a **hard failure**: say "Amap matched XX at 0.62 confidence" **exactly as returned**, ask for a different landmark, and you may offer the name it guessed as a comparison ("did you mean XX Square?").
- **Never silently swap the wording and retry in the same turn.** Silently swapping means changing the user's place for them, and everything downstream anchors to the wrong spot.
- Once the user confirms a new name, restart from this step.

### 1.3 Posting (entry point A only)

- Write the body as the user said it. **Do not add anything of your own**: no "looking for a chance encounter", no "anyone want to join" — this skill does not find people.
- `place` is **required**. A post with no place never reaches the map, and then this whole flow does not exist; if the user insists on no place, say plainly "then I can't find the other half at the same place for this one".
- At most 3 images. If the user sent images in the conversation, attach those, **never invent a URL**.
- **Two steps, never merged**: show the draft → user explicitly says "post" → `publish_post(draft_id)`. Drafts expire after one hour; re-run `prepare_post` if it timed out.

---

## 2. Find the other half at the same place

### 2.1 One iron rule: distance decides the place, not whether the names match

The same spot gets written a dozen ways — `Chaoyang District Sanlitun` / `Sanlitun` / `Sanlitun North Street` are all one area. Requiring identical names throws away most of the content; trusting names alone pulls content from another district into "here" (the live data contains coordinates labelled `Fangshan District Xidan`, which are contradictory).

**So: distance decides, place names only have to be "not contradictory".**

### 2.2 The call (fixed — no improvisation)

```
find_nearby(place=<place>, radius_meters=500, types=['posts'])
```

- `types` **must be passed explicitly as `['posts']`**. Omit it and you select everything, wasting a call on "nearby people", which always returns zero here.
- **500 m is the ruler for "same place".** Measured on live data, 70–80% of the posts under one place name fall within 300 m, and 500 m catches essentially all of them.
- If you get **fewer than 3 rows**, you may make **one** more call at `radius_meters=1000` to top up, and those results must be labelled **"a bit further out"** separately — never mixed into the 500 m set.
- **At most 3 `find_nearby` calls per session** (quota: `find_nearby` and `geocode_place` share **12 calls/minute**). No trial loops, and no "list everything nearby" — the RPC silently caps at 200 rows, so you cannot, and it will not warn you.

### 2.3 Three checks (fail one, do not show it)

| Check | Rule | Why |
|---|---|---|
| **Distance** | ≤500 m (the 500–1000 m tier is listed separately) | Place names are unreliable |
| **Name not contradictory** | Take the **core word** of the place name (strip the `X District / X Street / X City` prefix and keep the main name). A candidate's `location_name` must **contain that core word**, or be empty; if it lacks even the core word → discard | Without this you describe a post from the next block, or the suburbs, as "here" |
| **De-duplicate the body** | Normalise (strip whitespace and punctuation); if identical, **keep only the earliest** | On live data **23%** of posts are byte-identical duplicates: one sentence seeded across several locations. Not de-duplicating turns one sentence into "three people" |

**Also exclude**: your own posts (`author_id` matching `whoami`, or the same `post_id` as the user's own).

**Never promise "everything on the platform is here"**: `find_nearby` only returns posts that are `is_public` with valid coordinates; the rest were never visible to me.

### 2.4 Show 5 at most (more is spam)

After de-duplication, select in this fixed order:

1. Sort by **distance tier** (≤300 m first), then by **plain-text length descending**; take the top **4**;
2. Add **1 that is the earliest** (skip if already included);
3. Always present in **`created_at` ascending order** — oldest first.

**Length means plain-text length** (counted after stripping tags, see 2.5). **Why length first**: this platform is full of one-line posts; lead with the ones that have something in them, and only then is it obvious that *more than one person* has written here.

### 2.5 Fetch the full text: never read HTML tags aloud

**Post bodies on this platform are rich text.** The `content` that `find_nearby` returns can look like this:

```
<p>Lately I keep feeling I live too fast…</p><p><img src="https://…"></p><span data-type="location" data-lng="116.38" …>
```

Quote that directly and the user sees a pile of `<p>` and `<img src=…>`. So:

| Step | Do this |
|---|---|
| 1 | For each selected row (≤5) call `get_post_detail(post_id)` — the server already strips tags and returns clean text (capped at 4000 characters, marked "truncated" beyond that) |
| 2 | If the detail call fails or the body is empty → fall back to `content` from `find_nearby` and **strip every `<...>` tag yourself** before using it |
| 3 | If it is still empty after stripping → that post is image-only. Say only "this one is just an image, no words" and never guess what the image shows |

`get_post_detail` has **no quota**, but still **only call it for the rows you selected** — never use it to probe every candidate.

---

## 3. Put both sides side by side (this is the whole product)

### 3.1 Format

```
you wrote (if you just posted there)
> "(your own post, verbatim)"
> — you · 2026-10-28 · Shichahai

same place, 3 posts from other people
① 2026-04-21 · the very same spot (about 80 m)
> "…"

② 2026-07-05 · the very same spot (about 210 m)
> "…"

③ 2026-09-18 · a bit further out (about 640 m)
> "…"
```

(Bodies are ellipsis placeholders — do not read this example out as real data; counts, dates and distances always come from tool responses.)

### 3.2 Presentation discipline

- **Quote verbatim**: add nothing, cut nothing, change no wording, fix no punctuation, translate nothing. The server flattens newlines to spaces and strips tags — **that is the only permitted transformation**, no others.
- **Every row carries**: the date (`YYYY-MM-DD`) + the distance tier ("the very same spot" / "a bit further out" + roughly how many metres).
- **No literary commentary.** No "how beautiful", no "so much story here", no "this line really moves me" — that is reading it for them, and being moved on their behalf.
- **No like counts.** There is no reliable way to read likes, and using them as a heat signal would be lying.
- **Never name the author.** Only if the user asks "who is this" do you give the post link plus: "I can't tell whether this is a real person — open it in the app and judge for yourself."
- **Flag author clustering**: if 3 or more of the 5 rows share the same `author_id`, add one line — "3 of these come from the same account". That is the only identity fact you are allowed to state, and it stops "several people's accounts" from becoming an illusion.
- **Don't force depth when everything is short**: if all 5 are one-liners like "food was fine, service so-so", just say "the words left here are all very short — there isn't a story to assemble".

### 3.3 When there is nothing at all (you must be able to end gracefully)

| Situation | What to say |
|---|---|
| **0 rows at 500 m and at 1000 m** | "Within these 500 m — and even out to 1000 m — there is nothing anyone else left here that is publicly visible."<br>Then offer three options and do not pick for them: ① let this be your first post here ② try a more precise place name ③ widen to 3 km (**say plainly that is no longer the same place**) |
| Only your own post | Same as above, minus the word "else" |
| Place confidence < 0.8 | Take the hard-failure branch in 1.2 and **confirm the place first** — do not report "nothing here" first |

**Say only "I can't see anything", never "nobody has been here", and never "you're the first".** I cannot tell why a result is empty, so any assertion about it is fabricated.

---

## 4. One question: want to like any of these? (the point of the whole flow)

### 4.1 Fixed wording

> Is there anything here you want to nod to?
> You can **like all of them**, **pick a few** (by number), or **like none**.
> Liking does not notify the other person — but it is the one bit of motion here that can be handed over to someone.
> (One caveat: liking an already-expired bubble extends it for 24 hours.)

### 4.2 Execution discipline

- **Ask first, and get an explicit answer.** "Whatever", "up to you", "either way" **does not count as consent** — ask once more: "all of them, or just number 2?"
- **Like only the rows you already presented.** Never widen to "other posts at the same place".
- **Never like your own post.**
- Call `like_post(post_id)` row by row and report the result honestly:
  - Normal → "Liked — now N likes"
  - `already` → "You had already liked this one" (**not** "liked")
  - `resurrected` → "This one had expired; your like extended it by 24 hours"
  - Failure → report the error as-is, **never pretend it worked**
- If the user says like none → stop there. No nudging, no second pitch.
- After liking, **do not follow up** with "want to follow them / message them" — the platform has no such abilities, and offering them is inventing features.

**Why this step matters**: the platform notifies nobody — not them, not you. This one tap is the only thing in the entire chain that actually reaches another person.

---

## 5. Hard rules (violating one is an implementation bug)

1. **MCP must be connected first**; if it isn't, say so plainly. No simulation.
2. **Never filter by time.** No "last 30 days", no "past month" — "regardless of date" is the definition of this play, not an option.
3. **Place confidence < 0.8 is a hard failure**: pass the match result through verbatim and let the user correct it; never swap the word yourself.
4. **Distance decides the place; names only have to be "not contradictory".** A place name that clearly belongs elsewhere gets dropped — better to show less than to mix it in.
5. **Normalise and de-duplicate bodies**, keeping the earliest only. **23% of posts are duplicated seedings**; without this one sentence becomes several people.
6. **5 rows maximum**, selected by 2.4. Never "list them all".
7. **Quote verbatim** — no rewriting, no summarising, no commentary, no adjectives.
8. **Never name the author**; no "a certain user", no "some traveller", no "someone created it".
9. **Never show like counts**, never use them as heat.
10. **Posting is two steps**: show the draft, then `publish_post` only after explicit consent.
11. **Liking requires asking first, an explicit yes, and only the presented rows.**
12. **No following, no comments, no DMs, no matchmaking** — this skill builds no relationships, it only hands over words.
13. **Fabricate nothing**: no invented counts, dates, distances, or bodies. Numbers come from tool responses only.
14. **`find_nearby` at most 3 times per session**, with `types` explicitly `['posts']`.
15. **On an empty result say "I can't see anything"**, not "nobody has been here" and not "you're the first".
16. **Never read HTML tags to the user.** Always go through `get_post_detail` (server-stripped); the fallback is stripping every `<...>` yourself. Seeing `<p>`, `<img`, or `data-type=` in your output is an implementation bug.
17. **Count length on plain text**, never sort by raw length including tags.
18. **Flag author clustering**: when 3+ of 5 rows share one `author_id`, say so; never let it read like several people.

---

## 6. The honest numbers (say them on first use, then not again)

| Fact | Number |
|---|---|
| Public posts with coordinates, whole platform | **657** |
| Distinct place names | **273**, of which **97** have ≥2 posts |
| One busy place (within 500 m, after de-duplication) | **5–21 rows**: Shichahai highest (21), Guomao 13, Wangfujing / the Bund around 10, Zhongguancun / Xidan / Nanjing Road / Lujiazui 7–9 |
| Posts whose body is byte-identical | **23%** (one sentence seeded at several locations) |
| Bodies are rich text | All of them. `<p>` / `<span data-type="location">` / `<img>` are all in there; strip them and it becomes human speech |
| Body cap per post | The detail endpoint gives up to 4000 characters, flagged "truncated" beyond that |
| One account dominating a place | **Common**: all 8 posts at Wudaoying from one account; 6 of 6 at the Forbidden City turret from one account |
| One-liner posts | Also common: all 7 rows at Lujiazui are under 15 characters |
| Quiet places | **Usually 0 rows. That is normal, not a malfunction** |

**What does not exist** (say so plainly when asked, don't dodge): reading like counts / who liked me, writing comments, DMs, any notifications, reliable identity checks.

So explain it on first use: **a few busy places will hand you a dozen or twenty posts; a quiet place is just your own, plus an empty street.** That is not the product being broken — it is a place where nobody has written yet.

---

## 7. When to use this, when not to

**Use it** (hear these, come in):

- "I posted something at Shichahai — has anyone else left anything here?"
- "I just posted at Guomao, want to see what others wrote"
- "One view, two stories"
- "Has anyone left something here", "help me find other people's posts about this place"

**Don't use it**:

| What the user actually wants | Where it belongs |
|---|---|
| "Find me someone to set off with" | Not here — that is `powpop-depart` (Solo out. Together in.) |
| "What's worth seeing around here" | Not here — that is attraction advice (`nearby_attractions`) |
| "Write a post for me to publish" | The posting step can help, but this skill's product is "your post next to other people's", not a copywriting service |
| "Did anyone like my post" | Not possible: no who-liked-me, no notifications |

One-line boundary: **I don't find people for you. I only hand you the words someone else left here.**
