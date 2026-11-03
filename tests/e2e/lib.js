// Shared helpers for the browser tests (node --test e2e/*.test.js).
// Needs: `cd tests && npm install` (playwright-core + axe-core) and a Chromium binary.
// Set CHROME_PATH to override the browser; otherwise a few common locations are tried.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');

const ROOT = process.env.SITE_ROOT || path.join(__dirname, '..', '..');   // SITE_ROOT lets you run the same tests against another checkout (e.g. main)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

function chromePath() {
  const cands = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/google/chrome/chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  return cands.find(p => fs.existsSync(p));
}

function startServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}

// setup() -> { url, browser, newPage(opts), close() }.  Every page collects console errors / page errors in page.errors.
async function setup() {
  const { srv, url } = await startServer();
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
  const ctxs = [];
  async function newPage(opts = {}) {
    const ctx = await browser.newContext({
      viewport: opts.viewport || { width: 1280, height: 800 },
      deviceScaleFactor: opts.dpr || 1,
      colorScheme: opts.dark ? 'dark' : 'light',
      reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
    });
    ctxs.push(ctx);
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', e => page.errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location().url || '')) page.errors.push('console: ' + m.text() + ' @ ' + (m.location().url || '')); });
    // Google Fonts is the only external resource; abort it so tests are offline-safe and fast.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    return page;
  }
  return { url, browser, newPage, async close() { for (const c of ctxs) await c.close(); await browser.close(); srv.close(); } };
}

// Run axe-core on the current page; returns violations (filtered to wcag2a/2aa + best-practice).
async function axe(page, opts = {}) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const res = await page.evaluate(async (o) => {
    return await axe.run(o.context || document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
      rules: Object.assign({ 'color-contrast': { enabled: true } }, o.rules || {}),
    });
  }, opts);
  return res.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join(' ')) }));
}

module.exports = { setup, axe, ROOT };
