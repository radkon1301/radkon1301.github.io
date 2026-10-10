// js/zapn/theswitch.js — Game 6: The Switch (task switching).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 6 · THE SWITCH
// ══════════════════════════════════════════════════════
function startTheSwitch(){
  const TOTAL=35;
  let round=0,score=0,answered=false;
  let times=[],roundShownAt=null;
  const g=myGen();
  function alive(){return myGen()===g;}
  function stat(){if(!alive())return;setStats(`<div class="stat-pill">Round <b>${round}</b>/${TOTAL}</div><div class="stat-pill">Score <b>${score}</b></div>`);}

  const ARR=['←','→'];
  function makeArrows(){return Array.from({length:4},()=>ARR[rand(0,1)]);}
  function arrsEq(a,b){return a.join('')===b.join('');}

  function genRound(){
    const op=Math.random()<.5?'+':'-';
    let a,b,ans;
    if(op==='+'){a=rand(1,19);b=rand(1,19);ans=a+b;}
    else        {a=rand(2,20);b=rand(1,a-1);ans=a-b;}
    const mathStr=`${a} ${op} ${b}`;
    const isEven=ans%2===0;

    const setA=makeArrows();
    const match=Math.random()<.5;
    let setB=match?[...setA]:makeArrows();
    if(!match&&arrsEq(setA,setB)){
      const idx=rand(0,3);
      setB[idx]=setB[idx]==='←'?'→':'←';
    }
    const arrsMatch=arrsEq(setA,setB);

    const activeBox=rand(0,1);
    const askEven=Math.random()<.5;  // randomly ask "even" or "odd"
    const mathCorrect=askEven?isEven:!isEven;
    const correctYes=activeBox===0?mathCorrect:arrsMatch;

    return{mathStr,setA,setB,activeBox,correctYes,askEven};
  }

  function renderRound(rd){
    if(!alive())return;
    answered=false;
    roundShownAt=performance.now();
    const{mathStr,setA,setB,activeBox,askEven}=rd;

    const topActive=activeBox===0;
    const topQ=askEven?'Is the answer <b>EVEN</b>?':'Is the answer <b>ODD</b>?';
    const botQ='Are both sets of arrows the same?';

    const arrowHTML=arr=>arr.map(a=>`<span>${a}</span>`).join('');

    const boxContent=`
      <div class="sw-content">
        <div class="sw-math">${mathStr}</div>
        <div class="sw-sep"></div>
        <div class="sw-arrows">${arrowHTML(setA)}</div>
        <div class="sw-sep"></div>
        <div class="sw-arrows">${arrowHTML(setB)}</div>
      </div>`;

    setPanel(`<div class="sw-wrap">
      <div class="prog-track"><div class="prog-fill" style="width:${(round-1)/TOTAL*100}%"></div></div>
      <div class="sw-block ${topActive?'active':'inactive'}">
        ${topActive?`<div class="sw-q">${topQ}</div>`:''}
        ${boxContent}
      </div>
      <div class="sw-block ${topActive?'inactive':'active'}">
        ${!topActive?`<div class="sw-q">${botQ}</div>`:''}
        ${boxContent}
      </div>
      <div class="sw-btns">
        <button class="sw-btn" id="sw-yes" onclick="swAnswer(true)">Yes</button>
        <button class="sw-btn" id="sw-no"  onclick="swAnswer(false)">No</button>
      </div>
    </div>`,true);
  }

  window.swAnswer=yes=>{
    if(!alive()||answered)return;
    answered=true;
    const rt=Math.min(performance.now()-(roundShownAt||performance.now()),4000);
    const correct=yes===_swRound.correctYes;
    if(correct){score++;times.push(rt);}
    else{times.push(4000);}
    // No color change on buttons
    stat();
    setTimeout(()=>{
      if(!alive())return;
      if(round>=TOTAL){endGame();return;}
      _swRound=genRound();
      round++;
      renderRound(_swRound);
      stat();
    },300);
  };

  setKey(e=>{
    if(!alive())return;
    if(e.key==='y'||e.key==='Y')swAnswer(true);
    if(e.key==='n'||e.key==='N')swAnswer(false);
  });

  function endGame(){
    if(!alive())return;
    clearKeys();
    const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length:1000;
    const avgS=(avg/1000).toFixed(3);
    const acc=Math.round(score/TOTAL*100);
    const label=`${avgS}s @ ${acc}%`;
    saveScore('theswitch', avg, label);
    setStats('');
    setPanel(`<div class="result-card">
      <h3>The Switch complete</h3>
      <div class="result-num">${avgS}<span style="font-size:2rem;color:var(--muted)">s</span></div>
      <div class="result-sub">Avg response time · Accuracy: ${acc}%</div>
      <button class="again-btn" onclick="startTheSwitch()">Play again</button>
    </div>`);
  }

  let _swRound=genRound();
  setStats('');
  setPanel(`<div class="start-card">
    <h3>The Switch</h3>
    <p>Two boxes appear each round — one asks if the math answer is even, the other asks if the two arrow sequences match. Only the <strong>larger, brighter box</strong> is your task for that round. Answer <strong>Yes</strong> or <strong>No</strong>. 35 rounds.</p>
    <button class="big-btn" onclick="swGo()">Begin</button>
  </div>`);
  window.swGo=()=>{if(!alive())return;round++;renderRound(_swRound);stat();};
}
