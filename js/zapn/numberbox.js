// js/zapn/numberbox.js — Game 4: NumberBox (arithmetic).
// Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 4 · NUMBERBOX
// ══════════════════════════════════════════════════════
function startNumberBox(){
  const TOTAL=5;
  let round=0,score=0,puzzle=null;
  let pool=[],selId=null,pendingOp=null,interCount=0;
  let roundTimes=[],roundStartedAt=null; // timing
  const g=myGen();
  function alive(){return myGen()===g;}

  const opSym={'+':'+','-':'−','*':'×','/':'÷'};

  function apply(a,b,o){
    if(o==='+')return a+b;
    if(o==='-')return a-b;
    if(o==='*')return a*b;
    if(o==='/'){if(b===0||a%b!==0)return null;return a/b;}
    return null;
  }

  // Generate a puzzle using the same pool-reduction model the player uses:
  // repeatedly pick two values from the pool, apply an op, replace them with the result.
  // This guarantees the target IS reachable with those exact numbers.
  // We try many random reduction paths; if any yields a nice target we return it.
  function genPuzzle(){
    const ops=['+','-','*','/'];

    for(let attempt=0;attempt<600;attempt++){
      const nums=Array.from({length:4},()=>rand(1,12));
      // Simulate a random sequence of 3 pool-reduction steps
      let pool=[...nums];
      let ok=true;
      for(let step=0;step<3;step++){
        // Pick two distinct indices
        const i=rand(0,pool.length-1);
        let j; do{j=rand(0,pool.length-1);}while(j===i);
        const o=ops[rand(0,3)];
        const a=pool[i],b=pool[j];
        const r=apply(a,b,o);
        if(r===null||!Number.isInteger(r)){ok=false;break;}
        // Replace the two values with the result
        const next=pool.filter((_,k)=>k!==i&&k!==j);
        next.push(r);
        pool=next;
      }
      if(!ok||pool.length!==1)continue;
      const target=pool[0];
      if(target>=2&&target<=48&&Number.isInteger(target)){
        return{nums,target};
      }
    }
    // Guaranteed fallback: (1+2)*4-3=9. Verify: 1+2=3, 3*4=12, 12-3=9 ✓ uses all 4
    return{nums:[1,2,3,4],target:9};
  }

  function startRound(){
    if(!alive())return;
    if(round>=TOTAL){endGame();return;}
    round++;
    puzzle=genPuzzle();
    interCount=0;
    // pool starts as the 4 corner numbers
    pool=puzzle.nums.map((v,i)=>({id:'orig'+i,val:v,isInter:false}));
    selId=null;pendingOp=null;
    roundStartedAt=performance.now();
    stat();
    renderRound();
  }

  function stat(){if(!alive())return;setStats(`<div class="stat-pill">Round <b>${round}</b>/${TOTAL}</div><div class="stat-pill">Score <b>${score}</b></div>`);}

  // Count how many original numbers have been consumed (used into intermediate blocks)
  // A number is consumed if it's not in pool (either used in an intermediate, or the intermediate itself was used)
  // We track this by: origUsed = orig blocks no longer in pool
  function origUsedCount(){
    const origInPool=pool.filter(b=>!b.isInter).length;
    return 4-origInPool;
  }
  // All 4 originals consumed = they've all been used in operations
  function allOrigUsed(){return origUsedCount()===4;}

  function renderRound(){
    if(!alive())return;
    const{nums,target}=puzzle;
    // Determine which original slots are still available or used
    const origBlocks=pool.filter(b=>!b.isInter);
    const origUsedIds=new Set(
      puzzle.nums.map((_,i)=>'orig'+i).filter(id=>!pool.find(b=>b.id===id))
    );
    const interBlocks=pool.filter(b=>b.isInter);

    // Rebuild grid: orig blocks in their fixed corner positions
    function cornerHTML(idx){
      const inPool=pool.find(b=>b.id==='orig'+idx);
      if(inPool){
        const isSel=selId===inPool.id;
        return`<div class="nb-num${isSel?' sel':''}" id="nb-orig${idx}" onclick="nbSel('orig${idx}')">${inPool.val}</div>`;
      } else {
        return`<div class="nb-num used">—</div>`;
      }
    }

    const interHTML=interBlocks.length>0
      ?`<div class="nb-intermediates" id="nb-inters">
          ${interBlocks.map(b=>`<div class="nb-inter${selId===b.id?' sel':''}" id="nb-${b.id}" onclick="nbSel('${b.id}')">${b.val}</div>`).join('')}
        </div>`
      :`<div class="nb-intermediates" id="nb-inters"></div>`;

    // Check if solution is complete: pool has exactly 1 block whose value = target AND all 4 originals consumed
    const canSubmit=pool.length===1&&allOrigUsed()&&Math.abs(pool[0].val-target)<0.001;

    setPanel(`<div class="nb-wrap">
      <div class="prog-track"><div class="prog-fill" style="width:${(round-1)/TOTAL*100}%"></div></div>
      <div class="nb-grid">
        ${cornerHTML(0)}<div class="nb-gap"></div>
        ${cornerHTML(1)}
        <div class="nb-gap"></div>
        <div class="nb-center-cell"><div class="nb-target-ring${canSubmit?' achieved':''}" id="nb-tgt">${target}</div></div>
        <div class="nb-gap"></div>
        ${cornerHTML(2)}<div class="nb-gap"></div>
        ${cornerHTML(3)}
      </div>
      ${interHTML}
      <div class="nb-ops">
        ${['+','-','×','÷'].map((s,i)=>`<button class="nb-op${pendingOp===['+','-','*','/'][i]?' sel':''}" id="nbop${i}" onclick="nbOp('${['+','-','*','/'][i]}')">${s}</button>`).join('')}
      </div>
      <div class="nb-expr" id="nb-expr">—</div>
      <div class="nb-row-btns">
        <button class="nb-small" onclick="nbReset()">Reset</button>
        <button class="nb-small go" id="nb-go" onclick="nbSubmit()" ${canSubmit?'':'disabled'}>Submit ✓</button>
      </div>
    </div>`);
    updExpr();
  }

  window.nbSel=blockId=>{
    if(!alive())return;
    const block=pool.find(b=>b.id===blockId);
    if(!block)return;

    if(selId===null){
      // First selection
      selId=blockId;
      const el=document.getElementById('nb-'+blockId);
      if(el)el.classList.add('sel');
      updExpr();
    } else if(selId===blockId){
      // Deselect
      selId=null;
      const el=document.getElementById('nb-'+blockId);
      if(el)el.classList.remove('sel');
      updExpr();
    } else if(pendingOp!==null){
      // Second selection with an op — compute result
      const a=pool.find(b=>b.id===selId);
      const b=block;
      if(!a||!b)return;
      const r=apply(a.val,b.val,pendingOp);
      if(r===null){flashEl('nb-tgt');return;}

      // Remove both from pool, add intermediate result
      const newId='inter'+(interCount++);
      pool=pool.filter(x=>x.id!==a.id&&x.id!==b.id);
      pool.push({id:newId,val:r,isInter:true});
      selId=null;pendingOp=null;
      renderRound();
    }
  };

  // Fix element ID for orig blocks: 'orig0' → element id is 'nb-orig0'
  // But we set onclick="nbSel('orig0')" and element id="nb-orig0"
  // Unified: all blocks use id="nb-{blockId}" and onclick="nbSel('{blockId}')"

  window.nbOp=o=>{
    if(!alive()||selId===null)return;
    pendingOp=o;
    // Update op button highlights
    ['+','-','*','/'].forEach((op,i)=>{
      const b=document.getElementById('nbop'+i);
      if(b)b.classList.toggle('sel',op===o);
    });
    updExpr();
  };

  function updExpr(){
    const el=document.getElementById('nb-expr');if(!el)return;
    if(selId===null){el.innerHTML='—';return;}
    const block=pool.find(b=>b.id===selId);
    if(!block){el.innerHTML='—';return;}
    if(pendingOp){
      el.innerHTML=`<b>${block.val}</b> ${opSym[pendingOp]} <span style="color:var(--muted)">?</span>`;
    } else {
      el.innerHTML=`<b>${block.val}</b>`;
    }
  }

  function flashEl(id){
    const el=document.getElementById(id);if(!el)return;
    el.style.outline='2px solid var(--red)';
    setTimeout(()=>{if(el)el.style.outline='';},400);
  }

  window.nbReset=()=>{
    if(!alive())return;
    // Restore pool to original 4 numbers
    interCount=0;
    pool=puzzle.nums.map((v,i)=>({id:'orig'+i,val:v,isInter:false}));
    selId=null;pendingOp=null;
    renderRound();
  };

  window.nbSubmit=()=>{
    if(!alive())return;
    const go=document.getElementById('nb-go');
    if(go){go.disabled=true;}
    const canSubmit=pool.length===1&&allOrigUsed()&&Math.abs(pool[0].val-puzzle.target)<0.001;
    if(canSubmit){
      score++;
      const elapsed=performance.now()-(roundStartedAt||performance.now());
      roundTimes.push(elapsed);
      setTimeout(()=>{if(alive())startRound();},600);
    }
  };

  function endGame(){
    if(!alive())return;
    const avg=roundTimes.length?roundTimes.reduce((a,b)=>a+b,0)/roundTimes.length:0;
    const avgS=(avg/1000).toFixed(2);
    const label=`${avgS}s avg`;
    saveScore('numberbox', avg, label);
    setStats('');
    setPanel(`<div class="result-card">
      <h3>NumberBox complete</h3>
      <div class="result-num">${score}<span style="font-size:2rem;color:var(--muted)">/${TOTAL}</span></div>
      <div class="result-sub">Solved · Avg time: ${avgS}s</div>
      <button class="again-btn" onclick="startNumberBox()">Play again</button>
    </div>`);
  }

  setStats('');
  setPanel(`<div class="start-card">
    <h3>NumberBox</h3>
    <p>Four numbers sit at the corners. Combine any two using +&nbsp;−&nbsp;×&nbsp;÷ to create an intermediate result (shown in purple). Keep combining — using all four originals — until you reach the target. 5 puzzles.</p>
    <button class="big-btn" onclick="nbGo()">Begin</button>
  </div>`);

  window.nbGo=()=>{ if(!alive())return; startRound(); };
}
