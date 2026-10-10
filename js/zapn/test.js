// js/zapn/test.js — Full Test runner: all games back-to-back.
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  FULL TEST — runs all 8 games in random order
// ══════════════════════════════════════════════════════
function startTest(){
  const TEST_IDS=['shapeshift','codecompare','pincode','numberbox','figureitout','theswitch','stockmaster','bart','skyscraper'];
  const order=[...TEST_IDS].sort(()=>Math.random()-.5);
  let idx=0;
  const testScores={};

  window._testAdvance=function(){
    if(idx>=order.length){showTestResults();return;}
    const id=order[idx++];
    window._testRemaining=order.length-idx; // games remaining after this one
    const g=GAMES.find(x=>x.id===id);
    _gen++;
    document.getElementById('gs-name').textContent=`Test · ${idx}/${order.length} · ${g.title}`;
    document.getElementById('gs-stats').innerHTML='';
    const p=document.getElementById('game-panel');
    p.innerHTML='';p.className='game-panel';
    g.start();
  };

  window._testSaveHook=function(id,v,label){
    testScores[id]={v,label:label||String(v)};
  };

  function showTestResults(){
    window._testAdvance=null;
    window._testSaveHook=null;
    window._testRemaining=null;
    _gen++;
    document.getElementById('gs-name').textContent='Full Test — Results';
    setStats('');
    const rows=TEST_IDS.map(id=>{
      const g=GAMES.find(x=>x.id===id);
      const ts=testScores[id];
      const best=getScoreLabel(id);
      const tsLabel=ts?ts.label:'—';
      const isNewBest=ts&&best&&ts.label===best;
      return`<tr>
        <td style="padding:10px 14px;font-weight:600">${g.icon} ${g.title}</td>
        <td style="padding:10px 14px;font-family:'DM Mono',monospace;font-size:.85rem">${tsLabel}</td>
        <td style="padding:10px 14px;font-family:'DM Mono',monospace;font-size:.85rem;color:var(--muted)">${best||'—'}</td>
        <td style="padding:10px 14px;font-size:.82rem">${isNewBest?'<span style="color:var(--green);font-weight:700">★ New best</span>':''}</td>
      </tr>`;
    }).join('');
    setPanel(`<div style="width:100%;display:flex;flex-direction:column;gap:20px">
      <div style="text-align:center">
        <div style="font-family:'Instrument Serif',serif;font-size:2rem;margin-bottom:4px">Full Test Complete</div>
        <div style="font-family:'DM Mono',monospace;font-size:.8rem;color:var(--muted)">Your scores this run vs personal bests</div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;overflow:hidden;font-size:.9rem">
        <thead><tr style="background:var(--surface2)">
          <th style="padding:8px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Game</th>
          <th style="padding:8px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">This run</th>
          <th style="padding:8px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Personal best</th>
          <th style="padding:8px 14px"></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:center;display:flex;gap:12px;justify-content:center">
        <button class="again-btn" onclick="startTest()">Run again</button>
        <button class="again-btn" style="background:var(--surface2);color:var(--text)" onclick="showDashboard()">Dashboard</button>
      </div>
    </div>`,true);
  }

  // Show intro
  _gen++;
  document.getElementById('dashboard').style.display='none';
  document.getElementById('game-screen').style.display='flex';
  document.getElementById('gs-name').textContent='Full Test';
  document.getElementById('gs-stats').innerHTML='';
  const p=document.getElementById('game-panel');
  p.innerHTML='';p.className='game-panel';
  setPanel(`<div class="start-card">
    <h3>Full Test</h3>
    <p>All 9 exercises back-to-back in a randomised order. A <strong>Next game →</strong> button replaces the usual "Play again" after each one. Scores update your personal bests automatically.</p>
    <p style="font-size:.85rem;color:var(--muted);margin-top:8px">Order: ${order.map(id=>GAMES.find(x=>x.id===id).title).join(' → ')}</p>
    <button class="big-btn" onclick="window._testAdvance&&window._testAdvance()">Begin</button>
  </div>`);
}
