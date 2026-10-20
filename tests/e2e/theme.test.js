const test = require('node:test'), assert = require('node:assert/strict');
const { setup } = require('./lib');
let env; test.before(async () => { env = await setup(); }); test.after(async () => { await env.close(); });

const bg = page => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const DARK_BG = 'rgb(18, 19, 23)', LIGHT_BG = 'rgb(244, 242, 238)';

test('follows the OS preference when nothing is saved', async () => {
  for (const [dark, want] of [[true, DARK_BG], [false, LIGHT_BG]]) {
    const page = await env.newPage({ dark });
    await page.goto(`${env.url}/index.html`);
    assert.equal(await bg(page), want);
    assert.equal(await page.getAttribute('html', 'data-theme'), null);
    assert.equal(await page.getAttribute('[data-theme-toggle]', 'aria-pressed'), String(dark));
  }
});

test('toggle switches theme, saves the choice, and survives reload and navigation', async () => {
  const page = await env.newPage({ dark: false });
  await page.goto(`${env.url}/zapn.html`);
  assert.equal(await bg(page), LIGHT_BG);
  await page.click('[data-theme-toggle]');
  assert.equal(await bg(page), DARK_BG);
  assert.equal(await page.evaluate(() => localStorage.getItem('me_theme')), 'dark');
  await page.reload(); assert.equal(await bg(page), DARK_BG);
  for (const f of ['index', 'sequences', 'arithmetic']) { await page.goto(`${env.url}/${f}.html`); assert.equal(await bg(page), DARK_BG, f); }
  await page.click('[data-theme-toggle]');
  assert.equal(await bg(page), LIGHT_BG);
  assert.equal(await page.evaluate(() => localStorage.getItem('me_theme')), 'light');
  assert.deepEqual(page.errors, []);
});

test('an explicit "light" choice beats an OS dark preference (and vice versa)', async () => {
  const page = await env.newPage({ dark: true });
  await page.goto(`${env.url}/index.html`);
  await page.evaluate(() => localStorage.setItem('me_theme', 'light')); await page.reload();
  assert.equal(await bg(page), LIGHT_BG);
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
  const p2 = await env.newPage({ dark: false });
  await p2.goto(`${env.url}/index.html`);
  await p2.evaluate(() => localStorage.setItem('me_theme', 'dark')); await p2.reload();
  assert.equal(await bg(p2), DARK_BG);
  assert.equal(await p2.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
});

test('saved theme is applied before first paint (no light flash)', async () => {
  const page = await env.newPage({ dark: false });
  await page.addInitScript(() => localStorage.setItem('me_theme', 'dark'));
  await page.addInitScript(() => {
    window.__seen = [];
    new MutationObserver(() => {}).observe(document, { childList: true, subtree: true });
    document.addEventListener('readystatechange', () => window.__seen.push(document.documentElement.getAttribute('data-theme')));
  });
  await page.goto(`${env.url}/index.html`);
  const seen = await page.evaluate(() => window.__seen);
  assert.ok(seen.length && seen.every(v => v === 'dark'), 'data-theme must already be "dark" at every readyState: ' + JSON.stringify(seen));
});

test('garbage in me_theme is ignored', async () => {
  const page = await env.newPage({ dark: false });
  await page.goto(`${env.url}/index.html`);
  await page.evaluate(() => localStorage.setItem('me_theme', '<script>')); await page.reload();
  assert.equal(await bg(page), LIGHT_BG); assert.deepEqual(page.errors, []);
});

test('primary buttons stay readable in both themes (inverted, not white-on-white)', async () => {
  for (const dark of [false, true]) {
    const page = await env.newPage({ dark });
    await page.goto(`${env.url}/zapn.html`);
    const c = await page.evaluate(() => { const b = document.querySelector('.play-btn'); const s = getComputedStyle(b); return [s.color, s.backgroundColor]; });
    assert.notEqual(c[0], c[1]); assert.equal(c[1], dark ? 'rgb(236, 236, 240)' : 'rgb(26, 25, 22)');
  }
});

test('Start buttons line up across a row of cards', async () => {
  const page = await env.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${env.url}/zapn.html`);
  const rows = await page.evaluate(() => { const o = {}; document.querySelectorAll('.game-card').forEach(c => { const r = c.getBoundingClientRect(), b = c.querySelector('.play-btn').getBoundingClientRect(); (o[Math.round(r.top)] = o[Math.round(r.top)] || []).push(Math.round(b.bottom - r.bottom)); }); return o; });
  for (const [top, offs] of Object.entries(rows)) assert.ok(new Set(offs).size === 1, `row at y=${top}: button offsets from card bottom differ: ${offs}`);
});
