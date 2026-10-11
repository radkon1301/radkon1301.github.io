// js/zapn/skyscraper-gen.js — Skyscraper puzzle generator (pure logic, no DOM; unit-testable in Node).
// Docs: docs/zapn.md
//
// A puzzle is { start, target, optimal }: arrangements of n blocks on 3 piles (arrays of block ids
// 0..n-1, index 0 = bottom). A move takes the top block of one pile and puts it on another pile.
// `optimal` is the true minimum number of moves from start to target and is >= minOpt.
//
// Why not guess-and-check: the old generator drew a random (start, target) pair and ran a BFS
// to measure its difficulty, retrying up to 300 times until the pair was hard enough. For 7 blocks
// each BFS costs ~0.5-2 s and most pairs are too easy, so late levels took 5 s (median) to 28 s.
//
// Now: run ONE BFS from a random start. It yields the exact distance from the start to every
// possible arrangement (n! * C(n+2, 2) of them: 181,440 for n = 7), so a target of the required
// difficulty is simply picked from the states at distance >= minOpt. One BFS is ~0.1 s for n = 7,
// there are no retries, and nothing is hard-coded per level.

// Number of distinct arrangements of n labelled blocks on 3 ordered piles.
function skyStateCount(n) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f * (n + 1) * (n + 2) / 2;
}

// Fisher–Yates with an injectable RNG (default Math.random) so tests can be seeded.
function skyShuffle(arr, rng) {
  rng = rng || Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Random starting position: blocks dealt round-robin onto 2 or 3 random piles (so no active pile is empty).
function skyRandomStart(n, rng) {
  rng = rng || Math.random;
  const blocks = skyShuffle([...Array(n).keys()], rng);
  const nActive = rng() < 0.5 ? 2 : 3;
  const active = skyShuffle([0, 1, 2], rng).slice(0, nActive);
  const piles = [[], [], []];
  blocks.forEach((b, i) => piles[active[i % nActive]].push(b));
  return piles;
}

// One BFS over the whole state space from `start`.
// Returns { keys, dist, count, dec }: states in BFS order, so dist[] is non-decreasing and
// keys[i] is a state at distance dist[i]; dec(key) turns a key back into piles.
// States are packed into a number: base-(n+1) digits = block ids with n as the pile separator,
// plus a leading 1 so that leading zeros (block 0) are not lost.
function skyDistances(start, n) {
  const B = n + 1;
  const enc = p => {
    let k = 1;
    for (let i = 0; i < 3; i++) {
      const a = p[i];
      for (let j = 0; j < a.length; j++) k = k * B + a[j];
      k = k * B + n;
    }
    return k;
  };
  const dec = k => {
    const p = [[], [], []];
    let pi = 3;
    while (k > 1) {
      const d = k % B;
      k = (k - d) / B;
      if (d === n) pi--; else p[pi].push(d);
    }
    for (const a of p) a.reverse();
    return p;
  };

  const total = skyStateCount(n);
  const keys = new Float64Array(total);
  const dist = new Uint8Array(total);
  const seen = new Set();
  let count = 0;
  const k0 = enc(start);
  keys[count] = k0; dist[count] = 0; count++; seen.add(k0);

  for (let h = 0; h < count; h++) {
    const p = dec(keys[h]);
    const d = dist[h] + 1;
    for (let i = 0; i < 3; i++) {
      const from = p[i];
      if (!from.length) continue;
      const b = from.pop();
      for (let j = 0; j < 3; j++) {
        if (j === i) continue;
        p[j].push(b);
        const nk = enc(p);
        p[j].pop();
        if (!seen.has(nk)) { seen.add(nk); keys[count] = nk; dist[count] = d; count++; }
      }
      from.push(b);
    }
  }
  return { keys, dist, count, dec };
}

// Number of arrangements of n blocks that use exactly k of the 3 piles (all k non-empty).
function skyShapeCount(n, k) {
  const C = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return Math.round(r); };
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return C(3, k) * f * C(n - 1, k - 1);
}

// Pick a random target at distance >= minOpt whose shape is allowed (<= maxPiles non-empty piles).
// Shape (number of non-empty piles) is chosen with probability proportional to the FRACTION of that
// shape's arrangements that are hard enough. This reproduces the mix the old guess-and-check loop
// produced implicitly (hard levels favour single towers because those are farthest from the start),
// so puzzles keep their character. Returns { target, optimal } or null.
function skyPickTarget(res, n, minOpt, maxPiles, rng) {
  rng = rng || Math.random;
  const groups = [null, [], [], []];                  // candidate indices by number of non-empty piles
  for (let i = res.count - 1; i > 0 && res.dist[i] >= minOpt; i--) {
    const np = res.dec(res.keys[i]).filter(p => p.length).length;
    if (np <= maxPiles) groups[np].push(i);
  }
  const open = [1, 2, 3].filter(k => groups[k].length);
  if (!open.length) return null;
  const w = open.map(k => groups[k].length / skyShapeCount(n, k));
  let r = rng() * w.reduce((a, b) => a + b, 0), pick = open.length - 1;
  for (let j = 0; j < w.length; j++) { if (r < w[j]) { pick = j; break; } r -= w[j]; }
  const grp = groups[open[pick]];
  const idx = grp[Math.floor(rng() * grp.length)];
  return { target: res.dec(res.keys[idx]), optimal: res.dist[idx] };
}

// Farthest allowed target from a BFS result (used only if no start reaches minOpt).
function skyFarthestTarget(res, maxPiles) {
  for (let i = res.count - 1; i > 0; i--) {
    const t = res.dec(res.keys[i]);
    if (t.filter(p => p.length).length <= maxPiles) return { target: t, optimal: res.dist[i] };
  }
  return null;
}

// Main entry: puzzle with `n` blocks whose optimal solution is at least `minOpt` moves.
// Always terminates: at most 8 BFS runs; normally exactly 1.
function skyGeneratePuzzle(n, minOpt, rng) {
  rng = rng || Math.random;
  minOpt = Math.max(1, minOpt);
  const maxPiles = n <= 3 ? 1 : n <= 5 ? 2 : 3;       // same target shapes as before
  let fallback = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const start = skyRandomStart(n, rng);
    const res = skyDistances(start, n);
    const pick = skyPickTarget(res, n, minOpt, maxPiles, rng);
    if (pick) return { start, target: pick.target, optimal: pick.optimal };
    const far = skyFarthestTarget(res, maxPiles);    // this start cannot reach minOpt: remember its best
    if (far && (!fallback || far.optimal > fallback.optimal)) fallback = { start, target: far.target, optimal: far.optimal };
  }
  return fallback;                                    // optimal < minOpt, but still a valid, correctly measured puzzle
}
