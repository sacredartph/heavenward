// Prayer tabs: petitions, sick, thanksgiving, inventory.
(function (global) {
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
  function isParent() { const u = api.user(); return u && (u.role === 'tatay' || u.role === 'nanay'); }

  async function loadPetitions() {
    const r = await api.get('/api/prayer/petitions');
    const list = document.getElementById('petition-list');
    if (!r.petitions.length) { list.innerHTML = '<p class="muted">No active petitions yet.</p>'; return; }
    list.innerHTML = r.petitions.map(p => `
      <div class="petition-item">
        <span class="level l${p.level}">L${p.level}</span>
        ${p.is_pinned ? '<span class="muted small">pinned</span>' : ''}
        <strong>${escape(p.person_name || 'Petition')}</strong>
        <p>${escape(p.petition)}</p>
        <div class="muted small">Added by ${escape(p.added_by_name || '')} - ${escape(p.date_added)}</div>
        <div class="actions">
          <button data-act="answer" data-id="${p.id}">Mark answered</button>
          ${isParent() ? '<button data-act="pin" data-id="' + p.id + '">' + (p.is_pinned ? 'Unpin' : 'Pin') + '</button>' : ''}
          ${isParent() ? '<button data-act="upgrade" data-id="' + p.id + '">Upgrade urgency</button>' : ''}
        </div>
      </div>`).join('');
    list.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', petitionAction));
  }

  async function petitionAction(ev) {
    const id = ev.target.dataset.id;
    const act = ev.target.dataset.act;
    if (act === 'answer') {
      const ans = prompt('How did God answer? (optional)');
      await api.post('/api/prayer/petition/' + id + '/answer', { how_god_answered: ans || null });
      toast('Answered. Thanksgiving recorded.');
      loadPetitions();
    } else if (act === 'pin') {
      const cur = await api.get('/api/prayer/petitions');
      const p = cur.petitions.find(x => x.id == id);
      await api.put('/api/prayer/petition/' + id, { is_pinned: p && p.is_pinned ? 0 : 1 });
      loadPetitions();
    } else if (act === 'upgrade') {
      const cur = await api.get('/api/prayer/petitions');
      const p = cur.petitions.find(x => x.id == id);
      const newLevel = Math.max(1, (p ? p.level : 3) - 1);
      await api.put('/api/prayer/petition/' + id, { level: newLevel });
      toast('Urgency raised to L' + newLevel + '.');
      loadPetitions();
    }
  }

  async function loadSick() {
    const r = await api.get('/api/prayer/sick');
    const list = document.getElementById('sick-list');
    if (!r.sick.length) { list.innerHTML = '<p class="muted">No one on the sick list right now.</p>'; return; }
    list.innerHTML = r.sick.map(s => `
      <div class="sick-item">
        <strong>${escape(s.person_name)}</strong> <span class="muted small">${escape(s.relationship || '')}</span>
        <p>${escape(s.intention)}</p>
        <div class="muted small">${escape(s.date_added)}</div>
        <div class="actions">
          <button data-act="recovered" data-id="${s.id}" data-name="${escape(s.person_name)}">Mark recovered</button>
          <button data-act="deceased" data-id="${s.id}" data-name="${escape(s.person_name)}">Add to the Book of the Dead</button>
        </div>
      </div>`).join('');
    list.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', sickAction));
  }

  async function sickAction(ev) {
    const id = ev.target.dataset.id;
    const act = ev.target.dataset.act;
    const name = ev.target.dataset.name;
    if (act === 'recovered') {
      await api.put('/api/prayer/sick/' + id, { status: 'recovered' });
      toast('Thanksgiving for ' + name + ' added.');
      loadSick();
    } else if (act === 'deceased') {
      if (!confirm('Add ' + name + ' to the Book of the Dead?\nLord, receive ' + name + ' into your mercy.')) return;
      const note = prompt('A brief, gentle line for the Book (optional)') || null;
      await api.put('/api/prayer/sick/' + id, { status: 'deceased', deceased_dignity_text: note });
      toast(name + ' has been added to the Book with love.');
      loadSick();
      loadDead();
    }
  }

  async function loadThx() {
    const r = await api.get('/api/prayer/thanksgiving');
    const list = document.getElementById('thx-list');
    if (!r.thanksgiving.length) { list.innerHTML = '<p class="muted">No thanksgivings yet.</p>'; return; }
    list.innerHTML = r.thanksgiving.map(t => `
      <div class="thx-item">
        ${t.person_name ? '<strong>' + escape(t.person_name) + '</strong> - ' : ''}
        <span>${escape(t.thanksgiving_text)}</span>
        <div class="muted small">${escape(t.date_added)}</div>
      </div>`).join('');
  }

  async function loadInventory() {
    const q = document.getElementById('inv-search').value || '';
    const r = await api.get('/api/prayer/inventory' + (q ? '?q=' + encodeURIComponent(q) : ''));
    const list = document.getElementById('inv-list');
    if (!r.inventory.length) { list.innerHTML = '<p class="muted">Nothing yet in the inventory.</p>'; return; }
    list.innerHTML = r.inventory.map(i => `
      <div class="inv-item">
        <strong>${escape(i.person_name || i.source_type)}</strong>
        <p>${escape(i.original_intention || '')}</p>
        ${i.how_god_answered ? '<p class="muted">Answer: ' + escape(i.how_god_answered) + '</p>' : ''}
        <div class="muted small">${escape(i.date_added)} -> ${escape(i.date_resolved || 'open')}</div>
      </div>`).join('');
  }

  async function loadDead() {
    const r = await api.get('/api/dead');
    const list = document.getElementById('dead-list');
    const month = new Date().getMonth() + 1;
    const banner = month === 11 ? '<div class="nov-banner-global">November - Month of the Holy Souls. Pray for all our beloved dead.</div>' : '';
    const addCard = document.getElementById('dead-add-card');
    if (!isParent()) addCard.classList.add('hidden'); else addCard.classList.remove('hidden');
    if (!r.dead.length) { list.innerHTML = banner + '<p class="muted">No entries yet. The Book is kept by Tatay and Nanay.</p>'; return; }
    list.innerHTML = banner + r.dead.map(d => `
      <div class="dead-item">
        <div class="dead-photo">${(d.full_name || '?')[0]}</div>
        <div>
          <strong>${escape(d.full_name)}</strong> ${d.is_family_patron ? '<span class="muted small">(family patron)</span>' : ''}
          ${d.relationship ? '<div class="muted small">' + escape(d.relationship) + '</div>' : ''}
          ${d.brief_story ? '<div class="muted small">' + escape(d.brief_story) + '</div>' : ''}
        </div>
        <div class="actions"><button data-act="candle" data-id="${d.id}" data-name="${escape(d.full_name)}">Light a candle</button></div>
      </div>`).join('');
    list.querySelectorAll('button[data-act="candle"]').forEach(b => b.addEventListener('click', async () => {
      await api.post('/api/dead/' + b.dataset.id + '/candle', {});
      toast('A candle was lit for ' + b.dataset.name + '.');
    }));
  }

  function init() {
    document.querySelectorAll('.tabs .tab').forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('.tabs .tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const id = 'tab-' + t.dataset.tab;
      document.getElementById(id).classList.add('active');
      if (t.dataset.tab === 'petitions')    loadPetitions();
      if (t.dataset.tab === 'sick')         loadSick();
      if (t.dataset.tab === 'thanksgiving') loadThx();
      if (t.dataset.tab === 'inventory')    loadInventory();
      if (t.dataset.tab === 'dead')         loadDead();
    }));
    document.getElementById('form-petition').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      await api.post('/api/prayer/petition', { person_name: fd.get('person_name'), petition: fd.get('petition'), level: Number(fd.get('level')) });
      ev.target.reset(); toast('Petition added to the family wall.'); loadPetitions();
    });
    document.getElementById('form-sick').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      await api.post('/api/prayer/sick', { person_name: fd.get('person_name'), relationship: fd.get('relationship'), intention: fd.get('intention') });
      ev.target.reset(); toast('Added to the sick list.'); loadSick();
    });
    document.getElementById('form-thx').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      await api.post('/api/prayer/thanksgiving', { person_name: fd.get('person_name'), thanksgiving_text: fd.get('thanksgiving_text') });
      ev.target.reset(); toast('Thanksgiving offered.'); loadThx();
    });
    document.getElementById('form-dead').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      try {
        await api.post('/api/dead', {
          full_name: fd.get('full_name'),
          relationship: fd.get('relationship'),
          birthdate: fd.get('birthdate'),
          death_date: fd.get('death_date'),
          brief_story: fd.get('brief_story')
        });
        ev.target.reset(); toast('Added to the Book of the Dead, with love.');
        loadDead();
      } catch (e) {
        toast(e.message || 'Only Tatay or Nanay can add to the Book.');
      }
    });
    document.getElementById('inv-search').addEventListener('input', () => loadInventory());
  }

  global.PrayerUI = { init, loadPetitions, loadSick, loadThx, loadInventory, loadDead };
})(window);
