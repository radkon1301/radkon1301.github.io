// js/zapn/figureitout.js — Game 5: FigureItOut (logic).
// Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME 5 · FIGUREITOUT
// ══════════════════════════════════════════════════════
function startFigureItOut(){
  const SHAPES=['square','circle','triangle'];
  const COLORS=['blue','red','yellow'];
  const PATTERNS=['horizontal','vertical','grid'];
  const ROUNDS=5;
  let round=0,totalMoves=0,secret=null,guesses=[],pick={shape:null,color:null,pattern:null};
  let roundMoves=0,movesPerRound=[]; // per-round step tracking
  const g=myGen();
  function alive(){return myGen()===g;}

  const cHex={blue:'#3b82f6',red:'#ef4444',yellow:'#eab308'};
  const cBg={blue:'#eff6ff',red:'#fff1f2',yellow:'#fefce8'};

  function shpIcon(s,sz=13){
    if(s==='square')return`<svg width="${sz}" height="${sz}"><rect x="1" y="1" width="${sz-2}" height="${sz-2}" rx="1" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
    if(s==='circle')return`<svg width="${sz}" height="${sz}"><circle cx="${sz/2}" cy="${sz/2}" r="${sz/2-1}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
    return`<svg width="${sz}" height="${sz}"><polygon points="${sz/2},1 ${sz-1},${sz-1} 1,${sz-1}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  }
  function cDot(c){return`<span style="width:10px;height:10px;border-radius:50%;background:${cHex[c]};display:inline-block;border:1px solid rgba(0,0,0,.12)"></span>`;}
  const pLbl={horizontal:'≡ horizontal',vertical:'||| vertical',grid:'⊞ grid'};

  function miniSVG(gg){
    const c=cHex[gg.color]||'#888',bg=cBg[gg.color]||'#fff';
    const W=50,H=66;
    let shp='',clip='';
    if(gg.shape==='square'){shp=`<rect x="5" y="9" width="40" height="48" rx="3" fill="${c}"/>`;clip=`<rect x="5" y="9" width="40" height="48" rx="3"/>`;}
    else if(gg.shape==='circle'){shp=`<circle cx="25" cy="33" r="21" fill="${c}"/>`;clip=`<circle cx="25" cy="33" r="21"/>`;}
    else{shp=`<polygon points="25,9 47,59 3,59" fill="${c}"/>`;clip=`<polygon points="25,9 47,59 3,59"/>`;}
    const uid='u'+(Math.random()*1e7|0);
    let ln='';
    if(gg.pattern==='horizontal')ln=`<line x1="0" y1="27" x2="${W}" y2="27" stroke="${bg}" stroke-width="3.5"/><line x1="0" y1="35" x2="${W}" y2="35" stroke="${bg}" stroke-width="3.5"/><line x1="0" y1="43" x2="${W}" y2="43" stroke="${bg}" stroke-width="3.5"/>`;
    else if(gg.pattern==='vertical')ln=`<line x1="17" y1="0" x2="17" y2="${H}" stroke="${bg}" stroke-width="3.5"/><line x1="25" y1="0" x2="25" y2="${H}" stroke="${bg}" stroke-width="3.5"/><line x1="33" y1="0" x2="33" y2="${H}" stroke="${bg}" stroke-width="3.5"/>`;
    else ln=`<line x1="0" y1="27" x2="${W}" y2="27" stroke="${bg}" stroke-width="2.5"/><line x1="0" y1="35" x2="${W}" y2="35" stroke="${bg}" stroke-width="2.5"/><line x1="0" y1="43" x2="${W}" y2="43" stroke="${bg}" stroke-width="2.5"/><line x1="17" y1="0" x2="17" y2="${H}" stroke="${bg}" stroke-width="2.5"/><line x1="25" y1="0" x2="25" y2="${H}" stroke="${bg}" stroke-width="2.5"/><line x1="33" y1="0" x2="33" y2="${H}" stroke="${bg}" stroke-width="2.5"/>`;
    return`<svg width="${W}" height="${H}" style="background:${bg}"><defs><clipPath id="${uid}">${clip}</clipPath></defs><g transform="translate(-2,0)">${shp}<g clip-path="url(#${uid})">${ln}</g></g></svg>`;
  }

  function newRound(){
    if(!alive())return;
    round++;guesses=[];roundMoves=0;
    secret={shape:SHAPES[rand(0,2)],color:COLORS[rand(0,2)],pattern:PATTERNS[rand(0,2)]};
    pick={shape:null,color:null,pattern:null};
    render();
  }

  function stat(){if(!alive())return;setStats(`<div class="stat-pill">Round <b>${round}</b>/${ROUNDS}</div><div class="stat-pill">Moves <b>${totalMoves}</b></div>`);}

  function render(){
    if(!alive())return;
    stat();
    setPanel(`<div class="fi-wrap">
      <div class="prog-track"><div class="prog-fill" style="width:${(round-1)/ROUNDS*100}%"></div></div>
      <div class="fi-sec-label">Previous guesses — round ${round}</div>
      <div class="fi-prev-row" id="fi-prev"></div>
      <div class="fi-divider"></div>
      <div class="fi-sec-label" style="margin-bottom:12px">Your guess</div>
      <div class="fi-row">
        <div class="fi-row-lbl">Shape</div>
        ${SHAPES.map(s=>`<button class="fi-opt" id="fis-${s}" onclick="fiPick('shape','${s}')">${shpIcon(s)} ${s}</button>`).join('')}
      </div>
      <div class="fi-row">
        <div class="fi-row-lbl">Color</div>
        ${COLORS.map(c=>`<button class="fi-opt" id="fic-${c}" onclick="fiPick('color','${c}')">${cDot(c)} ${c}</button>`).join('')}
      </div>
      <div class="fi-row">
        <div class="fi-row-lbl">Pattern</div>
        ${PATTERNS.map(p=>`<button class="fi-opt" id="fip-${p}" onclick="fiPick('pattern','${p}')">${pLbl[p]}</button>`).join('')}
      </div>
      <button class="fi-submit" id="fi-sub" onclick="fiSubmit()" disabled>Submit Guess</button>
    </div>`,true);
    renderPrev();
  }

  function renderPrev(){
    if(!alive())return;
    const el=document.getElementById('fi-prev');if(!el)return;
    if(!guesses.length){el.innerHTML='<span style="color:var(--muted);font-size:.8rem">None yet</span>';return;}
    el.innerHTML=guesses.map(gg=>{
      const cnt=[gg.fb.shape,gg.fb.color,gg.fb.pattern].filter(Boolean).length;
      return`<div class="fi-past">
        <div class="fi-mini">${miniSVG(gg.guess)}</div>
        <div class="fi-cnt${cnt===3?' all':''}">${cnt}/3</div>
      </div>`;
    }).join('');
  }

  // Row groups for toggling — only clear within the same row
  const rowGroups={shape:SHAPES,color:COLORS,pattern:PATTERNS};
  const rowPfx={shape:'fis',color:'fic',pattern:'fip'};

  window.fiPick=(prop,val)=>{
    if(!alive())return;
    pick[prop]=val;
    // Only clear buttons in the same property row
    rowGroups[prop].forEach(v=>{
      const el=document.getElementById(`${rowPfx[prop]}-${v}`);
      if(el)el.classList.toggle('sel',v===val);
    });
    const btn=document.getElementById('fi-sub');
    if(btn)btn.disabled=!(pick.shape&&pick.color&&pick.pattern);
  };

  window.fiSubmit=()=>{
    if(!alive()||!pick.shape||!pick.color||!pick.pattern)return;
    totalMoves++;roundMoves++;
    const fb={shape:pick.shape===secret.shape,color:pick.color===secret.color,pattern:pick.pattern===secret.pattern};
    guesses.push({guess:{...pick},fb});
    stat();

    if(fb.shape&&fb.color&&fb.pattern){
      movesPerRound.push(roundMoves);
      // Correct! Show result in prev area and a Next Round / End button
      renderPrev();
      // Disable submit and selection
      document.querySelectorAll('.fi-opt').forEach(el=>{el.style.pointerEvents='none';el.style.opacity='.5';});
      const subBtn=document.getElementById('fi-sub');
      if(subBtn){
        subBtn.textContent=round>=ROUNDS?'See Results →':'Next Round →';
        subBtn.disabled=false;
        subBtn.onclick=()=>{if(!alive())return;if(round>=ROUNDS)endGame();else newRound();};
      }
    } else {
      // Wrong — reset picks, keep previous guesses visible
      pick={shape:null,color:null,pattern:null};
      renderPrev();
      // Clear all sel classes
      Object.keys(rowGroups).forEach(pr=>rowGroups[pr].forEach(v=>{
        const el=document.getElementById(`${rowPfx[pr]}-${v}`);
        if(el)el.classList.remove('sel');
      }));
      const btn=document.getElementById('fi-sub');if(btn)btn.disabled=true;
    }
  };

  function endGame(){
    if(!alive())return;
    const avg=movesPerRound.length?movesPerRound.reduce((a,b)=>a+b,0)/movesPerRound.length:totalMoves;
    const avgR=Math.round(avg*100)/100;
    const label=`${avgR.toFixed(2)} steps avg`;
    saveScore('figureitout', avgR, label);
    setStats('');
    setPanel(`<div class="result-card">
      <h3>FigureItOut complete</h3>
      <div class="result-num">${avgR.toFixed(2)}</div>
      <div class="result-sub">Avg steps per round — lower is better</div>
      <button class="again-btn" onclick="startFigureItOut()">Play again</button>
    </div>`);
  }
  setStats('');
  setPanel(`<div class="start-card">
    <h3>FigureItOut</h3>
    <p>A hidden figure has three properties: shape, colour, and pattern. Submit a guess and you'll see how many of the three properties you got right — but not which ones. Deduce the figure in as few guesses as possible. 5 rounds.</p>
    <button class="big-btn" onclick="fiGo()">Begin</button>
  </div>`);

  window.fiGo=()=>{ if(!alive())return; newRound(); };
}
