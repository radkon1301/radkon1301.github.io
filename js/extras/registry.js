// js/extras/registry.js — Game registry (EXTRA_GAMES) and page init. Loaded LAST. Docs: docs/extras.md
const EXTRA_GAMES = [
  { id: 'nback', title: 'N-Back', icon: '◫', tag: 'Working memory',
    desc: 'Letters appear one at a time. Press Space when the current letter matches the one two back. Scored on balanced accuracy, so guessing earns nothing.',
    meta: ['2-back', '40 letters', '~2 min'], start: startNBack },
  { id: 'stroop', title: 'Stroop', icon: '◐', tag: 'Interference',
    desc: 'A colour word is shown in a coloured ink. Name the INK, not the word. Half the trials are deliberately conflicting.',
    meta: ['40 trials', '4 colours', '~2 min'], start: startStroop },
  { id: 'ev', title: 'Expected Value', icon: 'Σ', tag: 'Probability',
    desc: 'Twelve quick probability and expected-value problems — dice, coins, bets, waiting times. Review every mistake with a worked answer.',
    meta: ['12 questions', 'Multiple choice', 'Untimed'], start: startEV },
];

// ── init ──
renderDashboard();
