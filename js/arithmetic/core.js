// js/arithmetic/core.js — Arithmetic page core: score store and navigation.
// Shared helpers (_gen/myGen, rand, randChoice, shuffle, setStats, setPanel, createScoreStore,
// renderGameCards, openGame/closeGame) are in js/common.js. Docs: docs/arithmetic.md

// ── score storage (key me_arith_scores; higher is better) ──
const arithStore = createScoreStore('me_arith_scores');
const arithScores = arithStore.scores;
function saveArithScore(id, v, label) { arithStore.save(id, v, label); }
function getArithScoreLabel(id) { return arithStore.label(id); }

// ── navigation ──
function showDashboard() { closeGame(); }
function launchGame(id) { openGame(ARITH_GAMES, id); }
function renderDashboard() { renderGameCards('arith-games-grid', ARITH_GAMES, getArithScoreLabel); }
