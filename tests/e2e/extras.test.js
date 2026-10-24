// Extras suite, played end-to-end on a fake clock. The test reads what is on screen (letters, ink colours, questions)
// and answers like a player would: perfectly, badly, or not at all.
const test = require('node:test'), assert = require('node:assert/strict');
const { setup, axe } = require('./lib');
let env; test.before(async () => { env = await setup(); }); test.after(async () => { await env.close(); });

const fresh = async (opts = {}) => { const p = await env.newPage(opts); await p.clock.install({ time: 1.7e12 }); await p.goto(`${env.url}/extras.html`); return p; };
const launch = (p, id) => p.evaluate(i => launchGame(i), id);
const saved = (p) => p.evaluate(() => JSON.parse(localStorage.me_extra_scores || '{}'));
const hist = (p) => p.evaluate(() => JSON.parse(localStorage.me_extra_scores_hist || '[]'));

// ── N-Back ──
async function playNBack(page, policy) {                      // policy: 'perfect' | 'never' | 'always'
  await launch(page, 'nback'); await page.click('text=Begin');
  const letters = [];
  for (let i = 0; i < 40; i++) {
    await page.clock.runFor(100);
    const l = (await page.textContent('#nb-letter')).trim(); letters.push(l);
    assert.match(l, /^[BCDFGHKL]$/, 'a letter is visible at the start of every trial');
    const isMatch = i >= 2 && letters[i] === letters[i - 2];
    if (policy === 'always' || (policy === 'perfect' && isMatch)) await page.keyboard.press('Space');
    await page.clock.runFor(450);
    assert.equal((await page.textContent('#nb-letter')).trim(), '', 'letter disappears after ~500 ms');
    await page.clock.runFor(1950);
  }
  await page.clock.runFor(200);
  return letters;
}
test('N-Back: browser sequence has 12 matches; perfect play = 100%, never = 50%, always = 50%', async () => {
  let page = await fresh();
  const letters = await playNBack(page, 'perfect');
  assert.equal(letters.filter((l, i) => i >= 2 && l === letters[i - 2]).length, 12);
  await page.clock.runFor(900); assert.equal((await page.textContent('.result-num')).trim(), '100%');
  assert.equal(await page.getAttribute('.result-num', 'aria-label'), '100%');
  assert.equal((await saved(page)).nback.v, 100);
  for (const [policy, want] of [['never', '50'], ['always', '50']]) {
    page = await fresh(); await playNBack(page, policy);
    await page.clock.runFor(1000);
    assert.equal((await page.textContent('.result-num')).trim(), want + '%', policy);
    assert.equal(await page.getAttribute('.result-num', 'aria-label'), want + '%');
    assert.deepEqual(page.errors, []);
  }
});
test('N-Back: leaving mid-game stops everything and throws no errors', async () => {
  const page = await fresh(); await launch(page, 'nback'); await page.click('text=Begin'); await page.clock.runFor(3000);
  await page.click('text=← Extras'); await page.clock.runFor(10000);
  assert.equal(await page.locator('#game-screen').isVisible(), false); assert.equal(await page.locator('#dashboard').isVisible(), true);
  await page.clock.runFor(120000); assert.equal((await hist(page)).length, 0, 'an abandoned game must never save a score'); assert.deepEqual(page.errors, []);
});

