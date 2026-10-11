// js/sequences/registry.js — Game registry (SEQ_GAMES) and page init. Loaded LAST.
// Docs: docs/sequences.md

// ══════════════════════════════════════════════════════
//  SEQUENCES — GAME REGISTRY
// ══════════════════════════════════════════════════════
// Distinct generator functions (genArithmetic is listed twice in SEQUENCE_GENERATORS to weight it).
const SEQ_TYPE_COUNT = new Set(SEQUENCE_GENERATORS).size;

const SEQ_GAMES = [
  {
    id: 'seq-practice',
    title: 'Practice',
    icon: '∿',
    tag: 'Sequences',
    desc: `Complete the sequence by identifying the pattern. Covers ${SEQ_TYPE_COUNT} sequence types across 9 categories — arithmetic, geometric, prime-based, recursive, fractional, decimal, digit-based, interleaved, and more.`,
    meta: [`${SEQ_TYPE_COUNT} types`, 'Unlimited'],
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
