// js/zapn/core.js — Zap-N page core: score store, navigation, key handling, Full Test hook.
// Shared helpers (_gen/myGen, rand, setStats, setPanel, createScoreStore, renderGameCards,
// openGame/closeGame) are in js/common.js. Docs: docs/zapn.md

// ── scores (key me_scores) ──
// Each entry: {v: numeric value for comparison, label: display string}
// ids in LOWER_BETTER use lower-is-better comparison
const LOWER_BETTER=new Set(['shapeshift','numberbox','figureitout','theswitch','skyscraper']);
const scoreStore=createScoreStore('me_scores',{
  lowerBetter:LOWER_BETTER,
  // Test mode: always capture this run's score regardless of whether it's a best
  onSave:(id,v,label)=>{if(window._testSaveHook)window._testSaveHook(id,v,label);}
});
const scores=scoreStore.scores;
function saveScore(id,v,label){scoreStore.save(id,v,label);}
function getScoreLabel(id){return scoreStore.label(id);}

// ── Full Test state (set by startTest in test.js; must be cleared whenever a game is left) ──
function resetTestState(){window._testAdvance=null;window._testSaveHook=null;window._testRemaining=null;}

// ── dashboard / navigation ──
function renderDashboard(){renderGameCards('games-grid',GAMES,getScoreLabel);}
function showDashboard(){resetTestState();clearKeys();closeGame();}
function launchGame(id){resetTestState();openGame(GAMES,id);}

// ── Full Test hook, called by setPanel() in common.js ──
// Test mode: replace again-btn with Next game / See results button
function afterSetPanel(){
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

// ── keyboard: one active keydown handler at a time ──
let _kfn=null;
function setKey(fn){clearKeys();_kfn=fn;document.addEventListener('keydown',_kfn);}
function clearKeys(){if(_kfn){document.removeEventListener('keydown',_kfn);_kfn=null;}}
