# progress.html — Progress

Shows every game's run history, a direction-aware trend, and practice streaks; exports / imports / resets all stored progress. Everything is local (`localStorage`); nothing is uploaded.

## Data

Each suite's `createScoreStore(key)` keeps two keys: `key` (best score per game, unchanged format) and `key_hist` (array of `{id, v, label, t}`, every completed run, capped at 100 per game: `HIST_PER_ID` in `js/common.js`). `readScoreHistory(key)` drops malformed entries.

## Files

| File | Contents |
|---|---|
| `progress.html`, `css/progress.css` | page skeleton (loads `common.js`, `catalog.js`, `progress-stats.js`, `progress.js`) and styles (theme tokens) |
| `js/catalog.js` | `ME_CATALOG`: suites, storage keys, game ids/titles, `lowerBetter`. **Duplicates registry data on purpose**; `tests/catalog.test.js` fails if it drifts from the registries, `core.js` files or the ids games save |
| `js/progress-stats.js` | pure, DOM-free `MEProgress`: `streaks`, `trend`, `sparkPoints`, `summarise`, `buildExport`, `parseImport` |
| `js/progress.js` | rendering and the export / import / reset buttons. Uses `textContent` only (never `innerHTML`) because labels can come from an imported file |

## Behaviour worth knowing

- Sparklines always plot **improvement upward**, also for lower-is-better games.
- Trend compares the mean of the latest k runs with the k before (k up to 6, even, so alternating series cancel) relative to the spread; needs >= 4 runs.
- A streak counts local calendar days, and stays alive until a whole day is missed (playing yesterday still counts today).
- Import: only the known `me_*` score/history keys are accepted, shapes are validated, files over 5 MB are refused, and it asks before replacing. Theme and unrelated keys are never read or written.

## Adding a game to the page

Add it to `ME_CATALOG` (see `docs/extras.md` step 4). Nothing else.