// ── Stroop ──
const INK = { '#E8703A': 0, '#2FBF8F': 1, '#56B4E9': 2, '#F0E442': 3 }, KEYS = ['r', 'g', 'b', 'y'];
const hex = rgb => '#' + rgb.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
async function playStroop(page, policy, rtMs = 600) {         // 'correct' | 'wrong' | 'silent'
  await launch(page, 'stroop'); await page.click('text=Begin');
  let congruent = 0;
  for (let i = 0; i < 40; i++) {
    await page.clock.runFor(500);                               // fixation, then the word appears
    const word = (await page.textContent('#st-word')).trim(), ink = INK[hex(await page.$eval('#st-word', e => getComputedStyle(e).color))];
    assert.ok(['RED', 'GREEN', 'BLUE', 'YELLOW'].includes(word) && ink !== undefined, `word ${word} ink ${ink}`);
    if (['RED', 'GREEN', 'BLUE', 'YELLOW'].indexOf(word) === ink) congruent++;
    if (policy === 'silent') { await page.clock.runFor(2460); continue; }      // 50 ms after onset + 2460 = just past the 2500 ms response window
    await page.clock.runFor(rtMs);
    await page.keyboard.press(KEYS[policy === 'correct' ? ink : (ink + 1) % 4]);
  }
  await page.clock.runFor(1500);
  return congruent;
}
test('Stroop: 20 of 40 trials congruent; correct play -> 100%, wrong -> 0% (2.000s), silence -> 0% (2.000s)', async () => {
  let page = await fresh(); assert.equal(await playStroop(page, 'correct', 600), 20);
  const s = (await saved(page)).stroop; assert.match(s.label, /^0\.[56]\d\d s?@ 100%$|^0\.[56]\d\ds @ 100%$/); assert.ok(s.v > 590 && s.v < 700, 'avg ≈ 600 ms: ' + s.v);
  assert.match(await page.textContent('.result-sub'), /Accuracy: 100%/);
  for (const policy of ['wrong', 'silent']) {
    page = await fresh(); await playStroop(page, policy);
    assert.equal((await saved(page)).stroop.label, '2.000s @ 0%', policy); assert.deepEqual(page.errors, []);
  }
});
test('Stroop: lower is better — a slower second run does not replace the best, but is in history', async () => {
  const page = await fresh();
  await playStroop(page, 'correct', 400); const best = (await saved(page)).stroop.v;
  await page.click('.again-btn'); await page.click('text=Begin');
  for (let i = 0; i < 40; i++) { await page.clock.runFor(500); const ink = INK[hex(await page.$eval('#st-word', e => getComputedStyle(e).color))]; await page.clock.runFor(1200); await page.keyboard.press(String(ink + 1)); }
  await page.clock.runFor(1500);
  assert.equal((await saved(page)).stroop.v, best); assert.equal((await hist(page)).length, 2);
  assert.match(await page.textContent('[data-result-badge]'), /Personal best/);
});
test('Stroop: the stage is the same dark panel in light and dark themes', async () => {
  const bgs = [];
  for (const dark of [false, true]) { const p = await fresh({ dark }); await launch(p, 'stroop'); await p.click('text=Begin'); bgs.push(await p.$eval('.st-stage', e => getComputedStyle(e).backgroundColor)); }
  assert.equal(bgs[0], bgs[1]);
});

