
  (function() {
    var hb = document.getElementById('hamburger');
    var mo = document.getElementById('mobileOverlay');
    if (hb && mo) {
      hb.addEventListener('click', function() {
        hb.classList.toggle('open');
        mo.classList.toggle('show');
      });
    }
  })();


  // ═══ Data model ═══
  const monies = {
    bitcoin: {
      nodes: { sov: 'resonant', moe: 'resonant', uoa: 'resonant' },
      props: {
        'monetary-inflation':    { value: 'zero',           decoration: 'resonant', desc: 'Current issuance rate is 0.8%, halving every 4 years. Higher price drives zero supply response.' },
        'terminal-scarcity':     { value: 'absolute',       decoration: 'resonant', desc: 'First (and last) absolutely scarce commodity money. 21M cap, fixed for eternity. Protocol-enforced.' },
        'confiscation-risk':     { value: 'bearer',         decoration: 'resonant', desc: 'Self-custodied bearer asset. No intermediary to seize. Capital flight is easy.' },
        'durability':            { value: 'persistent',     decoration: 'resonant', desc: 'Share of network owned is fixed for eternity. Structural half-life is eternity.' },
        'settlement-finality':   { value: 'final',          decoration: 'resonant', desc: 'Confirmed transactions are irreversible.' },
        'permissionless-access': { value: 'permissionless', decoration: 'resonant', desc: 'Anyone can hold, send, and receive without approval from anyone else, globally.' },
        'cross-border-friction': { value: 'universal',      decoration: 'resonant', desc: 'Global, borderless network. Universal language of value; no FX translation needed. Most practical for trade over distance.' },
        'divisibility':          { value: 'high',           decoration: 'resonant', desc: '100 million sats per BTC. Divisible to near-infinite fineness. Divisibility can be increased further if/when needed.' },
        'denominator-stability': { value: 'fixed',          decoration: 'resonant', desc: 'Measuring stick fixed by protocol, for eternity. Supply is always certain.' },
        'long-horizon':          { value: 'decades',        decoration: 'resonant', desc: 'Monetary base knowable decades out. Long-horizon planning becomes structurally certain.' },
        'non-sovereign':         { value: 'non-sovereign',  decoration: 'resonant', desc: 'A digital commodity. No issuer. No sovereign can alter its rules — or prevent capital flight.' },
        'open-source':           { value: 'open',           decoration: 'resonant', desc: 'Rules-based monetary network; fully transparent, verifiable by anyone, anywhere, any time.' }
      }
    },
    gold: {
      nodes: { sov: 'resonant', moe: 'depleted', uoa: 'depleted' },
      props: {
        'monetary-inflation':    { value: 'low',            decoration: 'resonant', desc: '~1.5–2% supply growth from mining; higher prices drive higher supply response.' },
        'terminal-scarcity':     { value: 'elastic',        decoration: 'depleted', desc: 'Finite on Earth but elastic. New discoveries continue.' },
        'confiscation-risk':     { value: 'bearer',         decoration: 'resonant', desc: 'Bearer asset in principle. Historically can be seized by decree (1933). Capital flight is difficult.' },
        'durability':            { value: 'persistent',     decoration: 'resonant', desc: 'Chemically inert. Persists across millennia. Structural half-life is ~35 years.' },
        'settlement-finality':   { value: 'final',          decoration: 'depleted', desc: 'Physical transfer is final. Paper claims can reverse.' },
        'permissionless-access': { value: 'gatekept',       decoration: 'depleted', desc: 'KYC above thresholds. Customs-declared at borders. International transfers are scrutinized.' },
        'cross-border-friction': { value: 'fragmented',     decoration: 'depleted', desc: 'Heavy, visible, and regulated across borders. Transfers highly scrutinized. Impractical for trade over distance.' },
        'divisibility':          { value: 'medium',         decoration: 'depleted', desc: 'Physically constrained. Coins and bars as minimum units. Impractical for trade.' },
        'denominator-stability': { value: 'drifting',       decoration: 'depleted', desc: 'Drifts with mining flow. Anchoring, but never anchored. Supply actually unknown and unknowable.' },
        'long-horizon':          { value: 'decades',        decoration: 'resonant', desc: 'Mining supply predictable over decades, but high prices can spur more supply.' },
        'non-sovereign':         { value: 'non-sovereign',  decoration: 'resonant', desc: 'A physical commodity. No issuer — but sovereigns can seize holdings (as in 1933).' },
        'open-source':           { value: 'open',           decoration: 'resonant', desc: 'Assay-verifiable. Properties knowable to anyone.' }
      }
    },
    usd: {
      nodes: { sov: 'decaying', moe: 'decaying', uoa: 'decaying' },
      props: {
        'monetary-inflation':    { value: 'high',           decoration: 'decaying', desc: 'Real inflation is typically >7%. Money printing is required for credit-based economy to function.' },
        'terminal-scarcity':     { value: 'elastic',        decoration: 'decaying', desc: 'No cap. Supply expands at central-bank discretion, in unspoken partnership with Treasury.' },
        'confiscation-risk':     { value: 'confiscatable',  decoration: 'decaying', desc: 'Accounts are tracked and can be frozen or seized at state discretion. Sanctions enforceable.' },
        'durability':            { value: 'slow-decay',     decoration: 'decaying', desc: 'Structural half-life is <10 years.' },
        'settlement-finality':   { value: 'reversible',     decoration: 'decaying', desc: 'Chargebacks, reversals, freezes remain possible.' },
        'permissionless-access': { value: 'gatekept',       decoration: 'decaying', desc: 'Bank account required. KYC at every layer. Large transfers scrutinized. Capital flight permissioned.' },
        'cross-border-friction': { value: 'fragmented',     decoration: 'decaying', desc: 'SWIFT delays. FX fees. Sanctions carve-outs. Capital controls possible.' },
        'divisibility':          { value: 'medium',         decoration: 'decaying', desc: 'Cent minimum. Fees disproportionately penalize small transactions.' },
        'denominator-stability': { value: 'drifting',       decoration: 'decaying', desc: 'Always drifting downwards, at uncertain, varying speed.' },
        'long-horizon':          { value: 'years',          decoration: 'decaying', desc: 'Monetary policy resets the baseline each cycle. Long-term saving, investment, and planning become difficult.' },
        'non-sovereign':         { value: 'state-captured', decoration: 'decaying', desc: 'Federal Reserve sets supply; usually increasing.' },
        'open-source':           { value: 'closed',         decoration: 'decaying', desc: 'Policy determined behind closed doors by handful of people with self-interest.' }
      }
    },
    hyperinflating: {
      nodes: { sov: 'dying', moe: 'dying', uoa: 'dying' },
      props: {
        'monetary-inflation':    { value: 'extreme',        decoration: 'dying', desc: 'Triple-digit annual inflation. Printing becomes unchecked.' },
        'terminal-scarcity':     { value: 'elastic',        decoration: 'dying', desc: 'Supply expanded by decree to cover ever-increasing deficits. Every fiat money dies.' },
        'confiscation-risk':     { value: 'confiscatable',  decoration: 'dying', desc: 'Capital controls and financial repression increase.' },
        'durability':            { value: 'rapid-decay',    decoration: 'dying', desc: 'Structural half-life is weeks or even days.' },
        'settlement-finality':   { value: 'reversible',     decoration: 'dying', desc: 'Chargebacks, reversals, freezes remain possible.' },
        'permissionless-access': { value: 'gatekept',       decoration: 'dying', desc: 'Bank account required. KYC at every layer. Large transfers scrutinized. Capital flight permissioned.' },
        'cross-border-friction': { value: 'blocked',        decoration: 'dying', desc: 'SWIFT delays. FX fees. Sanctions carve-outs. Capital controls possible.' },
        'divisibility':          { value: 'low',            decoration: 'dying', desc: 'Denominations inflate past practical use.' },
        'denominator-stability': { value: 'unmoored',       decoration: 'dying', desc: 'No stable unit. Prices reset daily.' },
        'long-horizon':          { value: 'months',         decoration: 'dying', desc: 'Planning horizon collapses to weeks. Impossible to confidently invest, save or plan for the future.' },
        'non-sovereign':         { value: 'state-captured', decoration: 'dying', desc: 'Captured. Debased to fund state spending.' },
        'open-source':           { value: 'closed',         decoration: 'dying', desc: 'Policy determined behind closed doors by handful of people with self-interest.' }
      }
    }
  };

  // ═══ Apply preset ═══
  function applyMoney(key) {
    const money = monies[key];
    if (!money) return;

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.money === key);
    });

    ['sov', 'moe', 'uoa'].forEach(nId => {
      const node = document.getElementById('node-' + nId);
      node.classList.remove('resonant', 'depleted', 'decaying', 'dying');
      node.classList.add(money.nodes[nId]);
    });

    // Coupling line takes the state of the weaker endpoint.
    // Severity order: resonant < depleted < decaying < dying.
    const severity = { resonant: 0, depleted: 1, decaying: 2, dying: 3 };
    const states   = ['resonant', 'depleted', 'decaying', 'dying'];
    const lineState = (a, b) => states[Math.max(severity[a], severity[b])];

    [['line-sov-moe', money.nodes.sov, money.nodes.moe],
     ['line-sov-uoa', money.nodes.sov, money.nodes.uoa],
     ['line-moe-uoa', money.nodes.moe, money.nodes.uoa]].forEach(([id, a, b]) => {
      const line = document.getElementById(id);
      line.classList.remove('resonant', 'depleted', 'decaying', 'dying');
      line.classList.add(lineState(a, b));
    });

    document.querySelectorAll('.property').forEach(prop => {
      const pKey = prop.dataset.prop;
      const entry = money.props[pKey];
      if (!entry) return;

      prop.querySelectorAll('.state-btn').forEach(btn => {
        btn.classList.remove('active-resonant', 'active-depleted', 'active-decaying', 'active-dying');
        if (btn.dataset.state === entry.value) {
          btn.classList.add('active-' + entry.decoration);
        }
      });

      const desc = prop.querySelector('.property-desc');
      if (desc) desc.textContent = entry.desc;
    });
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyMoney(btn.dataset.money));
  });
  applyMoney('bitcoin');
