// js/zapn/codecompare.js — Game 2: CodeCompare (attention).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 2 · CODECOMPARE
// ══════════════════════════════════════════════════════
function startCodeCompare(){
  const TOTAL=30;
  let round=0,score=0,timer=null;
  const g=myGen();
  function alive(){return myGen()===g;}

  const C='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd=len=>Array.from({length:len},()=>C[rand(0,C.length-1)]).join('');
  function mut(c){const a=c.split('');const i=rand(0,a.length-1);let ch;do{ch=C[rand(0,C.length-1)];}while(ch===a[i]);a[i]=ch;return a.join('');}

  function flashRed(){
    const el=document.getElementById('cc-timeout-flash');
    if(!el)return;
    el.className='on';
    setTimeout(()=>{if(el)el.className='off';},80);
    setTimeout(()=>{if(el)el.className='';},500);
  }

  function next(){
    if(!alive())return;
    if(round>=TOTAL){endGame();return;}
    round++;clearTimeout(timer);
    const t=5000-(round/TOTAL)*2000;
    const len=rand(5,7),target=rnd(len),ci=rand(0,3);
    const opts=Array.from({length:4},(_,i)=>i===ci?target:mut(target));
    setStats(`<div class="stat-pill">Round <b>${round}</b>/${TOTAL}</div><div class="stat-pill">Score <b>${score}</b></div>`);
    setPanel(`
      <div class="prog-track"><div class="prog-fill" style="width:${(round-1)/TOTAL*100}%"></div></div>
      <div class="cc-target-label">Target sequence</div>
      <div class="cc-target-code">${target}</div>
      <div class="cc-timer-track"><div class="cc-timer-fill" id="cc-fill" style="width:100%"></div></div>
      <div class="cc-choices">
        ${opts.map((o,i)=>`<button class="cc-choice" onclick="ccPick(${i===ci},this)">${o}</button>`).join('')}
      </div>`);
    // Double-rAF ensures the browser has committed the 100% width before we start the transition
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!alive())return;
      const f=document.getElementById('cc-fill');
      if(f){f.style.transition=`width ${t}ms linear`;f.style.width='0%';}
    }));
    timer=setTimeout(()=>{if(alive())ccPick(false,null,true);},t);
  }

  window.ccPick=(correct,btn,timeout=false)=>{
    if(!alive())return;
    clearTimeout(timer);
    if(correct)score++;
    if(timeout)flashRed();
    if(btn)btn.classList.add(correct?'correct':'wrong');
    document.querySelectorAll('.cc-choice').forEach(b=>b.disabled=true);
    setStats(`<div class="stat-pill">Round <b>${round}</b>/${TOTAL}</div><div class="stat-pill">Score <b>${score}</b></div>`);
    setTimeout(()=>{if(alive())next();},650);
  };

  function endGame(){
    if(!alive())return;
    saveScore('codecompare',score);setStats('');
    setPanel(`<div class="result-card">
      <h3>CodeCompare complete</h3>
      <div class="result-num">${score}<span style="font-size:2rem;color:var(--muted)">/${TOTAL}</span></div>
      <div class="result-sub">Accuracy: ${Math.round(score/TOTAL*100)}%</div>
      <button class="again-btn" onclick="startCodeCompare()">Play again</button>
    </div>`);
  }
  setStats('');
  setPanel(`<div class="start-card">
    <h3>CodeCompare</h3>
    <p>A target sequence is shown at the top. Find the identical match among four options before the timer runs out. The timer shrinks from 5 s to 3 s over 30 rounds.</p>
    <button class="big-btn" onclick="ccGo()">Begin</button>
  </div>`);

  window.ccGo=()=>{ if(!alive())return; next(); };
}
