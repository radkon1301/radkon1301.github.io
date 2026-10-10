// js/zapn/core.js — Scores, generation guard, dashboard, navigation, shared helpers (setStats/setPanel/rand/setKey).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ── scores ──
// Each entry: {v: numeric value for comparison, label: display string}
// lowerBetter ids use lower-is-better comparison
const LOWER_BETTER=new Set(['shapeshift','numberbox','figureitout','theswitch','skyscraper']);
let scores = {};
try {
  const raw = JSON.parse(localStorage.getItem('me_scores')||'{}');
  let anyKept = false;
  Object.keys(raw).forEach(k=>{
    const v = raw[k];
    if(v != null && typeof v === 'object' && typeof v.label === 'string' && typeof v.v === 'number'){
      scores[k] = v;
      anyKept = true;
    }
  });
  // If nothing survived the filter the storage only had old-format data — wipe it
  if(!anyKept) localStorage.removeItem('me_scores');
} catch(e){ try{localStorage.removeItem('me_scores');}catch(_){} }

function saveScore(id, v, label) {
  const entry = {v, label: label||String(v)};
  const cur = scores[id];
  const curV = cur!=null && typeof cur==='object' ? cur.v : null;
  const better = curV==null
    ? true
    : LOWER_BETTER.has(id) ? v < curV : v > curV;
  if(better){
    scores[id]=entry;
    try{localStorage.setItem('me_scores',JSON.stringify(scores));}catch(e){}
  }
  // Test mode: always capture this run's score regardless of whether it's a best
  if(window._testSaveHook) window._testSaveHook(id, v, label||String(v));
}

function getScoreLabel(id){
  const s=scores[id];
  if(s==null) return null;
  if(typeof s==='object' && s.label!=null) return s.label;
  return null; // discard anything malformed
}

// ── game generation guard — incremented on every showDashboard/launchGame ──
// Each game closure captures the generation at start; any async callback checks
// it before doing anything, so stale timers from abandoned games are silently dropped.
let _gen = 0;
function myGen() { return _gen; }

// ── dashboard ──
function renderDashboard() {
  document.getElementById('games-grid').innerHTML = GAMES.map(g=>`
    <div class="game-card" onclick="launchGame('${g.id}')">
      <div class="card-tag">${g.tag}</div>
      <div class="card-icon-row">${g.icon}</div>
      <div class="card-title">${g.title}</div>
      <div class="card-desc">${g.desc}</div>
      <div class="card-meta">
        ${g.meta.map(m=>`<span class="chip">${m}</span>`).join('')}
        ${getScoreLabel(g.id)!=null?`<span class="chip hi">Best: ${getScoreLabel(g.id)}</span>`:''}
      </div>
      <button class="play-btn">Start exercise →</button>
    </div>`).join('');
}

function showLanding() {
  _gen++;
  window._testAdvance=null;window._testSaveHook=null;window._testRemaining=null;
  clearKeys();
  document.getElementById('landing').style.display='';
  document.getElementById('dashboard').style.display='none';
  document.getElementById('game-screen').style.display='none';
}

function showZapN() {
  document.getElementById('landing').style.display='none';
  document.getElementById('dashboard').style.display='block';
  document.getElementById('game-screen').style.display='none';
  renderDashboard();
}

function showDashboard() {
  _gen++; // invalidate all running game callbacks
  window._testAdvance=null;window._testSaveHook=null;window._testRemaining=null;
  clearKeys();
  document.getElementById('landing').style.display='none';
  document.getElementById('dashboard').style.display='block';
  document.getElementById('game-screen').style.display='none';
  renderDashboard();
}

function launchGame(id) {
  _gen++; // invalidate any previous game
  window._testAdvance=null;window._testSaveHook=null;window._testRemaining=null;
  const g = GAMES.find(x=>x.id===id);
  document.getElementById('dashboard').style.display='none';
  document.getElementById('game-screen').style.display='flex';
  document.getElementById('gs-name').textContent = g.title;
  document.getElementById('gs-stats').innerHTML = '';
  const p = document.getElementById('game-panel');
  p.innerHTML=''; p.className='game-panel';
  g.start();
}

// ── helpers ──
function setStats(html){document.getElementById('gs-stats').innerHTML=html;}
function setPanel(html,top){
  const p=document.getElementById('game-panel');
  p.className='game-panel'+(top?' top':'');
  p.innerHTML=html;
  // Test mode: replace again-btn with Next game / See results button
  if(window._testAdvance){
    setTimeout(()=>{
      const panel=document.getElementById('game-panel');if(!panel)return;
      const btn=panel.querySelector('.again-btn');
      if(!btn)return;
      // Don't replace the test results page buttons
      if(btn.textContent==='Run again'||btn.textContent==='Dashboard')return;
      const remaining=window._testRemaining!=null?window._testRemaining:1;
      btn.textContent=remaining>0?'Next game →':'See results →';
      btn.onclick=window._testAdvance;
    },50);
  }
}
function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
let _kfn=null;
function setKey(fn){clearKeys();_kfn=fn;document.addEventListener('keydown',_kfn);}
function clearKeys(){if(_kfn){document.removeEventListener('keydown',_kfn);_kfn=null;}}

// ── navigation: overridden for multi-page structure ──
// These replace the single-file versions that referenced a #landing div.
function showLanding() {
  _gen++;
  window._testAdvance=null;window._testSaveHook=null;window._testRemaining=null;
  clearKeys();
  window.location.href = 'index.html';
}

function showZapN() {
  document.getElementById('dashboard').style.display='block';
  document.getElementById('game-screen').style.display='none';
  renderDashboard();
}

function showDashboard() {
  _gen++;
  window._testAdvance=null;window._testSaveHook=null;window._testRemaining=null;
  clearKeys();
  document.getElementById('dashboard').style.display='block';
  document.getElementById('game-screen').style.display='none';
  renderDashboard();
}
