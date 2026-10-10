# shared.css + index.html

## shared.css (143 lines, read in full if needed)

Loaded by all four pages. Imports Google Fonts (DM Sans, DM Mono, Instrument Serif) on line 1: the only external dependency. Sections (find with `grep -n '/\* ───' shared.css`):

| Section | Contents |
|---|---|
| `:root` | Tokens: `--bg --surface --surface2 --border --border2 --accent --accent-light --accent2 --green(-light) --red(-light) --yellow(-light) --text --text2 --muted --shadow --shadow-lg --radius --radius-sm` |
| SHARED HEADER | `.site-header`, `.site-logo`, `.site-sub` (used by `index.html`) |
| CHIP | `.chip`, `.chip.hi` (the "Best: …" highlight) |
| SHARED BUTTONS | `.back-btn`, `.big-btn`, `.again-btn` (**`.again-btn` is also a JS hook in `zapn.html`**: see `docs/zapn.md`) |
| SHARED CARDS / RESULTS | `.start-card`, `.result-card`, `.result-num`, `.result-sub` |
| DASHBOARD LAYOUT | `.dash-header/-logo/-sub/-body/-intro`, `.games-grid`, `.game-card`, `.card-*`, `.play-btn` |
| GAME SCREEN | `#game-screen`, `.game-header`, `.game-name-bar`, `.stat-strip`, `.stat-pill`, `.game-wrap`, `.game-panel` (`.top`, `.wide` variants) |
| PROGRESS | `.prog-track`, `.prog-fill` |

Page-specific CSS stays in each page's own `<style>`; it should use the tokens above.
Note: `arithmetic.html` and `sequences.html` define `.arith-dash-header` / `.seq-dash-header`, near-duplicates of `.dash-header` (see ISSUES).

## index.html (105 lines, read in full if needed)

Landing page. Inline `<style>` (`.landing-body`, `.category-btn*`) then a header and `.category-list` with three `<a class="category-btn" href="…">` cards (Zap-N, Sequences, Arithmetic). An HTML comment at the bottom of the list holds a copy-paste template for a new category. Card text hard-codes counts ("9 exercises", "~35 min full test", "50 sequence types", "2 exercises", "8 min each"). Update these when the underlying pages change.
