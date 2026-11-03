// Run: node --test tests/common.test.js   (no dependencies)
// Unit tests for js/common.js: score store, run history, drift-free countdown. DOM-free (uses a fake localStorage / timers).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'common.js'), 'utf8');

function load() {
  const store = {};
  const timers = []; let nextId = 1;
  const ctx = {
    Math, Date, JSON, Array, Object, String, Number, isFinite, console,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    setInterval: (fn, ms) => { const id = nextId++; timers.push({ id, fn, ms }); return id; },
    clearInterval: id => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    setTimeout: () => 0, performance: { now: () => 0 },
    window: {}, document: { addEventListener() {}, removeEventListener() {} },
  };
  vm.createContext(ctx); vm.runInContext(src + '\n;globalThis.api={createScoreStore,readScoreHistory,createCountdown,shuffle,get last(){return _lastSave}};', ctx);
  return { api: ctx.api, store, timers };
}

test('best score: higher-is-better by default, ties are not "better"', () => {
  const { api } = load(); const s = api.createScoreStore('k');
  assert.equal(s.save('a', 5, '5'), true);       // first score is a best
  assert.equal(s.save('a', 5, '5'), false);      // tie
  assert.equal(s.save('a', 4, '4'), false);
  assert.equal(s.save('a', 9, '9'), true);
  assert.equal(s.label('a'), '9');
});

test('lowerBetter ids invert the comparison', () => {
  const { api } = load(); const s = api.createScoreStore('k', { lowerBetter: new Set(['t']) });
  s.save('t', 1.0, '1.0s'); assert.equal(s.save('t', 0.8, '0.8s'), true); assert.equal(s.save('t', 0.9, '0.9s'), false);
  assert.equal(s.label('t'), '0.8s');
});

test('every run is appended to history, including non-best runs, with timestamps', () => {
  const { api, store } = load(); const s = api.createScoreStore('k');
  s.save('a', 3, 'three'); s.save('a', 1, 'one'); s.save('b', 7, 'seven');
  const h = api.readScoreHistory('k');
  assert.deepEqual(h.map(e => [e.id, e.v, e.label]), [['a', 3, 'three'], ['a', 1, 'one'], ['b', 7, 'seven']]);
  assert.ok(h.every(e => typeof e.t === 'number' && e.t > 1.6e12));
  assert.deepEqual(Object.keys(JSON.parse(store.k)), ['a', 'b'], 'best-score key keeps its original shape');
  assert.ok(!('hist' in JSON.parse(store.k)));
});

test('history is capped per game (oldest dropped) without touching other games', () => {
  const { api } = load(); const s = api.createScoreStore('k');
  s.save('other', 1, 'o');
  for (let i = 0; i < 130; i++) s.save('a', i, 'r' + i);
  const h = api.readScoreHistory('k'), a = h.filter(e => e.id === 'a');
  assert.equal(a.length, 100); assert.equal(a[0].v, 30); assert.equal(a[99].v, 129);
  assert.equal(h.filter(e => e.id === 'other').length, 1);
});

test('malformed history is ignored, never thrown on', () => {
  const { api, store } = load();
  store.k_hist = '{not json'; assert.equal(api.readScoreHistory('k').length, 0);
  store.k_hist = JSON.stringify([{ id: 'a', v: 1, label: 'x', t: 5 }, null, { id: 'a', v: 'NaN', label: 'x', t: 1 }, { id: 1 }, 'str', { id: 'b', v: Infinity, label: 'x', t: 1 }]);
  assert.equal(api.readScoreHistory('k').length, 1);
  store.k_hist = '{"a":1}'; assert.equal(api.readScoreHistory('k').length, 0);
  const s = api.createScoreStore('k'); assert.doesNotThrow(() => s.save('a', 2, '2'));
});

test('save() records what the result badge needs', () => {
  const { api } = load(); const s = api.createScoreStore('k');
  s.save('a', 5, '5 pts'); let r = api.last;
  assert.equal(r.better, true); assert.equal(r.prevBestLabel, null); assert.equal(r.prevRunLabel, null);
  s.save('a', 3, '3 pts'); r = api.last;
  assert.equal(r.better, false); assert.equal(r.bestLabel, '5 pts'); assert.equal(r.prevRunLabel, '5 pts');
  s.save('a', 8, '8 pts'); r = api.last;
  assert.equal(r.better, true); assert.equal(r.prevBestLabel, '5 pts'); assert.equal(r.prevRunLabel, '3 pts');
});

test('onSave fires on every save with the new-best flag', () => {
  const { api } = load(); const calls = [];
  const s = api.createScoreStore('k', { onSave: (...a) => calls.push(a) });
  s.save('a', 2, '2'); s.save('a', 1, '1');
  assert.deepEqual(calls, [['a', 2, '2', true], ['a', 1, '1', false]]);
});

test('countdown: derived from the clock; a single late tick catches up fully', () => {
  const { api, timers } = load(); let t = 0, ticks = [], done = 0;
  api.createCountdown(10, { now: () => t, onTick: s => ticks.push(s), onDone: () => done++ });
  assert.equal(timers.length, 1);
  t = 1000; timers[0].fn(); assert.deepEqual(ticks, [9]);
  t = 1200; timers[0].fn(); assert.deepEqual(ticks, [9], 'no tick inside the same second');
  t = 6500; timers[0].fn(); assert.deepEqual(ticks, [9, 4], 'jumps straight to the true remaining time after a throttled gap');
  t = 600000; timers[0].fn(); assert.equal(done, 1); assert.equal(ticks.at(-1), 0);
  assert.equal(timers.length, 0, 'interval cleared once finished');
});

test('countdown: onDone fires once; stop() and alive()=false both cancel it', () => {
  const { api, timers } = load(); let t = 0, done = 0, alive = true;
  const c = api.createCountdown(2, { now: () => t, onDone: () => done++, alive: () => alive });
  t = 5000; timers[0] && timers[0].fn(); assert.equal(done, 1); assert.equal(timers.length, 0);
  const c2 = api.createCountdown(5, { now: () => t, onDone: () => done++ }); c2.stop(); assert.equal(timers.length, 0);
  const c3 = api.createCountdown(5, { now: () => t, onDone: () => done++, alive: () => alive }); alive = false;
  t = 99999; timers[0].fn(); assert.equal(done, 1, 'abandoned game must never fire onDone'); assert.equal(timers.length, 0);
});

test('shuffle is a permutation and not biased towards the identity (chi-square on 3 items)', () => {
  const { api } = load(); const counts = {};
  for (let i = 0; i < 30000; i++) { const k = api.shuffle([0, 1, 2]).join(''); counts[k] = (counts[k] || 0) + 1; }
  assert.equal(Object.keys(counts).length, 6);
  const exp = 5000, chi = Object.values(counts).reduce((a, c) => a + (c - exp) ** 2 / exp, 0);
  assert.ok(chi < 20.5, 'chi-square ' + chi.toFixed(1));       // df=5, p=0.001
});
