// js/arithmetic/answers.js — Multiple-choice distractors and answer/question display helpers.
// Moved verbatim from arithmetic.html. Docs: docs/arithmetic.md

// ── DISTRACTOR GENERATION ──
// Generate 4 wrong answers that are plausible but wrong
function makeArithDistractors(q) {
  const correct = q.answer;
  const mode = q.displayMode || 'frac';
  const fmt = f => answerDisplay(f, mode);
  const correctStr = fmt(correct);
  const wrong = new Set([correctStr]);
  const candidates = [];

  const { n, d } = correct;
  const val = n / d;
  const isInt = d === 1;
  const isDecMode = mode === 'decimal';

  if (isDecMode) {
    // Generate nearby decimal values at same precision as correct answer
    const decStr = correctStr;
    const dp = (decStr.split('.')[1] || '').length;
    const step = Math.pow(10, -dp);
    const deltas = shuffle([step,-step,2*step,-2*step,3*step,-3*step,
      5*step,-5*step,10*step,-10*step,0.1,-0.1,0.2,-0.2,0.5,-0.5,1,-1]);
    for (const delta of deltas) {
      const v = parseFloat((val + delta).toFixed(dp));
      if (v !== val && v >= 0) candidates.push(makeFrac(Math.round(v * Math.pow(10,dp)), Math.pow(10,dp)));
      if (candidates.length >= 12) break;
    }
  } else if (isInt) {
    const deltas = shuffle([1,-1,2,-2,3,-3,5,-5,10,-10,
      Math.round(val*0.1), -Math.round(val*0.1),
      Math.round(val*0.05), Math.round(val*0.2)]);
    for (const delta of deltas) {
      const v = n + delta;
      if (v !== n && v >= 0) candidates.push(makeFrac(v,1));
      if (candidates.length >= 12) break;
    }
    const lastDigit = Math.abs(n) % 10;
    for (let offset = -30; offset <= 30; offset += 10) {
      const v = n + offset;
      if (v !== n && v >= 0 && Math.abs(v - n) <= 50) candidates.push(makeFrac(v,1));
    }
  } else {
    // Fraction mode: nearby fractions
    for (const dn of [-2,-1,1,2,3,-3]) {
      for (const dd of [-2,-1,0,1,2]) {
        const nn = n+dn, nd = d+dd;
        if (nd > 0 && nn > 0 && !(nn===n && nd===d)) candidates.push(makeFrac(nn,nd));
      }
    }
    if (q.type === 'fracadd' || q.type === 'fracsub') {
      const parts = q.question.match(/(\d+)\/(\d+)/g);
      if (parts && parts.length >= 2) {
        const [n1,d1] = parts[0].split('/').map(Number);
        const [n2,d2] = parts[1].split('/').map(Number);
        if (q.type === 'fracadd') candidates.push(makeFrac(n1+n2, d1+d2));
        else candidates.push(makeFrac(Math.abs(n1-n2), d1+d2));
      }
    }
  }

  // Shuffle and pick 3 distinct wrong answers
  shuffle(candidates);
  for (const c of candidates) {
    if (wrong.size >= 4) break;
    const s = fmt(c);
    if (!wrong.has(s) && c.n >= 0) { wrong.add(s); }
  }

  // Fallback
  let extra = 1;
  while (wrong.size < 4) {
    const step = isDecMode ? 0.1 : (isInt ? 3 : 1);
    const fallbackVal = isDecMode
      ? parseFloat((val + extra * step).toFixed(2))
      : val + extra * step;
    const f = isDecMode
      ? makeFrac(Math.round(fallbackVal * 100), 100)
      : makeFrac(n + extra * (isInt ? 3 : 1), d);
    wrong.add(fmt(f));
    extra++;
  }

  const arr = Array.from(wrong);
  shuffle(arr);
  return arr;
}

// answerDisplay: canonical key used for choice storage and comparison.
// mode='decimal': format as decimal (for decadd/decmul/percent questions)
// mode='frac' (default): integer or "n/d"
function answerDisplay(f, mode) {
  if (!f) return '?';
  if (f.d === 1) return String(f.n);
  if (mode === 'decimal') {
    // Round to at most 2dp, strip trailing zeros
    const v = f.n / f.d;
    return parseFloat(v.toFixed(2)).toString();
  }
  return `${f.n}/${f.d}`;
}

// renderQText: convert fraction tokens "n/d" in a question string to stacked HTML.
// Handles formats like "2/3 × 4", "3 1/4 + 1/2", "14 ÷ 7"
function renderQText(s) {
  // Replace tokens matching word-boundary n/d (where d>1) with fracHTML
  return s.replace(/(\d+)\/(\d+)/g, (_, n, d) => fracHTML(`${n}/${d}`));
}

// fracHTML: render a fraction string as stacked visual HTML.
// Improper fractions are shown as mixed numbers (e.g. 8/3 → 2⅔).
function fracHTML(str) {
  if (!str || str === '?') return str;
  if (!str.toString().includes('/')) return String(str);
  const [ns, ds] = str.toString().split('/');
  const n = parseInt(ns), d = parseInt(ds);
  if (isNaN(n) || isNaN(d) || d <= 1) return String(n);
  if (n > d && n > 0 && d > 0) {
    const whole = Math.floor(n / d), rem = n % d;
    if (rem === 0) return String(whole);
    return `${whole}<span class="vfrac"><sup>${rem}</sup><sub>${d}</sub></span>`;
  }
  return `<span class="vfrac"><sup>${n}</sup><sub>${d}</sub></span>`;
}
