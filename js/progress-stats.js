// js/progress-stats.js — pure, DOM-free helpers for the Progress page (unit-tested in tests/progress-stats.test.js).
const MEProgress = (function () {
  const pad = n => String(n).padStart(2, '0');
  // Local calendar day of a timestamp, e.g. "2026-10-21". A "day practised" is a local day.
  function dayKey(t) { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayNumber(key) { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }   // DST-proof day index

  // streaks(timestamps, now) -> { days, current, longest }
  // current: consecutive days ending today, or ending yesterday (the streak is still alive until the day is missed).
  function streaks(times, now) {
    const set = new Set(times.map(dayKey));
    const nums = [...set].map(dayNumber).sort((a, b) => a - b);
    let longest = 0, run = 0, prev = null;
    for (const n of nums) { run = prev !== null && n === prev + 1 ? run + 1 : 1; if (run > longest) longest = run; prev = n; }
    let current = 0;
    if (nums.length) {
      const today = dayNumber(dayKey(now)), last = nums[nums.length - 1];
      if (last === today || last === today - 1) {
        current = 1;
        for (let i = nums.length - 2; i >= 0 && nums[i] === nums[i + 1] - 1; i--) current++;
      }
    }
    return { days: set.size, current, longest };
  }

  // trend(values, lowerBetter) -> 'improving' | 'steady' | 'slipping' | 'new'
  // Compares the mean of the latest k runs with the k before them (k up to 6, kept even so an alternating
  // series cancels out), relative to the overall spread so a single noisy run doesn't flip it. Needs at least 4 runs.
  function trend(values, lowerBetter) {
    if (values.length < 4) return 'new';
    let k = Math.min(6, Math.floor(values.length / 2));
    if (k > 2 && k % 2) k--;
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const recent = mean(values.slice(-k)), before = mean(values.slice(-2 * k, -k));
    const spread = Math.max(...values) - Math.min(...values);
    if (spread === 0) return 'steady';
    const gain = (lowerBetter ? before - recent : recent - before) / spread;
    return gain > 0.25 ? 'improving' : gain < -0.25 ? 'slipping' : 'steady';
  }

  // sparkPoints(values, w, h, lowerBetter, pad) -> [[x,y],...]. Improvement always points UP, whichever way the game scores.
  function sparkPoints(values, w, h, lowerBetter, pad) {
    pad = pad == null ? 4 : pad;
    const n = values.length, lo = Math.min(...values), hi = Math.max(...values);
    return values.map((v, i) => {
      const x = n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - 2 * pad);
      let f = hi === lo ? .5 : (v - lo) / (hi - lo);          // 0..1, bigger value = bigger f
      if (lowerBetter) f = 1 - f;                              // smaller value = better = higher on screen
      return [Math.round(x * 10) / 10, Math.round((h - pad - f * (h - 2 * pad)) * 10) / 10];
    });
  }

  // summarise(entries, game) -> per-game numbers for the card
  function summarise(entries, lowerBetter) {
    const vals = entries.map(e => e.v);
    let best = null;
    for (const e of entries) if (best === null || (lowerBetter ? e.v < best.v : e.v > best.v)) best = e;
    return { runs: entries.length, best, latest: entries[entries.length - 1] || null, trend: trend(vals, lowerBetter) };
  }

  // ── export / import ──
  const FORMAT = 'mental-edge-progress', VERSION = 1;
  function allKeys(catalog) { return catalog.flatMap(s => [s.key, s.key + '_hist']); }
  function validScoreMap(o) {
    return o && typeof o === 'object' && !Array.isArray(o) &&
      Object.values(o).every(x => x && typeof x === 'object' && typeof x.v === 'number' && isFinite(x.v) && typeof x.label === 'string' && x.label.length <= 80);
  }
  function validHist(a) {
    return Array.isArray(a) && a.length <= 5000 && a.every(e => e && typeof e.id === 'string' && typeof e.v === 'number' && isFinite(e.v) &&
      typeof e.label === 'string' && e.label.length <= 80 && typeof e.t === 'number' && isFinite(e.t));
  }
  // buildExport(getItem, catalog, now) reads raw localStorage strings and returns a plain object ready for JSON.stringify.
  function buildExport(getItem, catalog, now) {
    const data = {};
    for (const k of allKeys(catalog)) {
      let v = null; try { v = JSON.parse(getItem(k) || 'null'); } catch (e) {}
      if (v != null) data[k] = v;
    }
    return { format: FORMAT, version: VERSION, exported: new Date(now).toISOString(), data };
  }
  // parseImport(text, catalog) -> { ok:true, data } | { ok:false, error }. Only known keys are accepted; nothing else is ever written.
  function parseImport(text, catalog) {
    let obj; try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'That file is not valid JSON.' }; }
    if (!obj || obj.format !== FORMAT) return { ok: false, error: 'That is not a Mental Edge progress file.' };
    if (obj.version !== VERSION) return { ok: false, error: 'Unsupported file version (' + obj.version + ').' };
    if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) return { ok: false, error: 'The file has no data.' };
    const known = new Set(allKeys(catalog)), out = {};
    for (const [k, v] of Object.entries(obj.data)) {
      if (!known.has(k)) continue;                                           // ignore anything we do not own
      const ok = k.endsWith('_hist') ? validHist(v) : validScoreMap(v);
      if (!ok) return { ok: false, error: 'The data for "' + k + '" is malformed.' };
      out[k] = v;
    }
    if (!Object.keys(out).length) return { ok: false, error: 'The file contains no progress data.' };
    return { ok: true, data: out };
  }

  return { dayKey, streaks, trend, sparkPoints, summarise, buildExport, parseImport, allKeys, FORMAT, VERSION };
})();
if (typeof module !== 'undefined') module.exports = MEProgress;
