const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs');
const { setup, axe } = require('./lib');
let env; test.before(async () => { env = await setup(); }); test.after(async () => { await env.close(); });

const NOW = Date.UTC(2026, 9, 24, 12, 0, 0), DAY = 86400000;
const seed = (hist, scores) => ({ me_scores_hist: JSON.stringify(hist), me_scores: JSON.stringify(scores) });
async function open(opts = {}, ls = {}) {
  const page = await env.newPage(opts);
  await page.clock.install({ time: NOW });
  await page.addInitScript(o => { for (const [k, v] of Object.entries(o)) if (!localStorage.getItem('__seeded')) localStorage.setItem(k, v); localStorage.setItem('__seeded', '1'); }, ls);
  await page.goto(`${env.url}/progress.html`);
  return page;
}
// 8 ShapeShift runs on 8 consecutive days ending today; times get faster (lower is better) => improving
const hist = Array.from({ length: 8 }, (_, i) => ({ id: 'shapeshift', v: 0.80 - i * 0.04, label: (0.80 - i * 0.04).toFixed(3) + 's @ 90%', t: NOW - (7 - i) * DAY }));
const waitStatus = (page, re) => page.waitForFunction(r => new RegExp(r).test(document.getElementById('pr-status').textContent), re.source);
const SEED = seed(hist, { shapeshift: { v: 0.52, label: '0.520s @ 90%' } });

test('empty state: zeros, every game says "No runs yet", no errors', async () => {
  const page = await open();
  const tiles = await page.$$eval('.pr-tile-val', n => n.map(x => x.textContent.trim()));
  assert.deepEqual(tiles.slice(0, 2), ['0', '0']); assert.equal(tiles[4], '—');
  assert.equal(await page.locator('.pr-card.empty').count(), 12);              // 9 + 1 + 2 games
  assert.deepEqual(page.errors, []);
});

test('seeded history: counts, best (direction-aware), trend, streak, sparkline, recent runs', async () => {
  const page = await open({}, SEED);
  const tiles = await page.$$eval('.pr-tile-val', n => n.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  assert.equal(tiles[0], '8'); assert.equal(tiles[1], '8'); assert.equal(tiles[2], '8 days'); assert.equal(tiles[3], '8 days');
  const card = page.locator('.pr-card', { hasText: 'ShapeShift' });
  assert.match(await card.locator('.pr-trend').textContent(), /Improving/);
  const nums = await card.locator('.pr-num b').allTextContents();
  assert.deepEqual(nums, ['8', '0.520s @ 90%', '0.520s @ 90%']);                  // best = smallest time, latest = last run
  assert.equal(await card.locator('svg.pr-spark path.line').count(), 1);
  assert.equal(await card.locator('.pr-runs tr').count(), 9);                       // header + 8 runs
  // improving series must slope UP on screen even though the numbers go down
  const ys = await card.locator('svg.pr-spark path.line').getAttribute('d').then(d => [...d.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map(m => +m[1]));
  assert.ok(ys[ys.length - 1] < ys[0], 'last point should be higher (smaller y) than first');
  assert.match(await card.locator('svg.pr-spark').getAttribute('aria-label'), /Last 8 runs/);
  assert.deepEqual(page.errors, []);
});

test('streak is alive if you played yesterday but broken after two missed days', async () => {
  const yest = Array.from({ length: 3 }, (_, i) => ({ id: 'bart', v: 1, label: '$1', t: NOW - (1 + i) * DAY }));
  let page = await open({}, seed(yest, {}));
  assert.equal((await page.$$eval('.pr-tile-val', n => n.map(x => x.textContent.replace(/\s+/g, ' ').trim())))[2], '3 days');
  const old = yest.map(e => ({ ...e, t: e.t - 3 * DAY }));
  page = await open({}, seed(old, {}));
  assert.equal((await page.$$eval('.pr-tile-val', n => n.map(x => x.textContent.replace(/\s+/g, ' ').trim())))[2], '0 days');
});

test('hostile labels from storage are shown as text and never executed', async () => {
  const evil = [{ id: 'shapeshift', v: 1, label: '<img src=x onerror="window.__xss=1">', t: NOW }];
  const page = await open({}, seed(evil, {}));
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  assert.equal(await page.locator('.pr-card img').count(), 0);
  assert.match(await page.locator('.pr-card', { hasText: 'ShapeShift' }).locator('.pr-num b').nth(1).textContent(), /<img src=x/);
});

test('corrupt storage does not break the page', async () => {
  const page = await open({}, { me_scores_hist: '{oops', me_seq_scores_hist: '[null,1,"x"]', me_arith_scores_hist: '{"a":1}' });
  assert.equal(await page.locator('.pr-card.empty').count(), 12); assert.deepEqual(page.errors, []);
});

test('export, reset, import restores everything; bad files and cancelled confirms change nothing', async () => {
  const page = await open({}, SEED);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#pr-export')]);
  assert.match(dl.suggestedFilename(), /^mental-edge-progress-2026-10-24\.json$/);
  const file = '/tmp/me-export.json'; await dl.saveAs(file);
  const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(exp.format, 'mental-edge-progress'); assert.equal(exp.data.me_scores_hist.length, 8); assert.ok(!('me_theme' in exp.data));

  page.once('dialog', d => d.dismiss());
  await page.click('#pr-reset'); assert.equal(await page.locator('.pr-card.empty').count(), 11, 'cancelled reset keeps data');
  page.once('dialog', d => d.accept());
  await page.click('#pr-reset'); assert.equal(await page.locator('.pr-card.empty').count(), 12);
  assert.equal(await page.evaluate(() => localStorage.getItem('me_scores_hist')), null);

  fs.writeFileSync('/tmp/me-bad.json', '{"format":"nope"}');
  await page.setInputFiles('#pr-file', '/tmp/me-bad.json'); await waitStatus(page, /not a Mental Edge/);
  assert.match(await page.textContent('#pr-status'), /not a Mental Edge/); assert.equal(await page.locator('.pr-card.empty').count(), 12);

  page.once('dialog', d => d.dismiss());
  await page.setInputFiles('#pr-file', file); await waitStatus(page, /cancelled/); assert.match(await page.textContent('#pr-status'), /cancelled/); assert.equal(await page.locator('.pr-card.empty').count(), 12);
  page.once('dialog', d => d.accept());
  await page.setInputFiles('#pr-file', file); await waitStatus(page, /Imported/);
  assert.equal(await page.locator('.pr-card.empty').count(), 11);
  assert.match(await page.locator('.pr-card', { hasText: 'ShapeShift' }).locator('.pr-num b').nth(1).textContent(), /0\.520s/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.me_scores).shapeshift.v), 0.52);
  assert.deepEqual(page.errors, []);
});

