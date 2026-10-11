// js/sequences/generators-basic.js — Generator helpers + categories A (arithmetic/polynomial), B (geometric), C (prime-based).
// Docs: docs/sequences.md

// ══════════════════════════════════════════════════════
//  SEQUENCE GENERATORS
//  Each returns: { terms[], answer, explanation, typeName }
//  terms = terms SHOWN (not the blank); answer = the next value
// ══════════════════════════════════════════════════════

// ── helpers ──
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}
function getPrimes(count, start = 2) {
  const primes = [];
  let n = start;
  while (primes.length < count) { if (isPrime(n)) primes.push(n); n++; }
  return primes;
}
function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
function fmtFrac(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d));
  return `${n/g}/${d/g}`;
}
function fmtDec(x, dp = 5) {
  // Round to dp sig figs and strip trailing zeros
  const s = parseFloat(x.toPrecision(dp));
  return String(s);
}

// ════════════════════════════════════════════════════
//  CATEGORY A — ARITHMETIC & POLYNOMIAL
// ════════════════════════════════════════════════════

// A1: Arithmetic (constant difference)
function genArithmetic() {
  const d = rand(-12, 12); if (d === 0) return genArithmetic();
  const start = rand(-10, 30);
  const count = rand(5, 7);
  const terms = Array.from({length: count}, (_, i) => start + i * d);
  const sign = d > 0 ? `+${d}` : `${d}`;
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Arithmetic',
    explanation: `Each term changes by a constant difference of <strong>${sign}</strong>.`
  };
}

// A2: Quadratic / constant 2nd differences
// (covers: quadratic formula, triangle numbers n(n+1)/2, oblong n(n+1),
//  pentagonal n(3n-1)/2, hexagonal n(2n-1), squares+linear, etc.)
function genConstantSecondDiff() {
  // Pick a random figurate family or pure quadratic
  const kind = rand(0, 6);
  let terms, explanation, typeName;
  const offset = rand(0, 3);
  const count = rand(5, 7);
  if (kind === 0) {
    // Triangle: n(n+1)/2
    terms = Array.from({length: count}, (_, i) => { const n = i+1+offset; return n*(n+1)/2; });
    typeName = 'Triangle Numbers';
    explanation = `Triangle numbers: <strong>T(n) = n(n+1)/2</strong>. Second differences are constant (1).`;
  } else if (kind === 1) {
    // Oblong / pronic: n(n+1)
    terms = Array.from({length: count}, (_, i) => { const n = i+1+offset; return n*(n+1); });
    typeName = 'Oblong Numbers';
    explanation = `Oblong numbers: <strong>n(n+1)</strong>. Second differences are constant (2).`;
  } else if (kind === 2) {
    // Pentagonal: n(3n-1)/2
    terms = Array.from({length: count}, (_, i) => { const n = i+1+offset; return n*(3*n-1)/2; });
    typeName = 'Pentagonal Numbers';
    explanation = `Pentagonal numbers: <strong>P(n) = n(3n−1)/2</strong>. Second differences are constant (3).`;
  } else if (kind === 3) {
    // Perfect squares (offset)
    const startN = rand(1, 5);
    terms = Array.from({length: count}, (_, i) => (startN+i)*(startN+i));
    typeName = 'Perfect Squares';
    explanation = `Consecutive perfect squares: <strong>${startN}², ${startN+1}², ${startN+2}²…</strong>`;
  } else {
    // General quadratic an²+bn+c (includes all the above as special cases)
    const a = rand(1, 3), b = rand(-3, 5), c = rand(0, 10);
    const n0 = rand(1, 4);
    terms = Array.from({length: count}, (_, i) => a*(n0+i)*(n0+i) + b*(n0+i) + c);
    typeName = 'Constant 2nd Differences';
    const bStr = b === 0 ? '' : (b > 0 ? ` + ${b}n` : ` − ${Math.abs(b)}n`);
    const cStr = c === 0 ? '' : ` + ${c}`;
    explanation = `Quadratic rule: <strong>${a}n²${bStr}${cStr}</strong>. The second differences are constant (${2*a}).`;
  }
  return { terms: terms.slice(0,-1), answer: terms[terms.length-1], typeName, explanation };
}

// A3: Linearly accelerating differences (+step each time to the diff)
function genAcceleratingDiff() {
  const d0 = rand(1, 8), step = rand(2, 6);
  const start = rand(2, 15);
  const count = rand(5, 7);
  const terms = [start];
  let diff = d0;
  for (let i = 1; i < count; i++) { terms.push(terms[terms.length-1] + diff); diff += step; }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Accelerating Differences',
    explanation: `Differences increase by <strong>${step}</strong> each step: +${d0}, +${d0+step}, +${d0+2*step}…`
  };
}

