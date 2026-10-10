// js/sequences/core.js — Sequences page core: score store and navigation.
// Shared helpers (_gen/myGen, rand, setStats, setPanel, createScoreStore, renderGameCards,
// openGame/closeGame) are in js/common.js. Docs: docs/sequences.md

// ── score storage (key me_seq_scores; higher is better) ──
const seqStore = createScoreStore('me_seq_scores');
const seqScores = seqStore.scores;
function saveSeqScore(id, v, label) { seqStore.save(id, v, label); }
function getSeqScoreLabel(id) { return seqStore.label(id); }

// ── navigation ──
function showDashboard() { closeGame(); }
function launchGame(id) { openGame(SEQ_GAMES, id); }
function renderDashboard() { renderGameCards('seq-games-grid', SEQ_GAMES, getSeqScoreLabel); }
