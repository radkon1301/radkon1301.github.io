# zapn.html — Zap-N (2431 lines)

9 mini-games + a "Full Test" runner. Line numbers are approximate; re-locate with the grep anchors.

## Section map

| Lines | Section | Anchor |
|---|---|---|
| 8–193 | `<style>`: per-game CSS, one `/* ── NAME ── */` block each (Skyscraper 9, ShapeShift 33, CodeCompare 47, PinCode 60, NumberBox 77, FigureItOut 104, The Switch 121, Stock Master 138, BART 147). `#cc-timeout-flash` overlay is at 57–59. | `grep -n '^/\* ──' zapn.html` |
| 195–227 | Body: `#cc-timeout-flash`, `#dashboard` (`#games-grid`), `#game-screen` | |
| 233–244 | `GAMES` registry (one line per game, plus the "test" card) | `grep -n '^const GAMES' zapn.html` |
| 249–287 | Scores: `LOWER_BETTER`, `scores`, `saveScore`, `getScoreLabel` | |
| 290–307 | `_gen`/`myGen`, `renderDashboard` | |
| 309–333 | **Dead code**: first `showLanding/showZapN/showDashboard` (reference a `#landing` div that no longer exists; overridden at 2405+). See ISSUES. | |
| 335–346 | `launchGame` | |
| 348–371 | Helpers: `setStats`, `setPanel` (contains test-mode button rewiring), `rand`, `setKey`/`clearKeys` | |
| 373–2005, 2089–2400 | The games (below) | `grep -n 'GAME [0-9]' zapn.html` |
| 2006–2088 | Full Test runner `startTest` | |
| 2403–2425 | Live `showLanding/showZapN/showDashboard` overrides (win over the dead ones by hoisting) | |
| 2427 | `renderDashboard();` init | |

## Games

| # | id | Function (line) | What | Saved score (`saveScore` id → value / label / better) |
|---|---|---|---|---|
| 1 | `shapeshift` | `startShapeShift` (376) | Flash shape; ← square, → circle; 60 rounds | avg reaction ms (wrong = 1000) / `0.512s @ 95%` / **lower** |
| 2 | `codecompare` | `startCodeCompare` (502) | Pick sequence identical to target; 30 rounds, timer 5s→3s; red flash on timeout | # correct / default label / higher |
| 3 | `pincode` | `startPinCode` (579) | Memorise digits; type forward / reversed / sorted; 3 modes, growing length | `seqScore` / default / higher |
| 4 | `numberbox` | `startNumberBox` (728) | 4 numbers + ops → target; 5 puzzles | avg ms per puzzle / `1.23s avg` / **lower** |
| 5 | `figureitout` | `startFigureItOut` (978) | Deduce hidden figure (shape, colour, stripes) from match-count feedback; 5 rounds | avg steps per round / `2.40 steps avg` / **lower** |
| 6 | `theswitch` | `startTheSwitch` (1138) | Two boxes: parity of math answer or arrow match; 35 rounds | avg ms / `0.xxxs @ NN%` / **lower** |
| 7 | `stockmaster` | `startStockMaster` (1268) | Click gauges when needle in green; 2 min; rAF loop | # stocks bought / default / higher |
| 8 | `bart` | `startBART` (1502–2005, ~500 lines, biggest) | Balloon Analogue Risk Task, 2 rounds; has stats/EV helpers (`optimalPumps`, `expectedValue`, `popDistribution`) | total $ earned / `$12.34 @ 4/6` / higher |
| — | `test` | `startTest` (2009) | Full Test: all 9 in random order | (does not save its own score) |
| 9 | `skyscraper` | `startSkyscraper` (2092–2400) | Rearrange coloured blocks across 3 piles; 10 levels, 4–7 blocks | avg moves over par / `1.20 over par @ 8.5s` / **lower** |

Every game is `function startX(){ const g=myGen(); function alive(){…} … function endGame(){ … saveScore(id, v, label); setPanel(resultCard) } }`.
Keyboard games use `setKey(fn)` (auto-removes the previous listener; `clearKeys()` on exit). Handlers used by inline `onclick` are assigned to `window.*`.

## Full Test coupling (easy to break)

- `startTest` sets `window._testAdvance`, `window._testSaveHook`, `window._testRemaining`.
- `saveScore` always calls `_testSaveHook` (even when not a new best).
- `setPanel` (≈355–367): when `_testAdvance` is set, 50 ms after rendering it finds the **first `.again-btn`** in the panel and rewires it to "Next game →" / "See results →". **Every game's result screen must therefore use a button with class `again-btn`** for its "play again". The Full Test results page is excluded by matching button text `Run again` / `Dashboard`.
- Any code leaving a game must reset the three `window._test*` globals (`showDashboard`, `launchGame`, `showLanding` do).

## Adding a game (checklist)

1. Write `function startFoo(){…}` following the closure + `alive()` pattern; add a `/* ── FOO ── */` CSS block at top if needed.
2. Add an entry to `GAMES` (≈233).
3. If lower is better, add its id to `LOWER_BETTER` (≈249).
4. Add its id to `TEST_IDS` in `startTest` (≈2010) and update the "all 9" wording in the `test` card desc and in the `startTest` intro text.
5. End with `saveScore(id, numericValue, label)` and a result card containing an `.again-btn`.
6. Update the "9 exercises" chip/description for Zap-N in `index.html`, and this table.
