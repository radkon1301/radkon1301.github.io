// js/catalog.js — what the Progress page knows about each game. This duplicates a little of the suite registries on
// purpose (the registries need their suite's DOM and can't be loaded on another page); tests/catalog.test.js fails if
// the two drift apart. Add new games here too. lowerBetter must match the suite's createScoreStore() options.
const ME_CATALOG = [
  { suite: 'zapn', name: 'Zap-N', page: 'zapn.html', key: 'me_scores', games: [
    { id: 'shapeshift',  title: 'ShapeShift',   lowerBetter: true },
    { id: 'codecompare', title: 'CodeCompare' },
    { id: 'pincode',     title: 'PinCode' },
    { id: 'numberbox',   title: 'NumberBox',    lowerBetter: true },
    { id: 'figureitout', title: 'FigureItOut',  lowerBetter: true },
    { id: 'theswitch',   title: 'The Switch',   lowerBetter: true },
    { id: 'stockmaster', title: 'Stock Master' },
    { id: 'bart',        title: 'BART' },
    { id: 'skyscraper',  title: 'Skyscraper',   lowerBetter: true },
  ] },
  { suite: 'sequences', name: 'Sequences', page: 'sequences.html', key: 'me_seq_scores', games: [
    { id: 'seq-test', title: 'Sequence test' },
  ] },
  { suite: 'arithmetic', name: 'Arithmetic', page: 'arithmetic.html', key: 'me_arith_scores', games: [
    { id: 'arith-mc', title: '80 in 8 — Multiple Choice' },
    { id: 'arith-fr', title: '80 in 8 — Free Response' },
  ] },
  { suite: 'extras', name: 'Extras', page: 'extras.html', key: 'me_extra_scores', games: [
    { id: 'nback',  title: 'N-Back' },
    { id: 'stroop', title: 'Stroop', lowerBetter: true },
    { id: 'ev',     title: 'Expected Value' },
  ] },
];
if (typeof module !== 'undefined') module.exports = { ME_CATALOG };
