// Run: node --test tests/theme-tokens.test.js   (no dependencies)
// Parses the colour tokens out of shared.css and checks WCAG contrast for the pairs the UI actually uses, in BOTH themes,
// and that the two copies of the dark palette (OS-preference media query + [data-theme="dark"]) cannot drift apart.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'shared.css'), 'utf8');

function block(re) { const m = css.match(re); assert.ok(m, 'block not found: ' + re); return m[1]; }
function tokens(body) { const o = {}; for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) o[m[1]] = m[2]; return o; }
const light = tokens(block(/:root \{\s*color-scheme: light;([\s\S]*?)\n\}/));
const darkAttr = tokens(block(/:root\[data-theme="dark"\] \{([\s\S]*?)\}\n/));
const darkMedia = tokens(block(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([\s\S]*?)\}\s*\}/));

const lin = c => (c /= 255) <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

// [foreground token, background token, minimum ratio]  (4.5 = AA body text, 3 = AA large text / UI components)
const PAIRS = [
  ['text', 'bg', 7], ['text', 'surface', 7], ['text2', 'surface', 4.5], ['text2', 'surface2', 4.5], ['text2', 'bg', 4.5],
  ['muted', 'surface', 4.5], ['muted', 'surface2', 4.5], ['muted', 'bg', 4.5],
  ['accent', 'surface', 4.5], ['accent', 'accent-light', 4.5], ['accent', 'bg', 4.5],
  ['green', 'green-light', 4.5], ['green', 'surface', 4.5], ['red', 'red-light', 4.5], ['red', 'surface', 4.5],
  ['yellow', 'yellow-light', 4.5], ['yellow', 'surface', 4.5], ['purple', 'purple-light', 4.5],
  ['btn-fg', 'btn-bg', 7], ['btn-fg', 'btn-hover', 7],
  ['on-accent', 'accent', 4.5], ['on-accent', 'accent2', 4.5], ['on-accent', 'green', 4.5],
  ['text2', 'panel-grad-a', 4.5], ['text2', 'panel-grad-b', 4.5],
  ['border2', 'surface', 1.3],                                          // visible edge on controls
];

test('both dark palettes are identical', () => assert.deepEqual(darkMedia, darkAttr));
test('light and dark define exactly the same colour token names', () => assert.deepEqual(Object.keys(darkAttr).sort(), Object.keys(light).sort()));
for (const [name, T] of [['light', light], ['dark', darkAttr]]) {
  for (const [f, b, min] of PAIRS) {
    test(`${name}: ${f} on ${b} >= ${min}:1`, () => {
      assert.ok(T[f] && T[b], `missing token ${f} or ${b}`);
      const r = ratio(T[f], T[b]); assert.ok(r >= min, `${T[f]} on ${T[b]} is ${r.toFixed(2)}:1`);
    });
  }
}
test('every token used by var(--x) in the stylesheets and scripts is defined', () => {
  const defined = new Set([...Object.keys(light), 'shadow', 'shadow-lg', 'radius', 'radius-sm']);
  const dir = path.join(__dirname, '..');
  const files = ['shared.css', 'index.html', 'progress.html', ...fs.readdirSync(path.join(dir, 'css')).map(f => 'css/' + f),
    ...['js', 'js/zapn', 'js/sequences', 'js/arithmetic', 'js/extras'].flatMap(d => fs.existsSync(path.join(dir, d)) ? fs.readdirSync(path.join(dir, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f) : [])]
    .filter(f => fs.existsSync(path.join(dir, f)));
  const LOCAL = /^(sk-h|sk-mh|dx|dy|st-fix)$/;                    // per-component custom properties (sizes / animation offsets), not theme colours
  const bad = [];
  for (const f of files) for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/var\(--([\w-]+)/g)) {
    if (!defined.has(m[1]) && !LOCAL.test(m[1])) bad.push(f + ': --' + m[1]);
  }
  assert.deepEqual([...new Set(bad)], []);
});
