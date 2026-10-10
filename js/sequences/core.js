// js/sequences/core.js — Scores, generation guard, navigation, shared helpers.
// Moved verbatim from sequences.html. Docs: docs/sequences.md

// ── score storage ──
let seqScores = {};
try {
  const raw = JSON.parse(localStorage.getItem('me_seq_scores') || '{}');
  Object.keys(raw).forEach(k => {
    const v = raw[k];
    if (v != null && typeof v === 'object' && typeof v.label === 'string') seqScores[k] = v;
  });
} catch(e) {}

function saveSeqScore(id, v, label) {
  const entry = {v, label: label || String(v)};
  const cur = seqScores[id];
  const curV = cur != null ? cur.v : null;
  if (curV == null || v > curV) {
    seqScores[id] = entry;
    try { localStorage.setItem('me_seq_scores', JSON.stringify(seqScores)); } catch(e) {}
  }
}
function getSeqScoreLabel(id) {
  const s = seqScores[id];
  return (s && s.label) ? s.label : null;
}

// ── gen guard ──
let _gen = 0;
function myGen() { return _gen; }

// ── navigation ──
function showDashboard() {
  _gen++;
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('game-screen').style.display = 'none';
  renderDashboard();
}
function launchGame(id) {
  _gen++;
  const g = SEQ_GAMES.find(x => x.id === id);
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  document.getElementById('gs-name').textContent = g.title;
  document.getElementById('gs-stats').innerHTML = '';
  const p = document.getElementById('game-panel');
  p.innerHTML = ''; p.className = 'game-panel';
  g.start();
}
function renderDashboard() {
  document.getElementById('seq-games-grid').innerHTML = SEQ_GAMES.map(g => `
    <div class="game-card" onclick="launchGame('${g.id}')">
      <div class="card-tag">${g.tag}</div>
      <div class="card-icon-row">${g.icon}</div>
      <div class="card-title">${g.title}</div>
      <div class="card-desc">${g.desc}</div>
      <div class="card-meta">
        ${g.meta.map(m => `<span class="chip">${m}</span>`).join('')}
        ${getSeqScoreLabel(g.id) != null ? `<span class="chip hi">Best: ${getSeqScoreLabel(g.id)}</span>` : ''}
      </div>
      <button class="play-btn">Start exercise →</button>
    </div>`).join('');
}

function setStats(html) { document.getElementById('gs-stats').innerHTML = html; }
function setPanel(html, top) {
  const p = document.getElementById('game-panel');
  p.className = 'game-panel' + (top ? ' top' : '');
  p.innerHTML = html;
}
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
