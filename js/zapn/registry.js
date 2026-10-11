// js/zapn/registry.js — Game registry (GAMES) and page init. Loaded LAST.
// Docs: docs/zapn.md

// ══════════════════════════════════════════════════════
//  GAME REGISTRY — add entries here to add new games
// ══════════════════════════════════════════════════════
const GAMES = [
  { id:'shapeshift',  title:'ShapeShift',  icon:'◑', tag:'Reaction',   desc:'A shape flashes briefly on screen. Press ← for Square, → for Circle. 60 rounds.',                            meta:['60 rounds','~3 min'],          start:startShapeShift  },
  { id:'codecompare', title:'CodeCompare', icon:'≋', tag:'Attention',   desc:'Spot the sequence identical to the target. Timer shrinks from 5 s to 3 s over 30 rounds.',                   meta:['30 rounds','5 s → 3 s'],       start:startCodeCompare },
  { id:'pincode',     title:'PinCode',     icon:'⌨', tag:'Memory',      desc:'Memorise a number sequence, then type it forward, reversed, or sorted low-to-high.',                          meta:['3 modes','Growing length'],    start:startPinCode     },
  { id:'numberbox',   title:'NumberBox',   icon:'⊞', tag:'Arithmetic',  desc:'Use four numbers and basic operations to reach the target in the centre. 5 puzzles.',                         meta:['5 rounds','All ops'],          start:startNumberBox   },
  { id:'figureitout', title:'FigureItOut', icon:'◈', tag:'Logic',       desc:'Deduce the hidden figure\'s shape, colour, and stripe pattern. Feedback shows how many properties match.', meta:['5 rounds','3 properties'],    start:startFigureItOut },
  { id:'theswitch',   title:'The Switch',  icon:'⇅', tag:'Switching',   desc:'Two questions flash on two boxes — math answer odd/even, or arrows matching. Answer the active box. 35 rounds.', meta:['35 rounds','~3 min'],      start:startTheSwitch   },
  { id:'stockmaster', title:'Stock Master',icon:'◉', tag:'Timing',      desc:'Click a gauge when its needle is in the green zone to buy a stock. Gauges appear and vanish quickly. 2 minutes.', meta:['2 min','Reflex'],         start:startStockMaster },
  { id:'bart',        title:'BART',        icon:'✴︎', tag:'Risk',         desc:'Pump balloons to earn money — but pump too much and they pop. Balance risk and reward across two rounds of escalating stakes.', meta:['2 rounds','~8 min'], start:startBART },
  { id:'skyscraper',  title:'Skyscraper',  icon:'⬚', tag:'Planning',     desc:'Rearrange coloured blocks across three piles to match the target pattern. 10 levels, from 4 to 7 blocks. Fewest moves wins.', meta:['10 levels','4–7 blocks'], start:startSkyscraper },
  { id:'test',        title:'Full Test',   icon:'▶', tag:'Test',          desc:'Play all 9 exercises back-to-back in a random order. Your scores are saved and compared against your personal bests at the end.', meta:['All games','~35 min'], start:startTest }
];

// ── init ──
renderDashboard();
