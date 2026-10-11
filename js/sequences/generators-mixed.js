// js/sequences/generators-mixed.js — Category I (mixed/creative) + extra types.
// Docs: docs/sequences.md

// ════════════════════════════════════════════════════
//  CATEGORY I — MIXED / CREATIVE
// ════════════════════════════════════════════════════

// I1: Screenshot seq2 type — complex recurrence (next diff = 2×prev_diff − factor)
function genCompoundRecurrence() {
  // aₙ = aₙ₋₁ + diffₙ, where diffₙ = 2×diffₙ₋₁ − sub
  const sub = rand(2, 8);
  const d0 = rand(5, 20);
  const start = rand(5, 30);
  const count = rand(5, 7);
  const terms = [start];
  let diff = d0;
  for (let i = 1; i < count; i++) {
    terms.push(terms[terms.length-1] + diff);
    diff = 2 * diff - sub;
  }
  if (terms.some(t => t > 9999 || t < -999)) return genAcceleratingDiff();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Compound Recurrence',
    explanation: `Each difference = <strong>2 × previous difference − ${sub}</strong>. Differences: ${d0}, ${2*d0-sub}, ${2*(2*d0-sub)-sub}…`
  };
}

// I2: Geometric sequence with a polynomial offset (aₙ = rⁿ + linear term)
function genGeomPlusPoly() {
  const r = rand(2, 3);
  const m = rand(1, 5), k = rand(0, 10);
  const startN = rand(0, 2);
  const count = rand(5, 6);
  const terms = Array.from({length: count}, (_, i) => {
    const n = startN + i;
    return Math.pow(r, n) + m * n + k;
  });
  if (terms.some(t => t > 9999)) return genLinearRecurrence();
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Exponential + Linear',
    explanation: `Each term = <strong>${r}ⁿ + ${m}n + ${k}</strong>. A geometric component plus a linearly growing component.`
  };
}

// I3: Product of two arithmetic sequences
function genProductArith() {
  const a0 = rand(1,5), da = rand(1,3), b0 = rand(1,5), db = rand(1,3);
  const count = rand(5,7);
  const terms = Array.from({length: count}, (_,i) => (a0+i*da) * (b0+i*db));
  if (terms.some(t=>t>9999)) return genConstantSecondDiff();
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Product of Two Arithmetic Sequences',
    explanation: `Each term = <strong>(${a0}+${da}n) × (${b0}+${db}n)</strong>. Equivalently, both factors step up by ${da} and ${db}.`
  };
}

// I4: Steps grow then shrink (pyramid-shaped differences)
function genPyramidDiff() {
  const peak = rand(3,6);
  const diffs = [];
  for (let i = 1; i <= peak; i++) diffs.push(i);
  for (let i = peak-1; i >= 1; i--) diffs.push(i);
  const start = rand(5,20);
  const count = Math.min(rand(6,9), diffs.length+1);
  const terms = [start];
  for (let i = 0; i < count-1; i++) terms.push(terms[terms.length-1] + diffs[i]);
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Pyramid Differences',
    explanation: `Differences increase then decrease: <strong>${diffs.slice(0,peak).join(', ')}, ${diffs.slice(peak).join(', ')}…</strong>`
  };
}

// I5: Alternating multiply and add to different registers (screenshot seq1 variation)
function genMultiDiff() {
  const r = rand(2, 3), start = rand(3, 15), c = rand(2, 8);
  // aₙ = r·aₙ₋₂ + c  (every two steps, multiply by r, plus c)
  const count = rand(6, 8);
  const terms = [start, start + rand(2,6)];
  for (let i = 2; i < count; i++) terms.push(r * terms[terms.length-2] + c);
  if (terms.some(t=>t>9999)) return genLinearRecurrence();
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Skip-one Recurrence',
    explanation: `Each term = <strong>${r} × the term two before it + ${c}</strong>.`
  };
}

// I6: Running total — cumulative sums of primes
function genCumSumPrimes() {
  const primes = getPrimes(10);
  const startIdx = rand(0, 3);
  const count = rand(5, 7);
  let s = 0;
  const terms = [];
  for (let i = startIdx; i < startIdx + count; i++) {
    s += primes[i];
    terms.push(s);
  }
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Cumulative Sum of Primes',
    explanation: `Running total of consecutive primes: <strong>+${primes[startIdx]}, +${primes[startIdx+1]}, +${primes[startIdx+2]}…</strong>`
  };
}

// ── EXTRA NEW TYPES ──

