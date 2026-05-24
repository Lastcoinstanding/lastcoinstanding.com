
  // ═══ Data model ═══
  // 10 properties across 3 purposes:
  //   SAVE (4):   purchasing-power, independence, no-management, default-state
  //   INVEST (3): measuring-stick, long-horizon, required-exposure
  //   CONSUME (3): daily-transaction, pressure-to-spend, cross-border
  //
  // Each property has a value (the categorical state) and a decoration
  // (visual treatment: resonant / depleted / decaying / dying) plus a
  // ≤25-word descriptor cell.

  const monies = {

    bitcoin: {
      props: {
        // — SAVE —
        'purchasing-power':   { value: 'preserved',    decoration: 'resonant',  desc: 'Fixed supply; the share of the network owned is constant over time. Saving is the rational default.' },
        'independence':       { value: 'bearer',       decoration: 'resonant',  desc: 'A bearer asset on a permissionless network. No one to ask, no one to seize, no intermediary to fail.' },
        'no-management':      { value: 'passive',      decoration: 'resonant',  desc: 'Holding is a valid lifelong strategy. Saving is again something a person can simply do.' },
        'default-state':      { value: 'restored',     decoration: 'resonant',  desc: 'Hold first; deploy or spend by choice. The pre-fiat default state of wealth is back.' },
        // — INVEST —
        'measuring-stick':    { value: 'fixed',        decoration: 'resonant',  desc: 'Supply curve known in advance. Real returns become legible across decades.' },
        'long-horizon':       { value: 'decades',      decoration: 'resonant',  desc: 'Monetary base knowable out to 2140. Long-term plans hold their shape.' },
        'required-exposure':  { value: 'optional',     decoration: 'resonant',  desc: 'Standing still preserves wealth. Investing is a choice, not coercion.' },
        // — CONSUME —
        'daily-transaction':  { value: 'capable',      decoration: 'depleted',  desc: 'Technology is ready (Lightning, final settlement). The brake is fiat-era tax law treating every spend as a taxable disposition.' },
        'pressure-to-spend':  { value: 'none',         decoration: 'resonant',  desc: 'Holders\u2019 wealth grows by holding. Spending is a deliberate choice, never a defensive one.' },
        'cross-border':       { value: 'universal',    decoration: 'resonant',  desc: 'Permissionless global rail. Same protocol everywhere, with no foreign-exchange translation needed.' }
      }
    },

    gold: {
      props: {
        'purchasing-power':   { value: 'slow-leak',    decoration: 'depleted',  desc: '~2% annual supply growth. Saves across centuries with a slow, predictable leak.' },
        'independence':       { value: 'constrained',  decoration: 'depleted',  desc: 'A bearer asset in principle, centralised in practice. Seizable by decree, as the 1933 confiscation demonstrated.' },
        'no-management':      { value: 'manageable',   decoration: 'depleted',  desc: 'Holds across long periods, though the slow leak eventually forces some rotation for serious capital preservation.' },
        'default-state':      { value: 'partial',      decoration: 'depleted',  desc: 'The default works for those with custody and means. Impractical for most as an everyday holding.' },
        'measuring-stick':    { value: 'drifting',     decoration: 'depleted',  desc: 'Anchoring but never anchored. Supply drifts with mining flow; the true total is unknown and unauditable.' },
        'long-horizon':       { value: 'decades',      decoration: 'depleted',  desc: 'Supply predictable across decades, though high prices can spur a faster mining response.' },
        'required-exposure':  { value: 'light',        decoration: 'depleted',  desc: 'Standing still mostly works. Light pressure to deploy, given the 2% leak.' },
        'daily-transaction':  { value: 'impractical',  decoration: 'decaying',  desc: 'Heavy, indivisible at small denominations, and impractical as a bearer instrument over distance.' },
        'pressure-to-spend':  { value: 'none',         decoration: 'resonant',  desc: 'Holders\u2019 wealth holds. Spending is a deliberate choice, never a defensive one.' },
        'cross-border':       { value: 'gated',        decoration: 'depleted',  desc: 'Heavy, customs-declared, scrutinised. Cross-border transfers are slow and visible.' }
      }
    },

    usd: {
      props: {
        'purchasing-power':   { value: 'eroded',       decoration: 'decaying',  desc: 'Real yields below inflation are the norm. Holding cash is a guaranteed loss in real terms.' },
        'independence':       { value: 'intermediated', decoration: 'decaying', desc: 'Held inside the banking system. Accounts can be frozen, seized, or closed at the discretion of intermediaries.' },
        'no-management':      { value: 'compulsory',   decoration: 'decaying',  desc: 'Holding cash is an active loss. Everyone is conscripted into being an investor whether they want to be or not.' },
        'default-state':      { value: 'eliminated',   decoration: 'decaying',  desc: 'Standing still is not an option. Wealth must be consumed or invested; abstention is priced.' },
        'measuring-stick':    { value: 'unstable',     decoration: 'decaying',  desc: 'The unit of calculation is itself melting. State debt and money-printing distort prices system-wide.' },
        'long-horizon':       { value: 'years',        decoration: 'decaying',  desc: 'Policy resets the baseline each cycle. State capital allocation crowds out the signals private investment depends on.' },
        'required-exposure':  { value: 'mandatory',    decoration: 'decaying',  desc: 'Forced market exposure to stand still. Cheap-money policy funds malinvestment that private capital would not.' },
        'daily-transaction':  { value: 'practical',    decoration: 'resonant',  desc: 'Universal merchant acceptance, propped up by the tax neutrality fiat money uniquely enjoys.' },
        'pressure-to-spend':  { value: 'high',         decoration: 'decaying',  desc: 'Holders\u2019 wealth shrinks. Spend now or lose later \u2014 the engine of malconsumption.' },
        'cross-border':       { value: 'privileged',   decoration: 'depleted',  desc: 'Works as global reserve currency, with sanction-driven and capital-control friction at the edges.' }
      }
    },

    hyperinflating: {
      props: {
        'purchasing-power':   { value: 'destroyed',    decoration: 'dying',     desc: 'Wealth held in the unit of account evaporates over months, sometimes weeks.' },
        'independence':       { value: 'captured',     decoration: 'dying',     desc: 'Banking access becomes a political instrument. Capital controls and account freezes are routine.' },
        'no-management':      { value: 'impossible',   decoration: 'dying',     desc: 'Holding cash is a same-day loss. Anything tangible is preferred to the unit of account.' },
        'default-state':      { value: 'inverted',     decoration: 'dying',     desc: 'The default is to spend immediately. Holding wealth in the unit is the active loss.' },
        'measuring-stick':    { value: 'unmoored',     decoration: 'dying',     desc: 'No stable unit of account. Economic calculation becomes structurally impossible.' },
        'long-horizon':       { value: 'months',       decoration: 'dying',     desc: 'Planning horizon collapses to weeks. Long-term investment becomes a contradiction in terms.' },
        'required-exposure':  { value: 'forced',       decoration: 'dying',     desc: 'Forced into anything that moves. Bad investments are preferred to no investment.' },
        'daily-transaction':  { value: 'fraught',      decoration: 'dying',     desc: 'Cash burns in pocket; merchants reprice daily; barter and parallel currencies emerge.' },
        'pressure-to-spend':  { value: 'extreme',      decoration: 'dying',     desc: 'Spend on impulse, on anything tangible, before nightfall.' },
        'cross-border':       { value: 'blocked',      decoration: 'dying',     desc: 'Capital controls. SWIFT exclusion possible. The currency does not function across borders.' }
      }
    }

  };

  // ═══ Apply preset ═══
  function applyMoney(key) {
    const money = monies[key];
    if (!money) return;

    // Active state for preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.money === key);
    });

    // Update all property cards
    document.querySelectorAll('.property').forEach(prop => {
      const pKey = prop.dataset.prop;
      const entry = money.props[pKey];
      if (!entry) return;

      // Light up the matching state pill
      prop.querySelectorAll('.state-btn').forEach(btn => {
        btn.classList.remove('active-resonant', 'active-depleted', 'active-decaying', 'active-dying');
        if (btn.dataset.state === entry.value) {
          btn.classList.add('active-' + entry.decoration);
        }
      });

      // Write the descriptor text
      const desc = prop.querySelector('.property-desc');
      if (desc) desc.textContent = entry.desc;
    });
  }

  // Wire up preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyMoney(btn.dataset.money));
  });

  // Initial render: Bitcoin
  applyMoney('bitcoin');
