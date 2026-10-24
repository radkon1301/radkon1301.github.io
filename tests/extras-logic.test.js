// Run: node --test tests/extras-logic.test.js  (no dependencies). Property tests over thousands of seeded cases.
const test = require('node:test'), assert = require('node:assert/strict');
const L = require('../js/extras/logic.js');
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

test('n-back: exact target count, targets are exactly the n-back repeats, warm-up never targets', () => {
  for (let seed = 1; seed <= 2000; seed++) {
    const rng = mulberry32(seed), n = 1 + (seed % 3), len = 20 + (seed % 25), targets = seed % (len - n + 1) % 14;
    const { seq, isTarget } = L.genNBack(len, n, targets, rng);
    assert.equal(seq.length, len); assert.equal(isTarget.filter(Boolean).length, targets);
    for (let i = 0; i < len; i++) {
      assert.ok(L.NB_LETTERS.includes(seq[i]));
      if (i < n) assert.equal(isTarget[i], false);
      else assert.equal(isTarget[i], seq[i] === seq[i - n], `seed ${seed} i=${i}: flag must match the actual n-back repeat`);
    }
  }
});
test('n-back: rejects impossible parameters', () => {
  for (const [len, n, t] of [[5, 5, 0], [5, 0, 1], [10, 2, 9], [10, 2, -1], [3, 4, 0]]) assert.throws(() => L.genNBack(len, n, t), RangeError);
});
test('n-back scoring: perfect / silent / spammer, warm-up presses ignored', () => {
  const { seq, isTarget } = L.genNBack(40, 2, 12, mulberry32(7));
  assert.equal(L.scoreNBack(isTarget, isTarget.map(Boolean), 2).balanced, 100);
  assert.equal(L.scoreNBack(isTarget, new Array(40).fill(false), 2).balanced, 50, 'never pressing = chance');
  assert.equal(L.scoreNBack(isTarget, new Array(40).fill(true), 2).balanced, 50, 'always pressing = chance');
  const press = isTarget.map(Boolean); press[0] = press[1] = true;
  assert.equal(L.scoreNBack(isTarget, press, 2).balanced, 100, 'presses during the first n trials are not scored');
  const s = L.scoreNBack(isTarget, isTarget.map((t, i) => (i === isTarget.indexOf(true) ? false : t)), 2);   // miss exactly one target
  assert.equal(s.misses, 1); assert.equal(s.hits, 11); assert.equal(s.balanced, Math.round(((11 / 12 + 1) / 2) * 1000) / 10);
  assert.equal(s.targets + s.nonTargets, 38);
});
test('stroop: half congruent, incongruent never matches, all four colours used', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const t = L.genStroop(40, mulberry32(seed));
    assert.equal(t.length, 40); assert.equal(t.filter(x => x.congruent).length, 20);
    for (const x of t) { assert.equal(x.congruent, x.word === x.ink); assert.ok(x.word >= 0 && x.word < 4 && x.ink >= 0 && x.ink < 4); }
  }
  const words = new Set(L.genStroop(40, mulberry32(1)).map(x => x.word)); assert.equal(words.size, 4);
});
test('stroop colours are distinct and each has a unique key', () => {
  assert.equal(new Set(L.STROOP_COLORS.map(c => c.ink)).size, 4); assert.equal(new Set(L.STROOP_COLORS.map(c => c.key)).size, 4);
});
test('stroop scoring: penalty for wrong/timeout, interference only from correct trials', () => {
  const trials = [{ congruent: true }, { congruent: false }, { congruent: true }, { congruent: false }];
  const r = [{ rt: 500, correct: true }, { rt: 800, correct: true }, { rt: 600, correct: true }, { rt: 900, correct: false }];
  const s = L.scoreStroop(trials, r, 2000);
  assert.equal(s.avg, (500 + 800 + 600 + 2000) / 4); assert.equal(s.accuracy, 75); assert.equal(s.correct, 3);
  assert.equal(s.interference, 800 - 550);
  assert.equal(L.scoreStroop(trials, r.map(x => ({ ...x, correct: false })), 2000).interference, null);
  assert.equal(L.scoreStroop([{ congruent: true }], [{ rt: 9999, correct: true }], 2000).avg, 2000, 'a slow correct answer is capped at the penalty');
});
test('expected value: every generated answer equals brute-force enumeration (6 templates × 3000 seeds)', () => {
  for (let t = 0; t < L.EV_TEMPLATES; t++) for (let seed = 1; seed <= 3000; seed++) {
    const q = L.genEV(mulberry32(seed * 31 + t), t);
    assert.ok(Math.abs(q.brute() - q.answer) < 1e-9, `template ${t} seed ${seed}: ${q.text} formula=${q.answer} brute=${q.brute()}`);
  }
});
test('expected value: well-formed options (4 unique, exactly 1 correct, sane text, explanation states the answer)', () => {
  for (let t = 0; t < L.EV_TEMPLATES; t++) for (let seed = 1; seed <= 3000; seed++) {
    const q = L.genEV(mulberry32(seed * 17 + t), t), texts = q.options.map(o => o.text);
    assert.equal(q.options.length, 4); assert.equal(new Set(texts).size, 4, `duplicate options: ${texts} for ${q.text}`);
    assert.equal(q.options.filter(o => o.correct).length, 1); assert.equal(q.options[q.correctIndex].correct, true);
    const correctText = q.fmt === 'money' ? L.money(q.answer) : L.plain(q.answer);
    assert.equal(q.options[q.correctIndex].text, correctText);
    for (const s of [...texts, q.text, q.explain]) assert.ok(!/NaN|undefined|Infinity|-0\b|\$-/.test(s), 'bad text: ' + s);
    assert.ok(q.explain.includes(correctText), `explanation should state ${correctText}: ${q.explain}`);
    assert.ok(Number.isFinite(q.answer) && Math.abs(q.answer * 100 - Math.round(q.answer * 100)) < 1e-6, 'answers have at most 2 decimals');
  }
});
test('expected value: a 12-question set uses each template exactly twice, and answers are not always option A', () => {
  const pos = [0, 0, 0, 0];
  for (let seed = 1; seed <= 400; seed++) {
    const set = L.genEVSet(12, mulberry32(seed)); assert.equal(set.length, 12);
    for (const q of set) pos[q.correctIndex]++;
  }
  const total = pos.reduce((a, b) => a + b); for (const p of pos) assert.ok(Math.abs(p / total - 0.25) < 0.03, 'correct answer position is uniform: ' + pos);
  const counts = {}; L.genEVSet(12, mulberry32(3)).forEach(q => { counts[q.text.slice(0, 18)] = (counts[q.text.slice(0, 18)] || 0) + 1; });
  assert.ok(Object.keys(counts).length >= 6);
});
