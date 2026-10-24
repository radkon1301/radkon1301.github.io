// Fails when js/catalog.js (used by the Progress page) drifts from the real suites. Run: node --test tests/catalog.test.js
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { ME_CATALOG } = require('../js/catalog.js');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const suite = name => ME_CATALOG.find(s => s.suite === name);

test('storage keys match each suite core.js', () => {
  for (const [s, file] of [['zapn', 'js/zapn/core.js'], ['sequences', 'js/sequences/core.js'], ['arithmetic', 'js/arithmetic/core.js'], ['extras', 'js/extras/core.js']]) {
    if (!suite(s)) continue;
    assert.ok(read(file).includes(`createScoreStore('${suite(s).key}'`), `${s}: key ${suite(s).key} not found in ${file}`);
  }
});
test('Zap-N: games and titles match registry; lowerBetter matches core.js', () => {
  const reg = [...read('js/zapn/registry.js').matchAll(/id:'(\w+)',\s*title:'([^']+)'/g)].filter(m => m[1] !== 'test');
  assert.deepEqual(suite('zapn').games.map(g => [g.id, g.title]), reg.map(m => [m[1], m[2]]));
  const lb = read('js/zapn/core.js').match(/LOWER_BETTER=new Set\(\[([^\]]*)\]\)/)[1].match(/'([^']+)'/g).map(s => s.replace(/'/g, '')).sort();
  assert.deepEqual(suite('zapn').games.filter(g => g.lowerBetter).map(g => g.id).sort(), lb);
});
test('Extras: games match registry; lowerBetter matches core.js', () => {
  const reg = [...read('js/extras/registry.js').matchAll(/id: '(\w+)', title: '([^']+)'/g)];
  assert.deepEqual(suite('extras').games.map(g => [g.id, g.title]), reg.map(m => [m[1], m[2]]));
  const lb = read('js/extras/core.js').match(/EXTRA_LOWER_BETTER = new Set\(\[([^\]]*)\]\)/)[1].match(/'([^']+)'/g).map(x => x.replace(/'/g, '')).sort();
  assert.deepEqual(suite('extras').games.filter(g => g.lowerBetter).map(g => g.id).sort(), lb);
});
test('every id a game saves is in the catalog, and vice versa', () => {
  const saved = new Map();   // file -> ids
  const files = ['js/zapn', 'js/sequences', 'js/arithmetic', 'js/extras'].flatMap(d => fs.existsSync(path.join(__dirname, '..', d)) ? fs.readdirSync(path.join(__dirname, '..', d)).map(f => d + '/' + f) : []);
  const ids = new Set();
  for (const f of files) for (const m of read(f).matchAll(/save(?:Seq|Arith)?Score\(\s*'([\w-]+)'/g)) ids.add(m[1]);
  // arithmetic passes a variable (gameId) to saveArithScore: its ids come from its registry
  for (const m of read('js/arithmetic/registry.js').matchAll(/id:\s*'([\w-]+)'/g)) ids.add(m[1]);
  assert.deepEqual([...ids].sort(), ME_CATALOG.flatMap(s => s.games.map(g => g.id)).sort());
});
test('ids are unique and every suite page exists', () => {
  const all = ME_CATALOG.flatMap(s => s.games.map(g => g.id)); assert.equal(new Set(all).size, all.length);
  for (const s of ME_CATALOG) assert.ok(fs.existsSync(path.join(__dirname, '..', s.page)), s.page);
});
