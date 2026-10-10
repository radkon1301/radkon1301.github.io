// js/sequences/practice.js — Practice mode.
// Moved verbatim from sequences.html. Docs: docs/sequences.md

// ══════════════════════════════════════════════════════
//  PRACTICE GAME
// ══════════════════════════════════════════════════════
function startSeqPractice() {
  const g = myGen();
  function alive() { return myGen() === g; }
  let correct = 0, total = 0;

  function stat() {
    if (!alive()) return;
    setStats(`<div class="stat-pill">Correct <b>${correct}</b>/${total}</div>`);
  }

  function nextQuestion() {
    if (!alive()) return;
    const q = generateQuestion();
    const choices = makeDistractors(String(q.answer), q.terms);

    stat();

    // Build terms HTML — no ellipsis; the blank box serves as the visual end
    const termsHTML = q.terms.map((t) =>
      `<span class="seq-term">${t}</span><span class="seq-comma">,</span>`
    ).join('') +
    `<span class="seq-blank" id="seq-blank">?</span>`;

    const choicesHTML = choices.map(c =>
      `<button class="seq-choice" onclick="seqPick(this, '${c.replace(/'/g,"\\'")}', '${String(q.answer).replace(/'/g,"\\'")}', '${q.explanation.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">
        ${c}
      </button>`
    ).join('');

    setPanel(`<div class="seq-wrap">
      <div class="seq-type-toggle">
        <button class="seq-type-toggle-btn" id="type-toggle-btn" onclick="seqToggleType()">
          <span class="seq-toggle-dot"></span>Show type
        </button>
        <span class="seq-type-label" id="type-label">${q.typeName}</span>
      </div>
      <div class="seq-question-label">What comes next?</div>
      <div class="seq-terms">${termsHTML}</div>
      <div class="seq-choices" id="seq-choices">${choicesHTML}</div>
      <div id="seq-feedback"></div>
    </div>`, true);

    window.seqToggleType = () => {
      const btn = document.getElementById('type-toggle-btn');
      const lbl = document.getElementById('type-label');
      if (!btn || !lbl) return;
      const on = btn.classList.toggle('revealed');
      lbl.classList.toggle('visible', on);
      btn.innerHTML = `<span class="seq-toggle-dot"></span>${on ? 'Hide type' : 'Show type'}`;
    };
  }

  window.seqPick = (btn, chosen, answer, explanation) => {
    if (!alive()) return;
    // Disable all choices
    document.querySelectorAll('.seq-choice').forEach(b => { b.disabled = true; });

    const isCorrect = chosen === answer;
    if (isCorrect) {
      correct++;
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
      // reveal correct
      document.querySelectorAll('.seq-choice').forEach(b => {
        if (b.textContent.trim() === answer) b.classList.add('reveal-correct');
      });
    }
    total++;
    stat();

    // Update blank
    const blank = document.getElementById('seq-blank');
    if (blank) {
      blank.textContent = answer;
      blank.classList.add(isCorrect ? 'filled-correct' : 'filled-wrong');
    }

    // Show explanation + Next
    const fb = document.getElementById('seq-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="seq-explanation"><strong>Pattern:</strong> ${explanation}</div>
        <button class="seq-next-btn" onclick="seqNext()">Next →</button>`;
    }
  };

  window.seqNext = () => {
    if (!alive()) return;
    nextQuestion();
  };

  setPanel(`<div class="start-card">
    <h3>Sequence Practice</h3>
    <p>Identify the pattern in each sequence and choose the next number. Covers arithmetic, geometric, prime-based, Fibonacci-type, fractional sequences, and many more.</p>
    <button class="big-btn" onclick="seqGo()">Begin</button>
  </div>`);
  stat();

  window.seqGo = () => { if (!alive()) return; nextQuestion(); };
}
