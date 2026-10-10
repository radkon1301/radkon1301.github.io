// js/arithmetic/questions.js — Fraction helpers, question generators (q*), generateAllQuestions().
// Moved verbatim from arithmetic.html. Docs: docs/arithmetic.md

// ══════════════════════════════════════════════════════
//  QUESTION GENERATOR
// ══════════════════════════════════════════════════════

// All questions return:
// { question: string, answer: Fraction, explanation: string, type: string }
// Fraction = { n: number, d: number } — always in lowest terms, d >= 1
// displayAnswer() for showing, equals(userInput) for checking

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while(b) { [a,b]=[b,a%b]; } return a||1; }
function makeFrac(n, d) {
  if (d === 0) return {n:0,d:1};
  if (d < 0) { n=-n; d=-d; }
  const g = gcd(Math.abs(n), d);
  return { n: n/g, d: d/g };
}
function fracDisplayHTML(f) {
  if (!f) return '?';
  if (f.d === 1) return String(f.n);
  return fracHTML(`${f.n}/${f.d}`);
}
function fracAdd(a, b) { return makeFrac(a.n*b.d + b.n*a.d, a.d*b.d); }
function fracSub(a, b) { return makeFrac(a.n*b.d - b.n*a.d, a.d*b.d); }
function fracMul(a, b) { return makeFrac(a.n*b.n, a.d*b.d); }
function fracDiv(a, b) { return makeFrac(a.n*b.d, a.d*b.n); }
function intFrac(n) { return {n, d:1}; }

// Parse user input to a Fraction (or null if invalid)
function parseInput(s) {
  s = s.trim().replace(/\s+/g,'');
  if (!s) return null;
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length !== 2) return null;
    const n = parseInt(parts[0]), d = parseInt(parts[1]);
    if (isNaN(n) || isNaN(d) || d === 0) return null;
    return makeFrac(n, d);
  }
  const v = parseFloat(s);
  if (isNaN(v)) return null;
  // Convert decimal to fraction
  const decStr = String(v);
  const dp = (decStr.split('.')[1] || '').length;
  const denom = Math.pow(10, dp);
  return makeFrac(Math.round(v * denom), denom);
}
function fracEqual(a, b) {
  if (!a || !b) return false;
  return a.n * b.d === b.n * a.d;
}

// Difficulty tiers: 0=easy, 1=medium, 2=hard
// 80 questions: 20 easy, 35 medium, 25 hard
const TIER_COUNTS = [20, 35, 25];

// ── Question type generators ──

function qAddInt(tier) {
  // tier 0: single digit + single digit
  // tier 1: 2-digit + 2-digit
  // tier 2: 3-digit + 3-digit or multi-term
  let a, b, c;
  if (tier === 0) { a = rand(2,9); b = rand(2,9); }
  else if (tier === 1) { a = rand(12,99); b = rand(12,99); }
  else { a = rand(100,999); b = rand(100,999); c = rand(10,99); }
  const ans = tier === 2
    ? makeFrac(a+b+c, 1)
    : makeFrac(a+b, 1);
  const q = tier === 2 ? `${a} + ${b} + ${c}` : `${a} + ${b}`;
  return { question: q, answer: ans, type: 'add', explanation: `${q} = <strong>${a+b+(c||0)}</strong>` };
}

function qSubInt(tier) {
  let a, b;
  if (tier === 0) { a = rand(5,15); b = rand(1,a); }
  else if (tier === 1) { a = rand(20,150); b = rand(10,a); }
  else { a = rand(200,999); b = rand(100,a); }
  return {
    question: `${a} − ${b}`,
    answer: makeFrac(a-b, 1),
    type: 'sub',
    explanation: `${a} − ${b} = <strong>${a-b}</strong>`
  };
}

function qMulInt(tier) {
  let a, b;
  if (tier === 0) { a = rand(2,9); b = rand(2,9); }
  else if (tier === 1) { a = rand(2,15); b = rand(11,25); }
  else { a = rand(12,35); b = rand(12,35); }
  return {
    question: `${a} × ${b}`,
    answer: makeFrac(a*b, 1),
    type: 'mul',
    explanation: `${a} × ${b} = <strong>${a*b}</strong>`
  };
}

