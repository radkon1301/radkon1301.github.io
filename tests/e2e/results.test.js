// Result-screen polish + run history, exercised by actually playing ShapeShift to the end on a fake clock.
const test = require('node:test'), assert = require('node:assert/strict');
const { setup, axe } = require('./lib');
let env; test.before(async () => { env = await setup(); }); test.after(async () => { await env.close(); });

async function playShapeShift(page) {
  await page.evaluate(() => launchGame('shapeshift'));
  await page.click('text=Begin');
  for (let i = 0; i < 400 && !(await page.$('.result-card')); i++) { await page.clock.runFor(450); await page.keyboard.press('ArrowRight'); }
  assert.equal(await page.locator('.result-card').count(), 1, 'game should have finished');
}
const fresh = async (opts = {}) => { const p = await env.newPage(opts); await p.clock.install({ time: 1.7e12 }); await p.goto(`${env.url}/zapn.html`); return p; };

test('first run: "First score saved" badge, history entry, announcement, final number after count-up', async () => {
  const page = await fresh();
  await playShapeShift(page);
  assert.match(await page.textContent('[data-result-badge]'), /First score saved/);
  assert.equal(await page.locator('.confetti').count(), 1, 'confetti for a new best');
  await page.clock.runFor(1200);
  const num = (await page.textContent('.result-num')).trim();
  const label = await page.evaluate(() => JSON.parse(localStorage.me_scores).shapeshift.label);
  assert.ok(/\d/.test(num) && label.includes(num.replace(/[^\d.]/g, '')), `final count-up value ${num} should match saved label ${label}`);
  await page.clock.runFor(2000);
  assert.equal(await page.locator('.confetti').count(), 0, 'confetti removes itself');
  const hist = await page.evaluate(() => JSON.parse(localStorage.me_scores_hist));
  assert.equal(hist.length, 1); assert.equal(hist[0].id, 'shapeshift'); assert.equal(hist[0].label, label);
  assert.match(await page.textContent('#sr-status'), /ShapeShift/);
  assert.deepEqual(page.errors, []);
});

test('second run: history grows to 2, badge shows previous run and either "New personal best" or "Personal best"', async () => {
  const page = await fresh();
  await playShapeShift(page);
  await page.click('.again-btn');                      // "Play again"
  await page.waitForSelector('.start-card, .prog-track, .ss-arena');
  if (await page.$('text=Begin')) await page.click('text=Begin');
  for (let i = 0; i < 400 && !(await page.$('.result-card')); i++) { await page.clock.runFor(450); await page.keyboard.press('ArrowRight'); }
  const badge = await page.textContent('[data-result-badge]');
  assert.match(badge, /New personal best|Personal best:/); assert.match(badge, /Previous run:|Beat /);
  assert.equal((await page.evaluate(() => JSON.parse(localStorage.me_scores_hist))).length, 2);
  assert.equal(await page.locator('[data-result-badge]').count(), 1, 'exactly one badge');
});

test('prefers-reduced-motion: no confetti, no count-up (final number immediately)', async () => {
  const page = await fresh({ reducedMotion: true });
  await playShapeShift(page);
  assert.equal(await page.locator('.confetti').count(), 0);
  const t1 = (await page.textContent('.result-num')).trim(); await page.clock.runFor(300);
  assert.equal((await page.textContent('.result-num')).trim(), t1);
  assert.ok(/\d/.test(t1) && !/^0\.0+s?$/.test(t1), 'shows the real value straight away: ' + t1);
});

test('result screen has no axe violations in light and dark', async () => {
  for (const dark of [false, true]) {
    const page = await fresh({ dark });
    await playShapeShift(page); await page.clock.runFor(1500);
    assert.deepEqual(await axe(page), [], (dark ? 'dark' : 'light'));
  }
});

test('result screen keeps working when localStorage is unavailable (private mode)', async () => {
  const page = await env.newPage(); await page.clock.install({ time: 1.7e12 });
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); });
  await page.goto(`${env.url}/zapn.html`);
  await playShapeShift(page);
  assert.equal(await page.locator('[data-result-badge]').count(), 1);
  assert.deepEqual(page.errors.filter(e => !/denied/.test(e)), []);
});
