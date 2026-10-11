// js/sequences/generators-recursive.js — Categories D (recursive), E (interleaved), F (digit-based).
// Docs: docs/sequences.md

// ════════════════════════════════════════════════════
//  CATEGORY D — RECURSIVE / MULTI-TERM
// ════════════════════════════════════════════════════

// D1: Fibonacci-type (each = sum of two preceding)
function genFibonacciType() {
  const a = rand(1, 8), b = rand(1, 8);
  const count = rand(6, 8);
  const terms = [a, b];
  for (let i = 2; i < count; i++) terms.push(terms[terms.length-1] + terms[terms.length-2]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Fibonacci-type',
    explanation: `Each term is the sum of the two preceding terms. Starts with <strong>${a}, ${b}</strong>.`
  };
}

// D2: Difference-of-two-preceding (like Fibonacci but subtraction — screenshot seq10)
function genDiffOfTwo() {
  const a = rand(-5, 10), b = rand(-5, 15);
  const count = rand(7, 10); // need many terms to show the cycle
  const terms = [a, b];
  for (let i = 2; i < count; i++) terms.push(terms[terms.length-2] - terms[terms.length-1]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Difference of Two Preceding',
    explanation: `Each term = the <strong>difference</strong> of the two preceding terms (second-to-last minus last).`
  };
}

// D3: Tribonacci (sum of three preceding)
function genTribonacci() {
  const a = rand(1,3), b = rand(1,3), c = rand(1,4);
  const count = rand(7, 9);
  const terms = [a, b, c];
  for (let i = 3; i < count; i++) terms.push(terms[terms.length-1] + terms[terms.length-2] + terms[terms.length-3]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Tribonacci-type',
    explanation: `Each term is the sum of the three preceding terms. Starts with <strong>${a}, ${b}, ${c}</strong>.`
  };
}

// D4: Rolling average of 3 preceding terms (screenshot example)
function genRollingAverage() {
  // Pick 3 random starting integers; subsequent = average of last 3
  const a = rand(1, 50) * (Math.random()<0.3 ? -1 : 1);
  const b = rand(1, 50) * (Math.random()<0.3 ? -1 : 1);
  const c = rand(1, 50) * (Math.random()<0.3 ? -1 : 1);
  const count = rand(6, 8);
  const terms = [a, b, c];
  for (let i = 3; i < count; i++) {
    const avg = (terms[terms.length-1] + terms[terms.length-2] + terms[terms.length-3]) / 3;
    if (!Number.isInteger(avg)) return genRollingAverage(); // retry if non-integer
    terms.push(avg);
  }
  if (terms.some(t => Math.abs(t) > 999)) return genRollingAverage();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Rolling Average of 3',
    explanation: `From the 4th term onward, each term = <strong>average of the three preceding terms</strong>.`
  };
}

// D5: General two-term recurrence aₙ = p·aₙ₋₁ + q·aₙ₋₂
function genTwoTermRecurrence() {
  const p = rand(1,3), q = rand(1,2);
  const t0 = rand(1,5), t1 = rand(1,6);
  const count = rand(5,7);
  const terms = [t0, t1];
  for (let i = 2; i < count; i++) terms.push(p*terms[terms.length-1] + q*terms[terms.length-2]);
  if (terms.some(t => t > 50000)) return genFibonacciType();
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Two-term Recurrence',
    explanation: `aₙ = <strong>${p}·aₙ₋₁ + ${q}·aₙ₋₂</strong>.`
  };
}

// ════════════════════════════════════════════════════
//  CATEGORY E — INTERLEAVED / POSITIONAL
// ════════════════════════════════════════════════════

// E1: Two interleaved arithmetic sequences
function genInterleavedArithmetic() {
  const d1 = rand(2, 8), d2 = rand(3, 10);
  const s1 = rand(2, 15), s2 = rand(3, 20);
  if (Math.abs(s1-s2) < 2) return genInterleavedArithmetic();
  const count = rand(7, 9);
  const terms = [];
  for (let i = 0; i < count; i++) {
    terms.push(i % 2 === 0 ? s1 + (i/2)*d1 : s2 + ((i-1)/2)*d2);
  }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Two Interleaved Arithmetic',
    explanation: `Two interleaved arithmetic sequences: positions 1,3,5… go +${d1}; positions 2,4,6… go +${d2}.`
  };
}

