// js/extras/stroop.js — Stroop (interference control). Pure logic is in logic.js (genStroop / scoreStroop). Docs: docs/extras.md
function startStroop() {
  const TOTAL = 40, WINDOW_MS = 2500, PENALTY_MS = 2000, GAP_MS = 450;
  const L = ExtrasLogic, C = L.STROOP_COLORS, g = myGen();
  function alive() { return myGen() === g; }
  let i = -1, trials = [], results = [], shownAt = 0, answered = true, timer = null;
  function stat() { if (!alive()) return; setStats(`<div class="stat-pill">Trial <b>${Math.max(i + 1, 0)}</b>/${TOTAL}</div>`); }

  setKey(e => {
    if (!alive()) return;
    const k = e.key.toLowerCase(), j = C.findIndex((c, n) => c.key === k || String(n + 1) === k);
    if (j >= 0) answer(j);
  });

  window.stGo = () => {
    if (!alive()) return;
    trials = L.genStroop(TOTAL); results = []; i = -1; answered = true;
    setPanel(`<div class="prog-track"><div class="prog-fill" id="st-prog" style="width:0%"></div></div>
      <div class="st-stage" aria-hidden="true"><div class="st-word" id="st-word">+</div></div>
      <div class="st-btns" role="group" aria-label="Ink colour">${C.map((c, j) => `<button type="button" class="st-btn" onclick="stAnswer(${j})"><kbd class="kbd-hint">${c.key.toUpperCase()}</kbd> ${c.name}</button>`).join('')}</div>
      <p class="nb-hint">Choose the colour of the <b>ink</b>, ignore what the word says. Keys: R G B Y (or 1–4).</p>`);
    next();
  };
  window.stAnswer = answer;

  function next() {
    if (!alive()) return;
    i++;
    if (i >= TOTAL) { finish(); return; }
    stat();
    const prog = document.getElementById('st-prog'); if (prog) prog.style.width = (i / TOTAL * 100) + '%';
    const w = document.getElementById('st-word'); if (w) { w.textContent = '+'; w.style.color = 'var(--st-fix)'; }
    setTimeout(() => {
      if (!alive()) return;
      const t = trials[i], el = document.getElementById('st-word'); if (!el) return;
      el.textContent = C[t.word].name; el.style.color = C[t.ink].ink;
      shownAt = performance.now(); answered = false;
      timer = setTimeout(() => { if (alive() && !answered) record(WINDOW_MS, false); }, WINDOW_MS);
    }, GAP_MS);
  }
  function answer(j) {
    if (!alive() || answered || i < 0 || i >= TOTAL) return;
    clearTimeout(timer);
    record(performance.now() - shownAt, j === trials[i].ink);
  }
  function record(rt, correct) {
    answered = true; results.push({ rt, correct });
    next();
  }
  function finish() {
    if (!alive()) return;
    clearKeys();
    const s = L.scoreStroop(trials, results, PENALTY_MS), avgS = (s.avg / 1000).toFixed(3);
    const label = `${avgS}s @ ${s.accuracy}%`;
    saveScore('stroop', s.avg, label); setStats('');
    const eff = s.interference == null ? '' : ` · Stroop effect ${s.interference >= 0 ? '+' : '−'}${Math.abs(s.interference / 1000).toFixed(3)}s`;
    setPanel(`<div class="result-card">
      <h2>Stroop complete</h2>
      <div class="result-num">${avgS}<span style="font-size:2rem;color:var(--muted)">s</span></div>
      <div class="result-sub">Avg response time · Accuracy: ${s.accuracy}%${eff}</div>
      <button class="again-btn" onclick="startStroop()">Play again</button>
    </div>`);
  }

  setStats('');
  setPanel(`<div class="start-card">
    <h2>Stroop</h2>
    <p>A colour word appears in a coloured ink, for example the word <strong>BLUE</strong> written in yellow. Choose the colour of the <strong>ink</strong>, not the word. Press <strong>R, G, B, Y</strong> (or 1–4), or click.
    Slow or wrong answers count as ${PENALTY_MS / 1000} s. ${TOTAL} trials. The result also shows your <em>Stroop effect</em>: how much slower you are when word and ink conflict.</p>
    <button class="big-btn" onclick="stGo()">Begin</button>
  </div>`);
}
