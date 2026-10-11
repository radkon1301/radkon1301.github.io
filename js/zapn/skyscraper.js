// js/zapn/skyscraper.js — Game 9: Skyscraper (planning).
// Docs: docs/zapn.md

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

  // ── Level config: [nBlocks, minOptimal], taken from the pre-solved bank (js/zapn/skyscraper-bank.js) ──
  const LEVELS=SKY_BANK.map(l=>[l.n,l.minOpt]);   // levels 1-3: 4 blocks, 4-6: 5, 7-8: 6, 9-10: 7
  const TOTAL_LEVELS=LEVELS.length;

  // ── State ────────────────────────────────────────
  let levelIdx=0, piles, targetPiles, selected, moves, optimal, roundStart;
  let overPars=[], times=[], optimals=[], userMoves=[];

  // ── Puzzles ──────────────────────────────────────
  // No search at play time: each level picks a pre-solved puzzle from SKY_BANK and randomly relabels the
  // blocks / permutes the piles (skyPuzzleFromBank). Optimal move counts are exact and the pick is instant.
  function stateKey(p){return p.map(pile=>pile.join(',')).join('|');}
  const toColors=(pz,colors)=>pz.map(p=>p.map(i=>colors[i]));
  function puzzleFor(idx){
    const lv=SKY_BANK[idx];
    return skyPuzzleFromBank(lv.puzzles[Math.floor(Math.random()*lv.puzzles.length)],lv.n);
  }

  function newLevel(){
    if(!alive())return;
    const [nBlocks]=LEVELS[levelIdx];
    const colors=COLOR_KEYS.slice(0,nBlocks);
    const pz=puzzleFor(levelIdx);

    piles=toColors(pz.start,colors);
    targetPiles=toColors(pz.target,colors);
    optimal=pz.optimal;
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

    // Sizes live in CSS (css/zapn.css, --sk-h scales with viewport height); both areas reserve room for
    // 7 stacked blocks so the layout never changes height between levels.
    panel.className='game-panel wide top sky-panel';
    panel.innerHTML=`<div class="sky-wrap">
      <div class="sky-target-label">Target pattern — level ${levelIdx+1} of ${TOTAL_LEVELS}</div>
      <div class="sky-target-area">
        <div class="sky-piles-row target">
          ${renderPilesHTML(targetPiles,true,null)}
        </div>
      </div>
      <div class="sky-game-area" id="sky-game">
        <div class="sky-piles-row play" id="sky-piles">
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
