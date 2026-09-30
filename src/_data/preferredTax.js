// The Bitcoin and Fixed Income tax example, computed at build time from the
// preferreds' rates (src/_data/preferredRates.json), so a rate change updates
// the example with it. The page's own assumptions, stated beside the table:
// a 42% combined ordinary rate, a 30% combined long-term capital-gains rate
// (the calculator's default), inflation at M2 growth (6.5%), a $100 share
// bought at par and sold at par at the end of the hold.
//   Ordinary: the dividend taxed each year at 42%.
//   ROC: each dividend returns capital (untaxed) until the $100 basis is used
//   up, then is taxed as a long-term gain in the year paid; the sale at par
//   is a long-term gain of $100 less the basis left. The yield is the IRR of
//   those after-tax cash flows.
const rates = require('./preferredRates.json');

const ORDINARY = 0.42, LTCG = 0.30, INFLATION = 6.5;

function irr(cfs) {
  let lo = -0.9, hi = 1.0;
  for (let k = 0; k < 200; k++) {
    const m = (lo + hi) / 2;
    const v = cfs.reduce((a, c, t) => a + c / Math.pow(1 + m, t), 0);
    if (v > 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
function rocIrr(ratePct, years) {
  let basis = 100;
  const cfs = [-100];
  for (let y = 1; y <= years; y++) {
    const d = ratePct, back = Math.min(d, basis);
    basis -= back;
    cfs.push(d - (d - back) * LTCG);
  }
  cfs[years] += 100 - (100 - basis) * LTCG;
  return irr(cfs) * 100;
}
function one(ratePct, hold) {
  const ord = ratePct * (1 - ORDINARY), roc = rocIrr(ratePct, hold);
  return {
    ratePct, hold,
    depletionYears: 100 / ratePct,
    ordinary: ord, ordinaryReal: ord - INFLATION,
    roc, rocReal: roc - INFLATION,
    taxEquivalent: roc / (1 - ORDINARY),
    rocAdvantage: roc - ord
  };
}

module.exports = {
  assumptions: { ordinaryPct: ORDINARY * 100, ltcgPct: LTCG * 100, inflationPct: INFLATION },
  strc: one(rates.strc.ratePct, 9),
  sata: one(rates.sata.ratePct, 8)
};
