// js/zapn/skyscraper.js — Game 9: Skyscraper (planning).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 9 · SKYSCRAPER — block rearrangement puzzle
// ══════════════════════════════════════════════════════
function startSkyscraper(){
  const g=myGen();
  function alive(){return myGen()===g;}

  // ── Block colours ────────────────────────────────
  const COLORS={
    red:    {bg:'#E84040',dark:'#C02020',label:'red'},
    green:  {bg:'#4CC94C',dark:'#2EA02E',label:'grn'},
    blue:   {bg:'#5B8EF0',dark:'#3060C0',label:'blu'},
    yellow: {bg:'#F5D34B',dark:'#C8A800',label:'yel'},
    pink:   {bg:'#F075C8',dark:'#C040A0',label:'pnk'},
    orange: {bg:'#F09040',dark:'#C06010',label:'org'},
    teal:   {bg:'#40C8C0',dark:'#209090',label:'tel'},
  };
  const COLOR_KEYS=Object.keys(COLORS);

  // ── Level config: [nBlocks, minOptimal] ──────────
  const LEVELS=[
    [4,5],[4,6],[4,7],      // levels 1-3: 4 blocks
    [5,7],[5,9],[5,11],     // levels 4-6: 5 blocks
    [6,10],[6,13],          // levels 7-8: 6 blocks
    [7,14],[7,16],          // levels 9-10: 7 blocks
  ];
  const TOTAL_LEVELS=10;

  // ── State ────────────────────────────────────────
  let levelIdx=0, piles, targetPiles, selected, moves, optimal, roundStart;
  let overPars=[], times=[], optimals=[], userMoves=[];

  // ── BFS ─────────────────────────────────────────
  function stateKey(p){return p.map(pile=>pile.join(',')).join('|');}
  function bfs(startP,tgtP){
    const goal=stateKey(tgtP);
    const start=startP.map(p=>[...p]);
    const startKey=stateKey(start);
    if(startKey===goal)return 0;
    const visited=new Map([[startKey,null]]);
    const queue=[start];
    let head=0;
    while(head<queue.length){
      const cur=queue[head++];
      const curKey=stateKey(cur);
      for(let i=0;i<3;i++){
        if(!cur[i].length)continue;
        const top=cur[i][cur[i].length-1];
        for(let j=0;j<3;j++){
          if(i===j)continue;
          const ns=cur.map(p=>[...p]);
          ns[i].pop();ns[j].push(top);
          const nk=stateKey(ns);
          if(visited.has(nk))continue;
          visited.set(nk,curKey);
          if(nk===goal){
            // count path length
            let depth=0,k=nk;
            while(visited.get(k)!==null){k=visited.get(k);depth++;}
            return depth;
          }
          queue.push(ns);
        }
      }
    }
    return -1;
  }

  // ── Puzzle generation ────────────────────────────
  function generateTarget(colors){
    const n=colors.length;
    const maxP=n<=3?1:n<=5?2:3;
    const nP=rand(1,maxP);
    const active=[...Array(3).keys()].sort(()=>Math.random()-.5).slice(0,nP);
    const shuffled=[...colors].sort(()=>Math.random()-.5);
    const tgt=[[],[],[]];
    active.forEach((a,i)=>tgt[a].push(shuffled[i]));
    shuffled.slice(nP).forEach(c=>tgt[active[Math.floor(Math.random()*nP)]].push(c));
    return tgt;
  }

  function generateStart(colors,tgtP){
    for(let attempt=0;attempt<200;attempt++){
      const shuffled=[...colors].sort(()=>Math.random()-.5);
      const nA=Math.random()<0.5?2:3;
      const active=[...Array(3).keys()].sort(()=>Math.random()-.5).slice(0,nA);
      const sp=[[],[],[]];
      shuffled.forEach((c,ci)=>sp[active[ci%nA]].push(c));
      if(active.some(a=>!sp[a].length))continue;
      if(stateKey(sp)===stateKey(tgtP))continue;
      return sp;
    }
    // fallback: all on pile 0
    return [colors,[], []];
  }

  function newLevel(){
    if(!alive())return;
    const [nBlocks,minOpt]=LEVELS[levelIdx];
    const colors=COLOR_KEYS.slice(0,nBlocks);

    let tgt,sp,opt;
    let attempts=0;
    do{
      attempts++;
      tgt=generateTarget(colors);
      sp=generateStart(colors,tgt);
      opt=bfs(sp,tgt);
    }while((opt<minOpt||opt<0)&&attempts<300);

    if(opt<0)opt=minOpt; // fallback

    piles=sp.map(p=>[...p]);
    targetPiles=tgt;
    optimal=opt;
    selected=null;
    moves=0;
    roundStart=performance.now();
    render();
    setStats(`<div class="stat-pill">Level <b>${levelIdx+1}/${TOTAL_LEVELS}</b></div><div class="stat-pill">Moves <b id="sky-mv">0</b></div>`);
  }

  // ── SVG block rendering ──────────────────────────
  function blockHTML(colorKey,mini=false,floating=false){
    const c=COLORS[colorKey];
    const cls='sky-block'+(mini?' mini':'')+(floating?' sky-floating':'');
    return`<div class="${cls}" style="background:${c.bg};border-bottom:3px solid ${c.dark};box-shadow:0 3px 8px rgba(0,0,0,.35)"></div>`;
  }

  function emptySlotHTML(mini=false){
    return`<div class="${mini?'sky-pile-slot mini':'sky-pile-slot'}"></div>`;
  }

  function renderPilesHTML(pilesArr,mini=false,selectedIdx=null){
    const maxH=Math.max(...pilesArr.map(p=>p.length),1);
    return pilesArr.map((pile,i)=>{
      const isSel=selectedIdx===i;
      const paddingSlots=maxH-pile.length;
      let inner='';
      for(let k=0;k<paddingSlots;k++)inner+=emptySlotHTML(mini);
      // Render bottom to top: array index 0=bottom, so render in reverse for top-of-stack first (CSS flex-column)
      for(let k=pile.length-1;k>=0;k--){
        const isTop=k===pile.length-1;
        const floating=isSel&&isTop&&!mini;
        inner+=blockHTML(pile[k],mini,floating);
      }
      inner+=`<div class="sky-base"></div>`;
      return`<div class="sky-pile-col${isSel?' sky-selected-pile':''}" data-pile="${i}" style="cursor:pointer">${inner}</div>`;
    }).join('');
  }

  function render(){
    if(!alive())return;
    const panel=document.getElementById('game-panel');
    if(!panel)return;

    // Use max possible blocks across all levels (7) so height never changes mid-game
    const MAX_BLOCKS=7;
    const gameH=60+MAX_BLOCKS*58;   // 7 blocks × 58px (block 52 + margin 6) + padding
    const tgtH=40+MAX_BLOCKS*42;    // mini blocks ~36+gap

    panel.className='game-panel wide top';
    panel.innerHTML=`<div class="sky-wrap">
      <div class="sky-target-label">Target pattern — level ${levelIdx+1} of ${TOTAL_LEVELS}</div>
      <div class="sky-target-area" style="min-height:${tgtH}px">
        <div class="sky-piles-row" style="min-height:${tgtH-20}px;align-items:flex-end">
          ${renderPilesHTML(targetPiles,true,null)}
        </div>
      </div>
      <div class="sky-game-area" id="sky-game" style="min-height:${gameH}px">
        <div class="sky-piles-row" style="height:${gameH-50}px" id="sky-piles">
          ${renderPilesHTML(piles,false,selected)}
        </div>
        <div class="sky-info-row">
          <div class="sky-move-count">Moves: <span id="sky-mv2">${moves}</span></div>
          <div class="sky-status" id="sky-status">${selected===null?'Click a pile to pick up':'Click destination pile'}</div>
        </div>
      </div>
    </div>`;

    // Use event delegation — click anywhere in sky-game delegates to nearest pile col
    const gameDiv=document.getElementById('sky-game');
    if(gameDiv){
      gameDiv.addEventListener('click',(e)=>{
        // Walk up to find a data-pile element
        let el=e.target;
        while(el&&el!==gameDiv){
          if(el.dataset&&el.dataset.pile!==undefined){
            onPileClick(parseInt(el.dataset.pile));
            return;
          }
          el=el.parentElement;
        }
      });
    }
  }

  function onPileClick(i){
    if(!alive())return;
    if(selected===null){
      if(piles[i].length===0){showStatus('That pile is empty!');return;}
      selected=i;
      render();
    } else {
      if(i===selected){
        selected=null;
        render();
      } else {
        const block=piles[selected].pop();
        piles[i].push(block);
        moves++;
        selected=null;
        const mv=document.getElementById('sky-mv');
        if(mv)mv.textContent=moves;
        // Render the new state first, then check for win (overlay appended after)
        render();
        if(!alive())return;
        checkWin();
      }
    }
  }

  function showStatus(msg){
    const el=document.getElementById('sky-status');
    if(el)el.textContent=msg;
  }

  function checkWin(){
    if(stateKey(piles)!==stateKey(targetPiles))return false;
    const elapsed=(performance.now()-roundStart)/1000;
    const overPar=moves-optimal;
    overPars.push(overPar);
    times.push(elapsed);
    optimals.push(optimal);
    userMoves.push(moves);

    if(levelIdx+1>=TOTAL_LEVELS){endGame();return true;}

    // Show win overlay — render() was already called, so sky-game exists
    const gameArea=document.getElementById('sky-game');
    if(!gameArea)return true;
    const ov=document.createElement('div');
    ov.className='sky-win-overlay';
    ov.innerHTML=`
      <div class="sky-win-title">Level ${levelIdx+1} solved!</div>
      <div class="sky-win-hint">Click anywhere to continue to level ${levelIdx+2}</div>`;
    ov.addEventListener('click',()=>{
      if(!alive())return;
      levelIdx++;
      newLevel();
    });
    gameArea.appendChild(ov);
    return true;
  }

  function endGame(){
    if(!alive())return;
    const avgOver=(overPars.reduce((a,b)=>a+b,0)/overPars.length);
    const avgTime=(times.reduce((a,b)=>a+b,0)/times.length);
    const label=`${avgOver.toFixed(2)} over par @ ${avgTime.toFixed(1)}s`;
    saveScore('skyscraper',avgOver,label);
    setStats('');

    // Build per-level table columns
    const levelHeaders=Array.from({length:TOTAL_LEVELS},(_,i)=>`<th style="padding:6px 10px;text-align:center;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);min-width:52px">L${i+1}</th>`).join('');
    const optRow=optimals.map(v=>`<td style="padding:6px 10px;text-align:center;font-family:'DM Mono',monospace;font-size:.82rem;color:var(--text2)">${v}</td>`).join('');
    const movRow=userMoves.map(v=>`<td style="padding:6px 10px;text-align:center;font-family:'DM Mono',monospace;font-size:.82rem;color:var(--text)">${v}</td>`).join('');
    const parRow=overPars.map(v=>{
      const col=v===0?'var(--green)':v<=2?'var(--yellow)':'var(--red)';
      return`<td style="padding:6px 10px;text-align:center;font-family:'DM Mono',monospace;font-size:.82rem;font-weight:700;color:${col}">${v===0?'+0':'+'+v}</td>`;
    }).join('');

    setPanel(`<div style="width:100%;display:flex;flex-direction:column;gap:20px;align-items:center">
      <div class="result-card" style="width:100%">
        <h3>Skyscraper complete</h3>
        <div class="result-num">${avgOver.toFixed(2)}<span style="font-size:2rem;color:var(--muted)"> over par</span></div>
        <div class="result-sub">Avg extra moves per level · Avg solve time: ${avgTime.toFixed(1)}s</div>
      </div>
      <div style="width:100%;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;overflow:hidden;font-size:.88rem">
          <thead><tr style="background:var(--surface2)">
            <th style="padding:6px 14px;text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);white-space:nowrap">Level</th>
            ${levelHeaders}
          </tr></thead>
          <tbody>
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:6px 14px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);white-space:nowrap">Optimal</td>
              ${optRow}
            </tr>
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:6px 14px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);white-space:nowrap">Your moves</td>
              ${movRow}
            </tr>
            <tr style="border-top:1px solid var(--border);background:var(--surface2)">
              <td style="padding:6px 14px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);white-space:nowrap">Par</td>
              ${parRow}
            </tr>
          </tbody>
        </table>
      </div>
      <button class="again-btn" onclick="startSkyscraper()">Play again</button>
    </div>`,true);
  }

  // ── Start screen ─────────────────────────────────
  setStats('');
  setPanel(`<div class="start-card">
    <h3>Skyscraper</h3>
    <p>Rearrange coloured blocks across three piles to match the target pattern shown above the game area. Click a pile to pick up its top block, then click another pile to place it. 10 levels, 4 to 7 blocks — score is average moves over the optimal solution.</p>
    <button class="big-btn" onclick="skyGo()">Begin</button>
  </div>`);
  window.skyGo=()=>{if(!alive())return;levelIdx=0;overPars=[];times=[];optimals=[];userMoves=[];newLevel();};
}
