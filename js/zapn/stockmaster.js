// js/zapn/stockmaster.js — Game 7: Stock Master (timing).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 7 · STOCK MASTER
// ══════════════════════════════════════════════════════
function startStockMaster(){
  const DURATION=120; // 2 minutes in seconds
  let score=0,timeLeft=DURATION,gameOver=false;
  let gauges=[]; // [{id,x,y,angle,speed,dir,greenStart,greenEnd,lifeLeft,maxLife,fading}]
  let nextId=0,rafId=null,lastTs=null,spawnTimer=0;
  const g=myGen();
  function alive(){return myGen()===g;}

  // Gauge dimensions
  const GR=54; // radius

  function spawnGauge(arenaW,arenaH){
    const margin=GR+14;
    const minDist=GR*2+18; // minimum centre-to-centre distance to avoid overlap
    let x,y,attempts=0;
    do {
      x=rand(margin,arenaW-margin);
      y=rand(margin,arenaH-margin);
      attempts++;
    } while(
      attempts<40 &&
      gauges.some(g=>{const dx=g.x-x,dy=g.y-y;return dx*dx+dy*dy<minDist*minDist;})
    );
    const greenStart=rand(20,160);
    const greenSpan=rand(35,75);
    const speed=(Math.random()*1.8+0.4);
    const maxLife=rand(4000,9000);
    return{id:nextId++,x,y,angle:rand(0,359),speed,dir:Math.random()<.5?1:-1,
           greenStart,greenEnd:greenStart+greenSpan,lifeLeft:maxLife,maxLife,fading:false};
  }

  function drawGauge(ctx,gau,scale=1){
    const{x,y,angle,greenStart,greenEnd,fading,lifeLeft,maxLife}=gau;
    const r=GR*scale;
    const alpha=fading?Math.max(0,lifeLeft/400):1;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(x,y);

    // Background circle
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fillStyle='rgba(100,120,190,0.85)';
    ctx.fill();

    // Green zone arc
    const toRad=d=>(d-90)*Math.PI/180; // 0deg = top
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r,toRad(greenStart),toRad(greenEnd));
    ctx.closePath();
    ctx.fillStyle='#22c55e';
    ctx.fill();

    // Inner circle overlay (makes it look like a gauge face)
    ctx.beginPath();
    ctx.arc(0,0,r*0.18,0,Math.PI*2);
    ctx.fillStyle='rgba(80,100,170,0.9)';
    ctx.fill();

    // Needle
    const needleRad=(angle-90)*Math.PI/180;
    const nx=Math.cos(needleRad)*r*0.82;
    const ny=Math.sin(needleRad)*r*0.82;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(nx,ny);
    ctx.strokeStyle='white';
    ctx.lineWidth=2.5*scale;
    ctx.lineCap='round';
    ctx.stroke();

    // Rim
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.25)';
    ctx.lineWidth=2*scale;
    ctx.stroke();

    ctx.restore();
  }

  function isInGreen(gau){
    let a=((gau.angle%360)+360)%360;
    let s=gau.greenStart, e=gau.greenEnd;
    return a>=s&&a<=e;
  }

  function loop(ts){
    if(!alive()||gameOver){return;}
    rafId=requestAnimationFrame(loop);
    const dt=lastTs?Math.min(ts-lastTs,100):16;
    lastTs=ts;

    // Update time
    timeLeft=Math.max(0,timeLeft-dt/1000);
    if(timeLeft<=0){endGame();return;}

    const arena=document.getElementById('sm-arena');
    const canvas=document.getElementById('sm-canvas');
    if(!arena||!canvas)return;
    const W=arena.clientWidth,H=arena.clientHeight;
    canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);

    // Spawn timer
    spawnTimer-=dt;
    if(spawnTimer<=0&&gauges.length<7){
      gauges.push(spawnGauge(W,H));
      spawnTimer=rand(600,1800);
    }

    // Update & draw gauges
    gauges=gauges.filter(gau=>{
      gau.angle=(gau.angle+gau.speed*gau.dir*(dt/16))%360;
      gau.lifeLeft-=dt;
      if(gau.lifeLeft<=400)gau.fading=true;
      if(gau.lifeLeft<=0)return false;
      drawGauge(ctx,gau);
      return true;
    });

    // Timer bar
    const fill=document.getElementById('sm-fill');
    if(fill)fill.style.width=(timeLeft/DURATION*100)+'%';
    const label=document.getElementById('sm-time');
    if(label){
      const m=Math.floor(timeLeft/60);
      const s=Math.floor(timeLeft%60);
      label.textContent=`${m}:${s.toString().padStart(2,'0')}`;
    }
    // Stats
    setStats(`<div class="stat-pill">Score <b>${score}</b></div><div class="stat-pill">Time <b>${Math.ceil(timeLeft)}s</b></div>`);
  }

  function handleClick(e){
    if(!alive()||gameOver)return;
    const canvas=document.getElementById('sm-canvas');
    if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const cx=e.clientX-rect.left;
    const cy=e.clientY-rect.top;
    // Find clicked gauge (top of z-stack = last drawn = last in array)
    for(let i=gauges.length-1;i>=0;i--){
      const gau=gauges[i];
      const dx=cx-gau.x,dy=cy-gau.y;
      if(dx*dx+dy*dy<=GR*GR){
        if(isInGreen(gau)){
          score++;
          // +1 score pop
          const arena=document.getElementById('sm-arena');
          if(arena){
            const pop=document.createElement('div');
            pop.className='sm-score-pop';
            pop.textContent='+1';
            pop.style.left=(gau.x-16)+'px';
            pop.style.top=(gau.y-GR-10)+'px';
            arena.appendChild(pop);
            setTimeout(()=>{if(pop.parentNode)pop.remove();},800);
          }
          gauges.splice(i,1);
        } else {
          // Miss — deduct point, full-screen red flash
          score=Math.max(0,score-1);
          const flash=document.getElementById('cc-timeout-flash');
          if(flash){flash.className='on';setTimeout(()=>{if(flash)flash.className='off';},80);setTimeout(()=>{if(flash)flash.className='';},500);}
          // -1 pop at gauge location
          const arena2=document.getElementById('sm-arena');
          if(arena2){
            const pop=document.createElement('div');
            pop.className='sm-score-pop';
            pop.textContent='−1';
            pop.style.color='#fca5a5';
            pop.style.left=(gau.x-16)+'px';
            pop.style.top=(gau.y-GR-10)+'px';
            arena2.appendChild(pop);
            setTimeout(()=>{if(pop.parentNode)pop.remove();},800);
          }
        }
        break;
      }
    }
  }

  function endGame(){
    if(!alive())return;
    gameOver=true;
    cancelAnimationFrame(rafId);
    saveScore('stockmaster',score);setStats('');
    setPanel(`<div class="result-card">
      <h3>Stock Master complete</h3>
      <div class="result-num">${score}</div>
      <div class="result-sub">Stocks bought in 2 minutes</div>
      <button class="again-btn" onclick="startStockMaster()">Play again</button>
    </div>`);
  }

  function startGame(){
    if(!alive())return;
    setPanel(`<div style="display:flex;flex-direction:column;width:100%;gap:6px">
      <div class="sm-timer-bar"><div class="sm-timer-fill" id="sm-fill" style="width:100%"></div></div>
      <div class="sm-time-label" id="sm-time">2:00</div>
      <div class="sm-arena" id="sm-arena">
        <canvas id="sm-canvas" style="display:block;width:100%;height:100%"></canvas>
      </div>
    </div>`,true);

    // Initial spawn burst
    const arena=document.getElementById('sm-arena');
    setTimeout(()=>{
      if(!alive())return;
      const W=arena.clientWidth,H=arena.clientHeight;
      for(let i=0;i<rand(3,5);i++)gauges.push(spawnGauge(W,H));
      spawnTimer=rand(800,1500);
    },100);

    document.getElementById('sm-arena').addEventListener('click',handleClick);
    lastTs=null;
    rafId=requestAnimationFrame(loop);
  }

  setStats('');
  setPanel(`<div class="start-card">
    <h3>Stock Master</h3>
    <p>Gauges appear across the screen, each with a spinning needle and a <strong>green zone</strong>. Click a gauge when its needle is inside the green zone to buy a stock. Gauges fade in and out — act fast. 2 minutes on the clock.</p>
    <button class="big-btn" onclick="smGo()">Begin</button>
  </div>`);
  window.smGo=()=>{if(!alive())return;startGame();};
}