function qDivInt(tier) {
  // Generate so it divides evenly
  if (tier === 0) {
    const b = rand(2,9); const ans = rand(2,9);
    return { question: `${b*ans} ÷ ${b}`, answer: makeFrac(ans,1), type:'div',
      explanation: `${b*ans} ÷ ${b} = <strong>${ans}</strong>` };
  } else if (tier === 1) {
    const b = rand(2,15); const ans = rand(5,20);
    return { question: `${b*ans} ÷ ${b}`, answer: makeFrac(ans,1), type:'div',
      explanation: `${b*ans} ÷ ${b} = <strong>${ans}</strong>` };
  } else {
    const b = rand(7,25); const ans = rand(10,40);
    return { question: `${b*ans} ÷ ${b}`, answer: makeFrac(ans,1), type:'div',
      explanation: `${b*ans} ÷ ${b} = <strong>${ans}</strong>` };
  }
}

function qFracAdd(tier) {
  // tier 0: same denominator, small
  // tier 1: different denominators (LCM-friendly)
  // tier 2: mixed numbers or 3 fracs
  if (tier === 0) {
    const d = randChoice([4,5,6,8,10]);
    const n1 = rand(1,d-1), n2 = rand(1,d-1);
    const a = makeFrac(n1,d), b = makeFrac(n2,d);
    const ans = fracAdd(a,b);
    return { question: `${n1}/${d} + ${n2}/${d}`, answer: ans, type:'fracadd',
      explanation: `${n1}/${d} + ${n2}/${d} = ${n1+n2}/${d} = <strong>${fracDisplayHTML(ans)}</strong>` };
  } else if (tier === 1) {
    const pairs = [[2,3],[2,5],[3,4],[4,5],[3,5],[2,7],[4,6],[3,8]];
    const [d1,d2] = randChoice(pairs);
    const n1 = rand(1,d1), n2 = rand(1,d2);
    const a = makeFrac(n1,d1), b = makeFrac(n2,d2);
    const ans = fracAdd(a,b);
    return { question: `${n1}/${d1} + ${n2}/${d2}`, answer: ans, type:'fracadd',
      explanation: `Find common denominator: <strong>${fracDisplayHTML(ans)}</strong>` };
  } else {
    // mixed + fraction
    const whole = rand(1,5);
    const d = randChoice([3,4,5,6,8]);
    const n1 = rand(1,d-1), n2 = rand(1,d-1);
    const a = makeFrac(whole*d+n1,d), b = makeFrac(n2,d);
    const ans = fracAdd(a,b);
    return { question: `${whole} ${n1}/${d} + ${n2}/${d}`, answer: ans, type:'fracadd',
      explanation: `${whole} ${n1}/${d} + ${n2}/${d} = <strong>${fracDisplayHTML(ans)}</strong>` };
  }
}

function qFracSub(tier) {
  if (tier === 0) {
    const d = randChoice([4,5,6,8,10]);
    let n1 = rand(2,d), n2 = rand(1,n1-1);
    const a = makeFrac(n1,d), b = makeFrac(n2,d);
    const ans = fracSub(a,b);
    return { question: `${n1}/${d} − ${n2}/${d}`, answer: ans, type:'fracsub',
      explanation: `${n1}/${d} − ${n2}/${d} = ${n1-n2}/${d} = <strong>${fracDisplayHTML(ans)}</strong>` };
  } else if (tier === 1) {
    const pairs = [[3,4],[2,3],[4,5],[3,5],[2,5],[5,6],[3,8],[4,7]];
    const [d1,d2] = randChoice(pairs);
    const n1 = rand(2,d1), n2 = rand(1,d2-1);
    const a = makeFrac(n1,d1), b = makeFrac(n2,d2);
    const ans = fracSub(a,b);
    if (ans.n <= 0) return qFracSub(tier);
    return { question: `${n1}/${d1} − ${n2}/${d2}`, answer: ans, type:'fracsub',
      explanation: `Common denominator: <strong>${fracDisplayHTML(ans)}</strong>` };
  } else {
    const whole = rand(2,6), d = randChoice([3,4,5,6,8]);
    const n1 = rand(1,d-1), n2 = rand(n1+1,d);
    // whole n1/d - n2/d requires borrowing
    const a = makeFrac(whole*d+n1,d), b = makeFrac(n2,d);
    const ans = fracSub(a,b);
    return { question: `${whole} ${n1}/${d} − ${n2}/${d}`, answer: ans, type:'fracsub',
      explanation: `Borrow from ${whole}: <strong>${fracDisplayHTML(ans)}</strong>` };
  }
}

