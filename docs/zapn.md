# zapn.html — Zap-N

9 cognitive mini-games + a "Full Test" that chains them. Shared architecture: `README.md`. Page skeleton: `zapn.html` (59 lines). Page CSS: `css/zapn.css` (184 lines, one `/* ── NAME ── */` banner per game: `grep -n '^/\* ──' css/zapn.css`).

## Files (`js/zapn/`, load order as in `zapn.html`)

| File | Lines | Contents |
|---|---|---|
| `core.js` | 46 | `LOWER_BETTER`, score store wrappers `saveScore`/`getScoreLabel`, `renderDashboard`, `showDashboard`, `launchGame`, `resetTestState`, **`afterSetPanel`** (Full Test hook), `setKey`/`clearKeys` |
| `shapeshift.js` | 128 | Game 1 `startShapeShift` |
| `codecompare.js` | 79 | Game 2 `startCodeCompare` (red timeout flash uses `#cc-timeout-flash` in `zapn.html`) |
| `pincode.js` | 151 | Game 3 `startPinCode` |
| `numberbox.js` | 252 | Game 4 `startNumberBox` |
| `figureitout.js` | 162 | Game 5 `startFigureItOut` |
| `theswitch.js` | 132 | Game 6 `startTheSwitch` |
| `stockmaster.js` | 236 | Game 7 `startStockMaster` (canvas gauges, rAF loop) |
| `bart.js` | 507 | Game 8 `startBART` (largest; inner helpers `optimalPumps`, `expectedValue`, `popDistribution`; `grep -n '^  function' js/zapn/bart.js`) |
| `test.js` | 85 | Full Test: `startTest` |
| `skyscraper-gen.js` | 156 | Game 9 puzzle generator: **pure logic, no DOM** (see below) |
| `skyscraper.js` | 256 | Game 9 `startSkyscraper` (rendering, input, scoring) |
| `registry.js` | 21 | `GAMES` array (10 entries incl. the Full Test card) + `renderDashboard()` init. **Loaded last.** |

Each `startX()` is `function startX(){ const g=myGen(); function alive(){…} … endGame → saveScore(id, number, label) → setPanel(resultCard) }`. Keyboard games use `setKey(fn)` (replaces the previous listener); `showDashboard()` calls `clearKeys()`.

## Games and saved scores

| # | id | What | Saved value / label / better |
|---|---|---|---|
| 1 | `shapeshift` | Flash on left/right; ← square, → circle; 60 rounds | avg reaction ms (wrong = 1000) / `0.512s @ 95%` / **lower** |
| 2 | `codecompare` | Pick the sequence identical to the target; 30 rounds, timer 5s→3s | # correct / default / higher |
| 3 | `pincode` | Memorise digits; type forward / reversed / sorted; growing length | `seqScore` / default / higher |
| 4 | `numberbox` | 4 numbers + ops → target; 5 puzzles | avg ms per puzzle / `1.23s avg` / **lower** |
| 5 | `figureitout` | Deduce hidden figure (shape, colour, pattern) from match counts; 5 rounds | avg guesses per round / `2.40 steps avg` / **lower** |
| 6 | `theswitch` | Parity of math answer or arrow match; 35 rounds | avg ms / `0.xxxs @ NN%` / **lower** |
| 7 | `stockmaster` | Click gauges when needle is in green; 2 min | # stocks bought / default / higher |
| 8 | `bart` | Balloon Analogue Risk Task, 2 rounds | total $ earned / `$12.34 @ 4/6` / higher |
| 9 | `skyscraper` | Rearrange coloured blocks across 3 piles to match a target; 10 levels | avg moves over par / `1.20 over par @ 8.5s` / **lower** |
| — | `test` | Full Test: all 9 in random order | does not save its own score |

## Full Test coupling (easy to break)

- `startTest` (`test.js`) sets `window._testAdvance`, `window._testSaveHook`, `window._testRemaining`; it starts each game directly (not via `launchGame`) and bumps `_gen` itself.
- `scoreStore` (core.js) calls `window._testSaveHook(id, v, label, isNewBest)` on **every** save, even when not a personal best. `isNewBest` is true only for a strict improvement; the results table uses it for "★ New best".
- `afterSetPanel()` (core.js, called by `setPanel` in common.js): when `_testAdvance` is set, 50 ms after rendering it rewires the **first `.again-btn`** in the panel to "Next game →" / "See results →". **Every game's result screen must therefore use a button with class `again-btn` for "play again".** The test results screen is excluded by button text (`Run again` / `Dashboard`).
- Anything that leaves a game must call `resetTestState()` (`showDashboard`/`launchGame` do).

## Skyscraper (game 9)

- Levels: `LEVELS = [[nBlocks, minOptimal], …]` in `skyscraper.js` (10 levels; 4–7 blocks). `tests/skyscraper-gen.test.js` has a copy: keep in sync.
- Puzzle = `{start, target, optimal}`: piles of block ids `0..n-1` (index 0 = bottom). A move takes the top block of one pile onto another pile (unlimited height). `optimal` is the exact minimum number of moves.
- **Generation** (`skyscraper-gen.js`): `skyGeneratePuzzle(n, minOpt, rng?)` runs **one BFS** from a random start (`skyDistances`) that gives the exact distance to every one of the `n!·C(n+2,2)` arrangements (181,440 for n=7, ~0.1 s), then `skyPickTarget` picks a target with distance ≥ `minOpt` and ≤ `maxPiles` non-empty piles (n≤3: 1, n≤5: 2, else 3). Shape (number of piles) is weighted by the fraction of that shape that is hard enough, which reproduces the target mix of the old guess-and-check generator. No retries, no hard-coded levels; falls back to the farthest reachable target after ≤8 starts. **Tuning limit:** from a random start the farthest arrangement is 8 / 11 / 14 / 17–18 moves away for 4 / 5 / 6 / 7 blocks, so a `minOptimal` above that is unreachable (level 6 = `[5,11]` already sits exactly at the ceiling; level 10 = `[7,16]` has little headroom).
- Before this change levels 9–10 took 5 s median and up to 28 s (random pairs were rarely hard enough, each costing a BFS).
- `skyscraper.js` builds the next level's puzzle with `setTimeout(…,0)` while the "Level solved" overlay is visible (`nextPuzzle`), so click-through is instant; `newLevel()` generates synchronously if the prefetch isn't ready.
- Win check compares `stateKey(piles)` with `stateKey(targetPiles)`; blocks are colour keys (`COLORS`), mapped from ids with `COLOR_KEYS.slice(0, n)`.

## Adding a game (checklist)

1. Create `js/zapn/foo.js` with `function startFoo(){…}` using the closure + `alive()` pattern.
2. Add `<script src="js/zapn/foo.js"></script>` to `zapn.html` **before `registry.js`**.
3. Add an entry to `GAMES` in `registry.js`.
4. If lower is better, add the id to `LOWER_BETTER` (`core.js`).
5. Add the id to `TEST_IDS` in `test.js`; update "all 9" wording in the `test` card desc (`registry.js`) and the intro text in `startTest`.
6. End with `saveScore(id, numericValue, label)` and a result card containing an `.again-btn`.
7. Add a `/* ── FOO ── */` block to `css/zapn.css` if needed.
8. Update the exercise count text for Zap-N in `index.html`, and this doc.
