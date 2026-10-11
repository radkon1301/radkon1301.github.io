// js/sequences/generators-fraction-decimal.js — Categories G (fractions), H (decimals).
// Docs: docs/sequences.md

// ════════════════════════════════════════════════════
//  CATEGORY G — FRACTION SEQUENCES
// ════════════════════════════════════════════════════

// G1: Both numerator and denominator arithmetic
function genFracBothArith() {
  let n = rand(1,8), d = rand(3,12), dn = rand(3,9), dd = rand(1,4);
  // Guard: if dn/dd == n/d the sequence is constant — reject
  if (dn * d === dd * n) return genFracBothArith();
  // Also reject same step size when it would cause constant ratio
  const count = rand(5, 7);
  const terms = [];
  let cn = n, cd = d;
  for (let i = 0; i < count; i++) {
    terms.push([cn, cd]);
    cn += dn; cd += dd;
  }
  // All rendered fractions must be distinct
  const strs = terms.map(([a,b]) => fmtFrac(a,b));
  if (new Set(strs).size < count) return genFracTelescoping();
  return {
    terms: strs.slice(0, -1),
    answer: strs[strs.length-1],
    typeName: 'Fraction — Both Arithmetic',
    explanation: `Numerator +${dn} each step; denominator +${dd} each step.`
  };
}

// G2: Numerator arithmetic, denominator alternates between two step sizes
function genFracAltDenom() {
  let n = rand(1,8), d = rand(3,12), dn = rand(4,10);
  const dd1 = rand(1,2), dd2 = rand(2,4);
  if (dd1 === dd2) return genFracAltDenom();
  const count = rand(5, 7);
  const terms = [];
  let cn = n, cd = d;
  for (let i = 0; i < count; i++) {
    terms.push([cn, cd]);
    cn += dn;
    cd += (i % 2 === 0 ? dd1 : dd2);
  }
  // All rendered fractions must be distinct
  const strs = terms.map(([a,b]) => fmtFrac(a,b));
  if (new Set(strs).size < count) return genFracAltDenom();
  return {
    terms: strs.slice(0, -1),
    answer: strs[strs.length-1],
    typeName: 'Fraction — Alternating Denominator Step',
    explanation: `Numerator +${dn}; denominator alternates +${dd1} and +${dd2}.`
  };
}

// G3: Denominator of each term = numerator of next (Fibonacci-like chain)
// Consecutive Fibonacci numbers are always coprime, so simplification never collapses terms.
function genFracChain() {
  const fibA = rand(1,4), fibB = rand(3,8);
  // fibA and fibB must differ, otherwise first two terms are equal
  if (fibA === fibB) return genFracChain();
  const count = rand(5, 7);
  const nums = [fibA, fibB];
  for (let i = 2; i < count + 1; i++) nums.push(nums[nums.length-1] + nums[nums.length-2]);
  const terms = [];
  for (let i = 0; i < count; i++) terms.push([nums[i], nums[i+1]]);
  const strs = terms.map(([a,b]) => fmtFrac(a,b));
  if (new Set(strs).size < count) return genFracChain();
  return {
    terms: strs.slice(0, -1),
    answer: strs[strs.length-1],
    typeName: 'Fraction — Denominator Chain',
    explanation: `Denominator of each term becomes the numerator of the next; numerators follow a Fibonacci-like pattern (${fibA}, ${fibB}…).`
  };
}

// G4: Numerator Fibonacci, denominator arithmetic
function genFracFibNum() {
  const a = rand(1,3), b = rand(2,5);
  const fibs = [a, b];
  for (let i = 2; i < 8; i++) fibs.push(fibs[fibs.length-1]+fibs[fibs.length-2]);
  const dStart = rand(2, 8), dStep = rand(1, 3);
  const count = rand(5, 7);
  const terms = Array.from({length: count}, (_, i) => [fibs[i], dStart + i * dStep]);
  // All rendered fractions must be distinct
  const strs = terms.map(([a,b]) => fmtFrac(a,b));
  if (new Set(strs).size < count) return genFracFibNum();
  return {
    terms: strs.slice(0, -1),
    answer: strs[strs.length-1],
    typeName: 'Fraction — Fibonacci Numerators',
    explanation: `Numerators follow a Fibonacci pattern (${fibs.slice(0,5).join(', ')}…); denominator +${dStep} each step.`
  };
}

