# arithmetic.html — Arithmetic

80 questions in 8 minutes, two modes: `arith-mc` (multiple choice) and `arith-fr` (free response; accepts `1/2`, `0.5`, mixed numbers). Both run through `runTest(gameId, isMultipleChoice)`. Shared architecture: `README.md`. Skeleton: `arithmetic.html` (49 lines). CSS: `css/arithmetic.css` (316 lines; `grep -n '^/\* ──' css/arithmetic.css`: question display, multiple choice, free response, progress, review, stacked fractions).

## Files (`js/arithmetic/`, load order as in `arithmetic.html`)

| File | Lines | Contents |
|---|---|---|
| `core.js` | 14 | score store wrappers (`saveArithScore`, `getArithScoreLabel`, `arithScores`), `showDashboard`, `launchGame`, `renderDashboard` |
| `questions.js` | 367 | fraction helpers (`gcd`, `makeFrac`, `fracAdd/Sub/Mul/Div`, `intFrac`, `parseInput`, `fracEqual`), 13 question generators `qXxx(tier)`, `generateAllQuestions()` |
| `answers.js` | 126 | `makeArithDistractors(q)` (MC wrong answers), `answerDisplay`, `renderQText`, `fracHTML` |
| `run-test.js` | 280 | `TOTAL_Q = 80`, `TIME_LIMIT = 8*60`, `runTest` (timer, MC / FR UI, `window.arithPick`, `window.arithSubmitFR`, `window.submitTest`, review screen) |
| `registry.js` | 46 | `ARITH_GAMES`, `startArithMC/FR`, a runtime CSS patch for `.arith-choice.selected-mc`, `renderDashboard()` init. **Loaded last.** |

List question generators: `grep -n '^function q[A-Z]' js/arithmetic/questions.js`.

## Contracts

- Generator: `qX(tier) → { question: string, answer: Fraction{n,d}, explanation: HTML, type: string, displayMode? }`. Fractions are lowest terms with `d >= 1`; decimal answers are stored as fractions with `displayMode:'decimal'`, which `answerDisplay` prints as decimals (max 2 dp).
- Tiers: 0 easy / 1 medium / 2 hard. Final set = 10 easy + 35 medium + 35 hard = 80 (`tierCounts` in `generateAllQuestions`), shuffled with `shuffle()` (common.js). Pools are `[[() => qFoo(t), weight], …]` per tier; each question is retried up to 20× if invalid/non-finite, with a `1 + 1` fallback.
- Scoring: `correct − incorrect − skipped` (unanswered = −1), saved best-only under the game id. MC correctness compares the chosen string to `answerDisplay(answer, displayMode)`; FR uses `fracEqual(parseInput(raw), answer)`.

## Adding a question type (checklist)

1. Write `function qFoo(tier){…}` returning the contract object (use `makeFrac`, `fracAdd…`) in `questions.js`.
2. Add `[() => qFoo(t), weight]` to the tier pool(s) in `generateAllQuestions`; keep tier totals consistent with `tierCounts`.
3. If it needs a new display form, extend `answerDisplay` / `renderQText` / `fracHTML` and check `makeArithDistractors` yields plausible wrong answers.
4. Update this doc and, if the exercise description changes, `index.html` and `ARITH_GAMES` (`registry.js`).
