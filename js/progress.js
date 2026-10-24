// js/progress.js — renders progress.html from run history (see docs/progress.md). Everything is built with DOM APIs and
// textContent (never innerHTML) because labels can come from an imported file.
(function () {
  const C = ME_CATALOG, P = MEProgress;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sv(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  const fmtDate = t => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const TREND = { improving: ['▲ Improving', 'improving'], steady: ['■ Steady', 'steady'], slipping: ['▼ Slipping', 'slipping'], new: ['Needs 4+ runs', 'new'] };

  function tile(label, value, small) {
    const t = el('div', 'pr-tile'); t.appendChild(el('div', 'pr-tile-label', label));
    const v = el('div', 'pr-tile-val' + (value.length > 8 ? ' sm' : ''), value); if (small) { v.appendChild(document.createTextNode(' ')); v.appendChild(el('small', null, small)); } t.appendChild(v); return t;
  }
  function num(label, value) { const d = el('div', 'pr-num'); d.appendChild(el('span', null, label)); d.appendChild(el('b', null, value)); return d; }

  function sparkline(entries, lowerBetter, bestEntry) {
    const last = entries.slice(-30), W = 280, H = 52;
    const pts = P.sparkPoints(last.map(e => e.v), W, H, lowerBetter);
    const svg = sv('svg', { class: 'pr-spark', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img',
      'aria-label': `Last ${last.length} run${last.length === 1 ? '' : 's'}, oldest to newest: first ${last[0].label}, latest ${last[last.length - 1].label}. Higher on the chart is better.` });
    if (pts.length > 1) {
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
      svg.appendChild(sv('path', { class: 'area', d: d + ` L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z` }));
      svg.appendChild(sv('path', { class: 'line', d, 'vector-effect': 'non-scaling-stroke' }));
    }
    const bi = last.lastIndexOf(bestEntry);
    pts.forEach((p, i) => { if (i === pts.length - 1 || i === bi) svg.appendChild(sv('circle', { class: i === bi ? 'dot best' : 'dot', cx: p[0], cy: p[1], r: 3.5 })); });
    return svg;
  }

  function gameCard(suite, game, entries) {
    const card = el('div', 'pr-card' + (entries.length ? '' : ' empty'));
    const h = el('h3', null, game.title);
    if (!entries.length) {
      card.appendChild(h);
      const n = el('div', 'pr-none', 'No runs yet. '); const a = el('a', null, 'Play →'); a.href = suite.page; n.appendChild(a); card.appendChild(n); return card;
    }
    const s = P.summarise(entries, !!game.lowerBetter), tr = TREND[s.trend];
    h.appendChild(el('span', 'pr-trend ' + tr[1], tr[0])); card.appendChild(h);
    const nums = el('div', 'pr-nums');
    nums.appendChild(num('Runs', String(s.runs))); nums.appendChild(num('Best', s.best.label)); nums.appendChild(num('Latest', s.latest.label));
    card.appendChild(nums);
    card.appendChild(sparkline(entries, !!game.lowerBetter, s.best));
    const det = el('details'); det.appendChild(el('summary', null, 'Recent runs'));
    const tb = el('table', 'pr-runs'), head = el('tr'); head.appendChild(el('th', null, 'When')); head.appendChild(el('th', null, 'Result')); tb.appendChild(head);
    entries.slice(-10).reverse().forEach(e => { const r = el('tr'); r.appendChild(el('td', null, fmtDate(e.t))); r.appendChild(el('td', null, e.label)); tb.appendChild(r); });
    det.appendChild(tb); card.appendChild(det);
    return card;
  }

  function render() {
    const loaded = C.map(s => ({ s, hist: readScoreHistory(s.key) }));
    const all = loaded.flatMap(x => x.hist), st = P.streaks(all.map(e => e.t), Date.now());
    const sum = $('pr-summary'); sum.textContent = '';
    sum.appendChild(tile('Total runs', String(all.length)));
    sum.appendChild(tile('Days practised', String(st.days)));
    sum.appendChild(tile('Current streak', String(st.current), st.current === 1 ? 'day' : 'days'));
    sum.appendChild(tile('Longest streak', String(st.longest), st.longest === 1 ? 'day' : 'days'));
    sum.appendChild(tile('Last played', all.length ? fmtDate(Math.max(...all.map(e => e.t))) : '—'));
    const root = $('pr-suites'); root.textContent = '';
    loaded.forEach(({ s, hist }) => {
      const sec = el('section', 'pr-suite'); const head = el('div', 'pr-suite-head');
      head.appendChild(el('h2', null, s.name)); const a = el('a', null, 'Open ' + s.name + ' →'); a.href = s.page; head.appendChild(a); sec.appendChild(head);
      const grid = el('div', 'pr-grid');
      s.games.forEach(g => grid.appendChild(gameCard(s, g, hist.filter(e => e.id === g.id))));
      sec.appendChild(grid); root.appendChild(sec);
    });
  }

  function status(msg, kind) { const s = $('pr-status'); s.textContent = msg; s.className = 'pr-status' + (kind ? ' ' + kind : ''); }
  function clearKnown() { P.allKeys(C).forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); }

  $('pr-export').addEventListener('click', () => {
    const out = P.buildExport(k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, C, Date.now());
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'mental-edge-progress-' + P.dayKey(Date.now()) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    status('Exported ' + Object.keys(out.data).length + ' data set(s).', 'ok');
  });
  $('pr-import').addEventListener('click', () => $('pr-file').click());
  $('pr-file').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > 5 * 1024 * 1024) return status('That file is too large to be a progress export.', 'err');
    const r = P.parseImport(await f.text(), C);
    if (!r.ok) return status(r.error, 'err');
    if (!confirm('Replace ALL current progress in this browser with the contents of ' + f.name + '?')) return status('Import cancelled.');
    clearKnown();
    try { for (const [k, v] of Object.entries(r.data)) localStorage.setItem(k, JSON.stringify(v)); } catch (err) { return status('Could not save to this browser (storage unavailable).', 'err'); }
    render(); status('Imported ' + Object.keys(r.data).length + ' data set(s).', 'ok');
  });
  $('pr-reset').addEventListener('click', () => {
    if (!confirm('Delete ALL best scores and run history in this browser? This cannot be undone.')) return;
    clearKnown(); render(); status('All progress deleted.', 'ok');
  });
  render();
})();
