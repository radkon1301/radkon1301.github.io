# Shared pieces: common.js, shared.css, index.html

## js/common.js (111 lines, loaded first on every suite page)

Contract with a page: DOM ids `#dashboard #game-screen #gs-name #gs-stats #game-panel`; the page defines `renderDashboard()`; optionally `afterSetPanel()` (zapn's Full Test hook).

| API | Purpose |
|---|---|
| `_gen`, `myGen()` | generation guard; bumped by `openGame`/`closeGame` (and zapn's Full Test) |
| `rand(a,b)`, `randChoice(arr)`, `shuffle(arr)` | inclusive random int; random element; in-place Fisher–Yates, returns arr |
| `setStats(html)`, `setPanel(html, top?)` | write `#gs-stats` / `#game-panel` (`top` adds class `top`); `setPanel` then calls `afterSetPanel()` if defined |
| `createScoreStore(key, {lowerBetter?, onSave?})` | → `{scores, save(id,v,label)→isNewBest, label(id)}`; best-only; drops malformed stored entries; `onSave(id,v,label,isNewBest)` runs on every save |
| `renderGameCards(gridId, games, getLabel)` | dashboard cards (`onclick="launchGame('id')"`, "Best: …" chip) |
| `openGame(games, id)`, `closeGame()` | switch to game screen and call `start()`; back to dashboard and `renderDashboard()` |

Pages wrap these in thin `launchGame(id)` / `showDashboard()` (HTML `onclick` names) in their `core.js`.

## shared.css (143 lines, read in full if needed)

Imports Google Fonts (DM Sans, DM Mono, Instrument Serif): the only external dependency. Sections (`grep -n '/\* ───' shared.css`):

| Section | Contents |
|---|---|
| `:root` | Tokens: `--bg --surface --surface2 --border --border2 --accent --accent-light --accent2 --green(-light) --red(-light) --yellow(-light) --text --text2 --muted --shadow --shadow-lg --radius --radius-sm` |
| SHARED HEADER | `.site-header`, `.site-logo`, `.site-sub` (index.html) |
| CHIP | `.chip`, `.chip.hi` (the "Best: …" highlight) |
| SHARED BUTTONS | `.back-btn`, `.big-btn`, `.again-btn` (**`.again-btn` is also a JS hook in zapn's Full Test**) |
| SHARED CARDS / RESULTS | `.start-card`, `.result-card`, `.result-num`, `.result-sub` |
| DASHBOARD LAYOUT | `.dash-header/-logo/-sub/-body/-intro` (used by all three suite pages), `.games-grid`, `.game-card`, `.card-*`, `.play-btn` |
| GAME SCREEN | `#game-screen`, `.game-header`, `.game-name-bar`, `.stat-strip`, `.stat-pill`, `.game-wrap`, `.game-panel` (`.top`, `.wide`) |
| PROGRESS | `.prog-track`, `.prog-fill` |

Page-specific CSS lives in `css/<page>.css` and should use these tokens.

## index.html (105 lines, read in full if needed)

Landing page with an inline `<style>` (`.landing-body`, `.category-btn*`), a header, and `.category-list` with three `<a class="category-btn">` cards (Zap-N, Sequences, Arithmetic). A template comment for a new category sits at the bottom of the list. Card text hard-codes counts ("9 exercises", "~35 min full test", "51 sequence types", "2 exercises", "8 min each"); update when pages change.