test('import never touches keys it does not own', async () => {
  const page = await open({}, { me_theme: 'dark', unrelated: 'keep' });
  fs.writeFileSync('/tmp/me-sneaky.json', JSON.stringify({ format: 'mental-edge-progress', version: 1, data: { me_scores: { a: { v: 1, label: 'x' } }, unrelated: 'overwritten', me_theme: 'light' } }));
  page.once('dialog', d => d.accept()); await page.setInputFiles('#pr-file', '/tmp/me-sneaky.json'); await waitStatus(page, /Imported/);
  assert.equal(await page.evaluate(() => [localStorage.unrelated, localStorage.me_theme]).then(x => x.join()), 'keep,dark');
});

test('a real run shows up: play ShapeShift twice, Progress lists 2 runs', async () => {
  const page = await env.newPage(); await page.clock.install({ time: NOW }); await page.goto(`${env.url}/zapn.html`);
  for (let run = 0; run < 2; run++) {
    await page.evaluate(() => launchGame('shapeshift')); await page.click('text=Begin');
    for (let i = 0; i < 400 && !(await page.locator('.result-card').count()); i++) { await page.clock.runFor(450); await page.keyboard.press('ArrowRight'); }
    await page.click('text=← Zap-N').catch(() => {});
  }
  await page.click('.hdr-link'); await page.waitForURL(/progress\.html/);
  assert.equal((await page.$$eval('.pr-tile-val', n => n.map(x => x.textContent.trim())))[0], '2');
  assert.equal(await page.locator('.pr-card', { hasText: 'ShapeShift' }).locator('.pr-num b').first().textContent(), '2');
});

test('page is reachable from every header and the landing card; no axe violations in light and dark with data', async () => {
  for (const f of ['index', 'zapn', 'sequences', 'arithmetic']) { const p = await env.newPage(); await p.goto(`${env.url}/${f}.html`); assert.equal(await p.locator('a.hdr-link[href="progress.html"]').count(), 1, f); }
  const p = await env.newPage(); await p.goto(`${env.url}/index.html`); assert.equal(await p.locator('a.category-btn[href="progress.html"]').count(), 1);
  for (const dark of [false, true]) { const page = await open({ dark }, SEED); assert.deepEqual(await axe(page), [], dark ? 'dark' : 'light'); }
});
