// js/arithmetic/core.js — Scores, generation guard, navigation, shared helpers.
// Moved verbatim from arithmetic.html. Docs: docs/arithmetic.md

// ── score storage ──
let arithScores = {};
try {
  const raw = JSON.parse(localStorage.getItem('me_arith_scores') || '{}');
  Object.keys(raw).forEach(k => {
    const v = raw[k];
    if (v != null && typeof v === 'object' && typeof v.label === 'string') arithScores[k] = v;
  });
} catch(e) {}

function saveArithScore(id, v, label) {
  const entry = {v, label: label || String(v)};
  const cur = arithScores[id];
  if (cur == null || v > cur.v) {
    arithScores[id] = entry;
    try { localStorage.setItem('me_arith_scores', JSON.stringify(arithScores)); } catch(e) {}
  }
}
function getArithScoreLabel(id) {
  const s = arithScores[id]; return (s && s.label) ? s.label : null;
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
  const g = ARITH_GAMES.find(x => x.id === id);
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  document.getElementById('gs-name').textContent = g.title;
  document.getElementById('gs-stats').innerHTML = '';
  const p = document.getElementById('game-panel');
  p.innerHTML = ''; p.className = 'game-panel';
  g.start();
}
function renderDashboard() {
  document.getElementById('arith-games-grid').innerHTML = ARITH_GAMES.map(g => `
    <div class="game-card" onclick="launchGame('${g.id}')">
      <div class="card-tag">${g.tag}</div>
      <div class="card-icon-row">${g.icon}</div>
      <div class="card-title">${g.title}</div>
      <div class="card-desc">${g.desc}</div>
      <div class="card-meta">
        ${g.meta.map(m => `<span class="chip">${m}</span>`).join('')}
        ${getArithScoreLabel(g.id) != null ? `<span class="chip hi">Best: ${getArithScoreLabel(g.id)}</span>` : ''}
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
function randChoice(arr) { return arr[rand(0, arr.length - 1)]; }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
