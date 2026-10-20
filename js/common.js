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
let _lastLaunched = null;                                   // id of the game opened last (for focus return)
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

// ── drift-free countdown ──
// A bare setInterval(() => timeLeft--, 1000) loses time whenever the browser throttles timers (background tab,
// laptop sleep, heavy page). This derives the remaining time from the clock instead, so it can never run long.
// opts: { onTick(secondsLeft), onDone(), alive(), now() (injectable for tests), intervalMs }
// Returns { stop(), remaining() }. onTick fires only when the whole-second value changes; onDone fires once.
function createCountdown(seconds, opts) {
  opts = opts || {};
  const now = opts.now || (() => performance.now());
  const end = now() + seconds * 1000;
  let left = seconds, id = null, done = false;
  function stop() {
    if (id != null) { clearInterval(id); id = null; }
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', check);
  }
  function check() {
    if (opts.alive && !opts.alive()) { stop(); return; }
    const l = Math.max(0, Math.ceil((end - now()) / 1000));
    if (l !== left) { left = l; if (opts.onTick) opts.onTick(l); }
    if (l <= 0 && !done) { done = true; stop(); if (opts.onDone) opts.onDone(); }
  }
  id = setInterval(check, opts.intervalMs || 250);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', check);   // catch up the moment the tab is visible again
  return { stop, remaining: () => left };
}

// ── screen-reader announcements ──
// announce('text') speaks via a visually hidden polite live region (created on first use).
function announce(msg) {
  let el = document.getElementById('sr-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sr-status'; el.className = 'sr-only';
    el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
  }
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 30);     // clear-then-set so repeated identical messages are re-announced
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
// runs on EVERY save, even when it is not a new best (zapn Full Test uses it); its 4th arg is
// true only when the value strictly beat the previous best (or there was none). save() returns the same flag.
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
      if (onSave) onSave(id, v, lbl, better);
      return better;
    },
    label(id) {
      const s = scores[id];
      return s != null && s.label != null ? s.label : null;
    }
  };
}

// ── focus management ──
// After a game opens, focus its panel so keyboard / screen-reader users land in the game, not on the hidden dashboard.
function focusPanel() {
  const p = document.getElementById('game-panel');
  if (!p) return;
  p.setAttribute('tabindex', '-1');
  p.focus({ preventScroll: true });
}

// ── dashboard cards + screen switching ──
// games: [{id, title, icon, tag, desc, meta[], start}]; getLabel(id) -> best-score label or null.
function renderGameCards(gridId, games, getLabel) {
  document.getElementById(gridId).innerHTML = games.map(g => `
    <div class="game-card" onclick="launchGame('${g.id}')">
      <div class="card-tag">${g.tag}</div>
      <div class="card-icon-row" aria-hidden="true">${g.icon}</div>
      <h2 class="card-title">${g.title}</h2>
      <div class="card-desc">${g.desc}</div>
      <div class="card-meta">
        ${g.meta.map(m => `<span class="chip">${m}</span>`).join('')}
        ${getLabel(g.id) != null ? `<span class="chip hi">Best: ${getLabel(g.id)}</span>` : ''}
      </div>
      <button class="play-btn" data-game-id="${g.id}" aria-label="Start ${g.title.replace(/"/g, '&quot;')}">Start exercise →</button>
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
  _lastLaunched = id;
  g.start();
  focusPanel();
}
function closeGame() {
  _gen++;                                   // invalidate all running game callbacks
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('game-screen').style.display = 'none';
  renderDashboard();
  // Return keyboard focus to the card that launched the game (or the page heading).
  const btn = _lastLaunched && document.querySelector('.play-btn[data-game-id="' + _lastLaunched + '"]');
  if (btn) btn.focus({ preventScroll: true });
}