// ── Expected Value: an independent solver for the six templates ──
function solve(t) {
  let m;
  if ((m = t.match(/shows (5 or 6|4, 5 or 6), and nothing otherwise/))) return +t.match(/win \$(\d+)/)[1] * (m[1] === '5 or 6' ? 2 : 3) / 6;
  if ((m = t.match(/flipped (\d) times\. You win \$(\d+) for every head/))) return +m[1] * +m[2] / 2;
  if ((m = t.match(/pay \$(\d+) to play.*probability (\d+)% you win \$(\d+)/))) return +m[2] * +m[3] / 100 - +m[1];
  if ((m = t.match(/^(\d) fair six-sided dice/))) return 3.5 * +m[1];
  if ((m = t.match(/(\d+) red and (\d+) blue.*red pays \$(\d+), blue pays \$(\d+)/))) return (+m[1] * +m[3] + +m[2] * +m[4]) / (+m[1] + +m[2]);
  if ((m = t.match(/succeeds with probability (\d+)%/))) return 100 / +m[1];
  throw new Error('unknown question: ' + t);
}
const parseOpt = s => parseFloat(s.replace(/[^\d.\-]/g, '').replace(/^(-?)\$?/, '$1')) * (s.startsWith('-') ? 1 : 1);
async function playEV(page, mode) {                           // 'solve-click' | 'solve-keys' | 'wrong'
  await launch(page, 'ev'); await page.click('text=Begin');
  const seen = [];
  for (let n = 0; n < 12; n++) {
    const text = (await page.textContent('#ev-text')).trim(), opts = await page.$$eval('.ev-opt', b => b.map(x => x.textContent.replace(/^\s*\d\s*/, '').trim()));
    assert.equal(opts.length, 4); assert.equal(new Set(opts).size, 4); seen.push(text);
    const want = solve(text), right = opts.findIndex(o => Math.abs(parseOpt(o) - want) < 1e-9);
    assert.ok(right >= 0, `no option equals the true answer ${want} for "${text}" in ${opts}`);
    const choose = mode === 'wrong' ? (right + 1) % 4 : right;
    if (mode === 'solve-keys') await page.keyboard.press(String(choose + 1)); else await page.click(`.ev-opt >> nth=${choose}`);
  }
  return seen;
}
test('Expected Value: independent solver picks the displayed correct option every time -> 12/12, perfect', async () => {
  let page = await fresh(); const seen = await playEV(page, 'solve-click');
  assert.equal(new Set(seen.map(t => t.slice(0, 20))).size >= 6, true, 'variety of question types');
  assert.equal(await page.getAttribute('.result-num', 'aria-label'), '12/12', 'final value is exposed immediately');
  await page.clock.runFor(900); assert.equal((await page.textContent('.result-num')).trim(), '12/12'); assert.match(await page.textContent('.result-card'), /Perfect score/);
  assert.equal((await saved(page)).ev.label, '12/12');
  page = await fresh(); await playEV(page, 'solve-keys'); await page.clock.runFor(900); assert.equal((await page.textContent('.result-num')).trim(), '12/12');
});
test('Expected Value: all-wrong -> 0/12 with 12 worked explanations that state the right answer', async () => {
  const page = await fresh(); await playEV(page, 'wrong');
  await page.clock.runFor(900); assert.equal((await page.textContent('.result-num')).trim(), '0/12');
  const items = await page.$$eval('.ev-review li', l => l.map(x => ({ q: x.querySelector('.ev-rq').textContent, good: x.querySelector('.good').textContent, bad: x.querySelector('.bad').textContent, ex: x.querySelector('.ev-ex').textContent })));
  assert.equal(items.length, 12);
  for (const it of items) { assert.notEqual(it.good, it.bad); assert.ok(it.ex.includes(it.good), `explanation "${it.ex}" should contain ${it.good}`); assert.ok(Math.abs(parseOpt(it.good) - solve(it.q.replace(/^\d+\.\s*/, ''))) < 1e-9); }
  assert.deepEqual(page.errors, []);
});

// ── cross-cutting ──
test('every Extras screen passes axe in light and dark (dashboard, start, play, result)', async () => {
  for (const dark of [false, true]) {
    let p = await fresh({ dark }); assert.deepEqual(await axe(p), [], 'dashboard ' + dark);
    for (const [id, play] of [['nback', null], ['stroop', null], ['ev', null]]) {
      p = await fresh({ dark }); await launch(p, id); assert.deepEqual(await axe(p), [], id + ' start ' + dark);
      await p.click('text=Begin'); await p.clock.runFor(700); assert.deepEqual(await axe(p), [], id + ' play ' + dark);
    }
    p = await fresh({ dark }); await playEV(p, 'wrong'); await p.clock.runFor(1500); assert.deepEqual(await axe(p), [], 'ev result ' + dark);
    p = await fresh({ dark }); await playNBack(p, 'never'); await p.clock.runFor(1500); assert.deepEqual(await axe(p), [], 'nback result ' + dark);
  }
});
test('scores flow into history and the Progress page lists the Extras games', async () => {
  const page = await fresh(); await playEV(page, 'solve-click');
  await page.goto(`${env.url}/progress.html`);
  assert.equal(await page.locator('.pr-suite', { hasText: 'Extras' }).locator('.pr-card:not(.empty)').count(), 1);
  assert.equal(await page.locator('.pr-suite', { hasText: 'Extras' }).locator('.pr-card.empty').count(), 2);
});
test('landing page links to Extras and every page loads without console errors', async () => {
  const p = await env.newPage(); await p.goto(`${env.url}/index.html`); assert.equal(await p.locator('a.category-btn[href="extras.html"]').count(), 1);
  for (const f of ['index', 'zapn', 'sequences', 'arithmetic', 'extras', 'progress']) { await p.goto(`${env.url}/${f}.html`); await p.waitForTimeout(100); }
  assert.deepEqual(p.errors, []);
});
