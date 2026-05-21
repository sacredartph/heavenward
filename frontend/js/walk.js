// The Walk - rosary state and rendering.
(function (global) {
  const state = {
    walkId: null,
    mysterySet: null,
    mysteries: [],
    decadeIdx: 0,
    beadIdx: 0,
    steps: 0,
    pedometerSubId: null,
    intentions: []   // 50-name roster from /api/walk/intentions
  };

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]); }

  function currentBeadGlobalIdx() {
    // Decades are 0..4, each has 10 beads. beadIdx 0..10.
    return state.decadeIdx * 10 + Math.min(state.beadIdx, 9);
  }
  function renderIntention() {
    const el = document.getElementById('named-intention');
    const nameEl = document.getElementById('named-intention-name');
    const detailEl = document.getElementById('named-intention-detail');
    const beadNum = document.getElementById('bead-num');
    if (!el || !state.intentions.length) { if (el) el.classList.add('hidden'); return; }
    const i = currentBeadGlobalIdx();
    const offset = state.intentionOffset || 0;
    const intent = state.intentions[(i + offset) % state.intentions.length];
    nameEl.textContent = intent.name || '—';
    detailEl.textContent = intent.intention || '';
    if (intent.source === 'petition_emergency') el.dataset.urgency = 'emergency';
    else if (intent.source === 'petition_urgent') el.dataset.urgency = 'urgent';
    else el.dataset.urgency = '';
    el.classList.remove('hidden');
    if (beadNum) beadNum.textContent = String(i + 1);
  }

  function renderBeads() {
    const counter = document.getElementById('bead-counter');
    counter.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('div');
      b.className = 'bead' + (i < state.beadIdx ? ' done' : '') + (i === state.beadIdx ? ' current' : '');
      counter.appendChild(b);
    }
  }

  function renderDecade() {
    const m = state.mysteries[state.decadeIdx];
    document.getElementById('walk-mystery-name').textContent = m.mystery_name;
    document.getElementById('walk-scripture').textContent = m.scripture_ref;
    document.getElementById('walk-reflection').textContent = m.reflection;
    document.getElementById('walk-question').textContent = m.decade_question;
    document.getElementById('decade-num').textContent = String(state.decadeIdx + 1);
    state.beadIdx = 0;
    renderBeads();
    renderIntention();
  }

  function advanceBead() {
    if (state.beadIdx < 10) {
      state.beadIdx += 1;
      renderBeads();
      renderIntention();
      if (window.HwAudio) HwAudio.ring();
      if (state.beadIdx === 10) {
        if (window.HwAudio) setTimeout(() => HwAudio.bell(), 250);
        setTimeout(nextDecade, 700);
      }
    }
  }

  function nextDecade() {
    if (state.decadeIdx < state.mysteries.length - 1) {
      state.decadeIdx += 1;
      renderDecade();
      api.put('/api/walk/' + state.walkId + '/advance', { decades_completed: state.decadeIdx, steps: state.steps }).catch(() => {});
    } else {
      showTail();
    }
  }

  async function showTail() {
    const data = await api.get('/api/walk/tail');
    const list = document.getElementById('tail-list');
    const sections = [
      { title: 'Repository of the Dead', items: data.dead.map(d => '+ ' + d.full_name + (d.nickname ? ' (' + d.nickname + ')' : '')) },
      { title: 'For the Sick', items: data.sick.map(s => s.person_name + ' - ' + s.intention) },
      { title: 'Our Petitions', items: data.petitions.map(p => '[L' + p.level + '] ' + (p.person_name ? p.person_name + ' - ' : '') + p.petition) },
      { title: 'Thanksgiving', items: data.thanksgiving.map(t => (t.person_name ? t.person_name + ' - ' : '') + t.thanksgiving_text) },
      { title: 'For the Church and the World', items: data.church.petitions }
    ];
    const namedCount = state.intentions ? state.intentions.length : 0;
    list.innerHTML = sections.map(s => s.items.length
      ? '<div class="tail-section"><h4>' + s.title + '</h4>' + s.items.map(i => '<p>' + escape(i) + '</p>').join('') + '</div>'
      : ''
    ).join('')
      + '<div class="tail-section"><h4>Closing</h4><p style="font-style:italic">Hail, Holy Queen, Mother of Mercy, our life, our sweetness, and our hope. Amen.</p></div>'
      + '<p class="italic-cta" style="text-align:center;color:var(--gold)">You named ' + namedCount + ' of yours today. Rest now in Mary.</p>';
    showScreen('walk-tail');
  }

  function escape(s) { return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  async function begin() {
    // Solo/family is now auto-detected via existing active family walks.
    const r = await api.post('/api/walk/start', { mode: 'solo' });
    state.walkId = r.walk_id;
    state.mysterySet = r.mystery_set;
    const [t, intents] = await Promise.all([
      api.get('/api/walk/today'),
      api.get('/api/walk/intentions').catch(() => ({ roster: [] }))
    ]);
    state.mysteries = t.mysteries;
    state.intentions = intents.roster || [];
    // Random offset into the 50-name roster so each walk begins with a different
    // person on bead one. The roster itself stays day-stable (devices in the
    // same family/day see the same set), but each walk's entry point rotates,
    // so over many walks the whole circle gets the prominent first-bead moment.
    state.intentionOffset = state.intentions.length ? Math.floor(Math.random() * state.intentions.length) : 0;
    state.decadeIdx = 0;
    state.steps = 0;
    document.getElementById('step-count').textContent = '0';
    startPedometer();
    if (window.HwAudio) HwAudio.ensure();
    renderDecade();
    showScreen('walk-active');
  }

  async function finishWalk() {
    stopPedometer();
    try {
      const r = await api.post('/api/walk/' + state.walkId + '/complete', { steps: state.steps, decades_completed: state.decadeIdx + 1, tail_completed: true });
      toast('We prayed together today. (' + Math.round(r.duration_seconds / 60) + 'm, streak ' + r.streak_days + ')');
    } catch (e) { toast('Walk recorded.'); }
    showScreen('home', { replace: true });
    if (global.refreshHome) refreshHome();
  }

  async function endEarly() {
    stopPedometer();
    try { await api.post('/api/walk/' + state.walkId + '/complete', { steps: state.steps, decades_completed: state.decadeIdx, tail_completed: false }); } catch {}
    toast('Walk ended.');
    showScreen('home', { replace: true });
  }

  // Pedometer (DeviceMotion-based light approximation).
  let lastStepAt = 0;
  function startPedometer() {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      DeviceMotionEvent.requestPermission().then(p => { if (p === 'granted') window.addEventListener('devicemotion', motionHandler); }).catch(() => {});
    } else {
      window.addEventListener('devicemotion', motionHandler);
    }
    state.pedometerSubId = setInterval(() => {}, 1000);
  }
  function stopPedometer() {
    window.removeEventListener('devicemotion', motionHandler);
    if (state.pedometerSubId) { clearInterval(state.pedometerSubId); state.pedometerSubId = null; }
  }
  function motionHandler(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    const now = Date.now();
    if (mag > 12 && now - lastStepAt > 350) {
      lastStepAt = now;
      state.steps += 1;
      document.getElementById('step-count').textContent = String(state.steps);
    }
  }

  // ============================================================
  // The Pilgrim Path - shared visual for Camino + Saint's Companion
  // ============================================================
  const pilgrim = {
    mode: null,            // 'camino' or 'saint'
    goal: 1000,
    steps: 0,
    pedometerSubId: null,
    title: '',
    sub: '',
    recipientName: '',
    saintQuotes: [],
    nextQuoteAtStep: 50,
    quoteIdx: 0
  };

  function setPilgrimDestination(opts) {
    // opts: { glyphSvgInner: '<path .../>', letter: 'L' or null }
    const g = document.getElementById('pilgrim-destination-glyph');
    const letter = document.getElementById('pilgrim-destination-letter');
    if (opts.glyphSvgInner) {
      g.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" style="color:#C9A84C">' + opts.glyphSvgInner + '</svg>';
      letter.textContent = '';
    } else if (opts.letter) {
      g.innerHTML = '';
      letter.textContent = opts.letter;
    }
  }

  function updatePilgrim() {
    const path = document.getElementById('pilgrim-path-fill');
    const fig = document.getElementById('pilgrim-figure');
    const comp = document.getElementById('pilgrim-companion');
    if (!path || !fig) return;
    const total = path.getTotalLength();
    const progress = Math.min(1, pilgrim.steps / pilgrim.goal);
    path.style.strokeDashoffset = total * (1 - progress);
    const pt = path.getPointAtLength(total * progress);
    fig.setAttribute('transform', 'translate(' + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) + ')');
    // Saint companion silhouette: walks just behind, slightly offset.
    if (pilgrim.mode === 'saint' && comp) {
      const trailProgress = Math.max(0, progress - 0.04);
      const cp = path.getPointAtLength(total * trailProgress);
      comp.setAttribute('transform', 'translate(' + (cp.x + 14).toFixed(2) + ',' + (cp.y + 2).toFixed(2) + ')');
      comp.setAttribute('opacity', '1');
    }
    document.getElementById('pilgrim-steps').textContent = String(pilgrim.steps);
    // Bell every 100 steps
    if (window.HwAudio && pilgrim.steps > 0 && pilgrim.steps % 100 === 0 && pilgrim.steps !== pilgrim._lastBellAt) {
      pilgrim._lastBellAt = pilgrim.steps;
      HwAudio.ring();
    }
    // Prayer pacing - works for both Camino and Saint Walk.
    if (pilgrim.steps >= pilgrim.nextQuoteAtStep && pilgrim.saintQuotes.length > 0) {
      const q = pilgrim.saintQuotes[pilgrim.quoteIdx % pilgrim.saintQuotes.length];
      showSaintQuote(q);
      pilgrim.quoteIdx += 1;
      pilgrim.nextQuoteAtStep += 50;
    }
    // Completion
    if (pilgrim.steps >= pilgrim.goal) completePilgrim();
  }

  function showSaintQuote(text) {
    const q = document.getElementById('pilgrim-quote');
    if (!q) return;
    q.classList.remove('hidden');
    q.style.opacity = '0';
    setTimeout(() => { q.textContent = '"' + text + '"'; q.style.opacity = '1'; }, 180);
    if (window.HwAudio) HwAudio.ring();
  }

  let pilgrimMotionLast = 0;
  function pilgrimMotion(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    const now = Date.now();
    if (mag > 12 && now - pilgrimMotionLast > 350) {
      pilgrimMotionLast = now;
      pilgrim.steps += 1;
      updatePilgrim();
    }
  }
  function startPilgrimPedometer() {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      DeviceMotionEvent.requestPermission().then(p => { if (p === 'granted') window.addEventListener('devicemotion', pilgrimMotion); }).catch(() => {});
    } else {
      window.addEventListener('devicemotion', pilgrimMotion);
    }
    // Tick at 1Hz to be sure the screen stays animated even if no motion.
    pilgrim.pedometerSubId = setInterval(() => {}, 1000);
  }
  function stopPilgrimPedometer() {
    window.removeEventListener('devicemotion', pilgrimMotion);
    if (pilgrim.pedometerSubId) { clearInterval(pilgrim.pedometerSubId); pilgrim.pedometerSubId = null; }
  }

  function endPilgrimEarly() {
    stopPilgrimPedometer();
    toast('Walk ended.');
    showScreen('home', { replace: true });
  }

  async function completePilgrim() {
    if (pilgrim._completed) return;
    pilgrim._completed = true;
    stopPilgrimPedometer();
    const line = pilgrim.mode === 'camino'
      ? 'You walked ' + pilgrim.steps + ' steps for ' + pilgrim.recipientName + '.'
      : 'You walked with ' + pilgrim.recipientName + ' for ' + Math.max(1, Math.round(pilgrim.steps / 100)) + ' minutes.';
    const sub = pilgrim.mode === 'camino' ? 'The Father saw it.' : 'They walked with you the whole way.';
    document.getElementById('pilgrim-complete-line').textContent = line;
    document.getElementById('pilgrim-complete-sub').textContent = sub;
    // Log to Hearth so the family witnesses it.
    try {
      const content = (api.user().display_name || 'Family').split(' ')[0] + ' ' + (pilgrim.mode === 'camino' ? 'walked ' + pilgrim.steps + ' steps for ' + pilgrim.recipientName + '.' : 'walked with ' + pilgrim.recipientName + '.');
      await api.post('/api/hearth/post', { type: 'prayed_for', content });
    } catch {}
    // Log to pilgrim_log so the next Camino picker excludes this person for 24h.
    try {
      await api.post('/api/walk/pilgrim', {
        mode: pilgrim.mode,
        recipient: pilgrim.recipientName,
        steps: pilgrim.steps
      });
    } catch {}
    showScreen('pilgrim-complete');
  }

  // ---------- Camino ----------
  // Picker layout: a fixed "Holy Father / Church" intention always at the top
  // (the universal Catholic daily intention), then up to 6 randomly-rotated
  // cards drawn from the family's petitions (level <= 2 = emergency/urgent)
  // and active sick list, excluding anyone this user already walked-for in
  // the last 24h. Free intention card stays available below the list.
  const HOLY_FATHER_INTENTION = {
    name: 'The Holy Father & His Church',
    sub: 'For Pope Leo XIV, the Catholic Church, her priests, and all consecrated to God.',
    kind: 'holy-father',
    fixed: true
  };
  const ROTATING_SLOT_COUNT = 6;

  function shuffleInPlace(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function openCaminoPicker() {
    const list = document.getElementById('camino-pick-list');
    list.innerHTML = '<p class="muted small">Loading…</p>';
    const [pet, sick, recent] = await Promise.all([
      api.get('/api/prayer/petitions').catch(() => ({ petitions: [] })),
      api.get('/api/prayer/sick').catch(() => ({ sick: [] })),
      api.get('/api/walk/pilgrim/recent?hours=24').catch(() => ({ recipients: [] }))
    ]);
    const alreadyWalked = new Set((recent.recipients || []).map(s => s.toLowerCase()));

    // Build the rotating pool: emergency/urgent petitions + active sick.
    const pool = [];
    for (const p of (pet.petitions || []).filter(p => p.level <= 2))
      pool.push({ name: p.person_name || 'Intention', sub: p.petition, kind: 'petition' });
    for (const s of (sick.sick || []))
      pool.push({ name: s.person_name, sub: s.intention, kind: 'sick' });

    // Exclude anyone walked-for in the last 24h.
    const fresh = pool.filter(c => !alreadyWalked.has(String(c.name).toLowerCase()));

    // Randomize and slice. If everyone has been walked-for today (no fresh
    // people left), fall back to the full pool so the picker is never empty.
    const rotating = shuffleInPlace((fresh.length ? fresh : pool).slice()).slice(0, ROTATING_SLOT_COUNT);

    // The Holy Father intention is always at the top, regardless of pool state.
    const cards = [HOLY_FATHER_INTENTION].concat(rotating);
    // Belt-and-braces: if the family hasn't built a circle yet, the picker
    // still shows the Holy Father card alone.

    list.innerHTML = cards.map(c => `
      <button class="camino-pick-card${c.fixed ? ' camino-pick-card-fixed' : ''}"
              data-name="${escape(c.name)}"
              data-sub="${escape(c.sub || '')}"
              data-kind="${escape(c.kind)}">
        <div class="cpc-letter">${escape((c.name || '?')[0])}</div>
        <div class="cpc-body">
          <div class="cpc-name">${escape(c.name)}</div>
          ${c.sub ? '<div class="cpc-sub muted small">' + escape(c.sub) + '</div>' : ''}
        </div>
      </button>`).join('');
    list.querySelectorAll('.camino-pick-card').forEach(b => b.addEventListener('click', () => startPilgrim({
      mode: 'camino', name: b.dataset.name, sub: b.dataset.sub
    })));
    showScreen('camino-pick');
  }

  // Prayer rotations for Camino Walk - each line gets a turn every ~50 steps.
  const CAMINO_PRAYERS = [
    'Hail Mary, full of grace, the Lord is with thee.',
    'Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.',
    'Holy Mary, Mother of God, pray for us sinners.',
    'Lord, hear our prayer for {name}.',
    'Heart of Jesus, have mercy on {name}.',
    'Mary, intercede for {name}.',
    'Lord, by your wounds, heal {name}.',
    'Father, into your hands we commend {name}.'
  ];

  function startPilgrim(opts) {
    pilgrim.mode = opts.mode;
    pilgrim.steps = 0;
    pilgrim._completed = false;
    pilgrim._lastBellAt = 0;
    pilgrim.recipientName = opts.name;
    pilgrim.goal = opts.goal || (opts.mode === 'camino' ? 1000 : 300);
    pilgrim.nextQuoteAtStep = 50;
    // Camino uses a rotating litany of short prayers personalized to the recipient;
    // Saint Walk uses the saint's quotes.
    if (opts.mode === 'camino') {
      pilgrim.saintQuotes = CAMINO_PRAYERS.map(p => p.replace(/\{name\}/g, opts.name));
    } else {
      pilgrim.saintQuotes = opts.quotes || [];
    }
    // Random opening quote so the walk feels different each time. Subsequent
    // quotes still cycle in order from the picked starting point.
    pilgrim.quoteIdx = pilgrim.saintQuotes.length ? Math.floor(Math.random() * pilgrim.saintQuotes.length) : 0;
    document.getElementById('pilgrim-title').textContent = (opts.mode === 'camino' ? 'For ' : 'With ') + opts.name;
    document.getElementById('pilgrim-sub').textContent = opts.sub || '';
    document.getElementById('pilgrim-goal').textContent = String(pilgrim.goal);
    document.getElementById('pilgrim-steps').textContent = '0';
    setPilgrimDestination(opts.destination || { letter: (opts.name || '?')[0] });
    // Reset path fill
    const path = document.getElementById('pilgrim-path-fill');
    if (path) { const total = path.getTotalLength(); path.style.strokeDashoffset = total; }
    // Reset companion
    const comp = document.getElementById('pilgrim-companion');
    if (comp) comp.setAttribute('opacity', opts.mode === 'saint' ? '0.6' : '0');
    // Reset quote
    const q = document.getElementById('pilgrim-quote');
    if (q) { q.classList.add('hidden'); q.textContent = ''; }
    // Reset pilgrim to bottom
    const fig = document.getElementById('pilgrim-figure');
    if (fig) {
      const start = path.getPointAtLength(0);
      fig.setAttribute('transform', 'translate(' + start.x + ',' + start.y + ')');
    }
    showScreen('pilgrim');
    startPilgrimPedometer();
    if (window.HwAudio) HwAudio.ensure();
    updatePilgrim();
    // Show the first prayer immediately - the user shouldn't have to walk 50 steps
    // before seeing one. Use the randomly-picked starting quote, then advance.
    if (pilgrim.saintQuotes.length > 0) {
      showSaintQuote(pilgrim.saintQuotes[pilgrim.quoteIdx % pilgrim.saintQuotes.length]);
      pilgrim.quoteIdx = (pilgrim.quoteIdx + 1) % pilgrim.saintQuotes.length;
    }
  }

  // ---------- Saint Walk ----------
  // Each tap pulls a fresh saint from /api/saints/random. The 30% bias toward
  // the day's liturgical memorial lives server-side. We pass the slug we just
  // walked with so two back-to-back walks never repeat the same companion.
  let __lastSaintSlug = null;
  async function openSaintWalk() {
    let saint = null, source = null;
    try {
      const url = '/api/saints/random' + (__lastSaintSlug ? '?notSlug=' + encodeURIComponent(__lastSaintSlug) : '');
      const r = await api.get(url);
      saint = r.saint; source = r.source;
    } catch {}
    if (!saint) { toast('No saint available right now.'); return; }
    __lastSaintSlug = saint.slug;
    // Compose ~5 quotable lines for this walk.
    const quotes = [];
    if (saint.key_quote) quotes.push(saint.key_quote);
    if (saint.brief) quotes.push(saint.brief);
    // Pull a few sentences from the full story.
    const story = (saint.full_story_adult || '').split(/(?<=\.)\s+/).filter(s => s.length > 30 && s.length < 220).slice(0, 6);
    for (const s of story) quotes.push(s);
    // Always close with a prayer to the saint.
    quotes.push(saint.name + ', pray for us.');
    const glyph = (window.Avatars && Avatars.SAINT_TO_GLYPH[saint.slug]) || 'cross';
    const glyphSvg = window.Avatars ? window.Avatars.GLYPHS[glyph] : null;
    startPilgrim({
      mode: 'saint',
      name: saint.name,
      sub: 'Walking with the saint of today',
      goal: 300,           // shorter walk for the contemplative mode
      quotes: quotes.slice(0, 6),
      destination: glyphSvg ? { glyphSvgInner: glyphSvg } : { letter: saint.name[0] }
    });
  }

  // ---------- Walk launch wiring ----------
  async function refreshWalkLaunch() {
    try {
      const t = await api.get('/api/walk/today');
      const setName = (t.mystery_set || 'Joyful');
      document.getElementById('walk-set-name').textContent = setName.charAt(0).toUpperCase() + setName.slice(1) + ' Mysteries';
    } catch {}
    try {
      const ints = await api.get('/api/walk/intentions');
      const total = ints.total_in_circle || 0;
      document.getElementById('walk-named-count').textContent = total + ' name' + (total === 1 ? '' : 's') + ' waiting';
    } catch {}
    // Launch-card subtitle: name today's liturgical saint if there's a real
    // memorial; otherwise advertise that each tap picks a different saint.
    try {
      const r = await api.get('/api/saints/today');
      const el = document.getElementById('saint-walk-sub');
      if (el) {
        if (r.liturgical && r.liturgical.saint_slug && r.saint) {
          el.textContent = "Today: " + r.saint.name + ' (or pick again for another)';
        } else {
          el.textContent = 'A different saint every walk';
        }
      }
    } catch {}
    // Glyphs on the launch cards
    if (window.Avatars) {
      document.getElementById('wpc-rosary-glyph').innerHTML = Avatars.svg('rose');
      document.getElementById('wpc-camino-glyph').innerHTML = Avatars.svg('mountain');
      document.getElementById('wpc-saint-glyph').innerHTML = Avatars.svg('rays');
    }
  }
  global.refreshWalkLaunch = refreshWalkLaunch;

  function init() {
    // Three launch cards
    const cardRosary = document.getElementById('card-rosary-walk');
    const cardCamino = document.getElementById('card-camino');
    const cardSaint  = document.getElementById('card-saint-walk');
    if (cardRosary) cardRosary.addEventListener('click', begin);
    if (cardCamino) cardCamino.addEventListener('click', openCaminoPicker);
    if (cardSaint)  cardSaint.addEventListener('click',  openSaintWalk);

    // Camino picker
    const caminoCancel = document.getElementById('btn-camino-cancel');
    if (caminoCancel) caminoCancel.addEventListener('click', () => showScreen('walk-launch'));
    const caminoFree = document.getElementById('btn-camino-free');
    if (caminoFree) caminoFree.addEventListener('click', () => {
      const v = document.getElementById('camino-free-text').value.trim();
      if (!v) return toast('A short word about who you walk for.');
      startPilgrim({ mode: 'camino', name: v, sub: 'A free intention' });
    });

    // Pilgrim controls
    const btnEnd = document.getElementById('btn-pilgrim-end');
    if (btnEnd) btnEnd.addEventListener('click', endPilgrimEarly);
    const btnAmen = document.getElementById('btn-pilgrim-amen');
    if (btnAmen) btnAmen.addEventListener('click', () => { showScreen('home', { replace: true }); if (global.refreshHome) refreshHome(); });

    // Rosary active screen (unchanged)
    document.getElementById('btn-next-decade').addEventListener('click', nextDecade);
    document.getElementById('btn-end-walk').addEventListener('click', endEarly);
    document.getElementById('btn-finish-walk').addEventListener('click', finishWalk);
    document.querySelector('.screen-walk-active').addEventListener('click', (ev) => {
      if (ev.target.tagName === 'BUTTON') return;
      advanceBead();
    });
  }

  global.WalkUI = { init, refreshWalkLaunch };
})(window);