// E2: Two interleaved geometric sequences
function genInterleavedGeometric() {
  const r1 = rand(2, 3), r2 = rand(2, 3);
  const s1 = rand(1, 4), s2 = rand(1, 5);
  if (s1 === s2 && r1 === r2) return genInterleavedGeometric();
  const count = rand(6, 8);
  const terms = [];
  for (let i = 0; i < count; i++) {
    terms.push(i % 2 === 0 ? s1 * Math.pow(r1, i/2) : s2 * Math.pow(r2, (i-1)/2));
  }
  if (terms.some(t => t > 10000)) return genInterleavedArithmetic();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Two Interleaved Geometric',
    explanation: `Two interleaved geometric sequences: odd positions ×${r1}, even positions ×${r2}.`
  };
}

// E3: Interleaved arithmetic + geometric
function genInterleavedArithGeom() {
  const d = rand(3, 8), r = rand(2, 3);
  const s1 = rand(2, 12), s2 = rand(1, 5);
  const count = rand(6, 8);
  const terms = [];
  for (let i = 0; i < count; i++) {
    terms.push(i % 2 === 0 ? s1 + (i/2)*d : s2 * Math.pow(r, (i-1)/2));
  }
  if (terms.some(t => t > 5000)) return genInterleavedArithmetic();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Interleaved Arithmetic & Geometric',
    explanation: `Two interleaved sequences: odd positions form arithmetic (+${d}), even positions form geometric (×${r}).`
  };
}

// ════════════════════════════════════════════════════
//  CATEGORY F — DIGIT-BASED
// ════════════════════════════════════════════════════

// F1: Add digit sum
function genDigitSum() {
  const start = rand(10, 60);
  const count = rand(5, 7);
  const terms = [start];
  for (let i = 1; i < count; i++) {
    const prev = terms[terms.length-1];
    const ds = String(Math.abs(prev)).split('').reduce((s,c)=>s+parseInt(c),0);
    terms.push(prev + ds);
  }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Add Digit Sum',
    explanation: `Each term = previous term + <strong>sum of its digits</strong>.`
  };
}

// F2: Add digit product
// Only use starting values whose digits are all non-zero (avoids product=0 degenerate case)
function genDigitProduct() {
  // Pick a 2-digit start with no zero digits
  const d1 = rand(1,9), d2 = rand(1,9);
  const start = d1 * 10 + d2;
  const count = rand(5, 7);
  const terms = [start];
  for (let i = 1; i < count; i++) {
    const prev = terms[terms.length-1];
    const digits = String(prev).split('').map(Number);
    // If any digit becomes 0 (can happen as sequence progresses), stop and retry
    if (digits.includes(0)) return genDigitProduct();
    const dp = digits.reduce((p,c) => p * c, 1);
    terms.push(prev + dp);
  }
  // Sanity: all terms must be distinct and reasonable
  if (new Set(terms).size < count) return genDigitProduct();
  if (terms[terms.length-1] > 9999) return genDigitProduct();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Add Digit Product',
    explanation: `Each term = previous term + <strong>product of its digits</strong>.`
  };
}

// F3: Digit rotation (cyclic permutation of digits — screenshot sequence 4)
function genDigitRotation() {
  // Pick a 5-6 digit number and rotate its digits each step
  const digits = rand(4, 5); // 4 or 5 digit numbers
  const dArr = [];
  dArr.push(rand(1,9)); // no leading zero
  for (let i = 1; i < digits; i++) dArr.push(rand(0,9));
  const count = rand(5, 7);
  const terms = [];
  for (let i = 0; i < count; i++) {
    const rotated = [...dArr.slice(i % dArr.length), ...dArr.slice(0, i % dArr.length)];
    const num = parseInt(rotated.join(''));
    if (num === 0 || String(num).length !== digits) return genDigitRotation(); // skip leading-zero issues
    terms.push(num);
  }
  // Check all distinct enough
  if (new Set(terms).size < 3) return genDigitRotation();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Digit Rotation',
    explanation: `Each term is formed by <strong>rotating the digits</strong> of the previous term one position to the left.`
  };
}
