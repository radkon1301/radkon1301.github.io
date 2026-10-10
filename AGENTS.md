# Agent instructions

1. Read `README.md` (short) for architecture, file index and conventions.
2. Read only the `docs/*.md` for the file you will touch. It has a section map with line ranges and `grep` anchors, a function index, and "how to add X" checklists.
3. **Never read an entire `*.html` file.** Use `grep -n` anchors from the docs, then `sed -n 'A,Bp' file` for just the region you need.
4. No build, no tests. Verify by loading the page; keep the `alive()` / `_gen` guard pattern in every game.
5. After changing structure, counts, or adding games/generators, update the matching `docs/*.md` and the card text in `index.html`.
6. Known issues and cleanup candidates: `docs/ISSUES.md`.
