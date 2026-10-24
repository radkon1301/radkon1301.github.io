// Run: node --test tests/progress-stats.test.js
const test = require('node:test'), assert = require('node:assert/strict');
const P = require('../js/progress-stats.js'), { ME_CATALOG } = require('../js/catalog.js');
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();       // local time

test('streaks: consecutive days, gaps, multiple runs per day', () => {
  const t = [at(2026, 10, 18), at(2026, 10, 19), at(2026, 10, 19, 20), at(2026, 10, 20), at(2026, 10, 24)];
  assert.deepEqual(P.streaks(t, at(2026, 10, 24)), { days: 4, current: 1, longest: 3 });
  assert.deepEqual(P.streaks(t, at(2026, 10, 25)), { days: 4, current: 1, longest: 3 }, 'yesterday still counts');
  assert.equal(P.streaks(t, at(2026, 10, 26)).current, 0, 'two days ago: streak is over');
  assert.deepEqual(P.streaks([], at(2026, 10, 24)), { days: 0, current: 0, longest: 0 });
});
test('streaks: across month and year ends and DST changes', () => {
  assert.equal(P.streaks([at(2026, 12, 30), at(2026, 12, 31), at(2027, 1, 1), at(2027, 1, 2)], at(2027, 1, 2)).current, 4);
  assert.equal(P.streaks([at(2026, 3, 28), at(2026, 3, 29), at(2026, 3, 30)], at(2026, 3, 30)).current, 3);   // EU spring-forward weekend
  assert.equal(P.streaks([at(2026, 10, 24), at(2026, 10, 25), at(2026, 10, 26)], at(2026, 10, 26)).longest, 3); // EU fall-back weekend
  assert.equal(P.streaks([at(2026, 2, 28), at(2026, 3, 1)], at(2026, 3, 1)).current, 2);
});
test('trend: direction depends on whether lower is better', () => {
  const falling = [10, 9, 8, 7, 6, 5];
  assert.equal(P.trend(falling, true), 'improving'); assert.equal(P.trend(falling, false), 'slipping');
  assert.equal(P.trend([1, 2, 3, 4, 5, 6], false), 'improving');
  assert.equal(P.trend([5, 5, 5, 5, 5], false), 'steady');
  assert.equal(P.trend([5, 6, 5, 6, 5, 6], false), 'steady', 'noise around a constant is steady');
  assert.equal(P.trend([1, 2, 3], false), 'new', 'fewer than 4 runs');
  assert.equal(P.trend([9, 1, 9, 1], false), 'steady');
});
test('sparkPoints: improvement always plots upward; bounds respected; single / flat series safe', () => {
  const up = P.sparkPoints([1, 2, 3], 100, 40, false), down = P.sparkPoints([1, 2, 3], 100, 40, true);
  assert.ok(up[2][1] < up[0][1], 'higher-is-better: last (best) point is higher on screen (smaller y)');
  assert.ok(down[0][1] < down[2][1], 'lower-is-better: smallest value is highest on screen');
  for (const [x, y] of [...up, ...down]) assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 40);
  assert.deepEqual(P.sparkPoints([7], 100, 40, false).map(p => p[0]), [50]);
  assert.ok(P.sparkPoints([3, 3, 3], 100, 40, false).every(p => p[1] === 20));
});
test('summarise: best respects direction, latest is the last entry', () => {
  const e = [{ v: 0.6, label: 'a' }, { v: 0.4, label: 'b' }, { v: 0.5, label: 'c' }];
  assert.equal(P.summarise(e, true).best.label, 'b'); assert.equal(P.summarise(e, false).best.label, 'a');
  assert.equal(P.summarise(e, true).latest.label, 'c'); assert.equal(P.summarise([], true).best, null);
});

const store = { me_scores: JSON.stringify({ shapeshift: { v: .5, label: '0.500s' } }), me_scores_hist: JSON.stringify([{ id: 'shapeshift', v: .5, label: '0.500s', t: 1 }]), other_site_key: 'secret' };
const get = k => store[k] ?? null;
test('export -> import round-trips and never includes unrelated keys', () => {
  const x = P.buildExport(get, ME_CATALOG, 1.7e12);
  assert.equal(x.format, P.FORMAT); assert.deepEqual(Object.keys(x.data).sort(), ['me_scores', 'me_scores_hist']);
  assert.ok(!JSON.stringify(x).includes('secret'));
  const r = P.parseImport(JSON.stringify(x), ME_CATALOG); assert.ok(r.ok); assert.deepEqual(r.data.me_scores, JSON.parse(store.me_scores));
});
test('export copes with corrupt stored values', () => {
  const x = P.buildExport(k => k === 'me_scores' ? '{broken' : null, ME_CATALOG, 1.7e12); assert.deepEqual(x.data, {});
});
test('import rejects bad input with a message, and ignores keys it does not own', () => {
  const bad = (o, re) => { const r = P.parseImport(typeof o === 'string' ? o : JSON.stringify(o), ME_CATALOG); assert.equal(r.ok, false); assert.match(r.error, re); };
  bad('nope', /not valid JSON/); bad({ hello: 1 }, /not a Mental Edge/); bad({ format: P.FORMAT, version: 99, data: {} }, /version/);
  bad({ format: P.FORMAT, version: 1 }, /no data/); bad({ format: P.FORMAT, version: 1, data: {} }, /no progress data/);
  bad({ format: P.FORMAT, version: 1, data: { me_scores: { a: { v: 'x', label: 'y' } } } }, /malformed/);
  bad({ format: P.FORMAT, version: 1, data: { me_scores_hist: [{ id: 'a', v: 1, label: 'x' }] } }, /malformed/);
  bad({ format: P.FORMAT, version: 1, data: { me_scores_hist: 'str' } }, /malformed/);
  bad({ format: P.FORMAT, version: 1, data: { me_scores: { a: { v: 1, label: 'x'.repeat(500) } } } }, /malformed/);
  const ok = P.parseImport(JSON.stringify({ format: P.FORMAT, version: 1, data: { me_scores: { a: { v: 1, label: 'x' } }, evil_key: 'x', me_theme: 'dark', __proto__: { polluted: 1 } } }), ME_CATALOG);
  assert.ok(ok.ok); assert.deepEqual(Object.keys(ok.data), ['me_scores']); assert.equal({}.polluted, undefined);
});
