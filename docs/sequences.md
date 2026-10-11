# sequences.html — Sequences

Two modes: **Practice** (endless, unscored, live "Correct x/y") and **Test** (26 questions, 25 min, free navigation, scored). Shared architecture: `README.md`. Skeleton: `sequences.html` (53 lines). CSS: `css/sequences.css` (382 lines: practice styles first, then test styles; `grep -n '^/\* ──' css/sequences.css`).

## Files (`js/sequences/`, load order as in `sequences.html`)

| File | Lines | Contents |
|---|---|---|
| `core.js` | 14 | score store wrappers (`saveSeqScore`, `getSeqScoreLabel`, `seqScores`), `showDashboard`, `launchGame`, `renderDashboard` |
| `generators-basic.js` | 370 | helpers (`isPrime`, `getPrimes`, `gcd`, `fmtFrac`, `fmtDec`) + categories **A** arithmetic & polynomial, **B** geometric & multiplicative, **C** prime-based |
| `generators-recursive.js` | 208 | **D** recursive / multi-term, **E** interleaved / positional, **F** digit-based |
| `generators-fraction-decimal.js` | 202 | **G** fractions, **H** decimals |
| `generators-mixed.js` | 212 | **I** mixed / creative, then "EXTRA NEW TYPES" (extra generators for A, B, G, H, I) |
| `questions.js` | 146 | `SEQUENCE_GENERATORS` master list, `generateQuestion()` (retry + sanity filter), `makeDistractors()` |
| `practice.js` | 107 | `startSeqPractice` |
| `test.js` | 333 | `startSeqTest`: tier lists (`easyGens`/`mediumGens`/`hardGens`), `pickDiverse`, timer, navigation, `window.submitTest`, results/review |
| `registry.js` | 32 | `SEQ_TYPE_COUNT` (derived), `SEQ_GAMES`, starters, `renderDashboard()` init. **Loaded last.** |

Find a generator: `grep -n 'function genFoo' js/sequences/*.js`. List categories: `grep -n 'CATEGORY' js/sequences/*.js`.

## Contracts

- Generator: `genXxx() → { terms: [...shown...], answer, explanation: HTML string, typeName }`. `terms` excludes the blank; `answer` is the next value. Fractions are `"n/d"` strings; numbers are numbers.
- **Answers are compared as strings** (`String(q.answer)`), so format must be canonical (reduced fractions via `fmtFrac`, decimals via `fmtDec`).
- `generateQuestion` rejects: fewer than 4 terms, missing answer, |answer| > 99999, any fraction term with |n| or |d| ≥ 9999, non-finite values; retries; falls back to `genArithmetic`.
- Scoring (Test only): `correct − incorrect`, skips are free; saved under `seq-test` (`seqScores['seq-test']` is read before saving to show "new best"). Practice saves nothing.

## Test composition

`startSeqTest` builds 26 questions: 8 from `easyGens`, 10 from `mediumGens`, 8 from `hardGens` (`pickDiverse` shuffles a pool and takes distinct generators), then shuffles all (Fisher–Yates). Each of the 51 generators appears in exactly one tier list. `TOTAL = 26`, `TIME_LIMIT = 25*60` at the top of `startSeqTest`.

## Adding a sequence type (checklist)

1. Write `function genFoo(){ … return {terms, answer, typeName, explanation}; }` in the right `generators-*.js` file (all four load before `questions.js`).
2. Add it to `SEQUENCE_GENERATORS` (`questions.js`). Repeat an entry to weight it (`genArithmetic` appears twice; `SEQ_TYPE_COUNT` counts distinct functions).
3. **Also add it to exactly one of `easyGens` / `mediumGens` / `hardGens` in `test.js`**, or it never appears in the Test.
4. Update the hard-coded "51 sequence types" in `index.html` and this doc (the dashboard card count is computed).
