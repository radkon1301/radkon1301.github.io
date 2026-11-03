// js/extras/ev.js — Expected Value (probability reasoning). Question generation is in logic.js (genEVSet). Docs: docs/extras.md
function startEV() {
  const TOTAL = 12, L = ExtrasLogic, g = myGen();
  function alive() { return myGen() === g; }
  let qs = [], idx = 0, picks = [], t0 = 0;
  function stat() { if (!alive()) return; setStats(`<div class="stat-pill">Question <b>${Math.min(idx + 1, TOTAL)}</b>/${TOTAL}</div>`); }

  setKey(e => {
    if (!alive() || !qs.length || idx >= TOTAL) return;
    const j = '1234'.indexOf(e.key);
    if (j >= 0) pick(j);
  });

  window.evGo = () => { if (!alive()) return; qs = L.genEVSet(TOTAL); idx = 0; picks = []; t0 = performance.now(); show(); };
  window.evPick = pick;

  function show() {
    if (!alive()) return;
    stat();
    const q = qs[idx];
    setPanel(`<div class="prog-track"><div class="prog-fill" style="width:${idx / TOTAL * 100}%"></div></div>
      <div class="ev-q">
        <div class="ev-num">Question ${idx + 1} of ${TOTAL}</div>
        <p class="ev-text" id="ev-text" tabindex="-1">${q.text}</p>
        <div class="ev-opts" role="group" aria-label="Answer choices">${q.options.map((o, j) => `<button type="button" class="ev-opt" onclick="evPick(${j})"><kbd class="kbd-hint">${j + 1}</kbd> ${o.text}</button>`).join('')}</div>
      </div>`);
    const t = document.getElementById('ev-text'); if (t) t.focus({ preventScroll: true });   // keep keyboard / screen-reader users on the new question
  }
  function pick(j) {
    if (!alive() || idx >= TOTAL) return;
    picks.push(j); idx++;
    if (idx >= TOTAL) finish(); else show();
  }
  function finish() {
    if (!alive()) return;
    clearKeys();
    const secs = Math.round((performance.now() - t0) / 1000), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
    const correct = qs.filter((q, n) => picks[n] === q.correctIndex).length;
    saveScore('ev', correct, `${correct}/${TOTAL}`); setStats('');
    const wrong = qs.map((q, n) => ({ q, n, mine: q.options[picks[n]] })).filter(x => picks[x.n] !== x.q.correctIndex);
    const review = wrong.length
      ? `<ul class="ev-review" aria-label="Questions you missed">${wrong.map(x => `<li><div class="ev-rq">${x.n + 1}. ${x.q.text}</div>
          <div class="ev-ra">You chose <b class="bad">${x.mine.text}</b> · correct answer <b class="good">${x.q.options[x.q.correctIndex].text}</b></div>
          <div class="ev-ex">${x.q.explain}</div></li>`).join('')}</ul>`
      : `<p class="ev-perfect">Perfect score. Nothing to review.</p>`;
    setPanel(`<div class="result-card">
      <h2>Expected Value complete</h2>
      <div class="result-num">${correct}<span style="font-size:2rem;color:var(--muted)">/${TOTAL}</span></div>
      <div class="result-sub">Correct answers · ${mm}:${ss}</div>
      ${review}
      <button class="again-btn" onclick="startEV()">Play again</button>
    </div>`, true);
  }

  setStats('');
  setPanel(`<div class="start-card">
    <h2>Expected Value</h2>
    <p>${TOTAL} short probability problems: dice, coins, bets, draws, waiting times. Pick the right expected value from four options (keys <strong>1–4</strong> work too).
    Untimed, but a real assessment is not, so aim to answer in under 30 seconds each. Every mistake is explained at the end.</p>
    <button class="big-btn" onclick="evGo()">Begin</button>
  </div>`);
}
