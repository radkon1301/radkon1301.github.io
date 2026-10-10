# arithmetic.html — Arithmetic (1261 lines)

80 questions in 8 minutes, two modes: `arith-mc` (multiple choice) and `arith-fr` (free response; accepts `1/2`, `0.5`, mixed numbers). Both run through the same `runTest(gameId, isMultipleChoice)`. Shared architecture: `README.md`. Line numbers are approximate.

## Section map

| Lines | Section | Anchor |
|---|---|---|
| 8–338 | `<style>`: dashboard 9, question display 22, multiple choice 72, free response 117, progress 195, review 211, stacked fractions 305 | `grep -n '^/\* ──' arithmetic.html` |
| 340–370 | Body: `#dashboard` (`#arith-games-grid`), `#game-screen` | |
| 376–395 | `ARITH_GAMES` registry | |
| 397–417 | Score storage: key `me_arith_scores`, `saveArithScore`, `getArithScoreLabel` (higher is better) | |
| 419–473 | `_gen`/`myGen`, navigation, `renderDashboard`, `setStats`, `setPanel`, `rand`, `randChoice`, `shuffle` | |
| 475–524 | Question contract; fraction helpers: `gcd`, `makeFrac`, `fracAdd/Sub/Mul/Div`, `intFrac`, `parseInput`, `fracEqual`; `TIER_COUNTS` (**unused**, see ISSUES) | |
| 526–781 | Question generators `qAddInt … qSquare` (each takes `tier`) | `grep -n '^function q[A-Z]' arithmetic.html` |
| 784–836 | `generateAllQuestions()`: weighted pools per tier | |
| 840–926 | `makeArithDistractors(q)` (MC wrong answers) | |
| 928–963 | Display helpers: `answerDisplay`, `renderQText`, `fracHTML` | |
| 965–1241 | `TOTAL_Q`, `TIME_LIMIT`, `runTest` (timer, MC/FR UI, `window.arithSubmitFR` 1077, `window.submitTest` 1099, review screen) | |
| 1243–1258 | Starters, runtime CSS patch for `.arith-choice.selected-mc`, init | |

## Contracts

- Generator: `qX(tier) → { question: string, answer: Fraction{n,d}, explanation: HTML, type: string, displayMode? }`. Fractions are always lowest terms with `d >= 1`; decimal answers are also stored as fractions (e.g. `makeFrac(round(x*10),10)`) with `displayMode:'decimal'`, which `answerDisplay` uses to print them as decimals (max 2 dp).
- Tiers: 0 easy / 1 medium / 2 hard. Final set = 10 easy + 35 medium + 35 hard = 80 (`tierCounts` inside `generateAllQuestions`), shuffled with `shuffle()`.
- Pools are `[[() => qFoo(tier), weight], …]` per tier; each question retried up to 20× if invalid/non-finite, with a `1 + 1` fallback.
- Scoring: `correct − incorrect − skipped` (unanswered counts −1), saved best-only under the game id. MC correctness compares the chosen string to `answerDisplay(answer, displayMode)`; FR uses `fracEqual(parseInput(raw), answer)`.

## Adding a question type (checklist)

1. Write `function qFoo(tier){…}` returning the contract object (use `makeFrac`, `fracAdd…`).
2. Add `[() => qFoo(t), weight]` to the relevant tier pool(s) in `generateAllQuestions` (≈790–820). Keep tier totals consistent with `tierCounts`.
3. If it needs a new display form, extend `answerDisplay` / `renderQText` / `fracHTML` and check `makeArithDistractors` produces plausible wrong answers.
4. Update this doc and, if the exercise description changes, `index.html` and `ARITH_GAMES`.
