# radkon1301.github.io — Mental Edge

Collection of exercises often tested in quant assessments. Go to https://radkon1301.github.io/ to practice.

Static site on GitHub Pages: plain HTML/CSS/vanilla JS, **no build step, no dependencies**. Pushing to `main` deploys. The only external resource is Google Fonts (`@import` in `shared.css`).

> **Agents / contributors:** read this file, then only the `docs/*.md` for the area you touch, then open only the one small file you need (every game / generator group is its own file, 20–500 lines). Don't read whole directories. Line numbers are deliberately avoided in docs; use the `grep` anchors given.

## Layout

```
index.html            landing page (3 cards)                                   → docs/shared.md
shared.css            design tokens + components used by every page            → docs/shared.md
js/common.js          helpers shared by the 3 suite pages (111 lines)          → docs/shared.md
zapn.html             Zap-N: 9 cognitive mini-games + Full Test                → docs/zapn.md
  css/zapn.css          page CSS (one banner per game)
  js/zapn/              core, one file per game, test (Full Test), skyscraper-gen, registry
sequences.html        Sequences: 51 generators, Practice + 26-question Test   → docs/sequences.md
  css/sequences.css
  js/sequences/         core, generators-*.js (4), questions, practice, test, registry
arithmetic.html       Arithmetic: 80 questions / 8 min, multiple choice or free response → docs/arithmetic.md
  css/arithmetic.css
  js/arithmetic/        core, questions, answers, run-test, registry
tests/                skyscraper-gen.test.js (node, no deps)
docs/ISSUES.md        remaining cleanup ideas + log of what was changed and why
```

Each suite `*.html` is a ~50-line skeleton: head + header + `#dashboard` + `#game-screen` + `<script src>` tags.

## Architecture (same on all three suite pages)

- **Script order matters** (classic scripts sharing globals): `js/common.js` → `core.js` → feature files (games / generators / engine) → **`registry.js` last**. The registry builds the game list with `start: startX` references and calls `renderDashboard()`, so everything it references must already be loaded. A new file must be added to the page's `<script>` list before `registry.js`.
- **Registry** (`GAMES` / `SEQ_GAMES` / `ARITH_GAMES`): `{id, title, icon, tag, desc, meta[], start}` per game; drives dashboard cards. `launchGame(id)` → `openGame()` hides the dashboard and calls `start()`.
- **A game** is a function `startX()` with its state in a closure. It renders via `setPanel(html, top?)` / `setStats(html)` (innerHTML replacement). Inline `onclick=` handlers are exposed as `window.*`.
- **Generation guard (always keep it):** `const g = myGen(); const alive = () => myGen() === g;` and check `alive()` at the top of every timer/callback. `openGame()`/`closeGame()` bump `_gen`, silencing abandoned games.
- **Scores:** `createScoreStore(key, {lowerBetter?, onSave?})` in `common.js`; best-only; entries `{v:number, label:string}` in localStorage:

  | Page | localStorage key | Better |
  |---|---|---|
  | zapn | `me_scores` | higher, except ids in `LOWER_BETTER` (`js/zapn/core.js`) |
  | sequences | `me_seq_scores` | higher |
  | arithmetic | `me_arith_scores` | higher |

- **Shared random helpers** in `common.js`: `rand(a,b)`, `randChoice(arr)`, `shuffle(arr)` (Fisher–Yates). Never shuffle with `sort(() => Math.random() - .5)` (biased).

## Common tasks

| Task | Where |
|---|---|
| Add/change a Zap-N game | `docs/zapn.md` → "Adding a game" |
| Add a sequence type | `docs/sequences.md` → "Adding a sequence type" |
| Add an arithmetic question type | `docs/arithmetic.md` → "Adding a question type" |
| Add a suite page | copy a suite skeleton (e.g. `arithmetic.html`), add a card in `index.html` (template comment at the bottom of `.category-list`), new `me_*_scores` key |
| Colours, fonts, spacing | `:root` variables in `shared.css`; page CSS uses `var(--…)` |

## Verify

- `node tests/skyscraper-gen.test.js` checks the Skyscraper generator against an independent BFS (~10 s).
- Everything else is manual: `python3 -m http.server`, open the page, play the changed game, check the console. (A jsdom smoke/differential harness was used for the refactor; it is not committed. See `docs/ISSUES.md`.)

## Keeping docs current

When you add or remove a game, generator, question type or file: update the matching `docs/*.md`, the layout above if files move, and the static count text in `index.html` cards (the Sequences count on the dashboard card is computed; the one on `index.html` is hard-coded).