// J1: Sum of position index and previous term: aₙ = aₙ₋₁ + n
function genAddIndex() {
  const a0 = rand(1, 15);
  const mult = rand(1, 3); // add mult*n each step
  const count = rand(5, 7);
  const terms = [a0];
  for (let i = 1; i < count; i++) terms.push(terms[terms.length-1] + mult * i);
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Add Position Index',
    explanation: `Each term = previous + <strong>${mult === 1 ? 'step number' : mult+'×step number'}</strong>: +${mult}, +${2*mult}, +${3*mult}, +${4*mult}…`
  };
}

// J2: Differences alternate between two fixed values (a, b, a, b…)
// Distinct from cyclic because it's strictly 2-cycle and creates a clear zigzag
function genAltTwoDiffs() {
  const d1 = rand(3, 10), d2 = rand(2, 9);
  if (d1 === d2) return genAltTwoDiffs();
  const start = rand(5, 30);
  const count = rand(7, 9);
  const terms = [start];
  for (let i = 1; i < count; i++) terms.push(terms[terms.length-1] + (i%2===1 ? d1 : d2));
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Alternating Two Differences',
    explanation: `Differences alternate between <strong>+${d1}</strong> and <strong>+${d2}</strong>.`
  };
}

// J3: Partial sums of a geometric sequence
function genPartialSumGeom() {
  const r = rand(2, 3), a = rand(1, 4);
  const count = rand(5, 6);
  let s = 0;
  const terms = [];
  for (let i = 0; i < count; i++) {
    s += a * Math.pow(r, i);
    terms.push(s);
  }
  if (terms.some(t => t > 9999)) return genArithmetic();
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Partial Sums of Geometric',
    explanation: `Running total of a geometric sequence (×${r}): add <strong>${a}, ${a*r}, ${a*r*r}, ${a*r*r*r}…</strong>`
  };
}

// J4: Fraction sequence where each term = previous × (n+1)/n (telescoping product)
function genFracTelescoping() {
  // a_n = start × (k+1)/k × (k+2)/(k+1) × ... — but show the raw values
  // Simpler: terms are start×(n/d) where n and d each step by different amounts
  // Equivalent: aₙ = a₀ × product_of_ratios
  const a = rand(1,4), b = rand(2,5), da = rand(1,3), db = rand(1,3);
  if (da === db) return genFracTelescoping();
  const count = rand(5, 7);
  const terms = [];
  let cn = a, cd = b;
  for (let i = 0; i < count; i++) {
    const g = gcd(Math.abs(cn), cd);
    terms.push([cn/g, cd/g]);
    cn += da; cd += db;
  }
  // Check none reduce to same value
  const strs = terms.map(([n,d]) => fmtFrac(n,d));
  if (new Set(strs).size < count) return genFracTelescoping();
  return {
    terms: strs.slice(0,-1), answer: strs[strs.length-1],
    typeName: 'Fraction — Stepped Numerator & Denominator',
    explanation: `Numerator steps +${da}, denominator steps +${db} each term. Track each separately.`
  };
}

// J5: Geometric sequence where ratio itself grows by 1 each step
function genGrowingRatio() {
  const start = rand(1, 5);
  const baseR = rand(2, 3);
  const count = rand(5, 6);
  const terms = [start];
  for (let i = 1; i < count; i++) terms.push(terms[terms.length-1] * (baseR + i - 1));
  if (terms.some(t => t > 50000)) return genGeometric();
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Growing Ratio',
    explanation: `Each term is multiplied by an increasing factor: ×${baseR}, ×${baseR+1}, ×${baseR+2}… (ratio increases by 1 each step).`
  };
}

// J6: Decimal sequence: each term = 1/n² shown as decimal
function genReciprocalSquares() {
  const startN = rand(1, 3);
  const count = rand(5, 7);
  const fmt = v => fmtDec(v, 5);
  const terms = Array.from({length: count}, (_, i) => parseFloat((1/((startN+i)*(startN+i))).toPrecision(5)));
  if (terms[terms.length-1] < 0.001) return genDecimalFracs();
  return {
    terms: terms.slice(0,-1).map(fmt), answer: fmt(terms[terms.length-1]),
    typeName: 'Reciprocal Squares (Decimal)',
    explanation: `Terms are <strong>1/n²</strong>: 1/${startN}² = ${fmt(terms[0])}, 1/${startN+1}² = ${fmt(terms[1])}… Note the pattern of which squares appear.`
  };
}
