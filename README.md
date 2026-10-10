# radkon1301.github.io — Mental Edge

Collection of exercises often tested in quant assessments. Go to https://radkon1301.github.io/ to practice.

Static site on GitHub Pages: plain HTML/CSS/vanilla JS, **no build step, no dependencies, no tests**. Pushing to `main` deploys. The only external resource is Google Fonts (`@import` in `shared.css`).

> **Agents / contributors: do not read whole HTML files.** `zapn.html` is ~120 KB, `sequences.html` ~78 KB, `arithmetic.html` ~45 KB. Read this file, then the matching `docs/*.md`, then read only the line range you need (`sed -n 'A,Bp' file`). Line numbers in docs are approximate and drift; re-locate with the `grep` anchors given.

## Files

| File | Lines | What it is | Doc |
|---|---|---|---|
| `index.html` | 105 | Landing page: one card per suite (links to the 3 pages below). Small enough to read in full. | `docs/shared.md` |
| `shared.css` | 143 | Design tokens (`:root` vars), header, buttons, chips, game cards, game panel, progress bar. Loaded by every page. | `docs/shared.md` |
| `zapn.html` | 2431 | **Zap-N**: 9 cognitive mini-games + "Full Test" that chains them. | `docs/zapn.md` |
| `sequences.html` | 2101 | **Sequences**: 51 sequence generators; Practice mode + 26-question timed Test. | `docs/sequences.md` |
| `arithmetic.html` | 1261 | **Arithmetic**: 80 questions / 8 min, multiple-choice or free-response. | `docs/arithmetic.md` |
| `docs/ISSUES.md` | | Known dead code, inconsistencies, and refactor opportunities (with locations). | |

## Architecture (identical in all three suite pages)

Each suite page is one self-contained file: `<style>` (page-specific CSS) → HTML skeleton → one big `<script>`.

- Skeleton: `#dashboard` (grid of game cards) and `#game-screen` (`#gs-name`, `#gs-stats`, `#game-panel`). Only one is visible at a time.
- A registry array (`GAMES` / `SEQ_GAMES` / `ARITH_GAMES`) of `{id, title, icon, tag, desc, meta, start}` drives the dashboard cards. `launchGame(id)` hides the dashboard and calls `start()`.
- Each game is a function `startX()` whose state lives in its closure and which renders by `setPanel(html)` / `setStats(html)` (innerHTML replacement). Handlers are exposed on `window.*` because the markup uses inline `onclick=`.
- **Generation guard**: global `_gen` counter + `const g = myGen(); const alive = () => myGen() === g;`. `showDashboard()` / `launchGame()` bump `_gen`; every timer/callback in a game must check `alive()` so abandoned games go silent. Always keep this pattern.
- **Scores** live in `localStorage` as `{ id: { v: number, label: string } }`, best-only:

  | Page | localStorage key | Better = |
  |---|---|---|
  | zapn | `me_scores` | per-game; `LOWER_BETTER` set in `zapn.html` |
  | sequences | `me_seq_scores` | higher |
  | arithmetic | `me_arith_scores` | higher |

- Helpers (`rand`, `setStats`, `setPanel`, `_gen`, score storage, dashboard rendering, `gcd`) are **copy-pasted per page**, not shared. A fix in one usually needs applying to the others (see `docs/ISSUES.md`).

## Common tasks

- **Add a suite page**: copy the skeleton of the smallest page, add `<a class="category-btn">` in `index.html` (a commented template is at the bottom of `.category-list`), pick a new `me_*_scores` key.
- **Add a game/question type**: see "Adding …" in the page's doc; each has a checklist of the 2–4 places that must be touched.
- **Change colours/fonts/spacing**: `:root` variables in `shared.css`; page CSS uses them via `var(--…)`.
- **Verify**: open the page in a browser (or `python3 -m http.server`) and play the changed game; there are no automated tests. Check the console for errors.

## Keeping docs current

When you add/remove a game, generator, or section, update the matching `docs/*.md` table and the counts in `index.html` card text. If you move code a lot, refresh line numbers with the `grep` anchors listed in each doc.
