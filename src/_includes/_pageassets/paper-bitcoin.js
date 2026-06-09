
  // ═══ Severity scales ═══
  // Warm camp: how intact the property remains (best → worst)
  const WARM_STATES = ['intact', 'mostly', 'compromised', 'severed'];
  const WARM_LABELS = { intact: 'Intact', mostly: 'Mostly intact', compromised: 'Compromised', severed: 'Severed' };
  // Cool camp: how heavy the burden (lightest → heaviest)
  const COOL_STATES = ['light', 'moderate', 'heavy', 'structural'];
  const COOL_LABELS = { light: 'Light', moderate: 'Moderate', heavy: 'Heavy', structural: 'Structural' };

  const DIM_CAMP = {
    bearer: 'warm', confiscation: 'warm', freezes: 'warm', rehypo: 'warm', privacy: 'warm',
    keyloss: 'cool', coercion: 'cool', inheritance: 'cool', burden: 'cool', exit: 'cool'
  };

  // ═══ Data model: five custody models × ten dimensions ═══
  const models = {
    etf: {
      hold: 'You hold: a security entitlement to shares of a trust that holds a claim on a custodian\u2019s vault.',
      dims: {
        bearer:       { state: 'severed',     desc: 'Five intermediated claims separate you from any coin \u2014 and the issuer\u2019s own prospectus calls the custodian\u2019s bankruptcy protections \u201crelatively untested.\u201d' },
        confiscation: { state: 'severed',     desc: 'A modern 6102 needs one directive to the handful of custodians holding most ETF coin \u2014 paper gold\u2019s failure mode, replayed at higher concentration.' },
        freezes:      { state: 'severed',     desc: 'Brokerage assets sit inside the banking perimeter \u2014 every control that reaches a bank account reaches them.' },
        rehypo:       { state: 'compromised', desc: 'Trust assets pool through an omnibus prime-execution layer; you rely on policy and audit, not proof.' },
        privacy:      { state: 'compromised', desc: 'Holdings are invisible to criminals scraping crypto databases \u2014 and fully visible to the state, by design.' },
        keyloss:      { state: 'light',       desc: 'No keys to lose; passwords reset and beneficiaries transfer. SIPC covers a failed brokerage \u2014 it does not cover a failed bitcoin custodian.' },
        coercion:     { state: 'light',       desc: 'No bearer asset exists to hand over at gunpoint \u2014 coercion has nothing instant to extract.' },
        inheritance:  { state: 'light',       desc: 'A death certificate and a beneficiary form do everything; heirs never touch a key.' },
        burden:       { state: 'light',       desc: 'A ticker in a brokerage account \u2014 no new skills, no new habits.' },
        exit:         { state: 'heavy',       desc: 'Reaching real bitcoin means selling (a taxable event), transferring, rebuying, and withdrawing. The one exception: inside an IRA, the ETF is the only door in \u2014 and coins can never come out in kind.' }
      }
    },
    exchange: {
      hold: 'You hold: a contractual IOU from a platform. Whether the coins are yours depends on terms you likely haven\u2019t read.',
      dims: {
        bearer:       { state: 'severed',     desc: 'What you own depends on terms of service \u2014 Celsius customers learned in bankruptcy court that $4.2B of \u201ctheir\u201d coins legally belonged to the platform.' },
        confiscation: { state: 'severed',     desc: 'Exchanges comply with seizure and freeze orders to keep their licenses; your coins are reachable by administrative action.' },
        freezes:      { state: 'severed',     desc: 'In 2022, Canadian exchanges froze protest-linked accounts by government order within days.' },
        rehypo:       { state: 'severed',     desc: 'Yield-bearing terms have explicitly granted platforms the right to pledge, lend, and rehypothecate customer coins.' },
        privacy:      { state: 'severed',     desc: 'KYC files pair your identity, your address, and your balance \u2014 a standing target list awaiting its breach.' },
        keyloss:      { state: 'moderate',    desc: 'Forgotten passwords are recoverable; the platform\u2019s own failure is not \u2014 recourse ends where insolvency begins.' },
        coercion:     { state: 'moderate',    desc: 'An attacker with your phone and your face can drain the account; leaked KYC records have led criminals to doors.' },
        inheritance:  { state: 'moderate',    desc: 'Platform-dependent legal process \u2014 workable, slow, and contingent on the platform existing when needed.' },
        burden:       { state: 'light',       desc: 'A login, an app, and the discipline to enable 2FA.' },
        exit:         { state: 'light',       desc: 'One withdrawal, one network fee, no taxable event \u2014 the baby step that keeps every other step available.' }
      }
    },
    collab: {
      hold: 'You hold: bitcoin. A service holds one minority key; you hold the quorum.',
      dims: {
        bearer:       { state: 'intact',      desc: 'You hold the key quorum; the service\u2019s failure or bankruptcy cannot touch coins it cannot move.' },
        confiscation: { state: 'mostly',      desc: 'Remote seizure is mathematically impossible; distributed keys mean no single door to knock on.' },
        freezes:      { state: 'mostly',      desc: 'The service can decline to co-sign, but your quorum doesn\u2019t need it \u2014 transactions clear anyway.' },
        rehypo:       { state: 'intact',      desc: 'Coins sit at an on-chain address you can verify and that cannot move without your signature.' },
        privacy:      { state: 'compromised', desc: 'The service knows who you are, though it cannot move \u2014 and depending on setup, cannot fully see \u2014 what your quorum controls.' },
        keyloss:      { state: 'moderate',    desc: 'Lose one key and the service\u2019s backup key recovers you; lose your quorum and nothing can.' },
        coercion:     { state: 'moderate',    desc: 'No single person \u2014 including you under duress \u2014 can move the coins; time-delays and duress protocols exist for exactly this.' },
        inheritance:  { state: 'moderate',    desc: 'Structured inheritance protocols guide heirs to recovery without exposing keys during your lifetime.' },
        burden:       { state: 'moderate',    desc: 'Multiple devices, periodic key checks, a service relationship \u2014 real work, shared with a partner.' },
        exit:         { state: 'light',       desc: 'Export the wallet configuration to open-source software and walk \u2014 the service cannot hold you.' }
      }
    },
    singlesig: {
      hold: 'You hold: bitcoin. One key, yours alone \u2014 and so is everything that can happen to it.',
      dims: {
        bearer:       { state: 'intact',      desc: 'Ownership is the key itself \u2014 no counterparty exists.' },
        confiscation: { state: 'intact',      desc: 'Where hidden gold could not be used, hidden bitcoin still works \u2014 seizure requires finding the holder, not sending a memo.' },
        freezes:      { state: 'intact',      desc: 'No intermediary exists to receive the freeze order.' },
        rehypo:       { state: 'intact',      desc: 'Your coins verifiably exist and verifiably cannot be lent \u2014 the chain is the audit.' },
        privacy:      { state: 'mostly',      desc: 'If acquired with KYC, the purchase record exists somewhere; the holdings themselves answer to no registry.' },
        keyloss:      { state: 'structural',  desc: 'One lost seed phrase is total, permanent, unappealable loss \u2014 an estimated 2.3\u20134M coins are already there.' },
        coercion:     { state: 'structural',  desc: 'The key\u2019s holder is the vault\u2019s door \u2014 the profile France\u2019s kidnapping wave selected for.' },
        inheritance:  { state: 'structural',  desc: 'The secrecy that protects you in life locks out your family at death \u2014 the estate plan is a treasure map they must solve.' },
        burden:       { state: 'heavy',       desc: 'You are the security team: device, backup, firmware, opsec \u2014 for decades, without a mistake.' },
        exit:         { state: 'light',       desc: 'Move anywhere on the spectrum with a single signed transaction.' }
      }
    },
    diy: {
      hold: 'You hold: bitcoin, behind a quorum you built yourself. Nothing stands between you and it \u2014 including help.',
      dims: {
        bearer:       { state: 'intact',      desc: 'Ownership is the quorum you alone control \u2014 no counterparty exists.' },
        confiscation: { state: 'intact',      desc: 'Geographically split keys make seizure impractical even with the holder in custody.' },
        freezes:      { state: 'intact',      desc: 'No intermediary exists to receive the freeze order.' },
        rehypo:       { state: 'intact',      desc: 'Your coins verifiably exist and verifiably cannot be lent \u2014 the chain is the audit.' },
        privacy:      { state: 'mostly',      desc: 'The holdings answer to no registry; only your acquisition trail knows your name.' },
        keyloss:      { state: 'heavy',       desc: 'Key redundancy protects you, but lost wallet-descriptor metadata can brick funds even with every seed intact.' },
        coercion:     { state: 'moderate',    desc: 'A quorum split across locations means a home invasion captures a key, not the coins.' },
        inheritance:  { state: 'structural',  desc: 'Heirs must execute your architecture without you; most cannot.' },
        burden:       { state: 'structural',  desc: 'Everything single-sig demands, multiplied by the quorum, plus the architecture documentation only you maintain.' },
        exit:         { state: 'light',       desc: 'Move anywhere on the spectrum with a quorum of signatures.' }
      }
    }
  };

  // ═══ Build the static scale chips once ═══
  document.querySelectorAll('.dimension').forEach(dim => {
    const camp = DIM_CAMP[dim.dataset.dim];
    const states = camp === 'warm' ? WARM_STATES : COOL_STATES;
    const labels = camp === 'warm' ? WARM_LABELS : COOL_LABELS;
    const scale = dim.querySelector('.dimension-scale');
    scale.innerHTML = states.map(s =>
      '<span class="state-chip" data-state="' + s + '">' + labels[s] + '</span>'
    ).join('');
  });

  // ═══ Apply a custody model ═══
  function applyModel(key) {
    const model = models[key];
    if (!model) return;

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.model === key);
      btn.setAttribute('aria-selected', btn.dataset.model === key ? 'true' : 'false');
    });

    document.getElementById('youHold').textContent = model.hold;

    document.querySelectorAll('.dimension').forEach(dim => {
      const d = model.dims[dim.dataset.dim];
      if (!d) return;
      const camp = DIM_CAMP[dim.dataset.dim];
      // Decoration class on the row reflects the active state
      dim.className = 'dimension ' + camp + '-' + d.state;
      dim.dataset.dim = dim.dataset.dim; // preserve
      dim.querySelectorAll('.state-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.state === d.state);
      });
      dim.querySelector('.dimension-desc').textContent = d.desc;
    });
  }

  // ═══ Wire presets ═══
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyModel(btn.dataset.model));
  });

  // Initial state: single-sig (the canonical "physical bitcoin")
  applyModel('singlesig');
