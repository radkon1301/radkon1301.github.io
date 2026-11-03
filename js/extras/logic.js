// js/extras/logic.js — pure game logic for the Extras suite (no DOM). Unit-tested in tests/extras-logic.test.js.
// Every generator takes an optional rng() returning [0,1) so tests can seed it.
const ExtrasLogic = (function () {
  const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));            // inclusive int
  const pick = (rng, arr) => arr[ri(rng, 0, arr.length - 1)];
  function shuffled(rng, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(rng, 0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const r2 = x => Math.round(x * 100) / 100;

  // ───────────────────────── N-Back ─────────────────────────
  const NB_LETTERS = ['B', 'C', 'D', 'F', 'G', 'H', 'K', 'L'];               // consonants only: no words, no vowels to chunk
  // genNBack(len, n, targets) -> { seq:[letters], isTarget:[bool] }. A target is a letter equal to the one n trials earlier.
  // Non-target letters are guaranteed to DIFFER from the one n back, so the number of targets is exactly what was asked for.
  function genNBack(len, n, targets, rng) {
    rng = rng || Math.random;
    if (!(n >= 1) || len <= n || targets < 0 || targets > len - n) throw new RangeError('bad n-back parameters');
    const slots = []; for (let i = n; i < len; i++) slots.push(i);
    const isTarget = new Array(len).fill(false);
    shuffled(rng, slots).slice(0, targets).forEach(i => { isTarget[i] = true; });
    const seq = [];
    for (let i = 0; i < len; i++) {
      if (i >= n && isTarget[i]) seq.push(seq[i - n]);
      else { const avoid = i >= n ? seq[i - n] : null; seq.push(pick(rng, NB_LETTERS.filter(l => l !== avoid))); }
    }
    return { seq, isTarget };
  }
  // scoreNBack(isTarget, pressed, n): only trials from index n on are scored (the first n cannot be matches).
  // Balanced accuracy = mean of hit rate and correct-rejection rate, so spamming the key or never pressing both score 50%.
  function scoreNBack(isTarget, pressed, n) {
    let hits = 0, misses = 0, fa = 0, cr = 0;
    for (let i = n; i < isTarget.length; i++) {
      if (isTarget[i]) { if (pressed[i]) hits++; else misses++; } else { if (pressed[i]) fa++; else cr++; }
    }
    const targets = hits + misses, non = fa + cr;
    const hitRate = targets ? hits / targets : 0, crRate = non ? cr / non : 0;
    return { hits, misses, fa, cr, targets, nonTargets: non, balanced: Math.round(((hitRate + crRate) / 2) * 1000) / 10 };   // one decimal, 0..100
  }

  // ───────────────────────── Stroop ─────────────────────────
  // Okabe–Ito colours: chosen to stay distinguishable under the common forms of colour-blindness. Drawn on a fixed dark stage.
  const STROOP_COLORS = [
    { name: 'RED', ink: '#E8703A', key: 'r' }, { name: 'GREEN', ink: '#2FBF8F', key: 'g' },
    { name: 'BLUE', ink: '#56B4E9', key: 'b' }, { name: 'YELLOW', ink: '#F0E442', key: 'y' },
  ];
  // genStroop(total) -> [{word:i, ink:i, congruent:bool}]. Exactly half congruent (word === ink), shuffled.
  function genStroop(total, rng) {
    rng = rng || Math.random;
    const out = [];
    for (let i = 0; i < total; i++) {
      const word = ri(rng, 0, 3), congruent = i % 2 === 0;
      let ink = word; if (!congruent) { do { ink = ri(rng, 0, 3); } while (ink === word); }
      out.push({ word, ink, congruent });
    }
    return shuffled(rng, out);
  }
  // scoreStroop(trials, results, penaltyMs): results[i] = {rt, correct}. A wrong answer or a timeout counts as penaltyMs.
  // interference = mean correct RT on incongruent trials minus on congruent trials (null if either set is empty).
  function scoreStroop(trials, results, penaltyMs) {
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const times = results.map(r => (r.correct ? Math.min(r.rt, penaltyMs) : penaltyMs));
    const correct = results.filter(r => r.correct).length;
    const cong = [], inc = [];
    results.forEach((r, i) => { if (r.correct) (trials[i].congruent ? cong : inc).push(r.rt); });
    return { avg: mean(times), accuracy: Math.round((correct / results.length) * 100), correct, interference: cong.length && inc.length ? mean(inc) - mean(cong) : null };
  }

  // ───────────────────────── Expected value ─────────────────────────
  const money = v => (v < 0 ? '-$' : '$') + (Number.isInteger(Math.abs(v)) ? String(Math.abs(v)) : Math.abs(v).toFixed(2));
  const plain = v => String(Number(v.toFixed(2)));
  // Each template returns { text, answer, fmt, explain, wrong:[plausible mistakes], brute() }. brute() recomputes the answer by
  // brute-force enumeration instead of by formula; the tests require brute() === answer for every generated question.
  const TEMPLATES = [
    function dieThreshold(rng) {
      const N = pick(rng, [6, 12, 18, 24, 30, 36, 60]), k = pick(rng, [2, 3]), faces = k === 2 ? '5 or 6' : '4, 5 or 6';
      return { fmt: 'money', answer: N * k / 6,
        text: `A fair six-sided die is rolled. You win $${N} if it shows ${faces}, and nothing otherwise. What is the expected payoff?`,
        explain: `P(win) = ${k}/6, so E = ${k}/6 × $${N} = ${money(N * k / 6)}.`,
        wrong: [N / 6, N / 2, N * (6 - k) / 6, N * k / 3, N],
        brute() { let s = 0; for (let f = 1; f <= 6; f++) if (f >= 7 - k) s += N; return s / 6; } };
    },
    function coinHeads(rng) {
      const f = pick(rng, [3, 4, 5]), x = pick(rng, [2, 4, 5, 10]);
      return { fmt: 'money', answer: f * x / 2,
        text: `A fair coin is flipped ${f} times. You win $${x} for every head. What is the expected total payoff?`,
        explain: `Expected heads = ${f}/2, so E = ${f / 2} × $${x} = ${money(f * x / 2)}.`,
        wrong: [f * x, x / 2, (f - 1) * x / 2, f * x / 4, (f + 1) * x / 2],
        brute() { let s = 0; for (let m = 0; m < 2 ** f; m++) { let h = 0; for (let b = 0; b < f; b++) h += (m >> b) & 1; s += h * x; } return s / 2 ** f; } };
    },
    function betProfit(rng) {
      const c = pick(rng, [5, 10, 20]), p = pick(rng, [10, 20, 25, 40, 50]), W = pick(rng, [20, 40, 50, 80, 100, 200]);
      const ans = r2(p * W / 100 - c);
      return { fmt: 'money', answer: ans,
        text: `You pay $${c} to play a game. With probability ${p}% you win $${W}; otherwise you win nothing. What is your expected profit per play?`,
        explain: `E[win] = ${p}% × $${W} = ${money(p * W / 100)}; minus the $${c} stake gives ${money(ans)}.`,
        wrong: [p * W / 100, c - p * W / 100, (100 - p) * W / 100 - c, W - c, p * W / 100 + c],
        brute() { return r2(((p / 100) * (W - c)) + ((1 - p / 100) * (-c))); } };
    },
    function diceSum(rng) {
      const n = pick(rng, [2, 3, 4, 5]);
      return { fmt: 'num', answer: 3.5 * n,
        text: `${n} fair six-sided dice are rolled. What is the expected value of their sum?`,
        explain: `Each die averages 3.5, and expectations add: ${n} × 3.5 = ${plain(3.5 * n)}.`,
        wrong: [3 * n, 4 * n, 3.5 * (n - 1), 3.5 * (n + 1), 7 * n],
        brute() { let total = 0, count = 0; const rec = (d, s) => { if (d === n) { total += s; count++; return; } for (let f = 1; f <= 6; f++) rec(d + 1, s + f); }; rec(0, 0); return total / count; } };
    },
    function bagDraw(rng) {
      const total = pick(rng, [4, 5, 10]), a = ri(rng, 1, total - 1), b = total - a;
      let x = pick(rng, [0, 5, 10, 20, 50]), y = pick(rng, [0, 5, 10, 20, 50]); if (x === y) y = x + 10;
      const ans = r2((a * x + b * y) / total);
      return { fmt: 'money', answer: ans,
        text: `A bag holds ${a} red and ${b} blue ball${b === 1 ? '' : 's'}. You draw one at random: red pays $${x}, blue pays $${y}. What is the expected payoff?`,
        explain: `E = (${a}/${total}) × $${x} + (${b}/${total}) × $${y} = ${money(ans)}.`,
        wrong: [(x + y) / 2, a * x / total, b * y / total, x, y, (a * x + b * y) / 2],
        brute() { const balls = [...Array(a).fill(x), ...Array(b).fill(y)]; return r2(balls.reduce((s, v) => s + v, 0) / balls.length); } };
    },
    function waitingTime(rng) {
      const p = pick(rng, [10, 20, 25, 50]);
      return { fmt: 'num', answer: 100 / p,
        text: `Each attempt independently succeeds with probability ${p}%. What is the expected number of attempts up to and including the first success?`,
        explain: `The expected waiting time is 1/p = 100/${p} = ${plain(100 / p)} attempts.`,
        wrong: [100 / p + 1, 100 / p - 1, 100 / p * 2, p, 100 / (100 - p), 100 / p / 2],
        brute() { let e = 0, q = p / 100; for (let k = 1; k <= 5000; k++) e += k * q * Math.pow(1 - q, k - 1); return e; } };
    },
  ];
  function buildOptions(q, rng) {
    const f = q.fmt === 'money' ? money : plain, correct = f(q.answer);
    const seen = new Set([correct]), opts = [];
    for (const w of shuffled(rng, q.wrong)) { if (opts.length === 3) break; const s = f(w); if (!seen.has(s) && w >= -1e9) { seen.add(s); opts.push({ text: s, value: w }); } }
    for (let step = 1; opts.length < 3; step++) {                          // pad (rare): nearby values
      for (const w of [q.answer + step, q.answer - step, q.answer * (1 + step)]) { const s = f(w); if (opts.length < 3 && !seen.has(s)) { seen.add(s); opts.push({ text: s, value: w }); } }
    }
    const all = shuffled(rng, [{ text: correct, value: q.answer, correct: true }, ...opts]);
    return all;
  }
  function genEV(rng, templateIndex) {
    rng = rng || Math.random;
    const q = TEMPLATES[templateIndex != null ? templateIndex : ri(rng, 0, TEMPLATES.length - 1)](rng);
    q.options = buildOptions(q, rng); q.correctIndex = q.options.findIndex(o => o.correct);
    return q;
  }
  // genEVSet(count): every template appears (count / 6) times, shuffled, so a set has variety.
  function genEVSet(count, rng) {
    rng = rng || Math.random;
    const order = []; for (let i = 0; i < count; i++) order.push(i % TEMPLATES.length);
    return shuffled(rng, order).map(t => genEV(rng, t));
  }

  return { genNBack, scoreNBack, NB_LETTERS, STROOP_COLORS, genStroop, scoreStroop, genEV, genEVSet, EV_TEMPLATES: TEMPLATES.length, money, plain };
})();
if (typeof module !== 'undefined') module.exports = ExtrasLogic;