function qFracMul(tier) {
  if (tier === 0) {
    const d1 = randChoice([2,3,4,5]), d2 = randChoice([2,3,4,5]);
    const n1 = rand(1,d1), n2 = rand(1,d2);
    const a = makeFrac(n1,d1), b = makeFrac(n2,d2);
    const ans = fracMul(a,b);
    return { question: `${n1}/${d1} × ${n2}/${d2}`, answer: ans, type:'fracmul',
      explanation: `${n1}×${n2} / ${d1}×${d2} = <strong>${fracDisplayHTML(ans)}</strong>` };
  } else if (tier === 1) {
    const d = randChoice([3,4,5,6,8]);
    const n = rand(1,d-1), whole = rand(2,8);
    const a = makeFrac(n,d), b = intFrac(whole);
    const ans = fracMul(a,b);
    return { question: `${n}/${d} × ${whole}`, answer: ans, type:'fracmul',
      explanation: `${n}/${d} × ${whole} = ${n*whole}/${d} = <strong>${fracDisplayHTML(ans)}</strong>` };
  } else {
    // mixed × fraction
    const whole = rand(1,4), d1 = randChoice([3,4,5]), d2 = randChoice([2,3,4]);
    const n1 = rand(1,d1-1), n2 = rand(1,d2);
    const a = makeFrac(whole*d1+n1,d1), b = makeFrac(n2,d2);
    const ans = fracMul(a,b);
    return { question: `${whole} ${n1}/${d1} × ${n2}/${d2}`, answer: ans, type:'fracmul',
      explanation: `Convert: ${whole*d1+n1}/${d1} × ${n2}/${d2} = <strong>${fracDisplayHTML(ans)}</strong>` };
  }
}

function qFracDiv(tier) {
  if (tier === 0) {
    const d1 = randChoice([2,3,4,5]), d2 = randChoice([2,3,4,5]);
    const n1 = rand(1,d1), n2 = rand(1,d2);
    const a = makeFrac(n1,d1), b = makeFrac(n2,d2);
    const ans = fracDiv(a,b);
    return { question: `${n1}/${d1} ÷ ${n2}/${d2}`, answer: ans, type:'fracdiv',
      explanation: `Multiply by reciprocal: ${n1}/${d1} × ${d2}/${n2} = <strong>${fracDisplayHTML(ans)}</strong>` };
  } else if (tier === 1) {
    const d = randChoice([3,4,5,6,8]);
    const n = rand(1,d-1), whole = rand(2,6);
    const a = makeFrac(n,d), b = intFrac(whole);
    const ans = fracDiv(a,b);
    return { question: `${n}/${d} ÷ ${whole}`, answer: ans, type:'fracdiv',
      explanation: `${n}/${d} ÷ ${whole} = ${n}/${d*whole} = <strong>${fracDisplayHTML(ans)}</strong>` };
  } else {
    const whole = rand(2,5), d1 = randChoice([3,4,5]), d2 = randChoice([2,3,4]);
    const n1 = rand(1,d1-1), n2 = rand(1,d2);
    const a = makeFrac(whole*d1+n1,d1), b = makeFrac(n2,d2);
    const ans = fracDiv(a,b);
    return { question: `${whole} ${n1}/${d1} ÷ ${n2}/${d2}`, answer: ans, type:'fracdiv',
      explanation: `Convert & flip: ${whole*d1+n1}/${d1} × ${d2}/${n2} = <strong>${fracDisplayHTML(ans)}</strong>` };
  }
}

