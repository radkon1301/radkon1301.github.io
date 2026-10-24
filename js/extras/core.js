// js/extras/core.js — Extras page core: score store, key handling, navigation. Docs: docs/extras.md
// renderGameCards, openGame/closeGame are in js/common.js.

// ── score storage (key me_extra_scores). stroop is a time (lower is better); nback and ev are higher-is-better ──
const EXTRA_LOWER_BETTER = new Set(['stroop']);
const extraStore = createScoreStore('me_extra_scores', { lowerBetter: EXTRA_LOWER_BETTER });
function saveScore(id, v, label) { return extraStore.save(id, v, label); }
function getScoreLabel(id) { return extraStore.label(id); }

// ── keyboard: one active keydown handler at a time ──
let _kfn = null;
function setKey(fn) { clearKeys(); _kfn = fn; document.addEventListener('keydown', _kfn); }
function clearKeys() { if (_kfn) { document.removeEventListener('keydown', _kfn); _kfn = null; } }

// ── navigation ──
function showDashboard() { clearKeys(); closeGame(); }
function launchGame(id) { clearKeys(); openGame(EXTRA_GAMES, id); }
function renderDashboard() { renderGameCards('extra-games-grid', EXTRA_GAMES, getScoreLabel); }
