// Run: node tests/skyscraper-gen.test.js   (no dependencies; ~10 s)
// Verifies js/zapn/skyscraper-gen.js against an independent, naive BFS and checks speed.
// Keep the LEVELS table in sync with LEVELS in js/zapn/skyscraper.js.
const fs = require('fs'), vm = require('vm'), path = require('path');
const LEVELS = [[4,5],[4,6],[4,7],[5,7],[5,9],[5,11],[6,10],[6,13],[7,14],[7,16]];   // [nBlocks, minOptimal]

const ctx = { Math, Float64Array, Uint8Array, Set, Array };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/zapn/skyscraper-gen.js'), 'utf8') +
  '\nglobalThis.api = { skyStateCount, skyDistances, skyGeneratePuzzle };', ctx);
const api = ctx.api;

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Reference solver: plain level-by-level BFS with string keys (shares no code with the generator).
function refDistance(s, t) {
  const key = p => p.map(x => x.join(',')).join('|'), goal = key(t);
  if (key(s) === goal) return 0;
  let cur = [s], seen = new Set([key(s)]), d = 0;
  while (cur.length) {
    d++; const next = [];
    for (const st of cur) for (let i = 0; i < 3; i++) {
      if (!st[i].length) continue;
      for (let j = 0; j < 3; j++) {
        if (i === j) continue;
        const ns = st.map(x => [...x]); ns[j].push(ns[i].pop());
        const k = key(ns); if (seen.has(k)) continue;
        if (k === goal) return d;
        seen.add(k); next.push(ns);
      }
    }
    cur = next;
  }
  return -1;
}

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('FAIL:', msg); } };
const nonEmpty = p => p.filter(x => x.length).length;
const rng = mulberry32(2024);

for (const n of [4, 5, 6, 7]) {                       // BFS reaches every arrangement
  const r = api.skyDistances([[...Array(n).keys()], [], []], n);
  check(r.count === api.skyStateCount(n), `n=${n}: reached ${r.count} of ${api.skyStateCount(n)} states`);
}

LEVELS.forEach(([n, minOpt], li) => {
  const maxPiles = n <= 3 ? 1 : n <= 5 ? 2 : 3, N = n >= 7 ? 20 : 60, REF = n >= 7 ? 3 : n === 6 ? 10 : 25;
  let worst = 0;
  for (let i = 0; i < N; i++) {
    const t0 = Date.now(), pz = api.skyGeneratePuzzle(n, minOpt, rng); worst = Math.max(worst, Date.now() - t0);
    const all = [...Array(n).keys()].join(), flat = a => a.flat().sort((x, y) => x - y).join();
    check(flat(pz.start) === all && flat(pz.target) === all, `level ${li + 1}: blocks not conserved`);
    check(nonEmpty(pz.start) >= 2, `level ${li + 1}: start must use >= 2 piles`);
    check(nonEmpty(pz.target) >= 1 && nonEmpty(pz.target) <= maxPiles, `level ${li + 1}: bad target shape`);
    check(pz.optimal >= minOpt, `level ${li + 1}: optimal ${pz.optimal} < minOpt ${minOpt}`);
    if (i < REF) check(refDistance(pz.start, pz.target) === pz.optimal, `level ${li + 1}: optimal ${pz.optimal} disagrees with reference BFS`);
  }
  check(worst < 1500, `level ${li + 1}: slowest puzzle took ${worst} ms`);
  console.log(`level ${String(li + 1).padStart(2)} (n=${n}, min ${String(minOpt).padStart(2)}): ${N} puzzles ok, slowest ${worst} ms`);
});
console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