function qDecAdd(tier) {
  // All tiers: 1dp values in the question (e.g. 3.4 + 7.8)
  // tier 0: small values; tier 1: larger; tier 2: 3-term
  if (tier === 0) {
    const a = rand(1,9) + rand(1,9)*0.1, b = rand(1,9) + rand(1,9)*0.1;
    const ans = makeFrac(Math.round((a+b)*10), 10);
    return { question: `${a.toFixed(1)} + ${b.toFixed(1)}`, answer: ans, type:'decadd', displayMode:'decimal',
      explanation: `= <strong>${parseFloat((ans.n/ans.d).toFixed(2))}</strong>` };
  } else if (tier === 1) {
    const a = rand(5,25) + rand(1,9)*0.1, b = rand(5,25) + rand(1,9)*0.1;
    const ans = makeFrac(Math.round((a+b)*10), 10);
    return { question: `${a.toFixed(1)} + ${b.toFixed(1)}`, answer: ans, type:'decadd', displayMode:'decimal',
      explanation: `= <strong>${parseFloat((ans.n/ans.d).toFixed(2))}</strong>` };
  } else {
    // 3-term 1dp addition
    const a = rand(3,15) + rand(1,9)*0.1;
    const b = rand(3,15) + rand(1,9)*0.1;
    const cc = rand(2,9) + rand(1,9)*0.1;
    const ans = makeFrac(Math.round((a+b+cc)*10), 10);
    return { question: `${a.toFixed(1)} + ${b.toFixed(1)} + ${cc.toFixed(1)}`, answer: ans, type:'decadd', displayMode:'decimal',
      explanation: `= <strong>${parseFloat((ans.n/ans.d).toFixed(2))}</strong>` };
  }
}

function qDecMul(tier) {
  // All tiers: 1dp values in the question
  // tier 0: decimal × integer; tier 1: decimal × decimal (1dp each); tier 2: larger values
  if (tier === 0) {
    const a = rand(1,9) + rand(1,9)*0.1, b = rand(2,9);
    const ans = makeFrac(Math.round(a*b*10), 10);
    return { question: `${a.toFixed(1)} × ${b}`, answer: ans, type:'decmul', displayMode:'decimal',
      explanation: `= <strong>${parseFloat((ans.n/ans.d).toFixed(2))}</strong>` };
  } else if (tier === 1) {
    const a = rand(1,9) + rand(1,9)*0.1, b = rand(1,9) + rand(1,9)*0.1;
    const ans = makeFrac(Math.round(a*b*100), 100);
    return { question: `${a.toFixed(1)} × ${b.toFixed(1)}`, answer: ans, type:'decmul', displayMode:'decimal',
      explanation: `= <strong>${parseFloat((ans.n/ans.d).toFixed(2))}</strong>` };
  } else {
    // Larger 1dp × 1dp
    const a = rand(5,20) + rand(1,9)*0.1, b = rand(5,20) + rand(1,9)*0.1;
    const ans = makeFrac(Math.round(a*b*100), 100);
    return { question: `${a.toFixed(1)} × ${b.toFixed(1)}`, answer: ans, type:'decmul', displayMode:'decimal',
      explanation: `= <strong>${parseFloat((ans.n/ans.d).toFixed(2))}</strong>` };
  }
}

function qPercentage(tier) {
  // X% of Y
  const percents = tier === 0 ? [10,20,25,50,75] : tier === 1 ? [15,30,35,40,60,70,80] : [12,17,33,45,65,85];
  const p = randChoice(percents);
  const y = tier === 0 ? rand(2,10)*10 : tier === 1 ? rand(2,20)*10 : rand(5,40)*10;
  const val = p * y / 100;
  const ans = makeFrac(Math.round(val * 100), 100);
  return {
    question: `${p}% of ${y}`, answer: ans, type: 'percent',
    explanation: `${p}/100 × ${y} = <strong>${fracDisplayHTML(ans)}</strong>`
  };
}

