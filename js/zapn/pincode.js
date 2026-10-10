// js/zapn/pincode.js — Game 3: PinCode (memory).
// Moved verbatim from zapn.html. Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 3 · PINCODE
// ══════════════════════════════════════════════════════
function startPinCode(){
  const MODES=[
    {label:'Forward', cls:'m0', hint:'Type the sequence as shown',         xform:s=>s},
    {label:'Reverse', cls:'m1', hint:'Type the sequence in reverse order', xform:s=>s.split('').reverse().join('')},
    {label:'Sorted ↑',cls:'m2', hint:'Type the digits sorted low → high',  xform:s=>s.split('').sort().join('')}
  ];
  let mode=0,len=3,mistakes=0,seqScore=0,seq='',input='',phase='show';
  const g=myGen();
  function alive(){return myGen()===g;}

  function stat(){if(!alive())return;setStats(`<div class="stat-pill">Mode <b>${mode+1}</b>/3</div><div class="stat-pill">Length <b>${len}</b></div><div class="stat-pill">Score <b>${seqScore}</b></div>`);}

  function newSeq(){
    if(!alive())return;
    seq=Array.from({length:len},()=>rand(0,9)).join('');
    input='';phase='show';
    showDigits();
  }

  // Show exactly one digit at a time: "– – –" → "1 – –" → "– 2 –" → "– – 3" → "– – –" → activate pad
  function showDigits(){
    if(!alive())return;
    stat();const m=MODES[mode];

    // Build display: only slot i is shown if it is the activeSlot, else dash
    function buildDisplay(activeSlot){
      return Array.from({length:seq.length},(_,i)=>
        activeSlot>=0&&i===activeSlot ? seq[i] : '–'
      ).join(' ');
    }

    // Render the panel with a disabled keypad visible
    function renderShowing(displayStr){
      setPanel(`<div style="display:flex;flex-direction:column;align-items:center">
        <div class="pc-mode-pill ${m.cls}">${m.label}</div>
        <div class="pc-instruction">${m.hint}</div>
        <div class="pc-entry" id="pc-entry">${displayStr}</div>
        <p style="color:var(--muted);font-size:.8rem;margin-top:0;margin-bottom:16px" id="pc-show-sub">Memorising…</p>
        <div class="pc-pad" style="opacity:.25;pointer-events:none">
          ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pc-btn">${n}</button>`).join('')}
          <button class="pc-btn">0</button>
          <button class="pc-btn del">⌫</button>
        </div>
      </div>`);
    }

    renderShowing(buildDisplay(-1));

    let i=0;
    function showNext(){
      if(!alive())return;
      if(i<seq.length){
        // Show only digit i, all others dash
        const el=document.getElementById('pc-entry');
        if(el) el.textContent=buildDisplay(i);
        i++;
        setTimeout(showNext,900);
      } else {
        // All shown — blank and immediately activate input
        const el=document.getElementById('pc-entry');
        if(el) el.textContent=buildDisplay(-1);
        setTimeout(()=>{ if(alive()) activateInput(); },500);
      }
    }
    setTimeout(showNext,400);
  }

  // Transition straight to input phase — no Ready button
  function activateInput(){
    if(!alive())return;
    phase='input';input='';stat();const m=MODES[mode];

    function buildInputDisplay(typed){
      return Array.from({length:seq.length},(_,i)=>i<typed.length?typed[i]:'–').join(' ');
    }
    window._pcBuildDisplay=buildInputDisplay;

    setPanel(`<div style="display:flex;flex-direction:column;align-items:center">
      <div class="pc-mode-pill ${m.cls}">${m.label}</div>
      <div class="pc-instruction">${m.hint}</div>
      <div class="pc-entry" id="pc-entry">${buildInputDisplay('')}</div>
      <div class="pc-mistakes">
        ${[0,1].map(i=>`<div class="pc-life${i<mistakes?' gone':''}"></div>`).join('')}
      </div>
      <div class="pc-pad">
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pc-btn" onclick="pcKey('${n}')">${n}</button>`).join('')}
        <button class="pc-btn" onclick="pcKey('0')">0</button>
        <button class="pc-btn del" onclick="pcDel()">⌫</button>
      </div>
    </div>`);
    setKey(e=>{if(!alive())return;if(/^[0-9]$/.test(e.key))pcKey(e.key);if(e.key==='Backspace')pcDel();});
  }

  // pcReady kept as no-op alias (not used anymore but avoids stale-HTML errors)
  window.pcReady=()=>{};

  window.pcKey=k=>{
    if(!alive()||phase!=='input')return;
    const expected=MODES[mode].xform(seq);
    if(input.length>=expected.length)return;
    input+=k;
    const el=document.getElementById('pc-entry');
    if(el&&window._pcBuildDisplay)el.textContent=window._pcBuildDisplay(input);
    if(input.length<expected.length)return;
    phase='done';
    const ok=input===expected;
    if(el)el.classList.add(ok?'ok':'err');
    if(ok){seqScore++;len++;setTimeout(()=>{if(!alive())return;clearKeys();newSeq();},500);}
    else{
      mistakes++;
      setTimeout(()=>{
        if(!alive())return;
        clearKeys();
        if(mistakes>=2){mode++;if(mode>=MODES.length){endGame();return;}len=3;mistakes=0;}
        input='';newSeq();
      },600);
    }
  };

  window.pcDel=()=>{
    if(!alive()||phase!=='input')return;
    input=input.slice(0,-1);
    const el=document.getElementById('pc-entry');
    if(el&&window._pcBuildDisplay)el.textContent=window._pcBuildDisplay(input);
  };

  function endGame(){
    if(!alive())return;
    clearKeys();saveScore('pincode',seqScore);setStats('');
    setPanel(`<div class="result-card">
      <h3>PinCode complete</h3>
      <div class="result-num">${seqScore}</div>
      <div class="result-sub">Sequences recalled correctly</div>
      <button class="again-btn" onclick="startPinCode()">Play again</button>
    </div>`);
  }
  setStats('');
  setPanel(`<div class="start-card">
    <h3>PinCode</h3>
    <p>A number sequence will be revealed one digit at a time. Memorise it, then type it back. Mode 1: forward. Mode 2: reversed. Mode 3: sorted low to high. The sequence grows longer with each success.</p>
    <button class="big-btn" onclick="pcGo()">Begin</button>
  </div>`);

  window.pcGo=()=>{ if(!alive())return; newSeq(); };
}
