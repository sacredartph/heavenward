// Saint picker - choose your own patron saint (= your avatar across the app).
// Anyone signed in can change their own saint. Identity formation move.
(function (global) {
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  let __allSaints = null;
  let __currentSlug = null;
  let __showAll = false;

  // The curated 10 + 1 - the patron saints a Catholic family meets first.
  // Joseph + Mary + 4 Evangelists + 3 Archangels + John the Baptist + St. Lorenzo Ruiz (Filipino patron).
  const CURATED_SLUGS = [
    'joseph',
    'mary',
    'matthew',
    'mark',
    'luke',
    'john-the-apostle',
    'michael-archangel',
    'gabriel-archangel',
    'raphael-archangel',
    // 'john-the-baptist' isn't a seeded slug yet - swapping in John the Apostle's gospel role above
    // and using Pedro Calungsod as the second Filipino patron alongside Lorenzo
    'lorenzo-ruiz',
    'pedro-calungsod'
  ];

  async function loadSaints() {
    if (__allSaints) return __allSaints;
    try { const r = await api.get('/api/saints'); __allSaints = r.saints || []; }
    catch { __allSaints = []; }
    return __allSaints;
  }

  function curatedFirst(allSaints) {
    // Surface the curated saints in CURATED_SLUGS order; the rest are hidden behind "Show all saints".
    const bySlug = {};
    for (const s of allSaints) bySlug[s.slug] = s;
    const curated = CURATED_SLUGS.map(slug => bySlug[slug]).filter(Boolean);
    return curated;
  }

  function tileHTML(s) {
    const glyph = (window.Avatars && Avatars.SAINT_TO_GLYPH[s.slug]) ? Avatars.SAINT_TO_GLYPH[s.slug] : 'cross';
    const isCurrent = s.slug === __currentSlug;
    return '<button class="saint-tile' + (isCurrent ? ' current' : '') + '" data-slug="' + escape(s.slug) + '">' +
      '<div class="saint-tile-avatar">' + (window.Avatars ? Avatars.svg(glyph) : '') + '</div>' +
      '<div class="saint-tile-name">' + escape(s.name) + '</div>' +
      '<div class="saint-tile-patron muted small">' + escape(s.patron_of || '').slice(0, 50) + '</div>' +
    '</button>';
  }

  function renderGrid(saints, opts) {
    opts = opts || {};
    const grid = document.getElementById('saint-picker-grid');
    if (!grid) return;
    const showAllLink = opts.showAllAvailable
      ? '<button class="saint-picker-more" id="saint-picker-show-all">Show all saints (' + (__allSaints || []).length + ')</button>'
      : '';
    grid.innerHTML = saints.length
      ? (saints.map(tileHTML).join('') + showAllLink)
      : '<p class="muted small">No saints match that search.</p>';
    grid.querySelectorAll('.saint-tile').forEach(btn => btn.addEventListener('click', () => pick(btn.dataset.slug)));
    const more = document.getElementById('saint-picker-show-all');
    if (more) more.addEventListener('click', () => { __showAll = true; renderGrid(__allSaints); });
  }

  async function open() {
    let u = api.user();
    if (!u) return;
    // Refresh user from server so __currentSlug reflects latest pick.
    try { const me = await api.get('/api/auth/me'); if (me && me.user) { u = me.user; api.setUser(u); } } catch {}
    __currentSlug = u.patron_saint_slug || null;
    const saints = await loadSaints();
    const currentName = __currentSlug ? (saints.find(s => s.slug === __currentSlug) || {}).name : null;
    const head = document.getElementById('saint-picker-current');
    head.innerHTML = currentName
      ? '<em>Your patron is currently <strong>' + escape(currentName) + '</strong>. Tap any saint below to change.</em>'
      : '<em>You have no patron yet. Tap any saint to make them yours.</em>';
    __showAll = false;
    renderGrid(curatedFirst(saints), { showAllAvailable: true });
    document.getElementById('saint-picker').classList.remove('hidden');
    // Push a history entry so the back button closes the picker first instead of navigating away.
    if (global.openModalState) global.openModalState('saint-picker');
  }

  function close() {
    // Closing via back() ensures the modal history entry is consumed.
    if (global.closeModalState) global.closeModalState('saint-picker');
    else document.getElementById('saint-picker').classList.add('hidden');
  }

  function filterSaints(q) {
    if (!__allSaints) return;
    q = (q || '').trim().toLowerCase();
    // Typing a query searches the full library; empty box restores the curated default.
    if (!q) { __showAll = false; renderGrid(curatedFirst(__allSaints), { showAllAvailable: true }); return; }
    renderGrid(__allSaints.filter(s =>
      (s.name + ' ' + (s.patron_of || '') + ' ' + (s.nationality || '')).toLowerCase().includes(q)
    ));
  }

  async function pick(slug) {
    if (!slug) return;
    try {
      const r = await api.put('/api/auth/me', { patron_saint_slug: slug });
      api.setUser(r.user);
      const saint = (__allSaints || []).find(s => s.slug === slug);
      toast((saint ? saint.name : 'Your saint') + ' is now your patron.');
      // Hide picker directly (don't pop history - we want a clean state).
      document.getElementById('saint-picker').classList.add('hidden');
      // Consume the modal history entry so back doesn't reopen the picker.
      if (history.state && history.state.modal === 'saint-picker') history.back();
      // Refresh anything that shows avatars: Home presence, Hearth family row.
      if (global.refreshHome) refreshHome();
      if (global.HearthUI && HearthUI.load) HearthUI.load();
    } catch (e) {
      toast(e.message || 'Could not save the choice.');
    }
  }

  function init() {
    document.getElementById('saint-picker-backdrop').addEventListener('click', close);
    document.getElementById('saint-picker-close').addEventListener('click', close);
    const search = document.getElementById('saint-picker-search');
    if (search) search.addEventListener('input', () => filterSaints(search.value));
  }

  global.SaintPicker = { init, open, close, pick };
})(window);