function qMixedOps(tier) {
  // Simple BODMAS expressions
  if (tier === 1) {
    const a = rand(2,8), b = rand(2,6), c = rand(1,9);
    // a × b + c
    const ans = makeFrac(a*b+c, 1);
    return { question: `${a} × ${b} + ${c}`, answer: ans, type:'mixed',
      explanation: `${a}×${b} = ${a*b}, + ${c} = <strong>${a*b+c}</strong>` };
  } else {
    const a = rand(2,8), b = rand(2,6), c = rand(2,5), d = rand(1,9);
    // a × b − c × d
    const ans = makeFrac(a*b - c*d, 1);
    if (ans.n < 0) return qMixedOps(tier);
    return { question: `${a} × ${b} − ${c} × ${d}`, answer: ans, type:'mixed',
      explanation: `${a*b} − ${c*d} = <strong>${a*b-c*d}</strong>` };
  }
}

function qSquare(tier) {
  const n = tier === 0 ? rand(2,12) : tier === 1 ? rand(11,20) : rand(15,30);
  return {
    question: `${n}²`,
    answer: makeFrac(n*n, 1),
    type: 'square',
    explanation: `${n}² = <strong>${n*n}</strong>`
  };
}

// Generate all 80 questions with tier distribution
function generateAllQuestions() {
  // Difficulty pools — no single-digit arithmetic; heavier on 2-digit×2-digit,
  // 3-digit ops, fraction manipulation, and mixed-ops.
  // Tier counts: 10 easy, 35 medium, 35 hard
  const pools = [
    [
      // Easy — 2-digit ops, simple fractions, squares to 15
      [() => qAddInt(1), 3], [() => qSubInt(1), 3], [() => qMulInt(1), 4],
      [() => qDivInt(1), 3], [() => qFracAdd(0), 2], [() => qFracSub(0), 2],
      [() => qSquare(0), 2], [() => qPercentage(0), 2]
    ],
    [
      // Medium — 3-digit add/sub, 2-digit×2-digit mul, fractions with different denoms,
      //          decimals, percentages, mixed-ops
      [() => qAddInt(2), 3], [() => qSubInt(2), 3], [() => qMulInt(2), 5],
      [() => qDivInt(2), 3], [() => qFracAdd(1), 3], [() => qFracSub(1), 3],
      [() => qFracMul(1), 3], [() => qFracDiv(1), 3], [() => qDecAdd(1), 2],
      [() => qDecMul(0), 2], [() => qPercentage(1), 3], [() => qMixedOps(1), 3],
      [() => qSquare(1), 2]
    ],
    [
      // Hard — mixed numbers, hard fracs, 2-dp decimals, tough mixed-ops, big squares
      [() => qAddInt(2), 2], [() => qMulInt(2), 4], [() => qFracAdd(2), 3],
      [() => qFracSub(2), 3], [() => qFracMul(2), 4], [() => qFracDiv(2), 4],
      [() => qDecAdd(2), 2], [() => qDecMul(1), 3], [() => qDecMul(2), 2],
      [() => qPercentage(2), 3], [() => qMixedOps(2), 4], [() => qSquare(2), 3]
    ]
  ];

  // Build weighted pools
  function buildWeighted(pool) {
    const arr = [];
    for (const [fn, w] of pool) for (let i = 0; i < w; i++) arr.push(fn);
    return arr;
  }

  const questions = [];
  const tierCounts = [10, 35, 35];
  for (let tier = 0; tier < 3; tier++) {
    const weighted = buildWeighted(pools[tier]);
    for (let i = 0; i < tierCounts[tier]; i++) {
      let q = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          q = randChoice(weighted)();
          if (q && q.answer && isFinite(q.answer.n/q.answer.d)) break;
        } catch(e) { q = null; }
      }
      questions.push(q || { question:'1 + 1', answer:makeFrac(2,1), type:'add', explanation:'1+1=<strong>2</strong>' });
    }
  }
  return shuffle(questions);
}
