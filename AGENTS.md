# Agent instructions

1. Read `README.md` (short): layout, script-order rule, conventions.
2. Read only the `docs/*.md` for the area you will touch (`zapn`, `sequences`, `arithmetic`, `extras`, `progress`, `shared`). Each lists files with one-line purposes, contracts, and an "adding X" checklist.
3. Open only the specific small file you need. Use `grep -n` anchors from the docs; do not read whole directories.
4. No build step. Keep the `alive()` / `myGen()` guard in every game; use `shuffle()` from `js/common.js`, never `sort(() => Math.random() - .5)`.
5. New JS files must be added to the page's `<script>` list **before `registry.js`**.
6. Verify: `node --test tests/*.test.js` (unit, no install) and, for UI changes, `cd tests && npm install && npm run test:e2e` (real browser + axe; keep it at zero violations in light AND dark). After editing Skyscraper levels run `node tools/gen-skyscraper-bank.js` first. Use `var(--…)` tokens, never hard-coded light colours. Call `saveScore()` before `setPanel(result)`. New games also go in `js/catalog.js`.
7. After structural changes update the matching `docs/*.md` and the card text in `index.html`.
8. Remaining cleanup ideas and a log of past changes: `docs/ISSUES.md`.
