// Morning, Night, Saints UI logic.
(function (global) {
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  async function openMorning() {
    const r = await api.get('/api/hours/morning');
    const body = document.getElementById('morning-body');
    body.innerHTML = `
      <p class="muted">${escape(r.liturgical ? (r.liturgical.feast_name || r.liturgical.season) : '')}</p>
      <h2>Good morning.</h2>
      ${r.saint ? `<p class="saint-line">${escape(r.saint.name)}: "${escape(r.saint.key_quote || '')}"</p>` : ''}
      <h3>Morning Offering</h3>
      <p class="text-block">${escape(r.offering.text)}</p>
      <h3>From Lauds</h3>
      <p class="text-block">${escape(r.lauds.psalm_verse)}</p>
      <p class="text-block">${escape(r.lauds.benedictus_intro)}</p>
      <p class="text-block"><em>${escape(r.lauds.collect)}</em></p>
      ${r.gospel ? `<h3>Gospel of the Day</h3><p>${escape(r.gospel.ref)}</p><p class="muted"><em>${escape(r.gospel.question)}</em></p>` : ''}
      ${r.carry && r.carry.length ? '<h3>Carrying today</h3><ul>' + r.carry.map(c => '<li>L' + c.level + ' - ' + escape(c.petition) + '</li>').join('') + '</ul>' : ''}
    `;
    showScreen('morning');
  }

  async function offerDay() {
    await api.post('/api/hours/log', { hour_type: 'morning_offering' });
    await api.post('/api/hearth/post', { type: 'offering', content: (api.user().display_name || 'Family member') + ' has offered the day.' });
    toast('Your offering is on the family hearth.');
    showScreen('home');
    if (global.refreshHome) refreshHome();
  }

  async function openNight() {
    const r = await api.get('/api/hours/night');
    const body = document.getElementById('night-body');
    body.innerHTML = `
      <h2>Compline & Examen</h2>
      <p class="verse">${escape(r.psalm.verse)}</p>
      <p class="verse">${escape(r.nunc_dimittis)}</p>
      <div class="examen">
        <h3>Examen</h3>
        <ol>${r.examen.map(q => '<li>' + escape(q) + '</li>').join('')}</ol>
      </div>
      <p class="verse">${escape(r.salve_regina)}</p>
    `;
    showScreen('night');
  }

  async function examineDay() {
    await api.post('/api/hours/log', { hour_type: 'examen' });
    await api.post('/api/hearth/post', { type: 'examen_done', content: (api.user().display_name || 'Family member') + ' has examined the day.' });
    toast('Sleep well. He keeps watch.');
    showScreen('home');
    if (global.refreshHome) refreshHome();
  }

  async function loadSaints() {
    const today = await api.get('/api/saints/today');
    const wrap = document.getElementById('saint-today');
    wrap.innerHTML = today.saint ? saintCard(today.saint) : '<p class="muted">No saint of the day loaded.</p>';

    const fil = await api.get('/api/saints?nationality=Filipino');
    document.getElementById('saints-filipino').innerHTML = fil.saints.map(saintCard).join('');

    const all = await api.get('/api/saints');
    document.getElementById('saints-list').innerHTML = '<div class="card"><h3>All saints</h3>' + all.saints.map(saintCard).join('') + '</div>';

    document.getElementById('saints-search').addEventListener('input', async (ev) => {
      const q = ev.target.value;
      const r = await api.get('/api/saints/search?q=' + encodeURIComponent(q));
      document.getElementById('saints-list').innerHTML = '<div class="card"><h3>Results</h3>' + (r.saints.length ? r.saints.map(saintCard).join('') : '<p class="muted">No matches.</p>') + '</div>';
    });
  }

  function saintCard(s) {
    return `<a class="saint-card-link" data-slug="${s.slug}" href="#${s.slug}">
      <div class="name">${escape(s.name)}</div>
      <div class="meta">${escape(s.feast_day)} · ${escape(s.category || '')} · ${escape(s.nationality || '')}</div>
      ${s.key_quote ? '<div class="quote">"' + escape(s.key_quote) + '"</div>' : ''}
    </a>`;
  }

  async function openSaintProfile(slug) {
    try {
      const r = await api.get('/api/saints/' + slug);
      const s = r.saint;
      document.getElementById('saint-profile-body').innerHTML = `
        <h2>${escape(s.name)}</h2>
        <p class="muted">Feast day ${escape(s.feast_day)} · ${escape(s.category || '')} · ${escape(s.nationality || '')}</p>
        <p><strong>Patron of:</strong> ${escape(s.patron_of || '')}</p>
        ${s.key_quote ? '<div class="quote-block">"' + escape(s.key_quote) + '"</div>' : ''}
        <h3>About</h3>
        <div class="story">${escape(s.story_for_user).replace(/\n/g, '<br><br>')}</div>
      `;
      showScreen('saint-profile');
    } catch (e) { toast('Could not load saint.'); }
  }

  function init() {
    document.getElementById('btn-morning-offered').addEventListener('click', offerDay);
    document.getElementById('btn-morning-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('btn-night-examined').addEventListener('click', examineDay);
    document.getElementById('btn-night-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('btn-saint-back').addEventListener('click', () => showScreen('saints'));
    document.addEventListener('click', (ev) => {
      const link = ev.target.closest('.saint-card-link');
      if (link) { ev.preventDefault(); openSaintProfile(link.dataset.slug); }
    });
  }

  global.HoursUI = { init, openMorning, openNight, loadSaints, openSaintProfile };
})(window);
