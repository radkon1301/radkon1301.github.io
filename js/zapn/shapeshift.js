// js/zapn/shapeshift.js — Game 1: ShapeShift (reaction).
// Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 1 · SHAPESHIFT
// ══════════════════════════════════════════════════════
function startShapeShift(){
  const TOTAL=60;
  let round=0,score=0;
  let times=[]; // per-round response times (capped at 1000ms for wrong)
  let shapeShownAt=null;
  const g=myGen();
  window._ssH=null;

  function alive(){return myGen()===g;}
  function stat(){if(!alive())return;setStats(`<div class="stat-pill">Round <b>${round}</b>/${TOTAL}</div><div class="stat-pill">Score <b>${score}</b></div>`);}

  setKey(e=>{
    if(!alive())return;
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    e.preventDefault();
    if(window._ssH)window._ssH(e.key);
  });

  setPanel(`<div class="start-card">
    <h3>ShapeShift</h3>
    <p>A shape flashes briefly on the left or right. Press <strong>←</strong> for a square and <strong>→</strong> for a circle. Focus on the + in the centre and react quickly — 60 rounds.</p>
    <button class="big-btn" onclick="ssGo()">Begin</button>
  </div>`);
  stat();

  window.ssGo=()=>{
    if(!alive())return;
    setPanel(`
      <div class="prog-track"><div class="prog-fill" id="ss-prog" style="width:0%"></div></div>
      <div class="ss-arena" id="ss-arena">
        <div class="ss-crosshair">+</div>
        <div class="ss-slot left"  id="ss-left"></div>
        <div class="ss-slot right" id="ss-right"></div>
      </div>
      <div class="ss-keys">
        <div class="ss-key-chip"><kbd>←</kbd> Square</div>
        <div class="ss-key-chip"><kbd>→</kbd> Circle</div>
      </div>`);
    nextRound();
  };

  const SIZE=160;
  function makeSVG(isCircle){
    return isCircle
      ?`<svg class="ss-shape-svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE/2}" cy="${SIZE/2}" r="${SIZE/2-6}" fill="#d1d9e6" stroke="#7a8db5" stroke-width="7"/></svg>`
      :`<svg class="ss-shape-svg" width="${SIZE}" height="${SIZE}"><rect x="6" y="6" width="${SIZE-12}" height="${SIZE-12}" fill="#d1d9e6" stroke="#7a8db5" stroke-width="7"/></svg>`;
  }

  function nextRound(){
    if(!alive())return;
    if(round>=TOTAL){endGame();return;}
    round++;stat();
    const prog=document.getElementById('ss-prog');
    if(prog)prog.style.width=((round-1)/TOTAL*100)+'%';
    window._ssH=null;
    const l=document.getElementById('ss-left'),r=document.getElementById('ss-right');
    if(l)l.innerHTML=''; if(r)r.innerHTML='';
    setTimeout(()=>{if(alive())showShape();},rand(400,1100));
  }

  function showShape(){
    if(!alive())return;
    const arena=document.getElementById('ss-arena');if(!arena)return;
    const isCircle=Math.random()<.5;
    const onLeft=Math.random()<.5;
    const slot=document.getElementById(onLeft?'ss-left':'ss-right');
    if(!slot)return;
    slot.innerHTML=makeSVG(isCircle);
    const svg=slot.querySelector('.ss-shape-svg');
    if(svg)svg.classList.add('show');

    // Shape visible for just 120–200ms — a blink
    const vis=rand(120,200);
    shapeShownAt=performance.now();
    let answered=false;

    const autoMiss=setTimeout(()=>{
      if(!alive()||answered)return;
      answered=true;
      times.push(1000); // timeout counts as 1s penalty
      nextRound();
    },vis+800); // still allow response window after shape disappears

    window._ssH=key=>{
      if(!alive()||answered)return;
      answered=true;clearTimeout(autoMiss);
      const rt=Math.min(performance.now()-shapeShownAt,1000);
      const correct=(key==='ArrowRight')===isCircle;
      if(correct){score++;times.push(rt);}
      else{times.push(1000);} // wrong answer → 1s
      // No feedback — go straight to next round
      const sv=slot.querySelector('.ss-shape-svg');
      if(sv)sv.classList.remove('show');
      stat();
      setTimeout(()=>{if(alive())nextRound();},150);
    };

    setTimeout(()=>{
      if(!answered){
        const sv=slot.querySelector('.ss-shape-svg');
        if(sv)sv.classList.remove('show');
      }
    },vis);
  }

  function endGame(){
    if(!alive())return;
    clearKeys();
    const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length:1000;
    const avgS=(avg/1000).toFixed(3);
    const acc=Math.round(score/TOTAL*100);
    const label=`${avgS}s @ ${acc}%`;
    saveScore('shapeshift', avg, label);
    setStats('');
    setPanel(`<div class="result-card">
      <h3>ShapeShift complete</h3>
      <div class="result-num">${avgS}<span style="font-size:2rem;color:var(--muted)">s</span></div>
      <div class="result-sub">Avg response time · Accuracy: ${acc}%</div>
      <button class="again-btn" onclick="startShapeShift()">Play again</button>
    </div>`);
  }
}
