// js/sequences/questions.js — SEQUENCE_GENERATORS master list, generateQuestion(), makeDistractors().
// Docs: docs/sequences.md

// ── MASTER LIST ──
const SEQUENCE_GENERATORS = [
  // A: Arithmetic & Differences
  genArithmetic, genArithmetic, // weighted — most fundamental type
  genConstantSecondDiff,        // covers triangles, oblongs, pentagonals, squares, general quadratic
  genAcceleratingDiff, genGeomDiff, genAltSignGeomDiff,
  genFibDiffs, genCyclicDiff, genConvergingDiff,
  genAddIndex, genAltTwoDiffs,
  // B: Geometric & Multiplicative
  genGeometric, genLinearRecurrence,
  genAltMultAdd, genAltMultSub, genAlternatingAddSub,
  genPowers, genFactorials, genGrowingRatio,
  // C: Prime-based
  genPrimesSequence, genAddPrimes, genEveryOtherPrime, genPrimesSecondDiff,
  // D: Recursive / Multi-term
  genFibonacciType, genDiffOfTwo, genTribonacci, genRollingAverage, genTwoTermRecurrence,
  // E: Interleaved / Positional
  genInterleavedArithmetic, genInterleavedGeometric, genInterleavedArithGeom,
  // F: Digit-based
  genDigitSum, genDigitProduct, genDigitRotation,
  // G: Fraction sequences
  genFracBothArith, genFracAltDenom, genFracChain,
  genFracFibNum, genFracArithGeom, genFracBothGeom,
  genFracTelescoping,
  // H: Decimal sequences
  genDecimalFracs, genDecimalArithmetic, genGeomDecimal,
  genReciprocalSquares,
  // I: Mixed / Creative
  genCompoundRecurrence, genGeomPlusPoly, genProductArith,
  genPyramidDiff, genMultiDiff, genCumSumPrimes,
  genPartialSumGeom
];

// ── safe generator with retry ──
function generateQuestion(maxTries = 30) {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    try {
      const genFn = SEQUENCE_GENERATORS[rand(0, SEQUENCE_GENERATORS.length - 1)];
      const q = genFn();
      // Sanity checks
      if (!q || !q.terms || q.terms.length < 4) continue;
      if (q.answer === undefined || q.answer === null) continue;
      const ansStr = String(q.answer);
      // Keep numbers reasonable
      const numeric = parseFloat(ansStr.replace('/', '.').replace(/[^0-9.\-]/g,''));
      if (!isFinite(numeric) || Math.abs(numeric) > 99999) continue;
      // Make sure all terms are finite / valid-looking
      const valid = q.terms.every(t => {
        const s = String(t);
        if (s.includes('/')) {
          const [n,d] = s.split('/').map(Number);
          return isFinite(n) && isFinite(d) && d !== 0 && Math.abs(n) < 9999 && Math.abs(d) < 9999;
        }
        const v = Number(s);
        return isFinite(v) && Math.abs(v) < 99999;
      });
      if (!valid) continue;
      return q;
    } catch(e) { /* retry */ }
  }
  // fallback: plain arithmetic
  return genArithmetic();
}

// ── distractor generation ──
function makeDistractors(answerStr, terms) {
  const isFrac = answerStr.includes('/');
  // Detect decimal: has a dot, is not a fraction, and is not a plain integer
  const isDecimal = !isFrac && answerStr.includes('.');
  const distractors = new Set();
  distractors.add(answerStr);

  if (isFrac) {
    const [n, d] = answerStr.split('/').map(Number);
    const deltas = [-3,-2,-1,1,2,3,4,5,-4,-5,6,7,-6,-7];
    for (const dn of deltas) {
      for (const dd of [-2,-1,0,1,2]) {
        if (distractors.size >= 5) break;
        const nn = n + dn, nd = d + dd;
        if (nd > 0 && nn > 0) {
          const s = fmtFrac(nn, nd);
          if (s !== answerStr) distractors.add(s);
        }
      }
      if (distractors.size >= 5) break;
    }
    let extra = 1;
    while (distractors.size < 5) { distractors.add(fmtFrac(n + extra*3, d + extra)); extra++; }

  } else if (isDecimal) {
    const ans = Number(answerStr);
    // Work out decimal places to use
    const dp = (answerStr.split('.')[1] || '').length;
    const step = Math.pow(10, -dp);
    const bigStep = step * 5;
    const deltas = [step, -step, bigStep, -bigStep, step*2, -step*2, step*3, -step*3,
                    step*10, -step*10, step*15, -step*15, step*20, -step*20];
    // shuffle
    for (let i = deltas.length-1; i>0; i--) {
      const j = rand(0,i); [deltas[i],deltas[j]] = [deltas[j],deltas[i]];
    }
    for (const d of deltas) {
      if (distractors.size >= 5) break;
      const v = parseFloat((ans + d).toFixed(dp + 1));
      if (!isFinite(v)) continue;
      const s = fmtDec(v, 6);
      if (s !== answerStr && !distractors.has(s)) distractors.add(s);
    }
    let extra = 1;
    while (distractors.size < 5) {
      const v = parseFloat((ans + extra * step * 7).toFixed(dp+1));
      distractors.add(fmtDec(v, 6)); extra++;
    }

  } else {
    const ans = Number(answerStr);
    // Generate plausible nearby integers
    // Scale deltas to the magnitude of the answer for large numbers
    const scale = Math.max(1, Math.round(Math.abs(ans) * 0.05));
    const deltas = [];
    for (let i = 1; deltas.length < 30; i++) {
      deltas.push(i, -i, i*scale, -i*scale, i*2, -i*2);
    }
    for (let i = deltas.length-1; i>0; i--) {
      const j = rand(0,i); [deltas[i],deltas[j]] = [deltas[j],deltas[i]];
    }
    for (const d of deltas) {
      if (distractors.size >= 5) break;
      const v = ans + d;
      if (!Number.isInteger(v)) continue;
      const s = String(v);
      if (s !== answerStr && !distractors.has(s)) distractors.add(s);
    }
    let extra = 1;
    while (distractors.size < 5) { distractors.add(String(ans + extra * (scale||7))); extra++; }
  }

  const arr = Array.from(distractors);
  for (let i = arr.length-1; i>0; i--) {
    const j = rand(0,i); [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
