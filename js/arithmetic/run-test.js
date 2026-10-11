// js/arithmetic/run-test.js — runTest(): shared engine for MC and free-response modes.
// Docs: docs/arithmetic.md

// ══════════════════════════════════════════════════════
//  SHARED TEST ENGINE
// ══════════════════════════════════════════════════════
const TOTAL_Q = 80;
const TIME_LIMIT = 8 * 60; // seconds

function runTest(gameId, isMultipleChoice) {
  const g = myGen();
  function alive() { return myGen() === g; }

  const questions = generateAllQuestions();
  // For MC, pre-generate choices
  const allChoices = isMultipleChoice
    ? questions.map(q => makeArithDistractors(q))
    : null;

  let currentIdx = 0;
  let timeLeft = TIME_LIMIT;
  let timerInterval = null;
  let submitted = false;
  let reviewIdx = 0;

  // answers[i] = { raw: string (user typed or choice), parsed: Fraction|null } or null
  const answers = new Array(TOTAL_Q).fill(null);

  function startTimer() {
    timerInterval = setInterval(() => {
      if (!alive()) { clearInterval(timerInterval); return; }
      timeLeft--;
      updateTimerEl();
      if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); }
    }, 1000);
  }

  function fmtTime(s) {
    const m = Math.floor(s/60), sec = s%60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  }

  function updateTimerEl() {
    const el = document.getElementById('arith-timer');
    if (!el) return;
    el.textContent = fmtTime(timeLeft);
    el.className = 'arith-timer' + (timeLeft <= 60 ? ' warn' : '');
  }

  function updateStats() {
    const answered = answers.filter(a => a !== null).length;
    setStats(`<div class="stat-pill">Q <b>${currentIdx+1}</b>/${TOTAL_Q}</div><div class="stat-pill">${answered} answered</div>`);
  }

  // ── RENDER QUESTION ──
  function renderQ(idx) {
    currentIdx = idx;
    const q = questions[idx];
    const pct = (idx / TOTAL_Q * 100).toFixed(1);

    let bodyHTML = '';
    if (isMultipleChoice) {
      const choices = allChoices[idx];
      const answered = answers[idx];
      const choicesHTML = choices.map(c =>
        `<button class="arith-choice ${answered && c === answered.raw ? 'selected-mc' : ''}"
          onclick="arithPick('${c.replace(/'/g,"\\'")}', ${idx})">${c}</button>`
      ).join('');
      bodyHTML = `<div class="arith-choices">${choicesHTML}</div>`;
    } else {
      // Free response
      const prev = answers[idx] ? answers[idx].raw : '';
      bodyHTML = `
        <div class="arith-input-wrap">
          <input class="arith-input" id="arith-input" type="text"
            value="${prev.replace(/"/g,'&quot;')}"
            placeholder="Enter answer…"
            onkeydown="arithInputKey(event, ${idx})"
            autocomplete="off" spellcheck="false">
          <button class="arith-submit-btn" onclick="arithSubmitFR(${idx})">Enter</button>
        </div>`;
    }

    setPanel(`<div class="arith-wrap">
      <div class="arith-nav-bar">
        <span class="arith-q-counter">Q ${idx+1} / ${TOTAL_Q}</span>
        <span class="arith-timer" id="arith-timer">${fmtTime(timeLeft)}</span>
      </div>
      <div class="arith-prog-wrap">
        <div class="arith-prog-track"><div class="arith-prog-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="arith-question-label">What is</div>
      <div class="arith-question">${renderQText(q.question)}</div>
      ${bodyHTML}
    </div>`, true);

    updateTimerEl();
    updateStats();

    // Auto-focus the input for FR
    if (!isMultipleChoice) {
      const inp = document.getElementById('arith-input');
      if (inp) setTimeout(() => inp.focus(), 30);
    }
  }

  // ── MC PICK ──
  window.arithPick = (chosen, idx) => {
    if (!alive() || submitted) return;
    const parsed = parseInput(chosen);
    answers[idx] = { raw: chosen, parsed };
    // Auto-advance
    const next = idx + 1;
    if (next < TOTAL_Q) { renderQ(next); }
    else { submitTest(); }
  };

  // ── FR SUBMIT ──
  window.arithSubmitFR = (idx) => {
    if (!alive() || submitted) return;
    const inp = document.getElementById('arith-input');
    if (!inp) return;
    const raw = inp.value.trim();
    if (!raw) {
      // blank = skip (null stays)
      answers[idx] = null;
    } else {
      const parsed = parseInput(raw);
      answers[idx] = { raw, parsed };
    }
    const next = idx + 1;
    if (next < TOTAL_Q) { renderQ(next); }
    else { submitTest(); }
  };

  window.arithInputKey = (e, idx) => {
    if (e.key === 'Enter') { e.preventDefault(); window.arithSubmitFR(idx); }
  };

  // ── SUBMIT ──
  window.submitTest = function() {
    if (!alive()) return;
    submitted = true;
    clearInterval(timerInterval);

    let correct = 0, incorrect = 0, skipped = 0;
    answers.forEach((a, i) => {
      if (a === null) { skipped++; }
      else if (isMultipleChoice
        ? a.raw === answerDisplay(questions[i].answer, questions[i].displayMode)
        : fracEqual(a.parsed, questions[i].answer)) { correct++; }
      else { incorrect++; }
    });
    const score = correct - incorrect - skipped;
    const scoreStr = score >= 0 ? `+${score}` : String(score);
    const prev = arithScores[gameId];
    const isNewBest = prev == null || score > prev.v;
    saveArithScore(gameId, score, scoreStr);
    renderDashboard();

    const bestLabel = getArithScoreLabel(gameId);
    setStats('');
    setPanel(`<div class="arith-wrap">
      <div class="arith-review-header">
        <div class="arith-score-big">${scoreStr}</div>
        <div class="arith-score-sub">Score = correct − incorrect − skipped</div>
        <div class="arith-score-pills">
          <span class="arith-score-pill green">✓ ${correct} correct</span>
          <span class="arith-score-pill red">✗ ${incorrect} incorrect</span>
          <span class="arith-score-pill red">⊘ ${skipped} skipped (−${skipped})</span>
          ${isNewBest ? '<span class="arith-score-pill best">★ New best!</span>'
            : bestLabel ? `<span class="arith-score-pill best">Best: ${bestLabel}</span>` : ''}
        </div>
      </div>
      <div style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text2);text-align:center;margin-bottom:10px">Review answers</div>
      <div id="review-body"></div>
    </div>`, true);

    renderReview(0);
  };

  // ── REVIEW ──
  function renderReview(idx) {
    reviewIdx = idx;
    const q = questions[idx];
    const userAns = answers[idx];
    const correctAns = q.answer;
    const correctDisplay = answerDisplay(correctAns, q.displayMode);
    // MC: string equality (choice key == correct key); FR: fracEqual (accepts 0.5 == 1/2)
    const isCorrect = userAns !== null && (
      isMultipleChoice
        ? userAns.raw === answerDisplay(correctAns, q.displayMode)
        : fracEqual(userAns.parsed, correctAns)
    );
    const isSkipped = userAns === null;

    let answerHtml = '';
    if (isMultipleChoice) {
      const choices = allChoices[idx];
      answerHtml = `<div class="arith-choices" style="margin-bottom:12px">` +
        choices.map(c => {
          let cls = 'arith-choice';
          if (c === correctDisplay) cls += ' reveal-correct';
          else if (userAns && c === userAns.raw && !isCorrect) cls += ' wrong';
          return `<button class="${cls}" disabled>${fracHTML(c)}</button>`;
        }).join('') + `</div>`;
    } else {
      // FR review
      let inputCls = 'arith-input';
      let inputVal = isSkipped ? '—' : userAns.raw;
      if (!isSkipped) inputCls += isCorrect ? ' correct' : ' wrong';
      answerHtml = `
        <input class="${inputCls}" value="${inputVal.replace(/"/g,'&quot;')}" disabled
          style="margin-bottom:8px;width:100%">
        ${!isCorrect ? `<div class="arith-correct-reveal">Correct answer: ${correctDisplay}</div>` : ''}
      `;
    }

    const statusLabel = isSkipped
      ? `<span style="color:var(--muted);font-size:.82rem">Skipped</span>`
      : isCorrect
        ? `<span style="color:var(--green);font-size:.82rem;font-weight:700">✓ Correct</span>`
        : `<span style="color:var(--red);font-size:.82rem;font-weight:700">✗ Incorrect</span>`;

    // Dot grid (10 per row for 80 questions)
    const dotHTML = answers.map((a, i) => {
      const ca = questions[i].answer;
      const isC = a !== null && (
        isMultipleChoice ? a.raw === answerDisplay(ca, questions[i].displayMode) : fracEqual(a.parsed, ca)
      );
      let cls = 'arith-q-dot';
      if (i === idx) cls += ' active';
      else if (a === null) cls += ' dot-skip';
      else if (isC) cls += ' dot-correct';
      else cls += ' dot-wrong';
      return `<button class="${cls}" onclick="arithReviewGoto(${i})" title="Q${i+1}">${i+1}</button>`;
    }).join('');

    document.getElementById('review-body').innerHTML = `
      <div class="arith-review-nav">
        <button class="arith-review-arrow" onclick="arithReviewGoto(${idx-1})" ${idx===0?'disabled':''}>&#8592;</button>
        <div class="arith-review-q-label">Q ${idx+1} / ${TOTAL_Q}</div>
        <button class="arith-review-arrow" onclick="arithReviewGoto(${idx+1})" ${idx===TOTAL_Q-1?'disabled':''}>&#8594;</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="arith-question-label" style="margin:0">What is</div>
        ${statusLabel}
      </div>
      <div class="arith-question" style="font-size:1.6rem;margin-bottom:16px">${renderQText(q.question)}</div>
      ${answerHtml}
      <div class="arith-feedback"><strong>Solution:</strong> ${q.explanation}</div>
      <div class="arith-q-grid" style="margin-top:16px">${dotHTML}</div>
    `;
  }

  window.arithReviewGoto = (idx) => {
    if (!alive() || idx < 0 || idx >= TOTAL_Q) return;
    renderReview(idx);
  };

  // ── START SCREEN ──
  const modeName = isMultipleChoice ? 'Multiple Choice' : 'Free Response';
  setPanel(`<div class="start-card">
    <h3>80 in 8 — ${modeName}</h3>
    <p>80 arithmetic questions &nbsp;·&nbsp; 8 minutes</p>
    <p style="font-size:.85rem;color:var(--text2);margin-top:8px">
      ${isMultipleChoice
        ? 'Select one of four answer choices per question. The next question appears immediately after your selection.'
        : 'Type your answer and press <strong>Enter</strong>. Fractions (1/2) and decimals (0.5) are both accepted. Leave blank and press Enter to skip.'}
    </p>
    <p style="font-size:.82rem;color:var(--text2);margin-top:6px"><strong>Score = correct − incorrect − skipped.</strong></p>
    <button class="big-btn" onclick="arithBegin()" style="margin-top:20px">Begin →</button>
  </div>`);

  window.arithBegin = () => {
    if (!alive()) return;
    startTimer();
    renderQ(0);
  };
}
