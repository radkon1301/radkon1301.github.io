// Regression net for the EXISTING games after the shared-code changes (setPanel hook, timers, theme, a11y markup).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { setup } = require('./lib');
let env; test.before(async () => { env = await setup(); }); test.after(async () => { await env.close(); });
const fresh = async (file, opts = {}) => { const p = await env.newPage(opts); await p.clock.install({ time: 1.7e12 }); await p.goto(`${env.url}/${file}.html`); return p; };

const SUITES = [['zapn', 'GAMES'], ['sequences', 'SEQ_GAMES'], ['arithmetic', 'ARITH_GAMES'], ['extras', 'EXTRA_GAMES']];
for (const [file, list] of SUITES) {
  test(`${file}: every game launches, begins and runs 4 s with no errors, then returns to the dashboard`, async () => {
    const page = await fresh(file);
    const ids = await page.evaluate(l => eval(l).map(g => g.id), list);
    assert.ok(ids.length >= 1);
    for (const id of ids.filter(i => i !== 'test')) {
      await page.evaluate(i => launchGame(i), id);
      assert.equal(await page.locator('#game-screen').isVisible(), true, id);
      assert.ok((await page.textContent('#gs-name')).length > 0, id + ' has a title');
      const btn = page.locator('#game-panel .start-card button, #game-panel .big-btn').first();
      if (await btn.count()) await btn.click();
      await page.clock.runFor(4000);
      await page.evaluate(() => showDashboard());
      assert.equal(await page.locator('#dashboard').isVisible(), true, id);
      assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('play-btn')), true, id + ': focus returns to the launching card');
    }
    assert.deepEqual(page.errors, []);
  });
}

test('every Zap-N game that saves a score does so BEFORE rendering its result (so the badge can appear)', () => {
  const dir = path.join(__dirname, '..', '..', 'js', 'zapn');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js') && !/test|registry|core|bank|gen/.test(f))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8'), save = s.indexOf('saveScore('), res = Math.min(...['result-card', 'data-result'].map(k => s.indexOf(k)).filter(i => i >= 0));
    if (save < 0) continue;
    assert.ok(res > 0, f + ' renders no result card'); assert.ok(save < res, `${f}: saveScore must come before the result markup`);
  }
});

async function finish(page, press, step = 450, max = 600) {
  for (let i = 0; i < max && !(await page.locator('.result-card').count()); i++) { await page.clock.runFor(step); if (press) await page.keyboard.press(press); }
  assert.equal(await page.locator('.result-card').count(), 1, 'game finished');
}
test('TheSwitch, CodeCompare and Stock Master play to the end and show the badge, history entry and Play again', async () => {
  for (const [id, drive] of [
    ['theswitch', p => finish(p, 'y', 300)],
    ['codecompare', async p => { for (let i = 0; i < 400 && !(await p.locator('.result-card').count()); i++) { await p.clock.runFor(700); const o = p.locator('#game-panel button:not(.again-btn)').first(); if (await o.count()) await o.click({ timeout: 500 }).catch(() => {}); } assert.equal(await p.locator('.result-card').count(), 1); }],
    ['stockmaster', async p => { for (let i = 0; i < 400 && !(await p.locator('.result-card').count()); i++) await p.clock.runFor(1000); assert.equal(await p.locator('.result-card').count(), 1, 'stock master finished'); }],
  ]) {
    const page = await fresh('zapn', { viewport: { width: 1200, height: 900 } });
    await page.evaluate(i => launchGame(i), id); await page.click('#game-panel .start-card button');
    await drive(page);
    assert.equal(await page.locator('[data-result-badge]').count(), 1, id + ': badge');
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.me_scores_hist))).filter(e => e.id === id).length, 1, id + ': history');
    assert.equal(await page.locator('.again-btn').count(), 1);
    assert.deepEqual(page.errors, [], id);
  }
});

test('Full Test still chains games: result badge does not break the "Next game →" hook', async () => {
  const page = await fresh('zapn');
  await page.evaluate(() => { window.shuffle = a => a; });                     // deterministic order: TEST_IDS order, ShapeShift first
  await page.evaluate(() => launchGame('test'));
  await page.click('#game-panel .start-card button');
  await page.clock.runFor(200);
  assert.match(await page.textContent('#gs-name'), /ShapeShift|Full Test/);
  if (await page.locator('#game-panel .start-card button').count()) await page.click('#game-panel .start-card button');
  await finish(page, 'ArrowRight');
  assert.equal(await page.locator('[data-result-badge]').count(), 1);
  await page.clock.runFor(200);                                                // afterSetPanel swaps the button after 50 ms
  assert.equal((await page.textContent('.again-btn')).trim(), 'Next game →');
  await page.click('.again-btn'); await page.clock.runFor(300);
  assert.equal(await page.locator('.result-card').count(), 0, 'moved on to the next game');
  assert.ok((await page.textContent('#gs-name')).trim().length > 0);
  assert.deepEqual(page.errors, []);
});

test('score store stays backward compatible: old me_scores values are read, kept when unbeaten, replaced (and junk purged) when beaten', async () => {
  for (const [seeded, beaten] of [[100, false], [5000, true]]) {         // ShapeShift stores average milliseconds; lower is better
    const page = await env.newPage(); await page.clock.install({ time: 1.7e12 });
    await page.addInitScript(v => { if (!localStorage.__s) { localStorage.__s = 1; localStorage.me_scores = JSON.stringify({ shapeshift: { v, label: v + 's seeded' }, junk: 5, bad: { v: 'x' } }); } }, seeded);
    await page.goto(`${env.url}/zapn.html`);
    assert.match(await page.textContent('.game-card:has-text("ShapeShift") .chip.hi'), new RegExp(seeded + 's seeded'), 'old-format value is displayed');
    await page.evaluate(() => launchGame('shapeshift')); await page.click('#game-panel .start-card button'); await finish(page, 'ArrowRight');
    const stored = await page.evaluate(() => JSON.parse(localStorage.me_scores));
    if (beaten) { assert.match(await page.textContent('[data-result-badge]'), /New personal best/); assert.ok(stored.shapeshift.v < 5000 && !('junk' in stored) && !('bad' in stored), JSON.stringify(stored)); assert.match(await page.textContent('[data-result-badge]'), /Beat 5000s seeded/); }
    else { assert.match(await page.textContent('[data-result-badge]'), /Personal best: 100s seeded/); assert.equal(stored.shapeshift.v, 100); }
    assert.deepEqual(page.errors, []);
  }
});

test('Sequences and Arithmetic tests still finish and save through the new countdown', async () => {
  for (const [file, id, begin, key, scoreId] of [['sequences', 'seq-test', 'text=Begin test', 'me_seq_scores', 'seq-test'], ['arithmetic', 'arith-mc', 'text=Begin', 'me_arith_scores', 'arith-mc']]) {
    const page = await fresh(file); await page.evaluate(i => launchGame(i), id); await page.click(begin);
    await page.clock.runFor(40 * 60 * 1000);                                    // let the timer expire: auto-submit path
    assert.equal(await page.evaluate(([k, sid]) => JSON.parse(localStorage[k] || '{}')[sid] !== undefined, [key, scoreId]), true, file + ' score saved on timeout');
    assert.equal((await page.evaluate(k => JSON.parse(localStorage[k + '_hist']), key)).length, 1);
    assert.deepEqual(page.errors, [], file);
  }
});
