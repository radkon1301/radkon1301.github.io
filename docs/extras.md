# extras.html — Extras

Three extra practice games that are **not** part of the Zap-N assessment (so Zap-N's nine games and Full Test are unchanged): `nback` (working memory), `stroop` (interference), `ev` (expected value / probability). Scores live in `me_extra_scores` (`stroop` is lower-is-better, set `EXTRA_LOWER_BETTER` in `core.js`; the others are higher-is-better).

## Files (`js/extras/`, load order as in `extras.html`)

| File | Contents |
|---|---|
| `logic.js` | **Pure, DOM-free** `ExtrasLogic`: `genNBack`/`scoreNBack`, `genStroop`/`scoreStroop`, `genEV`/`genEVSet`, `STROOP_COLORS`. Takes an optional `rng()` so tests can seed it. Also a CommonJS export for node tests |
| `core.js` | score store (`saveScore`, `getScoreLabel`), `setKey`/`clearKeys` (one active keydown handler), `showDashboard`, `launchGame`, `renderDashboard` |
| `nback.js`, `stroop.js`, `ev.js` | one game each (`startNBack` / `startStroop` / `startEV`), UI only; all rules live in `logic.js` |
| `registry.js` | `EXTRA_GAMES`; **loaded last**; calls `renderDashboard()` |

Page CSS: `css/extras.css` (theme tokens only, except `.st-stage`, a fixed dark panel so Stroop ink colours look the same in light and dark).

## Game contracts

| Game | Rules | Score (`v`) | Label |
|---|---|---|---|
| `nback` | 2-back, 40 letters, exactly 12 matches, 500 ms on / 2500 ms per trial, Space or button | balanced accuracy 0-100 (mean of hit rate and correct-rejection rate, so spamming or never pressing = 50). Only trials from index n on are scored | `87.5% · 10/12 hits, 2 false` |
| `stroop` | 40 trials, half congruent, 2.5 s window, keys R G B Y or 1-4. Okabe-Ito ink colours | mean ms, wrong or timeout counts 2000 ms | `0.742s @ 95%`. Result also shows the Stroop effect (incongruent minus congruent mean RT) |
| `ev` | 12 questions, 6 templates twice each, 4 options, keys 1-4 | number correct | `9/12`. Result lists every mistake with a worked explanation |

## Invariants (all enforced by `tests/extras-logic.test.js`)

- Every `genEV` question carries a `brute()` that recomputes the answer by **enumeration, not formula**; `brute() === answer` is tested for 18 000 generated questions. Keep this when adding a template.
- Options: exactly 4, unique after formatting, exactly one correct, no `NaN`/`-0`/`$-`, explanation states the correct answer, answers have <= 2 decimals.
- `genNBack` non-targets never equal the letter n back, so the target count is exact.

## Adding an Extras game

1. Put the rules/scoring in `logic.js` (pure) and a property test in `tests/extras-logic.test.js`.
2. New `js/extras/<game>.js` with `startX()`: keep the `myGen()/alive()` guard, use `setKey(...)`/`clearKeys()`, render a `.start-card` then a `.result-card` (`.result-num`, `.result-sub`, `.again-btn`) and call `saveScore(id, v, label)` **before** `setPanel(result)` so the personal-best badge appears.
3. `<script>` in `extras.html` before `registry.js`; entry in `EXTRA_GAMES`; lower-is-better ids in `EXTRA_LOWER_BETTER`.
4. Add it to `js/catalog.js` (Progress page) and to the card text in `index.html`. `tests/catalog.test.js` fails until you do.
5. Add an e2e test in `tests/e2e/extras.test.js` (it also runs axe on every screen in both themes).