// A4: Differences themselves are geometric (×r)
function genGeomDiff() {
  const r = rand(2, 3);
  const d0 = rand(1, 4);
  const sign = Math.random() < 0.3 ? -1 : 1; // occasionally start with negative diff
  const start = rand(3, 20);
  const count = rand(5, 7);
  const terms = [start];
  let diff = sign * d0;
  for (let i = 1; i < count; i++) { terms.push(terms[terms.length-1] + diff); diff *= r; }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Geometric Differences',
    explanation: `Differences multiply by <strong>${r}</strong> each step: ${sign*d0}, ${sign*d0*r}, ${sign*d0*r*r}…`
  };
}

// A5: Differences alternate sign and double (screenshot example: -1,+2,-4,+8,-16,+32)
function genAltSignGeomDiff() {
  const d0 = rand(1, 3);
  const r = rand(2, 2); // always ×2 for clarity
  const start = rand(30, 80);
  const count = rand(6, 8);
  const terms = [start];
  let diff = -d0;
  for (let i = 1; i < count; i++) {
    terms.push(terms[terms.length-1] + diff);
    diff = diff * -r;
  }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Alternating-Sign Doubling Differences',
    explanation: `Differences alternate sign and double each step: <strong>${-d0}, ${d0*r}, ${-d0*r*r}, ${d0*r*r*r}…</strong>`
  };
}

// A6: Differences are Fibonacci numbers
function genFibDiffs() {
  const fibs = [1,1,2,3,5,8,13,21];
  const start = rand(2, 20);
  const count = rand(5, 7);
  const terms = [start];
  for (let i = 0; i < count - 1; i++) terms.push(terms[terms.length-1] + fibs[i]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Fibonacci Differences',
    explanation: `The differences between terms are consecutive Fibonacci numbers: <strong>+1, +1, +2, +3, +5, +8…</strong>`
  };
}

// A7: Cyclic differences (fixed repeating pattern)
function genCyclicDiff() {
  // 3-step or 4-step cycle, can include negatives (screenshot: -10,+1,+7,+1 repeating)
  const useMixed = Math.random() < 0.5;
  let cycle;
  if (useMixed) {
    const big = -rand(5,12);
    const a = rand(1,4), b = rand(3,8), c = rand(1,4);
    cycle = [big, a, b, c];
  } else {
    const vals = [rand(2,6), rand(4,10), rand(3,8)];
    cycle = vals;
  }
  const start = rand(5, 40);
  const count = rand(7, 10); // more terms to make cycle visible
  const terms = [start];
  for (let i = 1; i < count; i++) terms.push(terms[terms.length-1] + cycle[(i-1) % cycle.length]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Cyclic Differences',
    explanation: `Differences repeat in a cycle: <strong>${cycle.map(v=>v>=0?'+'+v:v).join(', ')}, ${cycle.map(v=>v>=0?'+'+v:v).join(', ')}…</strong>`
  };
}

// A8: Converging halving differences (alternating sign, ÷2 each step — screenshot example)
function genConvergingDiff() {
  const d0 = rand(8, 20) * (Math.random()<0.5?1:-1);
  const start = rand(80, 120);
  const count = rand(6, 7);
  const terms = [start];
  let diff = d0;
  for (let i = 1; i < count; i++) {
    terms.push(terms[terms.length-1] + diff);
    diff = -(diff / 2);
  }
  // Only accept if all values are nice (halve cleanly)
  const nice = terms.every(t => Number.isInteger(t) || (t*2 === Math.round(t*2)));
  if (!nice) return genArithmetic();
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Converging Halving Differences',
    explanation: `Differences halve and alternate sign each step: <strong>${d0}, ${-d0/2}, ${d0/4}…</strong> The sequence converges.`
  };
}

// ════════════════════════════════════════════════════
//  CATEGORY B — GEOMETRIC & MULTIPLICATIVE
// ════════════════════════════════════════════════════

// B1: Geometric (×r)
function genGeometric() {
  const r = rand(2, 5);
  const start = rand(1, 8);
  const count = rand(5, 6);
  const terms = Array.from({length: count}, (_, i) => start * Math.pow(r, i));
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Geometric',
    explanation: `Each term is multiplied by <strong>${r}</strong>.`
  };
}

// B2: Geometric with additive constant (aₙ = r·aₙ₋₁ + c)
function genLinearRecurrence() {
  const r = rand(2, 3), c = rand(1, 10), a0 = rand(1, 8);
  const count = rand(5, 6);
  const terms = [a0];
  for (let i = 1; i < count; i++) terms.push(r * terms[terms.length-1] + c);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Linear Recurrence',
    explanation: `Each term = <strong>${r} × previous + ${c}</strong>.`
  };
}

