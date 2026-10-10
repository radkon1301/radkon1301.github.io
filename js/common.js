// js/common.js — helpers shared by zapn.html, sequences.html and arithmetic.html.
// Loaded first on every suite page. Docs: docs/shared.md
//
// Contract with each page:
//   DOM:       #dashboard, #game-screen, #gs-name, #gs-stats, #game-panel
//   Functions: the page defines renderDashboard() (usually a one-liner over renderGameCards).
//              Optional: afterSetPanel() is called after every setPanel() (zapn uses it for Full Test mode).

// ── generation guard ──
// Incremented whenever the user leaves a game (openGame / closeGame). A game captures
// `const g = myGen(); const alive = () => myGen() === g;` and checks alive() in every
// timer/callback, so abandoned games go silent.
let _gen = 0;
function myGen() { return _gen; }

// ── random helpers ──
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }   // inclusive ints
function randChoice(arr) { return arr[rand(0, arr.length - 1)]; }
function shuffle(arr) {                                                       // Fisher–Yates, in place, returns arr
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── panel helpers ──
function setStats(html) { document.getElementById('gs-stats').innerHTML = html; }
function setPanel(html, top) {
  const p = document.getElementById('game-panel');
  p.className = 'game-panel' + (top ? ' top' : '');
  p.innerHTML = html;
  if (typeof afterSetPanel === 'function') afterSetPanel();
}

// ── personal-best score store ──
// Persists { gameId: { v: number, label: string } } in localStorage under storageKey.
// Higher v is better unless the id is in opts.lowerBetter (a Set). opts.onSave(id, v, label)
// runs on EVERY save, even when it is not a new best (zapn Full Test uses it).
// Malformed stored entries are dropped; if nothing valid remains the key is removed.
function createScoreStore(storageKey, opts) {
  const lowerBetter = (opts && opts.lowerBetter) || new Set();
  const onSave = opts && opts.onSave;
  const scores = {};
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
    let anyKept = false;
    Object.keys(raw).forEach(k => {
      const v = raw[k];
      if (v != null && typeof v === 'object' && typeof v.label === 'string' && typeof v.v === 'number') {
        scores[k] = v;
        anyKept = true;
      }
    });
    if (!anyKept) localStorage.removeItem(storageKey);
  } catch (e) { try { localStorage.removeItem(storageKey); } catch (_) {} }

  return {
    scores,
    save(id, v, label) {
      const lbl = label || String(v);
      const cur = scores[id];
      const curV = cur != null && typeof cur === 'object' ? cur.v : null;
      const better = curV == null ? true : lowerBetter.has(id) ? v < curV : v > curV;
      if (better) {
        scores[id] = { v, label: lbl };
        try { localStorage.setItem(storageKey, JSON.stringify(scores)); } catch (e) {}
      }
      if (onSave) onSave(id, v, lbl);
    },
    label(id) {
      const s = scores[id];
      return s != null && s.label != null ? s.label : null;
    }
  };
}

// ── dashboard cards + screen switching ──
// games: [{id, title, icon, tag, desc, meta[], start}]; getLabel(id) -> best-score label or null.
function renderGameCards(gridId, games, getLabel) {
  document.getElementById(gridId).innerHTML = games.map(g => `
    <div class="game-card" onclick="launchGame('${g.id}')">
      <div class="card-tag">${g.tag}</div>
      <div class="card-icon-row">${g.icon}</div>
      <div class="card-title">${g.title}</div>
      <div class="card-desc">${g.desc}</div>
      <div class="card-meta">
        ${g.meta.map(m => `<span class="chip">${m}</span>`).join('')}
        ${getLabel(g.id) != null ? `<span class="chip hi">Best: ${getLabel(g.id)}</span>` : ''}
      </div>
      <button class="play-btn">Start exercise →</button>
    </div>`).join('');
}
function openGame(games, id) {
  _gen++;                                   // invalidate any previous game
  const g = games.find(x => x.id === id);
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  document.getElementById('gs-name').textContent = g.title;
  document.getElementById('gs-stats').innerHTML = '';
  const p = document.getElementById('game-panel');
  p.innerHTML = ''; p.className = 'game-panel';
  g.start();
}
function closeGame() {
  _gen++;                                   // invalidate all running game callbacks
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('game-screen').style.display = 'none';
  renderDashboard();
}
