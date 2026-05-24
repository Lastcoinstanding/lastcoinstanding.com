
  // ═══ Data model ═══
  // 10 properties across 3 purposes:
  //   SAVE (4):   purchasing-power, independence, no-management, default-state
  //   INVEST (3): measuring-stick, long-horizon, required-exposure
  //   CONSUME (3): daily-transaction, pressure-to-spend, cross-border
  //
  // Each property has a value (the categorical state) and a decoration
  // (visual treatment: resonant / depleted / decaying / dying) plus a
  // descriptor cell.
  //
  // Cells may contain HTML (e.g., the EO 6102 Wikipedia link on gold/independence)
  // — `desc` is rendered via innerHTML, not textContent.

  const monies = {

    bitcoin: {
      props: {
        // — SAVE —
        'purchasing-power':   { value: 'preserved',    decoration: 'resonant',  desc: 'Fixed supply; the share of the network owned is constant over time. Saving is the rational default.' },
        'independence':       { value: 'bearer',       decoration: 'resonant',  desc: 'A bearer asset on a permissionless network. Unconfiscatable, borderless, transferable globally, no intermediary to fail.' },
        'no-management':      { value: 'passive',      decoration: 'resonant',  desc: 'Holding is a valid lifelong strategy, especially as the network is still being monetized. The very act of saving is once again available, arguably for the first time in decades.' },
        'default-state':      { value: 'restored',     decoration: 'resonant',  desc: 'Hold first; deploy or spend by choice. The pre-fiat default state of wealth preservation is back.' },
        // — INVEST —
        'measuring-stick':    { value: 'fixed',        decoration: 'resonant',  desc: 'Supply curve known in advance. Economic calculation becomes viable, for the first time, even for complex initiatives spanning multiple national borders.' },
        'long-horizon':       { value: 'decades',      decoration: 'resonant',  desc: 'Remaining issuance out to 2140 (under 5% remaining) known with certainty; terminal monetary base defined for eternity. Price of bitcoin drives zero supply response. Long-term plans hold their shape.' },
        'required-exposure':  { value: 'optional',     decoration: 'resonant',  desc: 'Standing still preserves wealth. Investing is a choice, not coercion.' },
        // — CONSUME —
        'daily-transaction':  { value: 'capable',      decoration: 'depleted',  desc: 'Technology is ready (Lightning, final settlement). The brake is fiat-era tax law treating every spend as a taxable disposition \u2014 an artificial construct that should eventually free up bitcoin\u2019s usage.' },
        'pressure-to-spend':  { value: 'none',         decoration: 'resonant',  desc: 'Holders\u2019 wealth grows by holding. Spending is a deliberate choice, never a defensive one.' },
        'cross-border':       { value: 'universal',    decoration: 'resonant',  desc: 'Permissionless global rail. Same protocol everywhere, with no foreign-exchange translation needed. The universal language of value, made practical and pragmatic for trade, even over great distances, for the first time.' }
      }
    },

    gold: {
      props: {
        'purchasing-power':   { value: 'slow-leak',    decoration: 'depleted',  desc: '~2% annual supply growth. Saving is possible across centuries, albeit with a slow, predictable leak/expansion.' },
        'independence':       { value: 'constrained',  decoration: 'depleted',  desc: 'A bearer asset in principle, often centralized in practice. Seizable by decree, as the 1933 confiscation demonstrated (<a href="https://en.wikipedia.org/wiki/Executive_Order_6102" target="_blank" rel="noopener" class="desc-link">rule 6102</a>).' },
        'no-management':      { value: 'manageable',   decoration: 'depleted',  desc: 'Holds across long periods, though the slow leak/expansion in supply structurally limits the efficacy of the saving intent. There is also an open question on whether gold may get demonetized by Bitcoin.' },
        'default-state':      { value: 'partial',      decoration: 'depleted',  desc: 'Can be impractical, especially at scale, to hold in self-custody, or risky to hold as \u2018paper gold\u2019 IOUs with a custodian.' },
        'measuring-stick':    { value: 'drifting',     decoration: 'depleted',  desc: 'Anchoring but never anchored. Supply drifts with mining flow; the true total is unknown and un-auditable, and the future total even less so.' },
        'long-horizon':       { value: 'decades',      decoration: 'depleted',  desc: 'Supply predictable across decades, though high prices can spur a faster mining response.' },
        'required-exposure':  { value: 'light',        decoration: 'depleted',  desc: 'Standing still mostly works. Light pressure to deploy, given the 2% leak.' },
        'daily-transaction':  { value: 'impractical',  decoration: 'decaying',  desc: 'Heavy, indivisible at small denominations, and impractical as a bearer instrument over distance.' },
        'pressure-to-spend':  { value: 'none',         decoration: 'resonant',  desc: 'Holders\u2019 wealth holds. Spending is a deliberate choice, never a defensive one.' },
        'cross-border':       { value: 'gated',        decoration: 'depleted',  desc: 'Heavy, customs-declared, scrutinised. Cross-border transfers are slow and visible. Impractical for trade across distance.' }
      }
    },

    usd: {
      props: {
        'purchasing-power':   { value: 'eroded',       decoration: 'decaying',  desc: 'Real yields below inflation are the norm. Holding cash is a guaranteed loss in real terms.' },
        'independence':       { value: 'intermediated', decoration: 'decaying', desc: 'Held inside the banking system. Accounts can be frozen, seized, or closed at the discretion of intermediaries, or the government. Capital flight can be monitored and limited.' },
        'no-management':      { value: 'compulsory',   decoration: 'decaying',  desc: 'Holding cash is an active loss. Everyone is conscripted into investing or consuming whether they want to or not.' },
        'default-state':      { value: 'eliminated',   decoration: 'decaying',  desc: 'Not pragmatic over any medium to long time period, as the purchasing power is destroyed, by design. Wealth must be consumed or invested.' },
        'measuring-stick':    { value: 'unstable',     decoration: 'decaying',  desc: 'The unit of calculation is itself melting. State debt and money-printing inflates prices system-wide.' },
        'long-horizon':       { value: 'years',        decoration: 'decaying',  desc: 'Policy resets every political cycle. Monetary expansion varies but is almost always inflationary. Long-term planning becomes risky. State capital allocation crowds out the signals private investment depends on.' },
        'required-exposure':  { value: 'mandatory',    decoration: 'decaying',  desc: 'Inflation forces market exposure, just to prevent otherwise guaranteed destruction of purchasing power. Inflationary monetary policy funds malinvestment that private capital would never fund in a free market. Zombie companies get created that the state feels compelled to keep alive, at taxpayer expense.' },
        'daily-transaction':  { value: 'practical',    decoration: 'resonant',  desc: 'Universal merchant acceptance, propped up by the tax neutrality fiat money uniquely enjoys. Government props up fiat as a singular legal tender to reinforce its ability to issue debt or print more money.' },
        'pressure-to-spend':  { value: 'high',         decoration: 'decaying',  desc: 'Holders\u2019 wealth shrinks. Spend now or lose later \u2014 the engine of mal-consumption.' },
        'cross-border':       { value: 'privileged',   decoration: 'depleted',  desc: 'Works as global reserve currency, with sanction-driven and capital-control friction at the edges. Recipients of USD then have to plan for investment or consumption vs. saving/holding for any long duration, as purchasing power will decrease.' }
      }
    },

    hyperinflating: {
      props: {
        'purchasing-power':   { value: 'destroyed',    decoration: 'dying',     desc: 'Wealth held in the unit of account evaporates over months, sometimes weeks, forcing immediate consumption or investment or escape to another, more stable money.' },
        'independence':       { value: 'captured',     decoration: 'dying',     desc: 'Banking access becomes a political instrument. Capital controls and account freezes are routine.' },
        'no-management':      { value: 'impossible',   decoration: 'dying',     desc: 'Holding cash is a same-day loss. Anything tangible is preferred to holding cash, even for a very short time period.' },
        'default-state':      { value: 'inverted',     decoration: 'dying',     desc: 'The default is to spend immediately, as holding cash, even for a very short period of time brings guaranteed loss in purchasing power.' },
        'measuring-stick':    { value: 'unmoored',     decoration: 'dying',     desc: 'No stable unit of account. Economic calculation becomes structurally impossible.' },
        'long-horizon':       { value: 'months',       decoration: 'dying',     desc: 'Planning horizon collapses to weeks. Long-term investment becomes impossible. Any productive resources are directed abroad or cease to operate altogether.' },
        'required-exposure':  { value: 'forced',       decoration: 'dying',     desc: 'Money is forced into anything that moves. Bad investments are preferred to no investment.' },
        'daily-transaction':  { value: 'fraught',      decoration: 'dying',     desc: 'Cash burns in pocket; merchants reprice daily or decline payment in the currency altogether, preferring stronger currencies (even other, not hyperinflating fiat); barter and parallel currencies emerge.' },
        'pressure-to-spend':  { value: 'extreme',      decoration: 'dying',     desc: 'Spend on impulse, on anything tangible, before nightfall.' },
        'cross-border':       { value: 'blocked',      decoration: 'dying',     desc: 'Capital controls. SWIFT exclusion possible. The currency does not function across borders, and is unwanted as a medium-of-exchange by any receiving party abroad, who would have stronger currency.' }
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

      // Write the descriptor (innerHTML — data is hardcoded above, no XSS risk)
      const desc = prop.querySelector('.property-desc');
      if (desc) desc.innerHTML = entry.desc;
    });
  }

  // Wire up preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyMoney(btn.dataset.money));
  });

  // Initial render: Bitcoin
  applyMoney('bitcoin');
