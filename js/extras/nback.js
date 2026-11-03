// js/extras/nback.js — N-Back (working memory). Pure logic is in logic.js (genNBack / scoreNBack). Docs: docs/extras.md
function startNBack() {
  const N = 2, TOTAL = 40, TARGETS = 12, STIM_MS = 500, TRIAL_MS = 2500;
  const L = ExtrasLogic, g = myGen();
  function alive() { return myGen() === g; }
  let i = -1, seq = [], isTarget = [], pressed = [], open = false;
  function stat() { if (!alive()) return; setStats(`<div class="stat-pill">Letter <b>${Math.max(i + 1, 0)}</b>/${TOTAL}</div>`); }

  setKey(e => {
    if (!alive()) return;
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); respond(); }
  });

  window.nbGo = () => {
    if (!alive()) return;
    const r = L.genNBack(TOTAL, N, TARGETS); seq = r.seq; isTarget = r.isTarget;
    pressed = new Array(TOTAL).fill(false); i = -1; open = false;
    setPanel(`<div class="prog-track"><div class="prog-fill" id="nb-prog" style="width:0%"></div></div>
      <div class="nb-stage"><div class="nb-letter" id="nb-letter" role="status" aria-live="polite" aria-atomic="true"></div></div>
      <button type="button" class="nb-match" id="nb-match" onclick="nbRespond()"><kbd class="kbd-hint">Space</kbd> Match</button>
      <p class="nb-hint">Press <b>Space</b> (or click Match) when this letter is the same as the one <b>${N} letters ago</b>.</p>`);
    next();
  };
  window.nbRespond = respond;

  function respond() {
    if (!alive() || !open || i < 0 || i >= TOTAL || pressed[i]) return;
    pressed[i] = true;
    const b = document.getElementById('nb-match'); if (b) b.classList.add('on');
  }
  function next() {
    if (!alive()) return;
    i++;
    if (i >= TOTAL) { finish(); return; }
    open = true; stat();
    const el = document.getElementById('nb-letter'), prog = document.getElementById('nb-prog'), b = document.getElementById('nb-match');
    if (el) el.textContent = seq[i];
    if (prog) prog.style.width = (i / TOTAL * 100) + '%';
    if (b) b.classList.remove('on');
    setTimeout(() => { if (alive()) { const e2 = document.getElementById('nb-letter'); if (e2) e2.textContent = ''; } }, STIM_MS);
    setTimeout(next, TRIAL_MS);
  }
  function finish() {
    if (!alive()) return;
    open = false; clearKeys();
    const s = L.scoreNBack(isTarget, pressed, N);
    const label = `${s.balanced}% · ${s.hits}/${s.targets} hits, ${s.fa} false`;
    saveScore('nback', s.balanced, label); setStats('');
    setPanel(`<div class="result-card">
      <h2>N-Back complete</h2>
      <div class="result-num">${s.balanced}<span style="font-size:2rem;color:var(--muted)">%</span></div>
      <div class="result-sub">Balanced accuracy · ${s.hits} of ${s.targets} matches caught · ${s.fa} false alarm${s.fa === 1 ? '' : 's'}</div>
      <button class="again-btn" onclick="startNBack()">Play again</button>
    </div>`);
  }

  setStats('');
  setPanel(`<div class="start-card">
    <h2>N-Back</h2>
    <p>Letters appear one at a time. Press <strong>Space</strong> whenever the letter on screen is the same as the one shown <strong>${N} letters earlier</strong>.
    Example: <span class="nb-eg">B &nbsp;K &nbsp;<b>B</b></span> — the second B is a match. ${TOTAL} letters, about ${Math.round(TOTAL * TRIAL_MS / 60000 * 10) / 10 } minutes. Pressing on everything or nothing scores 50%.</p>
    <button class="big-btn" onclick="nbGo()">Begin</button>
  </div>`);
}