// G5: Numerator arithmetic, denominator geometric
function genFracArithGeom() {
  let n = rand(2,8), d = rand(2,4), dn = rand(3,9), dr = rand(2,3);
  const count = rand(5, 6);
  const terms = [];
  let cn = n, cd = d;
  for (let i = 0; i < count; i++) {
    terms.push([cn, cd]);
    cn += dn; cd *= dr;
  }
  if (terms.some(([a,b])=>b>500)) return genFracBothArith();
  const strs = terms.map(([a,b]) => fmtFrac(a,b));
  if (new Set(strs).size < count) return genFracArithGeom();
  return {
    terms: strs.slice(0, -1),
    answer: strs[strs.length-1],
    typeName: 'Fraction — Arithmetic Numerator, Geometric Denominator',
    explanation: `Numerator +${dn} each step; denominator ×${dr} each step.`
  };
}

// G6: Both geometric (×rn numerator, ×rd denominator)
function genFracBothGeom() {
  let rn = rand(2,3), rd = rand(2,3), n = rand(1,5), d = rand(3,10);
  // If rn == rd every fraction simplifies to the same n/d — always trivial
  if (rn === rd) return genFracBothGeom();
  const count = rand(5, 6);
  const terms = [];
  let cn = n, cd = d;
  for (let i = 0; i < count; i++) {
    terms.push([cn, cd]);
    cn *= rn; cd *= rd;
  }
  if (terms.some(([a,b])=>b>1000||a>1000)) return genFracBothGeom();
  const strs = terms.map(([a,b]) => fmtFrac(a,b));
  // All must be distinct (catches cases where simplification makes terms repeat)
  if (new Set(strs).size < count) return genFracBothGeom();
  return {
    terms: strs.slice(0, -1),
    answer: strs[strs.length-1],
    typeName: 'Fraction — Both Geometric',
    explanation: `Numerator ×${rn}, denominator ×${rd} each step.`
  };
}

// ════════════════════════════════════════════════════
//  CATEGORY H — DECIMAL SEQUENCES
// ════════════════════════════════════════════════════

// H1: Fractions shown as decimals — n/(n+k) type (screenshot: 1/3, 2/4, 3/5...)
function genDecimalFracs() {
  const k = rand(1, 5);
  const start = rand(1, 4);
  const count = rand(5, 7);
  const terms = Array.from({length: count}, (_, i) => {
    const n = start + i;
    return parseFloat((n / (n+k)).toPrecision(5));
  });
  const lastN = start + count - 1;
  const ans = parseFloat((lastN / (lastN+k)).toPrecision(5));
  // format all as decimals
  const fmt = v => fmtDec(v, 5);
  return {
    terms: terms.slice(0, -1).map(fmt),
    answer: fmt(ans),
    typeName: 'Decimal Fractions',
    explanation: `Each term is <strong>n/(n+${k})</strong> for n = ${start}, ${start+1}, … Convert to fractions: ${start}/${start+k}, ${start+1}/${start+1+k}… The numerator and denominator each increase by 1.`
  };
}

// H2: Arithmetic sequence shown as decimals
function genDecimalArithmetic() {
  const choices = [0.1, 0.2, 0.25, 0.5, 0.15, 0.3, 0.05];
  const d = choices[rand(0, choices.length-1)] * (Math.random()<0.3?-1:1);
  const start = parseFloat((rand(0,4) + rand(0,9)*0.1).toFixed(1));
  const count = rand(5, 7);
  const terms = Array.from({length: count}, (_, i) => parseFloat((start + i*d).toFixed(4)));
  return {
    terms: terms.slice(0,-1).map(v=>fmtDec(v,5)),
    answer: fmtDec(terms[terms.length-1], 5),
    typeName: 'Decimal Arithmetic',
    explanation: `Each term changes by a constant <strong>${d > 0 ? '+' : ''}${d}</strong>.`
  };
}

// H3: Geometric sequence with ratio between 0 and 1 (shown as decimals)
function genGeomDecimal() {
  // Use ratio 1/2, 1/3, 2/3, or 3/4 for clean decimals
  const ratios = [[1,2],[1,3],[2,3],[3,4],[1,4]];
  const [rn, rd] = ratios[rand(0, ratios.length-1)];
  const start = rand(2, 8) * rd; // make sure first term divides cleanly
  const count = rand(5, 7);
  const terms = [];
  let cur = start;
  for (let i = 0; i < count; i++) {
    terms.push(parseFloat(cur.toPrecision(6)));
    cur = cur * rn / rd;
    if (cur < 0.001) break;
  }
  if (terms.length < 5) return genDecimalArithmetic();
  const fmt = v => fmtDec(v, 5);
  return {
    terms: terms.slice(0,-1).map(fmt), answer: fmt(terms[terms.length-1]),
    typeName: 'Geometric (Decimal)',
    explanation: `Each term is multiplied by <strong>${rn}/${rd}</strong> = ${(rn/rd).toFixed(4).replace(/0+$/,'')}.`
  };
}