// B3: Alternating ×r and +b (screenshot: ×10 and +9)
function genAltMultAdd() {
  const r = [2,3,4,5,10][rand(0,4)];
  const b = rand(2, 12);
  const start = rand(2, 10);
  const count = rand(6, 7);
  const terms = [start];
  for (let i = 1; i < count; i++) {
    terms.push(i % 2 === 1 ? terms[terms.length-1] * r : terms[terms.length-1] + b);
  }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Alternate ×r then +b',
    explanation: `Alternates between multiplying by <strong>${r}</strong> and adding <strong>${b}</strong>.`
  };
}

// B4: Alternating ×r and −c
function genAltMultSub() {
  const r = rand(2,3), c = rand(5,15), start = rand(3,12);
  const count = rand(5,7);
  const terms = [start];
  for (let i = 1; i < count; i++) {
    terms.push(i%2===1 ? terms[terms.length-1]*r : terms[terms.length-1]-c);
  }
  return {
    terms: terms.slice(0,-1), answer: terms[terms.length-1],
    typeName: 'Alternate ×r then −c',
    explanation: `Alternates between multiplying by <strong>${r}</strong> and subtracting <strong>${c}</strong>.`
  };
}

// B5: Alternating +a and −b (net change per pair)
function genAlternatingAddSub() {
  const a = rand(3, 12), b = rand(2, 8);
  if (a === b) return genAlternatingAddSub();
  const start = rand(5, 30);
  const count = rand(7, 9);
  const terms = [start];
  for (let i = 1; i < count; i++) terms.push(terms[terms.length-1] + (i % 2 === 1 ? a : -b));
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Alternating +a / −b',
    explanation: `Alternates between adding <strong>${a}</strong> and subtracting <strong>${b}</strong>.`
  };
}

// B6: Perfect powers (n^k)
function genPowers() {
  const exp = rand(2, 4);
  const startN = rand(1, 5);
  const count = rand(5, 7);
  const terms = Array.from({length: count}, (_, i) => Math.pow(startN + i, exp));
  const sup = exp===2?'²':exp===3?'³':'⁴';
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: `Perfect ${exp===2?'Squares':exp===3?'Cubes':'Powers'}`,
    explanation: `Consecutive perfect ${exp===2?'squares':exp===3?'cubes':'4th powers'}: <strong>${startN}${sup}, ${startN+1}${sup}, ${startN+2}${sup}…</strong>`
  };
}

// B7: Factorials
function genFactorials() {
  const offset = rand(1, 3);
  const count = rand(5, 6);
  let f = 1;
  const terms = [];
  for (let i = 1; i <= count + offset - 1; i++) {
    f *= i;
    if (i >= offset) terms.push(f);
  }
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Factorials',
    explanation: `Consecutive factorials: <strong>${offset}!, ${offset+1}!, ${offset+2}!…</strong>`
  };
}

// ════════════════════════════════════════════════════
//  CATEGORY C — PRIME-BASED
// ════════════════════════════════════════════════════

// C1: Consecutive primes (subsequence starting at random prime)
function genPrimesSequence() {
  const primes = getPrimes(20);
  const startIdx = rand(0, 8);
  const count = rand(5, 7);
  const terms = primes.slice(startIdx, startIdx + count);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Consecutive Primes',
    explanation: `Consecutive prime numbers.`
  };
}

// C2: Add consecutive primes as differences
function genAddPrimes() {
  const primes = getPrimes(8);
  const start = rand(2, 20);
  const count = rand(5, 7);
  const terms = [start];
  for (let i = 0; i < count - 1; i++) terms.push(terms[terms.length-1] + primes[i]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Add Consecutive Primes',
    explanation: `Add consecutive primes as differences: <strong>+${primes.slice(0, count-1).join(', +')}…</strong>`
  };
}

// C3: Every other prime
function genEveryOtherPrime() {
  const primes = getPrimes(25);
  const startIdx = rand(0, 4);
  const count = rand(5, 7);
  const terms = Array.from({length: count}, (_, i) => primes[startIdx + i * 2]);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Every Other Prime',
    explanation: `Every other prime number (alternate primes from the sequence).`
  };
}

// C4: Second differences are consecutive primes
function genPrimesSecondDiff() {
  const primes = getPrimes(7);
  const d0 = rand(3, 10), start = rand(5, 20);
  const count = rand(5, 7);
  const diffs = [d0];
  for (let i = 0; i < count - 2; i++) diffs.push(diffs[diffs.length-1] + primes[i]);
  const terms = [start];
  for (const d of diffs) terms.push(terms[terms.length-1] + d);
  return {
    terms: terms.slice(0, -1), answer: terms[terms.length - 1],
    typeName: 'Prime 2nd Differences',
    explanation: `First differences increase by consecutive primes (${primes.slice(0,4).join(', ')}…). Second differences are prime.`
  };
}
