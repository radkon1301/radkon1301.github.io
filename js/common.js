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
  decorateResult();
  if (typeof afterSetPanel === 'function') afterSetPanel();
}

// ── run history ──
// Every completed run is appended to localStorage[<storageKey>_hist] as {id, v, label, t(ms since epoch)}, capped at
// HIST_PER_ID runs per game, so the Progress page can chart improvement. It is separate from the best-score key, so
// the best-score format (and anything reading it) is unchanged. Malformed entries are ignored on read.
const HIST_PER_ID = 100;
function readScoreHistory(storageKey) {
  try {
    const a = JSON.parse(localStorage.getItem(storageKey + '_hist') || '[]');
    return Array.isArray(a) ? a.filter(e => e && typeof e.id === 'string' && typeof e.v === 'number' && isFinite(e.v) &&
      typeof e.label === 'string' && typeof e.t === 'number' && isFinite(e.t)) : [];
  } catch (e) { return []; }
}
function appendScoreHistory(storageKey, entry) {
  const hist = readScoreHistory(storageKey);
  hist.push(entry);
  let n = hist.filter(e => e.id === entry.id).length;
  const out = [];
  for (const e of hist) { if (e.id === entry.id && n > HIST_PER_ID) { n--; continue; } out.push(e); }   // drop the oldest of this game only
  try { localStorage.setItem(storageKey + '_hist', JSON.stringify(out)); } catch (e) {}
  return out;
}

// ── personal-best score store ──
// Persists { gameId: { v: number, label: string } } in localStorage under storageKey.
// Higher v is better unless the id is in opts.lowerBetter (a Set). opts.onSave(id, v, label) runs on EVERY save,
// even when it is not a new best (zapn Full Test uses it); its 4th arg is true only when the value strictly beat the
// previous best (or there was none). save() returns the same flag and also appends the run to the history.
// Malformed stored entries are dropped; if nothing valid remains the key is removed.
let _lastSave = null;      // details of the most recent save(); consumed by decorateResult() to build the result badge
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
      const prevBestLabel = cur != null ? cur.label : null;
      const hist = readScoreHistory(storageKey).filter(e => e.id === id);
      const prevRunLabel = hist.length ? hist[hist.length - 1].label : null;
      if (better) {
        scores[id] = { v, label: lbl };
        try { localStorage.setItem(storageKey, JSON.stringify(scores)); } catch (e) {}
      }
      appendScoreHistory(storageKey, { id, v, label: lbl, t: Date.now() });
      _lastSave = { id, v, label: lbl, better, prevBestLabel, prevRunLabel, bestLabel: scores[id].label, at: Date.now() };
      if (onSave) onSave(id, v, lbl, better);
      return better;
    },
    label(id) {
      const s = scores[id];
      return s != null && s.label != null ? s.label : null;
    }
  };
}

// ── result-screen polish ──
// setPanel() calls decorateResult() after every render. If the panel holds a result card (.result-card, or any element
// with data-result) and a score was saved in the last few seconds, it adds a personal-best badge, counts the headline
// number up, throws confetti for a new best, and announces the result to screen readers. Games only need to render
// their card and call saveScore() as before. Each save is decorated at most once.
function reducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function resultBadgeHTML(r) {
  const prev = r.prevRunLabel != null ? `<span class="result-prev">Previous run: ${esc(r.prevRunLabel)}</span>` : '';
  if (r.better && r.prevBestLabel == null) return `<div class="result-best new" data-result-badge><b>★ First score saved</b>${prev}</div>`;
  if (r.better) return `<div class="result-best new" data-result-badge><b>★ New personal best</b><span class="result-prev">Beat ${esc(r.prevBestLabel)}</span></div>`;
  return `<div class="result-best" data-result-badge><b>Personal best: ${esc(r.bestLabel)}</b>${prev}</div>`;
}
function countUp(el) {
  const node = el.firstChild;
  if (!node || node.nodeType !== 3 || reducedMotion()) return;
  const txt = node.nodeValue, m = txt.trim().match(/^(-?\d+(?:\.\d+)?)$/);
  if (!m) return;
  const target = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, t0 = performance.now(), dur = 650;
  function step(now) {
    if (!node.parentNode) return;                       // panel was replaced meanwhile
    const k = Math.min(1, (now - t0) / dur);
    if (k >= 1) { node.nodeValue = txt; return; }
    node.nodeValue = (target * (1 - Math.pow(1 - k, 3))).toFixed(dec);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function confetti() {
  if (reducedMotion()) return;
  const box = document.createElement('div');
  box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const cols = ['var(--accent)', 'var(--green)', 'var(--yellow)', 'var(--red)', 'var(--purple)'];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement('i');
    c.style.cssText = `left:${rand(2, 98)}%;background:${cols[i % cols.length]};animation-delay:${rand(0, 400)}ms;animation-duration:${rand(1100, 1900)}ms;--dx:${rand(-60, 60)}px;`;
    box.appendChild(c);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2600);
}
function decorateResult() {
  const r = _lastSave;
  if (!r || r.done || Date.now() - r.at > 5000) return;
  const panel = document.getElementById('game-panel');
  const card = panel && panel.querySelector('.result-card, [data-result]');
  if (!card || card.querySelector('[data-result-badge]')) return;
  r.done = true;
  const anchor = card.querySelector('.result-sub');
  const html = resultBadgeHTML(r);
  if (anchor) anchor.insertAdjacentHTML('afterend', html);
  else { const btn = card.querySelector('.again-btn'); if (btn) btn.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html); }
  const num = card.querySelector('.result-num'); if (num) countUp(num);
  if (r.better) confetti();
  const say = [card.querySelector('h2'), num, card.querySelector('.result-sub'), card.querySelector('[data-result-badge]')]
    .filter(Boolean).map(e => e.textContent.replace(/\s+/g, ' ').trim()).join('. ');
  announce(say);
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
