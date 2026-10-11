// js/sequences/test.js — Timed Test mode.
// Docs: docs/sequences.md

// ══════════════════════════════════════════════════════
//  TEST GAME  (26 questions, 25 minutes)
// ══════════════════════════════════════════════════════
function startSeqTest() {
  const g = myGen();
  function alive() { return myGen() === g; }

  const TOTAL = 26;
  const TIME_LIMIT = 25 * 60; // seconds

  // ── Generate diverse question set ──
  // Bucket generators by rough difficulty: easy / medium / hard
  // We'll draw ~8 easy, ~10 medium, ~8 hard
  const easyGens   = [genArithmetic, genGeometric, genPrimesSequence, genConstantSecondDiff,
                      genAlternatingAddSub, genAltTwoDiffs, genAddIndex, genFibonacciType,
                      genPowers, genFactorials];
  const mediumGens  = [genAcceleratingDiff, genGeomDiff, genLinearRecurrence, genAltMultAdd,
                       genAltMultSub, genAddPrimes, genEveryOtherPrime, genInterleavedArithmetic,
                       genDigitSum, genDigitProduct, genCyclicDiff, genFibDiffs,
                       genDiffOfTwo, genTribonacci, genDecimalArithmetic, genDecimalFracs,
                       genFracBothArith, genAltSignGeomDiff, genPyramidDiff, genProductArith];
  const hardGens    = [genCompoundRecurrence, genConvergingDiff, genTwoTermRecurrence,
                       genRollingAverage, genInterleavedGeometric, genInterleavedArithGeom,
                       genPrimesSecondDiff, genFracChain, genFracFibNum, genFracArithGeom,
                       genFracBothGeom, genFracAltDenom, genFracTelescoping, genGeomDecimal,
                       genReciprocalSquares, genMultiDiff, genGrowingRatio, genPartialSumGeom,
                       genCumSumPrimes, genGeomPlusPoly, genDigitRotation];

  function pickDiverse(pool, needed) {
    const shuffled = shuffle([...pool]);
    const result = [];
    for (const fn of shuffled) {
      if (result.length >= needed) break;
      let q = null;
      for (let t = 0; t < 15; t++) {
        try { q = fn(); if (q && q.terms && q.terms.length >= 4) break; } catch(e) {}
      }
      if (q) result.push(q);
    }
    // If pool ran dry, top up with random
    while (result.length < needed) result.push(generateQuestion());
    return result;
  }

  let questions = [
    ...pickDiverse(easyGens,   8),
    ...pickDiverse(mediumGens, 10),
    ...pickDiverse(hardGens,   8),
  ];
  // Shuffle the order
  shuffle(questions);
  // Pre-generate choices for every question
  const allChoices = questions.map(q => makeDistractors(String(q.answer), q.terms));

  // State
  let currentIdx = 0;
  // answers[i] = chosen string, or null (unanswered/skipped)
  const answers = new Array(TOTAL).fill(null);
  let timerInterval = null;
  let timeLeft = TIME_LIMIT;
  let submitted = false;
  let reviewIdx = 0;

  // ── Timer ──
  function startTimer() {
    timerInterval = setInterval(() => {
      if (!alive()) { clearInterval(timerInterval); return; }
      timeLeft--;
      renderTimerDisplay();
      if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); }
    }, 1000);
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  }

  function renderTimerDisplay() {
    const el = document.getElementById('test-timer');
    if (!el) return;
    el.textContent = fmtTime(timeLeft);
    el.className = 'test-timer' + (timeLeft <= 60 ? ' warn' : '');
  }

  // ── Main render ──
  function renderQuestion(idx) {
    currentIdx = idx;
    const q = questions[idx];
    const choices = allChoices[idx];
    const answered = answers[idx];

    const termsHTML = q.terms.map(t =>
      `<span class="seq-term">${t}</span><span class="seq-comma">,</span>`
    ).join('') + `<span class="seq-blank" id="seq-blank">${answered !== null ? answered : '?'}</span>`;

    const choicesHTML = choices.map(c => {
      let cls = 'seq-choice';
      let disabled = ''; // always re-answerable during test
      if (answered !== null && c === answered) cls += ' selected'; // neutral highlight, no color feedback
      return `<button class="${cls}" ${disabled} onclick="testPick('${c.replace(/'/g,"\'")}', ${idx})">${c}</button>`;
    }).join('');

    // Q-dot grid
    const dotHTML = questions.map((_, i) => {
      let cls = 'test-q-dot';
      if (i === idx) cls += ' active';
      else if (answers[i] !== null) cls += ' answered';
      else cls += ' skipped';
      return `<button class="${cls}" onclick="testGoto(${i})">${i+1}</button>`;
    }).join('');

    // All answered?
    const allDone = answers.every(a => a !== null);

    setPanel(`<div class="seq-wrap">
      <div class="test-nav-bar">
        <span class="test-q-counter">Q ${idx+1} / ${TOTAL}</span>
        <div class="test-nav-arrows">
          <button class="test-arrow" onclick="testGoto(${idx-1})" ${idx===0?'disabled':''}>&#8592;</button>
          <button class="test-arrow" onclick="testGoto(${idx+1})" ${idx===TOTAL-1?'disabled':''}>&#8594;</button>
        </div>
        <span class="test-timer" id="test-timer">${fmtTime(timeLeft)}</span>
      </div>
      <div class="seq-question-label">What comes next?</div>
      <div class="seq-terms" id="test-terms">${termsHTML}</div>
      <div class="seq-choices" id="seq-choices">${choicesHTML}</div>
      ${answered !== null
        ? `<div style="display:flex;gap:8px;margin-top:10px">
             <button class="test-skip-btn" style="flex:1;margin-top:0" onclick="testClear(${idx})">✕ Clear answer</button>
             <button class="test-skip-btn" style="flex:1;margin-top:0" onclick="testSkip(${idx})">Skip →</button>
           </div>`
        : `<button class="test-skip-btn" onclick="testSkip(${idx})">Skip →</button>`
      }
      <div class="test-q-grid">${dotHTML}</div>
      <div class="test-submit-row">
        <button class="test-submit-btn" onclick="testSubmitConfirm()">Submit test</button>
      </div>
    </div>`, true);

    // Keep timer ticking
    renderTimerDisplay();
  }

  window.testPick = (chosen, idx) => {
    if (!alive() || submitted) return;
    answers[idx] = chosen;
    renderQuestion(idx);
    // Auto-advance to next unanswered after a short pause
    setTimeout(() => {
      if (!alive() || submitted) return;
      // Find next unanswered
      let next = -1;
      for (let i = idx + 1; i < TOTAL; i++) { if (answers[i] === null) { next = i; break; } }
      if (next === -1) for (let i = 0; i < idx; i++) { if (answers[i] === null) { next = i; break; } }
      if (next !== -1) renderQuestion(next);
      // else stay — all answered, user can submit
    }, 350);
  };

  window.testSkip = (idx) => {
    if (!alive() || submitted) return;
    // Move to next (skips stay null)
    const next = (idx + 1) % TOTAL;
    renderQuestion(next);
  };

  window.testClear = (idx) => {
    if (!alive() || submitted) return;
    answers[idx] = null;
    renderQuestion(idx);
  };

  window.testGoto = (idx) => {
    if (!alive() || submitted) return;
    if (idx < 0 || idx >= TOTAL) return;
    renderQuestion(idx);
  };

  window.testSubmitConfirm = () => {
    if (!alive() || submitted) return;
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      // Briefly flash unanswered dots, then confirm
      if (!window._testConfirmPending) {
        window._testConfirmPending = true;
        // Show a confirmation overlay in the submit row
        const row = document.querySelector('.test-submit-row');
        if (row) row.innerHTML = `
          <div style="text-align:center;font-size:.84rem;color:var(--text2);margin-bottom:8px">
            ${unanswered} question${unanswered>1?'s':''} unanswered — they score 0.
          </div>
          <div style="display:flex;gap:8px;justify-content:center">
            <button class="test-submit-btn" style="background:var(--red)" onclick="submitTest()">Submit anyway</button>
            <button class="test-submit-btn" style="background:var(--surface2);color:var(--text);border:1px solid var(--border)" onclick="testCancelConfirm()">Keep going</button>
          </div>`;
        return;
      }
    }
    submitTest();
  };

  window.testCancelConfirm = () => {
    window._testConfirmPending = false;
    renderQuestion(currentIdx);
  };

  window.submitTest = function submitTest() {
    if (!alive()) return;
    submitted = true;
    window._testConfirmPending = false;
    clearInterval(timerInterval);

    // Compute score
    let correct = 0, incorrect = 0, skipped = 0;
    answers.forEach((a, i) => {
      if (a === null) { skipped++; }
      else if (a === String(questions[i].answer)) { correct++; }
      else { incorrect++; }
    });
    const score = correct - incorrect;

    // Save best
    const prev = seqScores['seq-test'];
    const isNewBest = prev == null || score > prev.v;
    saveSeqScore('seq-test', score, `${score > 0 ? '+' : ''}${score}`);
    renderDashboard(); // update card

    // Show results screen
    reviewIdx = 0;
    renderResultsScreen(correct, incorrect, skipped, score, isNewBest);
  }

  function renderResultsScreen(correct, incorrect, skipped, score, isNewBest) {
    const scoreStr = score > 0 ? `+${score}` : String(score);
    const bestLabel = getSeqScoreLabel('seq-test');
    setStats('');
    setPanel(`<div class="seq-wrap">
      <div class="test-review-header">
        <div class="test-score-big">${scoreStr}</div>
        <div class="test-score-sub">Score = correct − incorrect &nbsp;(skips = 0)</div>
        <div class="test-score-pills">
          <span class="test-score-pill green">✓ ${correct} correct</span>
          <span class="test-score-pill red">✗ ${incorrect} incorrect</span>
          <span class="test-score-pill">⊘ ${skipped} skipped</span>
          ${isNewBest ? '<span class="test-score-pill best">★ New best!</span>' : (bestLabel ? `<span class="test-score-pill best">Best: ${bestLabel}</span>` : '')}
        </div>
      </div>
      <div style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text2);text-align:center;margin-bottom:10px">Review answers</div>
      <div id="review-body"></div>
    </div>`, true);

    renderReview(0);
  }

  function renderReview(idx) {
    reviewIdx = idx;
    const q = questions[idx];
    const choices = allChoices[idx];
    const userAnswer = answers[idx];
    const correctAnswer = String(q.answer);
    const isCorrect = userAnswer !== null && userAnswer === correctAnswer;
    const isSkipped = userAnswer === null;

    const termsHTML = q.terms.map(t =>
      `<span class="seq-term">${t}</span><span class="seq-comma">,</span>`
    ).join('') + `<span class="seq-blank ${isCorrect?'filled-correct':isSkipped?'':'filled-wrong'}">${isSkipped ? '—' : userAnswer}</span>`;

    const choicesHTML = choices.map(c => {
      let cls = 'seq-choice';
      if (c === correctAnswer) cls += ' reveal-correct';
      else if (c === userAnswer && !isCorrect) cls += ' wrong';
      return `<button class="${cls}" disabled>${c}</button>`;
    }).join('');

    const dotHTML = questions.map((_, i) => {
      const ua = answers[i];
      const ca = String(questions[i].answer);
      let cls = 'test-q-dot';
      if (i === idx) cls += ' active';
      else if (ua === null) cls += ' skipped';
      else if (ua === ca) cls += ' dot-correct';
      else cls += ' dot-wrong';
      return `<button class="${cls}" onclick="testReviewGoto(${i})">${i+1}</button>`;
    }).join('');

    const statusLabel = isSkipped
      ? `<span style="color:var(--muted);font-size:.82rem">Skipped</span>`
      : isCorrect
        ? `<span style="color:var(--green);font-size:.82rem;font-weight:700">✓ Correct</span>`
        : `<span style="color:var(--red);font-size:.82rem;font-weight:700">✗ Incorrect</span>`;

    document.getElementById('review-body').innerHTML = `
      <div class="test-review-nav">
        <button class="test-arrow" onclick="testReviewGoto(${idx-1})" ${idx===0?'disabled':''}>&#8592;</button>
        <div class="test-review-q-label">Q ${idx+1} / ${TOTAL} &nbsp;•&nbsp; ${q.typeName}</div>
        <button class="test-arrow" onclick="testReviewGoto(${idx+1})" ${idx===TOTAL-1?'disabled':''}>&#8594;</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="seq-question-label" style="margin:0">What comes next?</div>
        ${statusLabel}
      </div>
      <div class="seq-terms">${termsHTML}</div>
      <div class="seq-choices">${choicesHTML}</div>
      <div class="seq-explanation" style="margin-top:14px"><strong>Pattern:</strong> ${q.explanation}</div>
      <div class="test-q-grid" style="margin-top:16px">${dotHTML}</div>
    `;
  }

  window.testReviewGoto = (idx) => {
    if (!alive()) return;
    if (idx < 0 || idx >= TOTAL) return;
    renderReview(idx);
  };

  // ── Start ──
  setPanel(`<div class="start-card">
    <h3>Sequence Test</h3>
    <p>26 questions &nbsp;·&nbsp; 25 minutes</p>
    <p style="font-size:.85rem;color:var(--text2);margin-top:8px">Navigate freely between questions. Skip any question and return later. Correct answers and explanations are revealed after you submit.</p>
    <p style="font-size:.82rem;color:var(--text2);margin-top:6px"><strong>Score = correct − incorrect.</strong> Skipped questions score 0.</p>
    <button class="big-btn" onclick="testBegin()" style="margin-top:20px">Begin test →</button>
  </div>`);

  window.testBegin = () => {
    if (!alive()) return;
    startTimer();
    renderQuestion(0);
  };
}
