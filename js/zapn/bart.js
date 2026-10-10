// js/zapn/bart.js — Game 8: BART (risk).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 8 · BART — Balloon Analogue Risk Task
// ══════════════════════════════════════════════════════
function startBART(){
  const g=myGen();
  function alive(){return myGen()===g;}

  // ── Config ────────────────────────────────────────
  const BALLOON_COLORS=[
    {name:'Blue', color:'#6478e0',dark:'#4456b8'},
    {name:'Red',  color:'#e05050',dark:'#b83030'},
    {name:'Green',color:'#3dc87a',dark:'#28935a'},
  ];
  const RISK_TIERS=[
    {popBase:0.04,popGrowth:0.10},
    {popBase:0.07,popGrowth:0.14},
    {popBase:0.10,popGrowth:0.18},
  ];
  const ROUND_CFG=[
    {balloons:30,centsPerPump:0.10,penalty:0.00},
    {balloons:20,centsPerPump:0.20,penalty:0.50},
  ];

  let BALLOON_DEFS=[];
  function jitter(v,a=0.01){return Math.max(0.005,v+(Math.random()*2-1)*a);}
  function assignRisks(){
    const tiers=[...RISK_TIERS].sort(()=>Math.random()-.5);
    BALLOON_DEFS=BALLOON_COLORS.map((c,i)=>({...c,popBase:jitter(tiers[i].popBase,.01),popGrowth:jitter(tiers[i].popGrowth,.01)}));
  }

  // ── State ─────────────────────────────────────────
  let roundIdx,balloonsLeft,pumps,balloonEarned,roundEarned,totalEarned;
  let currentDef,bartState,bSetStats;
  let roundQueue=[];  // pre-shuffled color sequence for current round

  function buildRoundQueue(roundI){
    // Build a balanced pool: R1=10+10+10, R2=6+6+7 (random color gets the extra)
    const n=BALLOON_DEFS.length;
    const cfg=ROUND_CFG[roundI];
    const base=Math.floor(cfg.balloons/n);
    const extra=cfg.balloons - base*n;
    // Assign counts: base for all, then randomly distribute extras
    const counts=BALLOON_DEFS.map(()=>base);
    // Pick 'extra' distinct indices at random to get +1
    const indices=[...Array(n).keys()].sort(()=>Math.random()-.5).slice(0,extra);
    indices.forEach(i=>{counts[i]++;});
    // Build pool and shuffle
    const pool=[];
    BALLOON_DEFS.forEach((d,i)=>{for(let j=0;j<counts[i];j++)pool.push(d);});
    // Fisher-Yates shuffle
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return pool;
  }

  function resetBART(){
    assignRisks();
    roundIdx=0;totalEarned=0;
    bSetStats={};
    BALLOON_DEFS.forEach(d=>{bSetStats[d.name]={pops:0,cashed:0,balloonsByRound:[[],[]]};});
    const arena=document.getElementById('bart-arena');
    if(!arena)return;
    arena.innerHTML=bartArenaGameHTML();
    bartStartRound();
  }

  function bartStartRound(){
    if(!alive())return;
    const cfg=ROUND_CFG[roundIdx];
    balloonsLeft=cfg.balloons; roundEarned=0;
    roundQueue=buildRoundQueue(roundIdx);
    bartDrawBg();bartNewBalloon();
    bartState='playing';bartUpdateInfo();bartUpdateStats();
  }

  function bartNewBalloon(){
    // Draw next color from the pre-built balanced queue
    currentDef=roundQueue.length>0 ? roundQueue.shift() : BALLOON_DEFS[Math.floor(Math.random()*BALLOON_DEFS.length)];
    pumps=0;balloonEarned=0;
    bartSetSize(52,true);bartSetColor(currentDef);
    const pl=document.getElementById('bart-pop');
    const cl=document.getElementById('bart-cash');
    if(pl)pl.classList.remove('show');
    if(cl)cl.classList.remove('show');
    bartSetBtns(true);bartUpdateColorInd();bartUpdateStats();
  }

  // ── SVG helpers ────────────────────────────────────
  const BASE_R=52,BASE_VB=120;
  function bartSetSize(r,instant=false){
    const svg=document.getElementById('bart-svg');if(!svg)return;
    const scale=r/BASE_R;
    const pxW=Math.round(BASE_VB*scale);
    const pxH=Math.round(160*scale);
    if(instant)svg.style.transition='none';
    svg.style.width=pxW+'px';svg.style.height=pxH+'px';
    if(instant)requestAnimationFrame(()=>{svg.style.transition='width .18s cubic-bezier(.34,1.56,.64,1),height .18s cubic-bezier(.34,1.56,.64,1)';});
    svg.setAttribute('viewBox',`0 0 ${BASE_VB} 160`);
  }
  function bartSetColor(def){
    const bc=document.getElementById('b2-circle');
    const bk=document.getElementById('b2-knot');
    const bs=document.getElementById('b2-string');
    if(bc)bc.setAttribute('fill',def.color);
    if(bk)bk.setAttribute('fill',def.dark);
    if(bs)bs.setAttribute('stroke',def.dark+'aa');
  }
  function bartUpdateColorInd(){
    const dot=document.getElementById('b2-dot');const nm=document.getElementById('b2-name');
    if(dot)dot.style.background=currentDef.color;
    if(nm)nm.textContent=currentDef.name;
  }
  function bartGrow(){
    const r=Math.min(52+pumps*6,110);bartSetSize(r);
  }

  // ── Background balloons ────────────────────────────
  function bartDrawBg(){
    const svg=document.getElementById('bart-bg');if(!svg)return;
    svg.innerHTML='';
    for(let i=0;i<18;i++){
      const def=BALLOON_DEFS[Math.floor(Math.random()*BALLOON_DEFS.length)];
      const r=14+Math.random()*28;
      const cx=10+Math.random()*640;
      const cy=10+Math.random()*220;
      const g2=document.createElementNS('http://www.w3.org/2000/svg','g');
      g2.setAttribute('opacity',(.35+Math.random()*.3).toFixed(2));
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r',r);
      c.setAttribute('fill',def.color);
      const hi=document.createElementNS('http://www.w3.org/2000/svg','circle');
      hi.setAttribute('cx',cx-r*.25);hi.setAttribute('cy',cy-r*.25);hi.setAttribute('r',r*.25);
      hi.setAttribute('fill','white');hi.setAttribute('opacity','.25');
      const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',cx);ln.setAttribute('y1',cy+r);
      ln.setAttribute('x2',cx);ln.setAttribute('y2',cy+r+16);
      ln.setAttribute('stroke',def.dark);ln.setAttribute('stroke-width','1.5');
      g2.append(c,hi,ln);svg.appendChild(g2);
    }
  }

  // ── Pump & Cash ────────────────────────────────────
  window.bartPump=()=>{
    if(!alive()||bartState!=='playing')return;
    const cfg=ROUND_CFG[roundIdx];
    pumps++;
    balloonEarned=+(pumps*cfg.centsPerPump).toFixed(2);
    bartGrow();bartUpdateStats();
    const popProb=Math.min(1,currentDef.popBase*Math.exp(currentDef.popGrowth*(pumps-1)));
    if(Math.random()<popProb){
      bSetStats[currentDef.name].pops++;
      bSetStats[currentDef.name].balloonsByRound[roundIdx].push({pumps,cashed:false});
      bartState='popped';bartSetBtns(false);
      if(cfg.penalty>0){
        const loss=Math.min(balloonEarned,cfg.penalty);
        roundEarned=+(roundEarned-loss).toFixed(2);
        totalEarned=+(totalEarned-loss).toFixed(2);
      }
      balloonEarned=0;bartUpdateStats();bartShowPop();
    }
  };
  window.bartCash=()=>{
    if(!alive()||bartState!=='playing')return;
    bSetStats[currentDef.name].cashed++;
    bSetStats[currentDef.name].balloonsByRound[roundIdx].push({pumps,cashed:true});
    roundEarned=+(roundEarned+balloonEarned).toFixed(2);
    totalEarned=+(totalEarned+balloonEarned).toFixed(2);
    bartState='cashed';bartSetBtns(false);
    const cl=document.getElementById('bart-cash');
    if(cl){cl.textContent=`+$${balloonEarned.toFixed(2)}`;cl.classList.remove('show');void cl.offsetWidth;cl.classList.add('show');}
    bartUpdateStats();
    setTimeout(bartAfter,800);
  };

  function bartShowPop(){
    const pl=document.getElementById('bart-pop');
    if(pl)pl.classList.add('show');
    const bsvg=document.getElementById('bart-svg');
    if(bsvg)bsvg.style.opacity='0';
    const arena=document.getElementById('bart-arena');
    if(arena){
      for(let i=0;i<14;i++){
        const p=document.createElement('div');
        p.style.cssText=`position:absolute;border-radius:50%;pointer-events:none;animation:burst .5s ease-out forwards;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;background:${currentDef.color};left:calc(50% - 4px);top:calc(43% - 4px);--dx:${Math.cos(i/14*Math.PI*2)*(60+Math.random()*40)}px;--dy:${Math.sin(i/14*Math.PI*2)*(60+Math.random()*40)}px`;
        arena.appendChild(p);
        p.addEventListener('animationend',()=>p.remove());
      }
    }
    setTimeout(bartAfter,800);
  }

  function bartAfter(){
    if(!alive())return;
    const bsvg=document.getElementById('bart-svg');
    if(bsvg)bsvg.style.opacity='1';
    balloonsLeft--;
    if(balloonsLeft<=0){
      roundIdx++;
      if(roundIdx>=ROUND_CFG.length) bartShowSetEnd();
      else bartShowRoundEnd();
    } else {bartNewBalloon();bartState='playing';}
  }

  // ── UI helpers ─────────────────────────────────────
  function bartSetBtns(on){
    const bp=document.getElementById('bart-pump-btn');
    const bc=document.getElementById('bart-cash-btn');
    if(bp)bp.disabled=!on;if(bc)bc.disabled=!on;
  }
  function bartUpdateInfo(){
    if(!alive())return;
    const cfg=ROUND_CFG[roundIdx];
    const balloonNum=cfg.balloons-balloonsLeft+1;
    const rl=document.getElementById('b2-round');
    if(rl)rl.textContent=`Round ${roundIdx+1}  ·  Balloon ${balloonNum}/${cfg.balloons}  ·  $${cfg.centsPerPump.toFixed(2)}/pump`;
    const pb=document.getElementById('b2-penalty');
    if(!pb)return;
    if(cfg.penalty>0){pb.style.display='inline-block';pb.textContent=`⚠ Pop penalty: −$${cfg.penalty.toFixed(2)}`;}
    else pb.style.display='none';
  }
  function bartUpdateStats(){
    if(!alive())return;
    bartUpdateInfo();
    const bEl=document.getElementById('b2-balloon');
    const rEl=document.getElementById('b2-round2');
    const tEl=document.getElementById('b2-total');
    if(bEl)bEl.textContent=`$${balloonEarned.toFixed(2)}`;
    if(rEl){rEl.textContent=`$${roundEarned.toFixed(2)}`;rEl.className='bart-stat-val'+(roundEarned<0?' neg':roundEarned>0?' pos':'');}
    if(tEl){tEl.textContent=`$${totalEarned.toFixed(2)}`;tEl.className='bart-stat-val'+(totalEarned<0?' neg':totalEarned>0?' pos':'');}
  }

  // ── Arena HTML builders ────────────────────────────
  function bartArenaGameHTML(){
    return `
      <svg id="bart-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></svg>
      <div class="bart-round-info">
        <span id="b2-round"></span><br>
        <span class="bart-penalty-badge" id="b2-penalty" style="display:none"></span>
      </div>
      <div class="bart-color-ind">
        <div class="bart-color-dot" id="b2-dot"></div>
        <span id="b2-name"></span>
      </div>
      <svg id="bart-svg" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" width="140" height="187"
           style="position:absolute;left:50%;top:52%;transform:translate(-50%,-44%);display:block;filter:drop-shadow(0 6px 18px rgba(0,0,0,.25));overflow:visible;">
        <defs><radialGradient id="bartGrad" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity=".35"/>
          <stop offset="100%" stop-color="black" stop-opacity=".12"/>
        </radialGradient></defs>
        <circle id="b2-circle" cx="60" cy="60" r="52" fill="#5a6db5"/>
        <circle cx="60" cy="60" r="52" fill="url(#bartGrad)"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="white" stroke-width="3" stroke-opacity=".6"/>
        <polygon id="b2-knot" points="60,112 54,122 66,122" fill="#4456b8" opacity=".8"/>
        <line id="b2-string" x1="60" y1="122" x2="60" y2="155" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
      </svg>
      <div class="bart-pop-lbl" id="bart-pop">POP!</div>
      <div class="bart-cash-lbl" id="bart-cash">+$0.00</div>
      <button onclick="bartSkipRound()" style="position:absolute;top:10px;left:75%;transform:translateX(-50%);font-family:'DM Mono',monospace;font-size:.65rem;color:rgba(255,255,255,.55);background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:3px 12px;cursor:pointer;letter-spacing:.04em;z-index:5" id="bart-skip-btn">skip round</button>`;
  }

  function bartSkipRound(){
    if(!alive()||bartState!=='playing')return;
    // Record remaining balloons as cashed with 0 pumps, using queued colors
    while(balloonsLeft>0){
      const def=roundQueue.length>0 ? roundQueue.shift() : BALLOON_DEFS[Math.floor(Math.random()*BALLOON_DEFS.length)];
      bSetStats[def.name].cashed++;
      bSetStats[def.name].balloonsByRound[roundIdx].push({pumps:0,cashed:true});
      balloonsLeft--;
    }
    roundIdx++;
    if(roundIdx>=ROUND_CFG.length) bartShowSetEnd();
    else bartShowRoundEnd();
  }

  function bartShowRoundEnd(){
    if(!alive())return;
    bartState='round_end';
    bartSetBtns(false);
    const cfg=ROUND_CFG[roundIdx];
    const arena=document.getElementById('bart-arena');
    if(!arena)return;
    arena.innerHTML=`
      <div style="
        position:absolute;inset:0;
        background:linear-gradient(160deg,#1e2860 0%,#3a4fa0 100%);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:14px;cursor:pointer;padding:28px 36px;text-align:center;
      " id="bart-end-card">
        <div style="font-family:'Instrument Serif',serif;font-size:2.6rem;color:#e8bc30;letter-spacing:1px;">Round ${roundIdx} Complete!</div>
        <div style="font-family:'Instrument Serif',serif;font-size:1.5rem;color:white;">Round earned: $${roundEarned.toFixed(2)}</div>
        <div style="font-family:'DM Mono',monospace;font-size:.85rem;color:rgba(255,255,255,.75);line-height:1.7;">
          Total so far: <strong style="color:#e8bc30">$${totalEarned.toFixed(2)}</strong><br><br>
          Round ${roundIdx+1}: ${cfg.balloons} balloons · $${cfg.centsPerPump.toFixed(2)}/pump
          ${cfg.penalty>0?`<br><span style="color:#ffd060">⚠ Pop penalty: −$${cfg.penalty.toFixed(2)}</span>`:''}
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:.78rem;color:rgba(255,255,255,.4);margin-top:4px;">Click anywhere to continue</div>
      </div>`;
    document.getElementById('bart-end-card').addEventListener('click',()=>{
      if(!alive())return;
      const arena2=document.getElementById('bart-arena');
      if(arena2)arena2.innerHTML=bartArenaGameHTML();
      bartStartRound();
    });
  }

  function bartShowSetEnd(){
    if(!alive())return;
    bartState='set_end';
    bartSetBtns(false);
    const rows=BALLOON_DEFS.map(d=>{
      const st=bSetStats[d.name];
      const all=[...st.balloonsByRound[0],...st.balloonsByRound[1]];
      const avg=all.length?(all.reduce((s2,b2)=>s2+b2.pumps,0)/all.length).toFixed(1):'—';
      const p1=(d.popBase*100).toFixed(1)+'%';
      const p5=(Math.min(1,d.popBase*Math.exp(d.popGrowth*4))*100).toFixed(1)+'%';
      const p10=(Math.min(1,d.popBase*Math.exp(d.popGrowth*9))*100).toFixed(1)+'%';
      return`<tr>
        <td><span class="bart-swatch" style="background:${d.color}"></span>${d.name}</td>
        <td>${p1} → ${p5} → ${p10}</td>
        <td>${st.pops}</td><td>${st.cashed}</td><td>${avg}</td>
      </tr>`;
    }).join('');
    const arena=document.getElementById('bart-arena');
    if(!arena)return;
    arena.innerHTML=`
      <div style="
        position:absolute;inset:0;
        background:linear-gradient(160deg,#1e2860 0%,#3a4fa0 100%);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:12px;cursor:pointer;padding:20px 28px;text-align:center;overflow-y:auto;
      " id="bart-end-card">
        <div style="font-family:'Instrument Serif',serif;font-size:2.4rem;color:#e8bc30;letter-spacing:1px;">Set Complete!</div>
        <div style="font-family:'Instrument Serif',serif;font-size:1.5rem;color:white;">Total Earned: $${totalEarned.toFixed(2)}</div>
        <div style="font-family:'DM Mono',monospace;font-size:.8rem;color:rgba(255,255,255,.75);">Balloon Pop Probabilities:</div>
        <table class="bart-prob-table" style="font-size:.78rem;">
          <thead><tr>
            <th>Color</th><th>Pop risk (1→5→10)</th><th>Pops</th><th>Cashed</th><th>Avg pumps</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="font-family:'DM Mono',monospace;font-size:.78rem;color:rgba(255,255,255,.4);margin-top:4px;">Click anywhere to see analysis</div>
      </div>`;
    document.getElementById('bart-end-card').addEventListener('click',()=>{
      if(!alive())return;
      bartShowStats();
    });
  }

  // ── Stats screen & scoring ─────────────────────────
  function expectedValue(def,x,centsPerPump,penalty){
    let survival=1.0;
    for(let n=1;n<=x;n++){const h=Math.min(1,def.popBase*Math.exp(def.popGrowth*(n-1)));survival*=(1-h);}
    return survival*x*centsPerPump-(1-survival)*penalty;
  }
  function optimalPumps(def,centsPerPump,penalty,maxSearch=25){
    let bestX=1,bestEV=-Infinity;
    for(let x=1;x<=maxSearch;x++){const ev=expectedValue(def,x,centsPerPump,penalty);if(ev>bestEV){bestEV=ev;bestX=x;}}
    return{x:bestX,ev:bestEV};
  }
  function adjustedAvg(balloons,optX){
    if(!balloons||!balloons.length)return null;
    const inc=balloons.filter(b=>b.cashed||b.pumps>optX);
    if(!inc.length)return null;
    return inc.reduce((s,b)=>s+b.pumps,0)/inc.length;
  }
  function popDistribution(def,maxY=15){
    const dist=[];let survival=1.0;
    for(let y=1;y<=maxY;y++){
      const h=Math.min(1,def.popBase*Math.exp(def.popGrowth*(y-1)));
      dist.push(Math.max(0,survival*h));
      survival=Math.max(0,survival*(1-h));
    }
    return{dist,surviveAll:survival};
  }

  function bartShowStats(){
    if(!alive())return;
    bartState='stats_screen';

    const MAX_Y=15,CW=148,CH=90;
    const allDists=BALLOON_DEFS.map(d=>popDistribution(d,MAX_Y));
    const globalMax=Math.max(...allDists.flatMap(r=>r.dist),0.001);

    // ── Compute score ──
    let greenCount=0;
    BALLOON_DEFS.forEach((d)=>{
      ROUND_CFG.forEach((cfg,ri)=>{
        const opt=optimalPumps(d,cfg.centsPerPump,cfg.penalty);
        const avg=adjustedAvg(bSetStats[d.name].balloonsByRound[ri],opt.x);
        if(avg!==null&&Math.abs(avg-opt.x)<=0.8)greenCount++;
      });
    });
    const scoreLabel=`$${totalEarned.toFixed(2)} @ ${greenCount}/6`;
    saveScore('bart',totalEarned,scoreLabel);
    setStats(`<div class="stat-pill">Earned <b>$${totalEarned.toFixed(2)}</b></div><div class="stat-pill">Green <b>${greenCount}/6</b></div>`);

    let cardsHtml=BALLOON_DEFS.map((d)=>{
      const di=BALLOON_DEFS.indexOf(d);
      const{dist}=allDists[di];
      const opt1=optimalPumps(d,ROUND_CFG[0].centsPerPump,ROUND_CFG[0].penalty);
      const opt2=optimalPumps(d,ROUND_CFG[1].centsPerPump,ROUND_CFG[1].penalty);
      const avg1=adjustedAvg(bSetStats[d.name].balloonsByRound[0],opt1.x);
      const avg2=adjustedAvg(bSetStats[d.name].balloonsByRound[1],opt2.x);
      function fmtAvg(avg,opt){
        if(avg===null)return`<span style="color:var(--muted)">no data</span>`;
        const diff=avg-opt;
        const col=Math.abs(diff)<=0.8?'var(--green)':diff<0?'var(--red)':'var(--yellow)';
        const sign=diff>0?'+':'';
        return`<span style="color:${col}">${avg.toFixed(1)} pumps (${sign}${diff.toFixed(1)} vs opt)</span>`;
      }
      function evLbl(opt,cfg){const ev=expectedValue(d,opt.x,cfg.centsPerPump,cfg.penalty);return`<b style="color:var(--accent)">${opt.x}</b> pumps · EV=$${ev.toFixed(2)}`;}
      const cid=`bc-${d.name}`;
      const barsJson=JSON.stringify(dist.map(p=>+(p*100).toFixed(3)));
      return`<div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.85rem">
          <span style="width:10px;height:10px;border-radius:50%;background:${d.color};display:inline-block;flex-shrink:0"></span>${d.name}
        </div>
        <canvas id="${cid}" width="${CW}" height="${CH}" data-bars='${barsJson}' data-gmax='${(globalMax*100).toFixed(3)}' data-color='${d.color}' style="width:100%;height:auto;border-radius:4px;background:#fff"></canvas>
        <div style="font-family:'DM Mono',monospace;font-size:.7rem;color:var(--text2);line-height:1.7;border-top:1px solid var(--border);padding-top:6px">
          <span style="color:var(--muted);font-size:.6rem">OPT R1</span><br>${evLbl(opt1,ROUND_CFG[0])}<br>
          <span style="color:var(--muted);font-size:.6rem">OPT R2</span><br>${evLbl(opt2,ROUND_CFG[1])}<br>
          <span style="color:var(--muted);font-size:.6rem">YOUR AVG</span><br>R1: ${fmtAvg(avg1,opt1.x)}<br>R2: ${fmtAvg(avg2,opt2.x)}
        </div>
      </div>`;
    }).join('');

    setPanel(`<div style="width:100%;display:flex;flex-direction:column;gap:16px">
      <div style="text-align:center">
        <div style="font-family:'Instrument Serif',serif;font-size:1.5rem;margin-bottom:4px">BART Complete</div>
        <div style="font-family:'DM Mono',monospace;font-size:.8rem;color:var(--muted)">Pop probability analysis — your average vs optimal pump count</div>
      </div>
      <div style="display:flex;gap:10px;width:100%">${cardsHtml}</div>
      <div style="font-family:'DM Mono',monospace;font-size:.68rem;color:var(--muted);text-align:center">
        <span style="color:var(--green)">●</span> near-optimal &nbsp;
        <span style="color:var(--red)">●</span> under-pumping &nbsp;
        <span style="color:var(--yellow)">●</span> over-pumping
      </div>
      <div style="text-align:center">
        <div style="font-family:'Instrument Serif',serif;font-size:2.5rem;color:var(--accent)">${scoreLabel}</div>
        <div style="color:var(--muted);font-size:.82rem;margin-bottom:20px">total earned · green averages</div>
        <button class="again-btn" onclick="startBART()">Play again</button>
      </div>
    </div>`,true);

    requestAnimationFrame(()=>{
      const dpr=window.devicePixelRatio||1;
      BALLOON_DEFS.forEach(d=>{
        const canvas=document.getElementById(`bc-${d.name}`);if(!canvas)return;
        const bars=JSON.parse(canvas.dataset.bars);
        const maxVal=parseFloat(canvas.dataset.gmax);
        const color=canvas.dataset.color;
        // Scale canvas buffer by dpr for sharpness
        const cssW=canvas.offsetWidth||148;
        const cssH=Math.round(cssW*(90/148));
        canvas.width=Math.round(cssW*dpr);
        canvas.height=Math.round(cssH*dpr);
        canvas.style.width=cssW+'px';
        canvas.style.height=cssH+'px';
        const ctx=canvas.getContext('2d');
        ctx.scale(dpr,dpr);
        const W=cssW,H=cssH;
        const n=bars.length;
        const padT=3,padB=14,chartH=H-padT-padB;
        const barW=W/n;
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
        bars.forEach((val,i)=>{
          const x=i*barW;const bH=(val/maxVal)*chartH;const y=padT+(chartH-bH);
          ctx.fillStyle=color+'cc';ctx.fillRect(x+0.5,y,barW-1,bH);
          ctx.fillStyle=color;ctx.fillRect(x+0.5,y,barW-1,1.5);
          if(i%2===0||i===n-1){ctx.fillStyle='rgba(0,0,0,0.45)';ctx.font=`${7}px DM Mono,monospace`;ctx.textAlign='center';ctx.fillText(String(i+1),x+barW/2,H-2);}
        });
        ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,H-padB);ctx.lineTo(W,H-padB);ctx.stroke();
      });
    });
  }

  // ── Render the game panel HTML ─────────────────────
  setStats('');
  setPanel(`<div class="bart-wrap">
    <div class="start-card">
      <h3>BART</h3>
      <p>Pump balloons to earn money — but pump too much and they pop! Two rounds: 30 balloons at $0.10/pump, then 20 at $0.20/pump with a pop penalty. Find the sweet spot between greed and caution.</p>
      <button class="big-btn" onclick="bartGo()">Begin</button>
    </div>
  </div>`);

  window.bartSkipRound=bartSkipRound;
  window.bartGo=()=>{
    if(!alive())return;
    setPanel(`<div class="bart-wrap">
      <div class="bart-game">
        <div class="bart-arena" id="bart-arena"></div>
        <div class="bart-btn-row">
          <button class="bart-btn bart-pump-btn" id="bart-pump-btn" onclick="bartPump()">Pump</button>
          <button class="bart-btn bart-cash-btn" id="bart-cash-btn" onclick="bartCash()">Cash Out</button>
        </div>
        <div class="bart-stats-row">
          <div class="bart-stat-cell"><div class="bart-stat-label">This Balloon</div><div class="bart-stat-val" id="b2-balloon">$0.00</div></div>
          <div class="bart-stat-cell"><div class="bart-stat-label">Round Earned</div><div class="bart-stat-val" id="b2-round2">$0.00</div></div>
          <div class="bart-stat-cell"><div class="bart-stat-label">Total Earned</div><div class="bart-stat-val" id="b2-total">$0.00</div></div>
        </div>
      </div>
    </div>`,true);
    resetBART();
  };
}
