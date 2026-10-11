// js/arithmetic/registry.js — Game registry (ARITH_GAMES), starters and page init. Loaded LAST.
// Docs: docs/arithmetic.md

// ══════════════════════════════════════════════════════
//  ARITHMETIC — GAME REGISTRY
// ══════════════════════════════════════════════════════
const ARITH_GAMES = [
  {
    id: 'arith-mc',
    title: '80 in 8 — Multiple Choice',
    icon: '◉',
    tag: 'Arithmetic',
    desc: '80 arithmetic questions in 8 minutes. Four answer choices per question — one correct. Mix of addition, subtraction, multiplication, division, fractions, and decimals.',
    meta: ['80 Qs', '8 min', 'Multiple Choice'],
    start: startArithMC
  },
  {
    id: 'arith-fr',
    title: '80 in 8 — Free Response',
    icon: '✎',
    tag: 'Arithmetic',
    desc: '80 arithmetic questions in 8 minutes. Type your answer — fractions (1/2) and decimals (0.5) are both accepted. Press Enter to submit each answer.',
    meta: ['80 Qs', '8 min', 'Free Response'],
    start: startArithFR
  }
];

// ══════════════════════════════════════════════════════
//  GAME STARTERS
// ══════════════════════════════════════════════════════
function startArithMC() { runTest('arith-mc', true); }
function startArithFR() { runTest('arith-fr', false); }

// ── CSS patch for MC selected state ──
// (Not in stylesheet above since it's only used at runtime)
const _style = document.createElement('style');
_style.textContent = `.arith-choice.selected-mc {
  border-color: var(--border2) !important;
  background: var(--surface2) !important;
  color: var(--text) !important;
  font-weight: 700;
}`;
document.head.appendChild(_style);

// ── init ──
renderDashboard();
