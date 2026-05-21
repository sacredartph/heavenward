// The Hearth - the family room.
// Five glanceable sections: rollup sentence, family avatars, ticker, votive rack, housekeeping drawer.
(function (global) {
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
  function isParent() { const u = api.user(); return u && (u.role === 'tatay' || u.role === 'nanay'); }
  function firstName(s) { return String(s || '').split(' ')[0]; }

  let __tickerActs = [];
  let __tickerIdx = 0;
  let __tickerTimer = null;

  function init() {
    // Wire the add-family-member submit (form lives in housekeeping drawer).
    const form = document.getElementById('form-add-member');
    if (form) form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const body = {
        display_name: fd.get('display_name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role'),
        date_of_birth: fd.get('date_of_birth') || null,
        patron_saint_slug: fd.get('patron_saint_slug') || null
      };
      try {
        const r = await api.post('/api/auth/member/add', body);
        const res = document.getElementById('add-member-result');
        res.classList.remove('hidden');
        res.innerHTML =
          '<div class="card" style="border-left:3px solid var(--gold);background:#fffdf6;margin-top:.75rem">' +
          '<h4>' + escape(r.user.display_name) + ' has been added.</h4>' +
          '<p class="muted small">Share these credentials with them:</p>' +
          '<p><strong>Email:</strong> ' + escape(body.email) + '</p>' +
          '<p><strong>Password:</strong> ' + escape(body.password) + '</p>' +
          '<p class="muted small">They sign in at this app with that email and password.</p>' +
          '<p class="italic-cta">Now share these with them. Then bless them - even just by name.</p>' +
          '</div>';
        ev.target.reset();
        toast('Welcome, ' + r.user.display_name + ', to the family.');
        load();
      } catch (e) { toast(e.message || 'Could not add member.'); }
    });

    // Gesture popover handlers
    const popover = document.getElementById('hearth-gestures');
    const backdrop = document.getElementById('gestures-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeGestures);
    const cancel = document.getElementById('gestures-cancel');
    if (cancel) cancel.addEventListener('click', closeGestures);
    if (popover) popover.querySelectorAll('.gesture-btn').forEach(b => b.addEventListener('click', () => runGesture(b.dataset.act)));
  }

  let __gestureTarget = null;
  function openGestures(member) {
    __gestureTarget = member;
    document.getElementById('gestures-name').textContent = firstName(member.display_name);
    document.getElementById('hearth-gestures').classList.remove('hidden');
    if (global.openModalState) global.openModalState('hearth-gestures');
  }
  function closeGestures() {
    if (history.state && history.state.modal === 'hearth-gestures') { history.back(); }
    else document.getElementById('hearth-gestures').classList.add('hidden');
    __gestureTarget = null;
  }
  async function runGesture(act) {
    const m = __gestureTarget;
    if (!m) return closeGestures();
    try {
      if (act === 'candle') {
        // Light a candle in the family's votive rack for this family member's intentions.
        // For Phase 1 we surface this as a hearth post; the votive rack itself shows
        // candles tied to repository_of_dead entries.
        await api.post('/api/hearth/post', { type: 'prayed_for', content: firstName(api.user().display_name) + ' lit a candle for ' + firstName(m.display_name) + '.' });
        toast('Candle lit for ' + firstName(m.display_name) + '.');
      } else if (act === 'hail-mary') {
        await api.post('/api/hearth/gesture/hail-mary', { target_user_id: m.id });
        toast('You are praying a Hail Mary for ' + firstName(m.display_name) + '.');
      } else if (act === 'carry') {
        await api.post('/api/hearth/gesture/carry', { target_user_id: m.id });
        toast('You are carrying ' + firstName(m.display_name) + "'s intention.");
      } else if (act === 'bless') {
        await api.post('/api/hearth/gesture/bless', { target_user_id: m.id });
        toast('Blessing sent to ' + firstName(m.display_name) + '.');
      }
    } catch (e) {
      toast(e.message || 'Could not complete the act.');
    }
    closeGestures();
    load();
  }

  // -------- Render --------
  async function load() {
    const [presence, rollupR, actsR, deadR, candlesR] = await Promise.all([
      api.get('/api/hearth/presence').catch(() => ({ members: [], candles_today: [] })),
      api.get('/api/hearth/rollup').catch(() => ({ sentence: '' })),
      api.get('/api/hearth/acts').catch(() => ({ acts: [] })),
      api.get('/api/dead').catch(() => ({ dead: [] })),
      api.get('/api/dead/candles/today').catch(() => ({ candles: [] }))
    ]);

    // 1) Rollup sentence
    document.getElementById('hearth-rollup').textContent = rollupR.sentence || '';

    // 2) Family avatars
    renderFamily(presence.members);

    // 3) Ticker
    __tickerActs = (actsR.acts || []).map(a => a.text).filter(Boolean);
    __tickerIdx = 0;
    renderTickerStep();
    if (__tickerTimer) clearInterval(__tickerTimer);
    if (__tickerActs.length > 1) {
      __tickerTimer = setInterval(() => {
        __tickerIdx = (__tickerIdx + 1) % __tickerActs.length;
        renderTickerStep();
      }, 4500);
    }

    // 4) Votive rack
    renderVotive(deadR.dead || [], candlesR.candles || []);

    // 5) Housekeeping drawer visibility
    document.getElementById('hearth-housekeeping').classList.toggle('hidden', !isParent());
  }

  function renderFamily(members) {
    const row = document.getElementById('hearth-family-row');
    if (!row) return;
    row.innerHTML = members.map(m => {
      const avatar = window.Avatars ? Avatars.avatarHTML(m, { size: 64 }) : '';
      const mom = m.last_moment && window.Moments && Moments.BY_KEY[m.last_moment];
      const colorWord = mom ? '<div class="hw-mood" style="color:' + mom.color + '">' + escape(mom.label) + '</div>' : '';
      const today = (m.rosaries_today || 0) > 0 || (m.hours_today || 0) > 0;
      return '<button class="hw-member" data-member-id="' + m.id + '">' +
        avatar +
        '<div class="hw-member-name">' + escape(firstName(m.display_name)) + '</div>' +
        (today ? '<div class="hw-prayed-dot" title="prayed today"></div>' : '') +
        colorWord +
      '</button>';
    }).join('');
    // Tap handler -> gestures popover
    row.querySelectorAll('.hw-member').forEach(btn => btn.addEventListener('click', () => {
      const id = Number(btn.dataset.memberId);
      const m = members.find(x => x.id === id);
      const me = api.user();
      // Don't open gestures for self.
      if (!m || (me && m.id === me.id)) { toast('Tap another family member to send a gesture.'); return; }
      openGestures(m);
    }));
  }

  function renderTickerStep() {
    const el = document.getElementById('hearth-ticker');
    if (!el) return;
    const text = __tickerActs[__tickerIdx];
    if (!text) { el.innerHTML = '<span class="muted">No acts yet. The day is young.</span>'; return; }
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = text;
      el.style.opacity = '1';
    }, 200);
  }

  // The votive rack: 10 candles visible at a time (5x2 grid), paged through the Book of Life.
  // Tap any candle to light it instantly; tap the rack to pause the page rotation.
  const VOTIVE_BATCH = 10;
  let __votiveTimer = null, __votiveItems = [], __votivePage = 0, __votivePaused = false;

  function renderVotive(dead, litToday) {
    const rack = document.getElementById('votive-rack');
    if (!rack) return;
    const litCountByPerson = {};
    for (const c of (litToday || [])) litCountByPerson[c.full_name] = (litCountByPerson[c.full_name] || 0) + 1;

    if (!dead || !dead.length) {
      rack.innerHTML = '<p class="muted small empty-line">No one in the Book of Life yet. When you add a name, a candle will rest here.</p>';
      if (__votiveTimer) { clearInterval(__votiveTimer); __votiveTimer = null; }
      return;
    }

    // Sort: lit-today first (most lit first), then unlit alphabetically.
    const sorted = dead.slice().sort((a, b) => {
      const la = litCountByPerson[a.full_name] || 0;
      const lb = litCountByPerson[b.full_name] || 0;
      if (la !== lb) return lb - la;
      return String(a.full_name).localeCompare(String(b.full_name));
    });

    __votiveItems = sorted.map(d => ({
      id: d.id,
      name: d.full_name,
      lit: litCountByPerson[d.full_name] || 0
    }));
    // Random initial page so a different batch of 10 fronts the rack each visit,
    // rather than always the lit-today + alphabetical-A names.
    const totalPagesInit = Math.max(1, Math.ceil(__votiveItems.length / VOTIVE_BATCH));
    __votivePage = Math.floor(Math.random() * totalPagesInit);
    __votivePaused = false;

    const litTotalToday = (litToday || []).length;
    const totalPages = Math.max(1, Math.ceil(__votiveItems.length / VOTIVE_BATCH));
    rack.innerHTML =
      '<div class="votive-cycle" id="votive-cycle">' +
        '<div class="votive-cycle-meta">' +
          '<span class="votive-meta-stat"><strong id="votive-cycle-summary">' + litTotalToday + '</strong> lit today</span>' +
          '<span class="votive-meta-sep">&middot;</span>' +
          '<span class="votive-meta-stat"><strong>' + __votiveItems.length + '</strong> in the Book</span>' +
        '</div>' +
        '<div class="votive-grid" id="votive-grid"></div>' +
        '<div class="votive-cycle-actions">' +
          (totalPages > 1 ? '<button class="ghost small" id="votive-cycle-pause" title="pause">&#9646;&#9646;</button>' : '') +
          (totalPages > 1 ? '<span class="muted small" id="votive-cycle-pos">1 / ' + totalPages + '</span>' : '<span class="muted small">all in view</span>') +
        '</div>' +
      '</div>';

    renderVotiveStep();
    if (__votiveTimer) clearInterval(__votiveTimer);
    if (totalPages > 1) {
      __votiveTimer = setInterval(() => {
        if (__votivePaused) return;
        __votivePage = (__votivePage + 1) % totalPages;
        renderVotiveStep();
      }, 6000);
    }

    const pauseBtn = document.getElementById('votive-cycle-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      __votivePaused = !__votivePaused;
      document.getElementById('votive-cycle').classList.toggle('paused', __votivePaused);
    });
  }

  function renderVotiveStep() {
    const grid = document.getElementById('votive-grid');
    const posEl = document.getElementById('votive-cycle-pos');
    if (!grid) return;
    const totalPages = Math.max(1, Math.ceil(__votiveItems.length / VOTIVE_BATCH));
    const start = __votivePage * VOTIVE_BATCH;
    const slice = __votiveItems.slice(start, start + VOTIVE_BATCH);
    grid.innerHTML = slice.map((item, i) => {
      const lit = item.lit > 0;
      return '<button class="votive-grid-cell ' + (lit ? 'lit' : 'unlit') + '" data-idx="' + (start + i) + '" type="button">' +
        '<div class="votive-cycle-candle' + (lit ? '' : ' unlit') + '">' +
          '<div class="votive-flame"><span></span></div>' +
          '<div class="votive-cup"></div>' +
        '</div>' +
        '<div class="votive-grid-name">' + escape(firstName(item.name)) + '</div>' +
        '<div class="votive-grid-status muted small">' + (lit ? ('x' + item.lit) : 'tap to light') + '</div>' +
      '</button>';
    }).join('');
    if (posEl) posEl.textContent = (__votivePage + 1) + ' / ' + totalPages;
    grid.querySelectorAll('.votive-grid-cell').forEach(btn => btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const item = __votiveItems[idx];
      if (!item) return;
      // Optimistic: flip the cell to lit + bump count immediately, before the server replies.
      item.lit = (item.lit || 0) + 1;
      btn.classList.remove('unlit'); btn.classList.add('lit');
      const candle = btn.querySelector('.votive-cycle-candle');
      if (candle) candle.classList.remove('unlit');
      const status = btn.querySelector('.votive-grid-status');
      if (status) status.textContent = 'x' + item.lit;
      toast('A candle was lit for ' + item.name + '.');
      if (window.HwAudio) HwAudio.ring();
      api.post('/api/dead/' + item.id + '/candle', {}).then(() => load()).catch(e => {
        toast(e.message || 'Could not light the candle.');
        load();
      });
    }));
  }

  global.HearthUI = { init, load };
})(window);
