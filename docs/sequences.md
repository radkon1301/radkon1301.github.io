# sequences.html — Sequences (2101 lines)

Two modes: **Practice** (endless, unscored, live "Correct x/y") and **Test** (26 questions, 25 min, free navigation, scored). Shared page architecture is in `README.md`. Line numbers are approximate.

## Section map

| Lines | Section | Anchor |
|---|---|---|
| 8–404 | `<style>`: dashboard 9, practice 22, test 245 | `grep -n '^/\* ──' sequences.html` |
| 406–436 | Body: `#dashboard` (`#seq-games-grid`), `#game-screen` | |
| 442–461 | `SEQ_GAMES` registry (`seq-practice`, `seq-test`) | |
| 463–485 | Score storage: key `me_seq_scores`, `saveSeqScore`, `getSeqScoreLabel` (higher is better) | |
| 488–530 | `_gen`/`myGen`, `showDashboard`, `launchGame`, `renderDashboard`, `setStats`, `setPanel`, `rand` | |
| 532–559 | Generator contract + helpers: `isPrime`, `getPrimes`, `gcd`, `fmtFrac`, `fmtDec` | |
| 561–1514 | **51 generators `genXxx()`**, grouped by category banners | `grep -n 'CATEGORY' sequences.html` |
| 1517–1547 | `SEQUENCE_GENERATORS` master list (practice pool) | |
| 1550–1578 | `generateQuestion()`: retry + sanity filter | |
| 1581–1658 | `makeDistractors(answerStr, terms)` | |
| 1663–1765 | `startSeqPractice` | |
| 1769–2095 | `startSeqTest` (tier lists at ≈1778, `pickDiverse`, timer, navigation, submit ≈1975, results/review) | |
| 2097 | `renderDashboard();` init | |

## Generator categories (line of banner)

A Arithmetic & polynomial (561) · B Geometric & multiplicative (732) · C Prime-based (840) · D Recursive / multi-term (900) · E Interleaved / positional (979) · F Digit-based (1035) · G Fractions (1106) · H Decimals (1243) · I Mixed / creative (1306) + "EXTRA NEW TYPES" (1412–1514, appended to categories A, B, G, H, I in the master list).

## Contracts

- A generator returns `{ terms: [...shown...], answer, explanation: HTML string, typeName }`. `terms` excludes the blank; `answer` is the next value. Fractions are strings `"n/d"`; numbers are numbers.
- **Answers are compared as strings** (`String(q.answer)`), so format must be canonical (e.g. reduced fractions via `fmtFrac`, decimals via `fmtDec`).
- `generateQuestion` rejects: fewer than 4 terms, missing answer, |answer| > 99999, any fraction term with |n| or |d| ≥ 9999, non-finite values. Falls back to `genArithmetic`.
- Scoring (test only): `correct − incorrect`, skips free; saved under id `seq-test`. Practice saves nothing.

## Test composition

`startSeqTest` builds 26 questions: 8 from `easyGens`, 10 from `mediumGens`, 8 from `hardGens` (`pickDiverse` shuffles each pool and takes distinct generators), then shuffles all. Tier lists contain each of the 51 generators exactly once.

## Adding a sequence type (checklist)

1. Write `function genFoo(){ … return {terms, answer, typeName, explanation}; }` in the right category.
2. Add it to `SEQUENCE_GENERATORS` (≈1517). Repeat an entry to weight it (`genArithmetic` appears twice).
3. **Also add it to exactly one of `easyGens` / `mediumGens` / `hardGens` in `startSeqTest` (≈1778)** or it will never appear in the Test.
4. Update counts: `index.html` card ("50 sequence types"), `SEQ_GAMES` practice `desc`/`meta`, and this doc.
