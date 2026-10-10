// js/sequences/registry.js — Game registry (SEQ_GAMES) and page init. Loaded LAST.
// Moved verbatim from sequences.html. Docs: docs/sequences.md

// ══════════════════════════════════════════════════════
//  SEQUENCES — GAME REGISTRY
// ══════════════════════════════════════════════════════
const SEQ_GAMES = [
  {
    id: 'seq-practice',
    title: 'Practice',
    icon: '∿',
    tag: 'Sequences',
    desc: 'Complete the sequence by identifying the pattern. Covers 50+ sequence types across 9 categories — arithmetic, geometric, prime-based, recursive, fractional, decimal, digit-based, interleaved, and more.',
    meta: ['50+ types', 'Unlimited'],
    start: startSeqPractice
  },
  {
    id: 'seq-test',
    title: 'Test',
    icon: '▶',
    tag: 'Sequences',
    desc: '26 questions, 25 minutes. Navigate freely, skip and return to questions. Score = correct − incorrect (skips are free). Answers and explanations revealed after submission.',
    meta: ['26 Qs', '25 min', 'Scored'],
    start: startSeqTest
  }
];

// ── init ──
renderDashboard();
