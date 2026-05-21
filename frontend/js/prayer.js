// The Book - the family's source of truth for who and what they carry.
// One illuminated scrollable page, six sections, inline add forms collapsed at the bottom of each.
(function (global) {
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
  function isParent() { const u = api.user(); return u && (u.role === 'tatay' || u.role === 'nanay'); }
  function firstName(s) { return String(s || '').split(' ')[0]; }
  function illumi(glyph) {
    return '<div class="illumi"><span class="illumi-letter">' + (window.Avatars ? Avatars.svg(glyph) : '') + '</span></div>';
  }
  function sectionHeader(opts) {
    return '<header class="book-section-head">' +
      illumi(opts.glyph) +
      '<div class="book-section-titles">' +
        '<h3>' + escape(opts.title) + (opts.count != null ? ' <span class="muted small">&middot; ' + opts.count + '</span>' : '') + '</h3>' +
        '<div class="book-section-rule"></div>' +
      '</div>' +
    '</header>';
  }
  function cta(text) { return '<p class="italic-cta book-cta">' + escape(text) + '</p>'; }

  // ============================================================
  // Cycling Litany - one name at a time, with a short prayer.
  // Tap to pause; tap again to resume. Inline action icons live
  // on the card so you never leave The Book to update status.
  // ============================================================
  const __cycles = {};          // sectionId -> { items, idx, timer, paused, prayers }

  // Prayer rotations per section kind, with {name} placeholder for the current item.
  const PRAYER_ROTATIONS = {
    sick: [
      'Lord Jesus, by your wounds, heal {name}.',
      'Mary, Mother of Sorrows, intercede for {name}.',
      'Christ the Healer, lay your hand on {name}.',
      'Lord, in your mercy, hear our prayer for {name}.'
    ],
    petition: [
      'We bring {name}\'s intention before you, Lord.',
      'Father, in your wisdom and love, hear us.',
      'Christ Jesus, hear our cry for {name}.',
      'Lord, hear our prayer.'
    ],
    people: [
      'Bless {name} today, Lord.',
      'Hold {name} in your love.',
      'Mary, pray for {name}.',
      'Father, watch over {name}.'
    ],
    dead: [
      'Eternal rest grant unto {name}, O Lord.',
      'And let perpetual light shine upon {name}.',
      'May the soul of {name} rest in peace.',
      'Our Lady, pray for {name}.'
    ],
    answered: [
      'Thank you, Lord.',
      'We praise you, Father.',
      'Glory to you, Lord.',
      'Blessed be God forever.'
    ],
    emergency: [
      'Lord, hasten to help us. Save {name}.',
      'Holy Mother, intercede now for {name}.',
      'Christ, have mercy. Christ, hear our cry.',
      'Lord Jesus, by your blood, save {name}.'
    ],
    world: [
      'Lord, grant peace to {name}.',
      'Christ, King of all nations, have mercy on {name}.',
      'Mary, Queen of Peace, intercede for {name}.',
      'Father, your kingdom come, your will be done for {name}.'
    ]
  };

  function pickPrayer(kind, name, seed) {
    const list = PRAYER_ROTATIONS[kind] || PRAYER_ROTATIONS.people;
    return list[seed % list.length].replace(/\{name\}/g, name || 'them');
  }

  // Build the cycling-card markup for a section.
  // items: [{ id, name, sub, raw }]; actions: [{key, glyph, title}]
  function cyclingCardHTML(sectionId, items, kind, actions) {
    const id = 'cycle-' + sectionId;
    return `
      <div class="book-cycle" id="${id}">
        <div class="cycle-stage" id="${id}-stage">
          <div class="cycle-name" id="${id}-name">—</div>
          <div class="cycle-sub muted small" id="${id}-sub">&nbsp;</div>
          <p class="cycle-prayer" id="${id}-prayer">&nbsp;</p>
        </div>
        <div class="cycle-actions" id="${id}-actions">
          ${(actions || []).map(a => `<button class="cycle-btn" data-act="${a.key}" data-id="" title="${escape(a.title)}">${(window.Avatars ? Avatars.svg(a.glyph) : '')}<span class="cycle-btn-label">${escape(a.title)}</span></button>`).join('')}
        </div>
        <div class="cycle-meta">
          <span class="cycle-pos" id="${id}-pos">—</span>
          <button class="cycle-pause" id="${id}-pause" title="pause">&#9646;&#9646;</button>
        </div>
      </div>
    `;
  }

  function startCycle(sectionId, items, kind, actionsFn) {
    if (__cycles[sectionId] && __cycles[sectionId].timer) clearInterval(__cycles[sectionId].timer);
    // Random start so the first name isn't the same person every visit. The cycle
    // still walks the whole list in order, but the entry point rotates each load,
    // so different people in the circle get the prominent first-stage moment.
    const startIdx = (items && items.length) ? Math.floor(Math.random() * items.length) : 0;
    __cycles[sectionId] = { items, idx: startIdx, paused: false, kind, actionsFn };
    renderCycleStep(sectionId);
    __cycles[sectionId].timer = setInterval(() => {
      const c = __cycles[sectionId];
      if (!c || c.paused) return;
      c.idx = (c.idx + 1) % c.items.length;
      renderCycleStep(sectionId);
    }, 5000);

    const stage = document.getElementById('cycle-' + sectionId + '-stage');
    if (stage) stage.addEventListener('click', () => togglePause(sectionId));
    const pauseBtn = document.getElementById('cycle-' + sectionId + '-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', (ev) => { ev.stopPropagation(); togglePause(sectionId); });
  }

  function togglePause(sectionId) {
    const c = __cycles[sectionId];
    if (!c) return;
    c.paused = !c.paused;
    const wrap = document.getElementById('cycle-' + sectionId);
    if (wrap) wrap.classList.toggle('paused', c.paused);
    renderCycleStep(sectionId);
  }

  function renderCycleStep(sectionId) {
    const c = __cycles[sectionId];
    if (!c || !c.items.length) return;
    const item = c.items[c.idx];
    document.getElementById('cycle-' + sectionId + '-name').textContent = item.name;
    document.getElementById('cycle-' + sectionId + '-sub').textContent = item.sub || '';
    document.getElementById('cycle-' + sectionId + '-prayer').textContent = pickPrayer(c.kind, item.name, c.idx);
    document.getElementById('cycle-' + sectionId + '-pos').textContent = (c.idx + 1) + ' / ' + c.items.length;
    // Re-wire action buttons with current item id
    const wrap = document.getElementById('cycle-' + sectionId);
    if (wrap) wrap.querySelectorAll('.cycle-btn').forEach(btn => {
      btn.dataset.id = item.id;
      btn.onclick = (ev) => { ev.stopPropagation(); (c.actionsFn || function(){})(btn.dataset.act, item); };
    });
  }

  // ---------- Date helpers (kept from old) ----------
  function todayMMDD() { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function mmdd(s) {
    if (!s) return null;
    s = String(s).trim();
    let m = s.match(/^\d{4}[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) return String(m[1]).padStart(2,'0') + '-' + String(m[2]).padStart(2,'0');
    m = s.match(/^(\d{1,2})[-\/](\d{1,2})$/);
    if (m) return String(m[1]).padStart(2,'0') + '-' + String(m[2]).padStart(2,'0');
    return null;
  }
  function yearsSince(s) {
    if (!s) return null;
    s = String(s).trim();
    if (!/^\d{4}[-\/]/.test(s) || s.startsWith('0000') || s.startsWith('0001')) return null;
    const d = new Date(s); if (isNaN(d.getTime())) return null;
    const now = new Date();
    let y = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) y -= 1;
    return y;
  }
  function ordinal(n) { if (n == null) return ''; const v = n % 100; if (v >= 11 && v <= 13) return n + 'th'; return n + (['th','st','nd','rd'][n % 10] || 'th'); }
  function displayDate(s, label) {
    if (!s) return null;
    const md = mmdd(s); if (!md) return null;
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const [mm, dd] = md.split('-').map(Number);
    return label + ' ' + (months[mm - 1] || mm) + ' ' + dd;
  }

  // ---------- Section render ----------
  async function load() {
    // Fetch all in parallel
    const [pet, sick, ppl, pplSum, sched, dead, candles, answered, world] = await Promise.all([
      api.get('/api/prayer/petitions').catch(() => ({ petitions: [] })),
      api.get('/api/prayer/sick').catch(() => ({ sick: [] })),
      api.get('/api/people').catch(() => ({ people: [] })),
      api.get('/api/people/summary').catch(() => ({ total: 0 })),
      api.get('/api/family/schedule').catch(() => ({ schedule: null })),
      api.get('/api/dead').catch(() => ({ dead: [] })),
      api.get('/api/dead/candles/today').catch(() => ({ candles: [] })),
      api.get('/api/prayer/answered').catch(() => ({ answered: [] })),
      api.get('/api/prayer/world').catch(() => ({ world: [] }))
    ]);

    // Top count
    const total = sick.sick.length + ppl.people.length + pet.petitions.length + dead.dead.length;
    document.getElementById('thebook-count').innerHTML =
      total ? 'The Manubag family carries <strong>' + total + '</strong> name' + (total === 1 ? '' : 's') + ' today.' : '';

    // Anniversary banners (preserved from old Book of Life logic)
    renderAnniversaries(dead.dead || []);

    // Sections
    renderEmergencies(pet.petitions.filter(p => p.level === 1));
    renderSick(sick.sick);
    renderPeople(ppl.people, pplSum.total, sched.schedule);
    renderPetitions(pet.petitions.filter(p => p.level >= 2));
    renderWorld(world.world || []);
    renderDead(dead.dead, candles.candles);
    renderAnswered(answered.answered);

    wireDrawerOnce();
  }

  // --- Section: Emergencies (L1) ---
  function renderEmergencies(items) {
    const sec = document.getElementById('section-emergencies');
    if (!items.length) { sec.classList.add('hidden'); sec.innerHTML = ''; return; }
    sec.classList.remove('hidden');
    const cycleItems = items.map(p => ({ id: p.id, name: p.person_name || 'Emergency', sub: p.petition, raw: p }));
    sec.innerHTML =
      sectionHeader({ glyph: 'rays', title: 'Emergencies', count: items.length }) +
      cyclingCardHTML('emerg', cycleItems, 'emergency', [
        { key: 'answer', glyph: 'rays', title: 'Answered' }
      ]) +
      cta('Stop and pray a Hail Mary now.');
    startCycle('emerg', cycleItems, 'emergency', async (act, item) => {
      if (act === 'answer') {
        const ans = prompt('How did God answer? (optional)');
        await api.post('/api/prayer/petition/' + item.id + '/answer', { how_god_answered: ans || null });
        toast('Answered. He is faithful.'); load();
      }
    });
  }

  // ---------- shared row + glyph helpers ----------
  function smallAvatar(glyph) {
    return '<span class="book-avatar">' + (window.Avatars ? Avatars.svg(glyph || 'cross') : '') + '</span>';
  }
  function iconBtn(act, id, name, glyph, title) {
    return '<button class="book-icon-btn" data-act="' + act + '" data-id="' + id + '" data-name="' + escape(name || '') + '" title="' + escape(title || act) + '">' +
      (window.Avatars ? Avatars.svg(glyph) : '') + '</button>';
  }

  // --- Section: The sick we carry ---
  function renderSick(items) {
    const sec = document.getElementById('section-sick');
    if (!items.length) {
      sec.innerHTML = sectionHeader({ glyph: 'cross', title: 'The sick we carry' }) +
        '<p class="muted small empty-line">No one on the sick list right now.</p>' +
        cta('Whisper their name in your next breath.');
      return;
    }
    const cycleItems = items.map(s => ({
      id: s.id,
      name: s.person_name,
      sub: s.intention + (s.relationship ? ' · ' + s.relationship : ''),
      raw: s
    }));
    sec.innerHTML =
      sectionHeader({ glyph: 'cross', title: 'The sick we carry', count: items.length }) +
      cyclingCardHTML('sick', cycleItems, 'sick', [
        { key: 'recovered', glyph: 'rays', title: 'Recovered' },
        { key: 'deceased',  glyph: 'cross', title: 'Heavenward' },
        { key: 'remove',    glyph: 'anchor', title: 'Remove' }
      ]) +
      cta('Whisper their name in your next breath.');
    startCycle('sick', cycleItems, 'sick', async (act, item) => {
      if (act === 'recovered') {
        await api.put('/api/prayer/sick/' + item.id, { status: 'recovered' });
        toast('Thanksgiving for ' + item.name + '.');
        load();
      } else if (act === 'deceased') {
        if (!confirm('Receive ' + item.name + ' into the Book of Life?\nLord, receive ' + item.name + ' into your mercy.')) return;
        await api.put('/api/prayer/sick/' + item.id, { status: 'deceased' });
        toast(item.name + ' has been received into the Book of Life.');
        load();
      } else if (act === 'remove') {
        if (!confirm('Remove ' + item.name + ' from the sick list?')) return;
        try { await api.del('/api/prayer/sick/' + item.id); toast('Removed.'); load(); }
        catch (e) { toast(e.message || 'Could not remove.'); }
      }
    });
  }
  function addCardSick() {
    return `<details class="card collapsible book-add">
      <summary><strong>Add a name to the sick list</strong></summary>
      <form id="form-sick">
        <label>Person<input name="person_name" required></label>
        <label>Relationship<input name="relationship"></label>
        <label>Intention<textarea name="intention" required></textarea></label>
        <button class="primary" type="submit">Add to prayer</button>
      </form>
    </details>`;
  }
  async function sickAction(btn) {
    const id = btn.dataset.id, name = btn.dataset.name, act = btn.dataset.act;
    if (act === 'recovered') {
      await api.put('/api/prayer/sick/' + id, { status: 'recovered' });
      toast('Thanksgiving for ' + name + '.');
    } else {
      if (!confirm('Receive ' + name + ' into the Book of Life?\nLord, receive ' + name + ' into your mercy.')) return;
      const note = prompt('A brief, gentle line for the Book (optional)') || null;
      await api.put('/api/prayer/sick/' + id, { status: 'deceased', deceased_dignity_text: note });
      toast(name + ' has been received into the Book of Life.');
    }
    load();
  }

  // --- Section: Our Circle ---
  // One section. One cycling card. EVERY name rotates under a single label.
  // No category buckets, no avatar grid: the relationship the user typed IS the context.
  function renderPeople(people, total, sched) {
    const sec = document.getElementById('section-people');
    if (!people || !people.length) {
      sec.innerHTML = sectionHeader({ glyph: 'heart', title: 'Our Circle' }) +
        '<p class="muted small empty-line">No one yet. Add a name in the drawer at the bottom.</p>' +
        cta('Every name added is a name carried at the family Rosary.');
      return;
    }
    // Sort alphabetically by full name. The relationship the user typed carries the context.
    const sorted = people.slice().sort((a, b) => String(a.full_name).localeCompare(String(b.full_name)));
    const cycleItems = sorted.map(p => ({
      id: p.id,
      name: p.full_name,
      sub: p.relationship || '',
      raw: p
    }));
    const rosaryTime = sched && sched.rosary_time;
    sec.innerHTML =
      sectionHeader({ glyph: 'heart', title: 'Our Circle', count: cycleItems.length }) +
      '<p class="muted small">We carry <strong>' + cycleItems.length + '</strong> name' + (cycleItems.length === 1 ? '' : 's') + ' in our circle.</p>' +
      cyclingCardHTML('ppl', cycleItems, 'people', [
        { key: 'remove', glyph: 'anchor', title: 'Remove' }
      ]) +
      cta(rosaryTime ? 'Every one of them is named at ' + rosaryTime + ' tonight.' : 'Every one of them is named at our family Rosary.');
    startCycle('ppl', cycleItems, 'people', async (act, item) => {
      if (act === 'remove') {
        if (!confirm('Remove ' + item.name + ' from our circle?')) return;
        try { await api.del('/api/people/' + item.id); toast('Removed.'); load(); }
        catch (e) { toast(e.message || 'Could not remove.'); }
      }
    });
  }
  function addCardsPeople() {
    return `<details class="card collapsible book-add">
        <summary><strong>Add a name</strong> <span class="muted small">(one at a time)</span></summary>
        <form id="form-person">
          <label>Full name<input name="full_name" required placeholder="e.g. Joaquin Cruz"></label>
          <label>Relationship<input name="relationship" placeholder="e.g. Lola, Ninong, classmate"></label>
          <label>Category
            <select name="category">
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="godfamily">Godparent / Godchild</option>
              <option value="parish">Parish</option>
              <option value="work">Work / school</option>
              <option value="acquaintance">Acquaintance</option>
              <option value="other" selected>Other</option>
            </select>
          </label>
          <label>Notes<input name="notes" placeholder="optional - a word about why you pray for them"></label>
          <button class="primary" type="submit">Add to the circle</button>
        </form>
      </details>
      <details class="card collapsible book-add">
        <summary><strong>Bulk add from Excel or a list</strong></summary>
        <p class="muted small">Paste from Excel (tab-separated), CSV, or one name per line. Three columns: <strong>Name &middot; Relationship &middot; Category</strong>. Only the name is required.</p>
        <form id="form-people-import">
          <label>Default category
            <select name="default_category">
              <option value="other" selected>Other</option>
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="godfamily">Godparent / Godchild</option>
              <option value="parish">Parish</option>
              <option value="work">Work / school</option>
              <option value="acquaintance">Acquaintance</option>
            </select>
          </label>
          <label>Paste here
            <textarea name="text" rows="6" required placeholder="Lolo Pedro Manubag&#9;grandfather&#9;family"></textarea>
          </label>
          <button class="primary" type="submit">Receive them all into the circle</button>
        </form>
        <p id="people-import-result" class="muted small mt"></p>
      </details>`;
  }

  // --- Section: Petitions (L2+L3+L4) ---
  function renderPetitions(items) {
    const sec = document.getElementById('section-petitions');
    if (!items.length) {
      sec.innerHTML = sectionHeader({ glyph: 'anchor', title: 'What we ask of him' }) +
        '<p class="muted small empty-line">No active petitions yet.</p>' +
        cta('Carry one of these into today\'s Rosary.');
      return;
    }
    const cycleItems = items.map(p => ({ id: p.id, name: p.person_name || 'Intention', sub: p.petition + (p.is_pinned ? ' · pinned' : ''), raw: p }));
    sec.innerHTML =
      sectionHeader({ glyph: 'anchor', title: 'What we ask of him', count: items.length }) +
      cyclingCardHTML('pet', cycleItems, 'petition', [
        { key: 'answer', glyph: 'rays', title: 'Answered' },
        { key: 'remove', glyph: 'anchor', title: 'Remove' }
      ]) +
      cta('Carry one of these into today\'s Rosary.');
    startCycle('pet', cycleItems, 'petition', async (act, item) => {
      if (act === 'answer') {
        const ans = prompt('How did God answer? (optional)');
        await api.post('/api/prayer/petition/' + item.id + '/answer', { how_god_answered: ans || null });
        toast('Answered. He is faithful.'); load();
      } else if (act === 'remove') {
        if (!confirm('Remove this petition?')) return;
        try { await api.del('/api/prayer/petition/' + item.id); toast('Removed.'); load(); }
        catch (e) { toast(e.message || 'Could not remove.'); }
      }
    });
  }
  function addCardPetition() {
    return `<details class="card collapsible book-add">
      <summary><strong>Add a petition</strong></summary>
      <form id="form-petition">
        <label>Person (optional)<input name="person_name"></label>
        <label>Petition<textarea name="petition" required></textarea></label>
        <label>Level
          <select name="level">
            <option value="3" selected>Active (3)</option>
            <option value="4">Ongoing (4)</option>
            <option value="2">Urgent (2)</option>
            <option value="1">Emergency (1)</option>
          </select>
        </label>
        <button class="primary" type="submit">Add to prayer</button>
      </form>
    </details>`;
  }
  async function petitionAction(btn) {
    const id = btn.dataset.id, act = btn.dataset.act;
    if (act === 'answer') {
      const ans = prompt('How did God answer? (optional)');
      await api.post('/api/prayer/petition/' + id + '/answer', { how_god_answered: ans || null });
      toast('Answered. He is faithful.');
      load();
    } else if (act === 'pin') {
      const cur = await api.get('/api/prayer/petitions');
      const p = cur.petitions.find(x => x.id == id);
      await api.put('/api/prayer/petition/' + id, { is_pinned: p && p.is_pinned ? 0 : 1 });
      load();
    } else if (act === 'upgrade') {
      const cur = await api.get('/api/prayer/petitions');
      const p = cur.petitions.find(x => x.id == id);
      const newLevel = Math.max(1, (p ? p.level : 3) - 1);
      await api.put('/api/prayer/petition/' + id, { level: newLevel });
      toast('Urgency raised to L' + newLevel + '.');
      load();
    }
  }

  // --- Section: The world we carry ---
  // Free-text intentions for events larger than the family: wars, calamities,
  // the Church, the Pope, public officials, peace, the unborn.
  function renderWorld(items) {
    const sec = document.getElementById('section-world');
    if (!sec) return;
    if (!items.length) {
      sec.innerHTML = sectionHeader({ glyph: 'globe', title: 'The world we carry' }) +
        '<p class="muted small empty-line">Bring the world into this Book. Add a war, a country, the Church, those in peril.</p>' +
        cta('Pray for the world. The family is part of the whole Body.');
      return;
    }
    const cycleItems = items.map(w => ({
      id: w.id,
      name: w.title,
      sub: (w.detail || '') + (w.category && w.category !== 'world' ? ' · ' + w.category : ''),
      raw: w
    }));
    sec.innerHTML =
      sectionHeader({ glyph: 'globe', title: 'The world we carry', count: items.length }) +
      cyclingCardHTML('world', cycleItems, 'world', [
        { key: 'resolved', glyph: 'rays',   title: 'Resolved' },
        { key: 'remove',   glyph: 'anchor', title: 'Remove' }
      ]) +
      cta('When we name the world, our home becomes a chapel for it.');
    startCycle('world', cycleItems, 'world', async (act, item) => {
      if (act === 'resolved') {
        if (!confirm('Mark "' + item.name + '" as resolved? It will leave this section.')) return;
        await api.put('/api/prayer/world/' + item.id, { active: 0 });
        toast('Lifted. Glory to God.');
        load();
      } else if (act === 'remove') {
        if (!confirm('Remove "' + item.name + '" from The Book?')) return;
        try { await api.del('/api/prayer/world/' + item.id); toast('Removed.'); load(); }
        catch (e) { toast(e.message || 'Could not remove.'); }
      }
    });
  }

  // --- Section: The faithful departed (Book of Life) ---
  // Wall shows 10 candles (5x2) at a time and pages through the full Book every ~6s.
  // Cycling card above carries the same names with the prayer text + actions.
  // Lighting is optimistic - flame turns on the instant you tap, server reconciled in the background.
  const WALL_BATCH = 10;
  let __wallTimer = null, __wallItems = [], __wallPage = 0, __wallLitCount = {}, __wallIsNov = false;

  function renderDead(dead, litToday) {
    const sec = document.getElementById('section-dead');
    __wallLitCount = {};
    for (const c of (litToday || [])) __wallLitCount[c.full_name] = (__wallLitCount[c.full_name] || 0) + 1;
    dead = dead.slice().sort((a, b) => (b.is_family_patron || 0) - (a.is_family_patron || 0) || a.full_name.localeCompare(b.full_name));
    __wallIsNov = (new Date().getMonth() + 1) === 11;
    __wallItems = dead;
    // Random initial page so a different batch of 10 names fronts the wall each
    // visit, instead of always the family-patron-first alphabetical block.
    const wallPagesInit = Math.max(1, Math.ceil(dead.length / WALL_BATCH));
    __wallPage = Math.floor(Math.random() * wallPagesInit);
    if (__wallTimer) { clearInterval(__wallTimer); __wallTimer = null; }

    const cycleItems = dead.slice(0, 60).map(d => ({ id: d.id, name: d.full_name, sub: d.relationship || '' }));
    const totalPages = Math.max(1, Math.ceil(dead.length / WALL_BATCH));
    const wallBlock = dead.length
      ? '<div class="book-votive-wall' + (__wallIsNov ? ' november' : '') + '" id="book-votive-wall"></div>' +
        (totalPages > 1 ? '<div class="book-votive-pager muted small"><span id="book-votive-pager-pos">1 / ' + totalPages + '</span></div>' : '')
      : '<p class="muted small empty-line">The Book of Life is empty. Add the first name below.</p>';
    sec.innerHTML =
      sectionHeader({ glyph: 'cross', title: 'The faithful departed', count: dead.length || null }) +
      (cycleItems.length ? cyclingCardHTML('dead', cycleItems, 'dead', [
        { key: 'candle', glyph: 'flame',  title: 'Light a candle' },
        { key: 'remove', glyph: 'anchor', title: 'Remove' }
      ]) : '') +
      wallBlock +
      cta('Light a candle. Tonight Mary will name them with you.');

    if (cycleItems.length) startCycle('dead', cycleItems, 'dead', async (act, item) => {
      if (act === 'candle') {
        lightCandleOptimistic(item.id, item.name);
      } else if (act === 'remove') {
        if (!confirm('Remove ' + item.name + ' from the Book of Life?')) return;
        try { await api.del('/api/dead/' + item.id); toast('Removed.'); load(); }
        catch (e) { toast(e.message || 'Could not remove.'); }
      }
    });

    if (dead.length) {
      renderWallPage();
      if (totalPages > 1) {
        __wallTimer = setInterval(() => {
          __wallPage = (__wallPage + 1) % totalPages;
          renderWallPage();
        }, 6000);
      }
    }
  }

  function renderWallPage() {
    const wall = document.getElementById('book-votive-wall');
    if (!wall) return;
    const start = __wallPage * WALL_BATCH;
    const slice = __wallItems.slice(start, start + WALL_BATCH);
    const today = todayMMDD();
    wall.innerHTML = slice.map(d => {
      const lit = __wallLitCount[d.full_name] || 0;
      const cls = lit > 0 ? 'book-votive lit' : 'book-votive unlit';
      const isAnniv = mmdd(d.birthdate) === today || mmdd(d.death_date) === today;
      return '<button class="' + cls + (isAnniv ? ' anniversary' : '') + '" data-id="' + d.id + '" data-name="' + escape(d.full_name) + '" data-lit="' + lit + '">' +
        '<div class="votive-candle">' +
          '<div class="votive-flame"><span></span></div>' +
          '<div class="votive-cup"></div>' +
        '</div>' +
        '<div class="votive-name">' + escape(firstName(d.full_name)) + (d.is_family_patron ? ' ✦' : '') + '</div>' +
        '<div class="votive-count"' + (lit > 1 ? '' : ' hidden') + '>x' + lit + '</div>' +
      '</button>';
    }).join('');
    const totalPages = Math.max(1, Math.ceil(__wallItems.length / WALL_BATCH));
    const posEl = document.getElementById('book-votive-pager-pos');
    if (posEl) posEl.textContent = (__wallPage + 1) + ' / ' + totalPages;
    wall.querySelectorAll('.book-votive').forEach(b => b.addEventListener('click', () => {
      // Optimistic: flip to lit + bump count on this button immediately.
      b.classList.remove('unlit');
      b.classList.add('lit');
      const prevLit = Number(b.dataset.lit || 0);
      const nextLit = prevLit + 1;
      b.dataset.lit = String(nextLit);
      __wallLitCount[b.dataset.name] = nextLit;
      const countEl = b.querySelector('.votive-count');
      if (countEl) {
        countEl.textContent = 'x' + nextLit;
        if (nextLit > 1) countEl.removeAttribute('hidden');
      }
      lightCandleOptimistic(b.dataset.id, b.dataset.name, { skipReload: true });
    }));
  }

  // Fire-and-reconcile candle lighting. Toast + sound on tap; server in background.
  // On error we toast and reload so the user sees the truth.
  function lightCandleOptimistic(id, name, opts) {
    opts = opts || {};
    toast('A candle was lit for ' + name + '.');
    if (window.HwAudio) HwAudio.ring();
    api.post('/api/dead/' + id + '/candle', {}).then(() => {
      if (!opts.skipReload) load();
    }).catch(e => {
      toast(e.message || 'Could not light the candle.');
      load();
    });
  }
  function addCardDead() {
    return `<details class="card collapsible book-add">
      <summary><strong>Add a name to the Book of Life</strong></summary>
      <form id="form-dead">
        <label>Full name<input name="full_name" required></label>
        <label>Relationship<input name="relationship" placeholder="e.g. Lolo, Tita, Ninang"></label>
        <label class="muted small">Birthday <span class="muted small">(month and day - no year needed)</span></label>
        <div class="row two-up">
          <select name="birth_month" id="birth_month"><option value="">— month —</option></select>
          <select name="birth_day"   id="birth_day"><option value="">— day —</option></select>
        </div>
        <label class="muted small mt">Heavenward day <span class="muted small">(month and day)</span></label>
        <div class="row two-up">
          <select name="death_month" id="death_month"><option value="">— month —</option></select>
          <select name="death_day"   id="death_day"><option value="">— day —</option></select>
        </div>
        <label class="mt">Brief story<textarea name="brief_story" placeholder="a few sentences, kept gently"></textarea></label>
        <button class="primary" type="submit">Receive into the Book of Life</button>
      </form>
    </details>`;
  }

  // --- Section: What he has done (Thanksgiving + Answered merged) ---
  function answeredRow(a) {
    const kindGlyph = a.kind === 'thanksgiving' ? 'heart' : (a.kind === 'sick' ? 'rays' : 'anchor');
    return '<div class="book-row">' +
      smallAvatar(kindGlyph) +
      '<div class="book-row-body">' +
        '<div class="book-row-name">' + (a.person_name ? escape(a.person_name) : '<em>Thanksgiving</em>') + '</div>' +
        '<div class="book-row-sub">' + escape(a.text || '') + '</div>' +
        '<div class="muted small">' + escape(a.at) + ' &middot; <em>' + escape(a.kind) + '</em></div>' +
      '</div>' +
    '</div>';
  }
  function renderAnswered(items) {
    const sec = document.getElementById('section-answered');
    if (!items.length) {
      sec.innerHTML = sectionHeader({ glyph: 'rays', title: 'What he has done' }) +
        '<p class="muted small empty-line">When you mark a petition answered or a sick person recovered, the family will remember it here.</p>' +
        cta('Read aloud at dinner. The kids will learn that he answers.');
      return;
    }
    const cycleItems = items.slice(0, 30).map(a => ({ id: 'a-' + (a.id || a.at), name: a.person_name || 'Thanksgiving', sub: a.text || '' }));
    sec.innerHTML =
      sectionHeader({ glyph: 'rays', title: 'What he has done', count: items.length }) +
      cyclingCardHTML('ans', cycleItems, 'answered', []) +
      cta('Read aloud at dinner. The kids will learn that he answers.');
    startCycle('ans', cycleItems, 'answered', () => {});
  }
  function addCardThx() {
    return `<details class="card collapsible book-add">
      <summary><strong>Add a thanksgiving</strong></summary>
      <form id="form-thx">
        <label>Person (optional)<input name="person_name"></label>
        <label>Thanksgiving<textarea name="thanksgiving_text" required></textarea></label>
        <button class="primary" type="submit">Offer thanksgiving</button>
      </form>
    </details>`;
  }

  // --- Anniversary banners at the very top of the page ---
  function renderAnniversaries(dead) {
    const el = document.getElementById('anniversary-banners');
    if (!el) return;
    const month = new Date().getMonth() + 1;
    const november = month === 11
      ? '<div class="nov-banner-global">November - Month of the Holy Souls. Pray for all our beloved in the Lord.</div>' : '';
    const today = todayMMDD();
    const anniv = [];
    for (const d of dead) {
      const bm = mmdd(d.birthdate);
      const dm = mmdd(d.death_date);
      if (bm === today) anniv.push({ d, kind: 'birthday',  years: yearsSince(d.birthdate) });
      if (dm === today) anniv.push({ d, kind: 'heavenward', years: yearsSince(d.death_date) });
    }
    el.innerHTML = november + anniv.map(a => {
      const label = a.kind === 'birthday'
        ? 'Today is the ' + (a.years != null ? ordinal(a.years) + ' ' : '') + 'birthday of ' + escape(a.d.full_name) + '.'
        : 'Today marks ' + (a.years != null ? a.years + ' year' + (a.years === 1 ? '' : 's') + ' since ' : '') + escape(a.d.full_name) + ' began the heavenward journey.';
      return '<div class="anniversary-banner">' +
        '<div class="ab-candle"><div class="candle-large"><div class="wick"></div><div class="flame"><span></span></div></div></div>' +
        '<div class="ab-text"><strong>' + label + '</strong><p class="muted small">Light a candle and remember them in today\'s Rosary.</p></div>' +
        '<button class="primary" data-act="anniv-candle" data-id="' + a.d.id + '" data-name="' + escape(a.d.full_name) + '">Light a candle</button>' +
      '</div>';
    }).join('');
    el.querySelectorAll('button[data-act="anniv-candle"]').forEach(b => b.addEventListener('click', () => {
      lightCandleOptimistic(b.dataset.id, b.dataset.name);
    }));
  }

  // ---------- Bottom add drawer ----------
  // ONE place to add to The Book. Tabs across the top. The currently selected
  // kind renders the relevant form in the pane below. No more inline add cards
  // scattered across the prayer page.
  function paneHTML(kind) {
    if (kind === 'sick') return `<form id="form-sick">
        <label>Person<input name="person_name" required></label>
        <label>Relationship<input name="relationship"></label>
        <label>Intention<textarea name="intention" required></textarea></label>
        <button class="primary" type="submit">Add to the sick list</button>
      </form>`;
    if (kind === 'petition') return `<form id="form-petition">
        <label>Person (optional)<input name="person_name"></label>
        <label>Petition<textarea name="petition" required></textarea></label>
        <label>Level
          <select name="level">
            <option value="3" selected>Active (3)</option>
            <option value="4">Ongoing (4)</option>
            <option value="2">Urgent (2)</option>
            <option value="1">Emergency (1)</option>
          </select>
        </label>
        <button class="primary" type="submit">Add to prayer</button>
      </form>`;
    if (kind === 'person') return `<form id="form-person">
        <label>Full name<input name="full_name" required></label>
        <label>Relationship<input name="relationship" placeholder="e.g. Lola, Ninong, classmate"></label>
        <label>Category
          <select name="category">
            <option value="family">Family - kin</option>
            <option value="friend">Friend</option>
            <option value="godfamily">Godparent / Godchild</option>
            <option value="parish">Parish</option>
            <option value="work">Work / school</option>
            <option value="acquaintance">Acquaintance</option>
            <option value="other" selected>Other</option>
          </select>
        </label>
        <label>Notes<input name="notes" placeholder="optional"></label>
        <button class="primary" type="submit">Add to our circle</button>
      </form>`;
    if (kind === 'dead') return `<form id="form-dead">
        <label>Full name<input name="full_name" required></label>
        <label>Relationship<input name="relationship" placeholder="e.g. Lolo, Tita, Ninang"></label>
        <label class="muted small">Birthday <span class="muted small">(month and day - no year)</span></label>
        <div class="row two-up">
          <select name="birth_month" id="birth_month"><option value="">— month —</option></select>
          <select name="birth_day"   id="birth_day"><option value="">— day —</option></select>
        </div>
        <label class="muted small mt">Heavenward day <span class="muted small">(month and day)</span></label>
        <div class="row two-up">
          <select name="death_month" id="death_month"><option value="">— month —</option></select>
          <select name="death_day"   id="death_day"><option value="">— day —</option></select>
        </div>
        <label class="mt">Brief story<textarea name="brief_story" placeholder="a few sentences"></textarea></label>
        <button class="primary" type="submit">Receive into the Book of Life</button>
      </form>`;
    if (kind === 'thx') return `<form id="form-thx">
        <label>Person (optional)<input name="person_name"></label>
        <label>Thanksgiving<textarea name="thanksgiving_text" required></textarea></label>
        <button class="primary" type="submit">Offer thanksgiving</button>
      </form>`;
    if (kind === 'world') return `<form id="form-world">
        <label>Title<input name="title" required placeholder="e.g. The war in the Holy Land"></label>
        <label>Category
          <select name="category">
            <option value="peace">Peace / war</option>
            <option value="church">The Church</option>
            <option value="leaders">Pope, bishops, leaders</option>
            <option value="calamity">Calamity / typhoon / disaster</option>
            <option value="unborn">The unborn</option>
            <option value="world" selected>The world</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>Detail<textarea name="detail" placeholder="optional - a sentence to keep this concrete"></textarea></label>
        <button class="primary" type="submit">Bring it into The Book</button>
      </form>`;
    if (kind === 'bulk') return `<p class="muted small">Paste from Excel (tab-separated), CSV, or one name per line. Three columns: Name, Relationship, Category.</p>
      <form id="form-people-import">
        <label>Default category
          <select name="default_category">
            <option value="other" selected>Other</option>
            <option value="family">Family - kin</option>
            <option value="friend">Friend</option>
            <option value="godfamily">Godparent / Godchild</option>
            <option value="parish">Parish</option>
            <option value="work">Work / school</option>
            <option value="acquaintance">Acquaintance</option>
          </select>
        </label>
        <label>Paste here<textarea name="text" rows="6" required placeholder="Lolo Pedro&#9;grandfather&#9;family"></textarea></label>
        <button class="primary" type="submit">Receive them all</button>
      </form>
      <p id="people-import-result" class="muted small mt"></p>`;
    return '';
  }
  function showAddPane(kind) {
    document.querySelectorAll('#book-add-tabs .book-add-tab').forEach(b => b.classList.toggle('active', b.dataset.kind === kind));
    document.getElementById('book-add-pane').innerHTML = paneHTML(kind);
    wireForms();
  }
  function wireDrawerOnce() {
    const tabs = document.getElementById('book-add-tabs');
    if (!tabs || tabs.dataset.wired) return;
    tabs.dataset.wired = '1';
    tabs.querySelectorAll('.book-add-tab').forEach(b => b.addEventListener('click', () => showAddPane(b.dataset.kind)));
    showAddPane('sick');
  }

  // ---------- Form wiring (re-wires every time forms are recreated by the drawer) ----------
  function wireForms() {
    // Populate Book-of-Life month/day selects
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    for (const id of ['birth_month','death_month']) {
      const el = document.getElementById(id);
      if (el && el.options.length === 1) months.forEach((m, i) => { const o = document.createElement('option'); o.value = String(i + 1).padStart(2,'0'); o.textContent = m; el.appendChild(o); });
    }
    for (const id of ['birth_day','death_day']) {
      const el = document.getElementById(id);
      if (el && el.options.length === 1) for (let d = 1; d <= 31; d++) { const o = document.createElement('option'); o.value = String(d).padStart(2,'0'); o.textContent = String(d); el.appendChild(o); }
    }
    const fp = document.getElementById('form-petition');
    if (fp) fp.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      await api.post('/api/prayer/petition', { person_name: fd.get('person_name'), petition: fd.get('petition'), level: Number(fd.get('level')) });
      ev.target.reset(); toast('Petition added.'); load();
    });
    const fs = document.getElementById('form-sick');
    if (fs) fs.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      await api.post('/api/prayer/sick', { person_name: fd.get('person_name'), relationship: fd.get('relationship'), intention: fd.get('intention') });
      ev.target.reset(); toast('Added to the sick list.'); load();
    });
    const ft = document.getElementById('form-thx');
    if (ft) ft.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      await api.post('/api/prayer/thanksgiving', { person_name: fd.get('person_name'), thanksgiving_text: fd.get('thanksgiving_text') });
      ev.target.reset(); toast('Thanksgiving offered.'); load();
    });
    const fd = document.getElementById('form-dead');
    if (fd) fd.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd2 = new FormData(ev.target);
      const combine = (mm, dd) => (mm && dd) ? (String(mm).padStart(2,'0') + '-' + String(dd).padStart(2,'0')) : null;
      try {
        await api.post('/api/dead', {
          full_name: fd2.get('full_name'),
          relationship: fd2.get('relationship'),
          birthdate: combine(fd2.get('birth_month'), fd2.get('birth_day')),
          death_date: combine(fd2.get('death_month'), fd2.get('death_day')),
          brief_story: fd2.get('brief_story')
        });
        ev.target.reset(); toast('Received into the Book of Life, with love.'); load();
      } catch (e) { toast(e.message || 'Only Tatay or Nanay can add.'); }
    });
    const fper = document.getElementById('form-person');
    if (fper) fper.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      try { await api.post('/api/people', { full_name: f.get('full_name'), relationship: f.get('relationship'), category: f.get('category'), notes: f.get('notes') });
        ev.target.reset(); toast('Added to the circle.'); load();
      } catch (e) { toast(e.message || 'Could not add.'); }
    });
    const fw = document.getElementById('form-world');
    if (fw) fw.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      try {
        await api.post('/api/prayer/world', {
          title: f.get('title'),
          category: f.get('category'),
          detail: f.get('detail')
        });
        ev.target.reset(); toast('Brought into The Book.'); load();
      } catch (e) { toast(e.message || 'Could not add.'); }
    });
    const fimp = document.getElementById('form-people-import');
    if (fimp) fimp.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      try { const r = await api.post('/api/people/import', { text: f.get('text'), default_category: f.get('default_category') });
        const out = document.getElementById('people-import-result');
        if (out) out.innerHTML = '<strong>' + r.added + ' name' + (r.added===1?'':'s') + ' received into the circle.</strong>';
        ev.target.reset(); toast(r.added + ' names added.'); load();
      } catch (e) { toast(e.message || 'Import failed.'); }
    });
  }

  function init() { /* loaded by app.js showScreen('prayer') -> calls load() */ }

  // Legacy global names referenced by app.js - all funnel into the new load().
  global.PrayerUI = {
    init, load,
    loadPetitions: load,
    loadSick: load,
    loadThx: load,
    loadInventory: load,
    loadDead: load,
    loadPeople: load
  };
})(window);
