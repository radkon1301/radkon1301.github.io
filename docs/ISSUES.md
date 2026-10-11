# Issues: remaining ideas and change log

## Remaining ideas (none are bugs)

1. **Shared helpers still duplicated per page:** `gcd` (arithmetic `questions.js`, sequences `generators-basic.js`) and `isPrime`-style math helpers. Low value; extract to `common.js` only if a third user appears.
2. **Inline styles in JS-built HTML:** result tables in `js/zapn/skyscraper.js` (`endGame`) and `js/zapn/test.js` repeat long `style="…"` strings. Moving them to classes in `css/zapn.css` would shrink those files and make restyling one edit.
3. **Largest single closures:** `js/zapn/bart.js` (507 lines), `js/sequences/test.js` (333), `js/arithmetic/run-test.js` (280). Each could be split further (e.g. BART stats helpers vs. UI) if they get worked on often. Use `grep -n '^  function' <file>` for their inner structure.
4. **Test coverage:** only the Skyscraper generator has an automated test (`tests/skyscraper-gen.test.js`). During the refactor a jsdom differential harness was used (seeded `Math.random`, fake clock for `setTimeout`/`setInterval`/`requestAnimationFrame`/`performance.now`, a seeded "monkey" that clicks buttons and presses keys, snapshots compared before vs after). It is not committed because it needs `npm install jsdom`; it is easy to re-create and worth adding if refactors continue. Games that need real play to finish (NumberBox, FigureItOut, BART end screens) are not reached by random clicking; Skyscraper is covered by a solver-driven playthrough.
5. **Caching after deploys:** GitHub Pages serves JS/CSS with a ~10-minute cache, and pages now load many small files. A visitor with a cached HTML page and a fresh script (or vice-versa) could briefly see a mismatch right after a deploy. If this matters, add `?v=<n>` to the `<script src>`/`<link>` URLs when changing shared files.
6. **Full Test flow** starts games directly instead of through `launchGame`, duplicating the `_gen++` bookkeeping (`js/zapn/test.js`). Works; a small `openGame`-like helper taking a title override would remove the duplication.
7. ~~Skyscraper `LEVELS` duplicated in the test~~ — resolved: the level table lives in the generated `skyscraper-bank.js`; the test reads it.

## Change log (what was done and why)

Skyscraper layout pass 2 (`fix/skyscraper-side-by-side`): the first fit (smaller padding, viewport-scaled blocks) still stacked target above play area (~14 blocks of height) and needed ~850px of viewport, so real windows (browser bar + taskbar + display scaling) still scrolled. Now target and play area are side by side on wide screens (~7 blocks of height, ~400px at max size); stacked only on narrow screens.

Skyscraper pass (`fix/skyscraper-fit-and-instant-levels`):

- ◆ **Fits a 1920×1080 screen without scrolling.** Sizes moved from inline JS pixels (7 blocks × 58px + 7 × 42px + 64px of padding ≈ 1050px of game) to CSS driven by `--sk-h`, which scales with viewport height (max 50px). Tighter padding/margins on the Skyscraper panel only.
- ◆ **Levels load instantly.** Puzzles are pre-solved offline (`tools/gen-skyscraper-bank.js` → `js/zapn/skyscraper-bank.js`, 40 per level, 13 KB) and varied at runtime by relabelling blocks and permuting piles (optimal move count is invariant). Removed the play-time BFS and the next-level prefetch. The test now verifies all stored puzzles against two solvers.

Docs pass (`docs/agent-friendly-documentation`): README, AGENTS.md, docs/*.md.

Refactor pass (`refactor/split-and-cleanup`), each step verified with the jsdom differential harness (items marked ◆ intentionally change behaviour):

- **Split** each page's inline `<style>`/`<script>` into `css/` and `js/<page>/` files along the existing section banners (lossless, scripted: 72/72 snapshots identical).
- **`js/common.js`**: `_gen`/`myGen`, `rand`/`randChoice`/`shuffle`, `setStats`/`setPanel`, `createScoreStore`, `renderGameCards`, `openGame`/`closeGame` replaced three near-identical copies. Removed zapn's shadowed first `showLanding/showZapN/showDashboard` (referenced a non-existent `#landing`) and the unused live `showLanding/showZapN`.
- ◆ Malformed localStorage score entries are now purged on the sequences/arithmetic pages too (zapn already did).
- ◆ Biased `sort(() => Math.random() - .5)` shuffles replaced by Fisher–Yates in sequences Test, zapn Full Test order and BART.
- ◆ Full Test "★ New best" now uses a strict-improvement flag from the score store instead of comparing label strings (a tie is no longer "new").
- Removed unused/contradictory `TIER_COUNTS` and a stale comment (arithmetic); deduped `.arith-dash-*`/`.seq-dash-*` CSS onto the identical shared `.dash-header/.dash-logo`; fixed "all 8 games" banner; sequence type count is derived (`SEQ_TYPE_COUNT`), `index.html` says 51.
- ◆ **Skyscraper generation**: one BFS per puzzle instead of up to 300 (levels 9–10: median 5 s, worst 28 s → ~0.14 s; next level prefetched behind the "solved" overlay). Mean optimal moves per level within ~0.1 of the old generator; target-shape mix similar (weighted by the fraction of each shape that is hard enough). See `docs/zapn.md`.
