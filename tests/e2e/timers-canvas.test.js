// Timer drift + HiDPI canvas. Uses Playwright's fake clock to simulate a throttled / sleeping tab.
const test = require('node:test'), assert = require('node:assert/strict');
const { setup } = require('./lib');

let env; test.before(async () => { env = await setup(); }); test.after(async () => { await env.close(); });

async function timedTest(page, file, launchId, beginSel, timerSel) {
  await page.clock.install({ time: 0 });
  await page.goto(`${env.url}/${file}`);
  await page.evaluate(id => launchGame(id), launchId);
  await page.click(beginSel);
  await page.clock.runFor(1100);                                   // one normal tick
  return (await page.textContent(timerSel)).trim();
}

for (const [name, file, id, begin, timer, total] of [
  ['Arithmetic 80-in-8', 'arithmetic.html', 'arith-mc', 'text=Begin', '#arith-timer', 8 * 60],
  ['Sequence test', 'sequences.html', 'seq-test', 'text=Begin test', '#test-timer', 25 * 60],
]) {
  test(`${name}: timer follows the clock, not the tick count`, async () => {
    const page = await env.newPage();
    const t1 = await timedTest(page, file, id, begin, timer);
    assert.equal(t1, `${Math.floor(total / 60) - 1}:59`, 'after ~1s exactly one second is gone');
    // Simulate Chrome throttling a background tab: 90 s of wall-clock pass but the interval only fires once.
    await page.clock.fastForward(90 * 1000);
    await page.clock.runFor(300);
    const after = (await page.textContent(timer)).trim();
    const [m, s] = after.split(':').map(Number);
    const left = m * 60 + s;
    assert.ok(Math.abs(left - (total - 91)) <= 2, `expected ~${total - 91}s left after 91s elapsed, got ${left}s (${after})`);
    assert.deepEqual(page.errors, []);
  });

  test(`${name}: auto-submits at zero even if the tab was frozen past the deadline`, async () => {
    const page = await env.newPage();
    await timedTest(page, file, id, begin, timer);
    await page.clock.fastForward((total + 30) * 1000);               // way past the end in a single jump
    await page.clock.runFor(500);
    assert.match(await page.textContent('#game-panel'), /Review answers|Review/i, 'results/review screen should be showing');
    assert.deepEqual(page.errors, []);
  });
}

test('Stock Master canvas backing store scales with devicePixelRatio', async () => {
  for (const dpr of [1, 2]) {
    const page = await env.newPage({ dpr, viewport: { width: 1200, height: 900 } });
    await page.goto(`${env.url}/zapn.html`);
    await page.evaluate(() => launchGame('stockmaster'));
    await page.click('text=Begin');
    await page.waitForSelector('#sm-canvas');
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => { const c = document.getElementById('sm-canvas'); const r = c.getBoundingClientRect(); return { w: c.width, h: c.height, cw: r.width, ch: r.height, dpr: devicePixelRatio }; });
    assert.equal(m.dpr, dpr);
    assert.ok(Math.abs(m.w - Math.round(m.cw * dpr)) <= 1 && Math.abs(m.h - Math.round(m.ch * dpr)) <= 1, `dpr ${dpr}: canvas ${m.w}x${m.h} vs css ${m.cw}x${m.ch}`);
    assert.deepEqual(page.errors, []);
  }
});

test('Stock Master only writes the stats bar when its text changes', async () => {
  const page = await env.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`${env.url}/zapn.html`);
  await page.evaluate(() => launchGame('stockmaster'));
  await page.click('text=Begin');
  await page.waitForSelector('#sm-canvas');
  const mutations = await page.evaluate(() => new Promise(res => {
    let n = 0; const mo = new MutationObserver(l => { n += l.length; });
    mo.observe(document.getElementById('gs-stats'), { childList: true, subtree: true, characterData: true });
    setTimeout(() => { mo.disconnect(); res(n); }, 2500);
  }));
  assert.ok(mutations <= 8, `stats bar mutated ${mutations}× in 2.5 s (was ~150 before: once per frame)`);
});
