# Known issues and cleanup candidates

Identified during the documentation pass. **None of these have been changed in the code**; they are listed so a future task can pick them up without re-auditing. Ordered roughly by value.

## Efficiency (biggest lever for future agent work)

1. **Split the inline scripts into files.** `zapn.html` (~2.2k lines of JS) forces every edit to navigate a 120 KB file. Moving each game to its own file (e.g. `js/zapn/bart.js`, loaded via `<script src>`) plus a small `js/common.js` lets an agent open only the one game it needs. Works on GitHub Pages with no build step. Same for generators in `sequences.html` (e.g. `js/sequences/generators-*.js`) and question types in `arithmetic.html`.
2. **Extract duplicated boilerplate** into `js/common.js`: `_gen`/`myGen`, `setStats`, `setPanel`, `rand`, `gcd`, score load/save (3 near-identical copies: `saveScore`, `saveSeqScore`, `saveArithScore`), `renderDashboard`/`launchGame`/`showDashboard`. Today a fix must be repeated per page. (zapn's `saveScore` additionally supports `LOWER_BETTER` and the test-mode hook, so the shared version needs those as options.)
3. **Dedupe header CSS**: `.arith-dash-header`, `.seq-dash-header` (and their logo classes) duplicate `.dash-header`/`.dash-logo` in `shared.css`.

## Dead code / stale content

4. `zapn.html` ≈309–333: first definitions of `showLanding`, `showZapN`, `showDashboard` reference a non-existent `#landing` element. They are overridden by the later declarations at ≈2405–2421 (function hoisting), so they never run. Safe to delete; the section comment at ≈2403 explains the history.
5. `arithmetic.html` ≈524: `TIER_COUNTS = [20, 35, 25]` is never used and contradicts the real distribution `[10, 35, 35]` in `generateAllQuestions`. Delete it.
6. `arithmetic.html` ≈477: comment mentions `displayAnswer()` / `equals(userInput)`; the real functions are `answerDisplay()` / `fracEqual()`.
7. `zapn.html` ≈2007: banner says "runs all 8 games" but `TEST_IDS` has 9. Also Skyscraper (game 9) is defined after the Full Test runner, which is easy to miss.

## Inconsistencies

8. Count drift: `index.html` says "50 sequence types"; `sequences.html` has 51 generators (52 master-list entries because `genArithmetic` is listed twice for weight); the registry desc says "50+".
9. Biased shuffles: `arr.sort(() => Math.random() - 0.5)` is used in `sequences.html` (`pickDiverse`, test order) and `zapn.html` `startTest`. It is not uniform. `arithmetic.html` already has a proper `shuffle()` (≈464) to copy (Fisher–Yates).
10. Full Test "★ New best" (`zapn.html` ≈2040) is decided by comparing label strings (`ts.label === best`), not numbers, so a tie or a label-format change can mislabel.

## Not an issue, but worth knowing

- No automated tests; verification is manual in a browser. Randomised generators could be sanity-tested with a small Node script if the generators are ever moved to separate files (see item 1).
- State is `localStorage` only (keys `me_scores`, `me_seq_scores`, `me_arith_scores`); clearing site data resets personal bests.
