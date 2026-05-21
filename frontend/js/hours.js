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
    showScreen('home', { replace: true });
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
      <p class="italic-cta">Sleep in him. He keeps watch.</p>
    `;
    showScreen('night');
  }

  async function examineDay() {
    await api.post('/api/hours/log', { hour_type: 'examen' });
    await api.post('/api/hearth/post', { type: 'examen_done', content: (api.user().display_name || 'Family member') + ' has examined the day.' });
    toast('Sleep well. He keeps watch.');
    showScreen('home', { replace: true });
    if (global.refreshHome) refreshHome();
  }

  // ============================================================
  // The Heavenward Hours - the four "in-between" prayer screens
  // ============================================================

  function openMidMorning() {
    const body = document.getElementById('midmorning-body');
    body.innerHTML = `
      <p class="muted">Mid-morning - Terce</p>
      <h2>The hour of work, offered.</h2>
      <p class="text-block">
        Come, Holy Spirit, fill the hearts of your faithful and kindle in them the fire of your love.<br>
        Send forth your Spirit and they shall be created. And you shall renew the face of the earth.
      </p>
      <h3>Consecration of the work hour</h3>
      <p class="text-block">
        Lord Jesus, I give you the work of this hour - my hands, my words, my attention.
        Make my labor a small offering to you. Be in my conversations.
        Make me patient with those around me. Through Christ our Lord. Amen.
      </p>
      <p class="text-block"><em>An Our Father - slowly, while you walk to your next task.</em></p>
      <p class="italic-cta">Then carry him into the next hour.</p>
    `;
    showScreen('midmorning');
  }
  async function logMidMorning() {
    await api.post('/api/hours/log', { hour_type: 'reading' }); // 'reading' is the "other" hour bucket
    toast('Your work this hour is an offering.');
    showScreen('home', { replace: true });
    if (global.refreshHome) refreshHome();
  }

  async function openAngelus() {
    // Switch to Regina Caeli during Easter season.
    let season = 'ordinary';
    try { const t = await api.get('/api/hours/today'); season = (t.liturgical && t.liturgical.season) || 'ordinary'; } catch {}
    const body = document.getElementById('angelus-body');
    if (season === 'easter') {
      body.innerHTML = `
        <p class="muted">Easter season - Regina Caeli replaces the Angelus</p>
        <h2>Regina Caeli</h2>
        <p class="text-block" style="font-family: var(--font-serif); line-height: 2;">
          V. Queen of Heaven, rejoice, alleluia.<br>
          R. For He whom you did merit to bear, alleluia.<br>
          V. Has risen, as he said, alleluia.<br>
          R. Pray for us to God, alleluia.<br>
          V. Rejoice and be glad, O Virgin Mary, alleluia.<br>
          R. For the Lord has truly risen, alleluia.
        </p>
        <h3>Let us pray</h3>
        <p class="text-block">
          O God, who by the Resurrection of your Son, our Lord Jesus Christ, gave joy to the world, grant, we beseech you,
          that through the intercession of the Virgin Mary, his Mother, we may obtain the joys of everlasting life.
          Through the same Christ our Lord. Amen.
        </p>
        <p class="italic-cta">Rejoice. He has truly risen.</p>`;
    } else {
      body.innerHTML = `
        <p class="muted">Noon - the Angelus</p>
        <h2>The Angelus</h2>
        <p class="text-block" style="font-family: var(--font-serif); line-height: 2;">
          V. The angel of the Lord declared unto Mary.<br>
          R. And she conceived of the Holy Spirit.<br>
          <em>Hail Mary, full of grace, the Lord is with thee...</em>
          <br><br>
          V. Behold the handmaid of the Lord.<br>
          R. Be it done unto me according to thy word.<br>
          <em>Hail Mary...</em>
          <br><br>
          V. And the Word was made flesh.<br>
          R. And dwelt among us.<br>
          <em>Hail Mary...</em>
          <br><br>
          V. Pray for us, O holy Mother of God.<br>
          R. That we may be made worthy of the promises of Christ.
        </p>
        <h3>Let us pray</h3>
        <p class="text-block">
          Pour forth, we beseech you, O Lord, your grace into our hearts,
          that we, to whom the Incarnation of Christ your Son was made known by the message of an angel,
          may by his Passion and Cross be brought to the glory of his Resurrection.
          Through the same Christ our Lord. Amen.
        </p>
        <p class="italic-cta">Then go back to your work. The Word is with you.</p>`;
    }
    showScreen('angelus');
  }
  async function logAngelus() {
    await api.post('/api/hours/log', { hour_type: 'angelus' });
    toast('At the message of an angel, the Word was made flesh.');
    showScreen('home', { replace: true });
    if (global.refreshHome) refreshHome();
  }

  function openMercy() {
    const body = document.getElementById('mercy-body');
    body.innerHTML = `
      <p class="muted">3 PM - The Hour of Divine Mercy</p>
      <h2>"At three o\'clock implore my mercy."</h2>
      <p class="text-block">
        You expired, Jesus, but the source of life gushed forth for souls, and the ocean of mercy
        opened up for the whole world. O Fount of Life, unfathomable Divine Mercy, envelop the
        whole world and empty Yourself out upon us.
      </p>
      <p class="text-block" style="font-style: italic; color: var(--gold); font-family: var(--font-serif);">
        Blood and Water, which gushed forth from the Heart of Jesus as a fount of Mercy for us,
        I trust in You!
      </p>
      <h3>Chaplet of Divine Mercy (5 minutes)</h3>
      <p class="text-block">
        On the large beads:<br>
        <em>Eternal Father, I offer you the Body and Blood, Soul and Divinity of your dearly beloved Son,
        our Lord Jesus Christ, in atonement for our sins and those of the whole world.</em>
      </p>
      <p class="text-block">
        On the ten small beads:<br>
        <em>For the sake of his sorrowful Passion, have mercy on us and on the whole world.</em>
      </p>
      <p class="text-block">
        At the end (three times):<br>
        <em>Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world.</em>
      </p>
      <p class="text-block muted small">St. Faustina, pray for us. Jesus, I trust in You.</p>
      <p class="italic-cta">Now sit one minute. It is the hour he died for you.</p>
    `;
    showScreen('mercy');
  }
  async function logMercy() {
    await api.post('/api/hours/log', { hour_type: 'reading' });
    toast('Jesus, I trust in you.');
    showScreen('home', { replace: true });
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
        <p class="italic-cta"><span class="clickable" data-saint-intercession="${escape(s.name)}">${escape(s.name)}, pray for us.</span></p>
      `;
      // Wire the intercession tap - logs a Hearth entry so the saint becomes a daily companion.
      const link = document.querySelector('#saint-profile-body .clickable[data-saint-intercession]');
      if (link) link.addEventListener('click', async () => {
        try {
          await api.post('/api/hearth/post', {
            type: 'note',
            content: (api.user().display_name || 'Family member') + ' asked ' + link.dataset.saintIntercession + ' to pray for the family.'
          });
          toast(link.dataset.saintIntercession + ' is praying for us.');
          link.style.color = 'var(--rose)';
          link.style.cursor = 'default';
        } catch (e) { toast('Could not record the intercession.'); }
      });
      showScreen('saint-profile');
    } catch (e) { toast('Could not load saint.'); }
  }

  function init() {
    document.getElementById('btn-morning-offered').addEventListener('click', offerDay);
    document.getElementById('btn-morning-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('btn-night-examined').addEventListener('click', examineDay);
    document.getElementById('btn-night-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('btn-saint-back').addEventListener('click', () => showScreen('home'));
    // Heavenward Hours
    const wire = (btnId, fn) => { const b = document.getElementById(btnId); if (b) b.addEventListener('click', fn); };
    wire('btn-midmorning-done', logMidMorning);
    wire('btn-midmorning-back', () => showScreen('home'));
    wire('btn-angelus-done',    logAngelus);
    wire('btn-angelus-back',    () => showScreen('home'));
    wire('btn-mercy-done',      logMercy);
    wire('btn-mercy-back',      () => showScreen('home'));
    document.addEventListener('click', (ev) => {
      const link = ev.target.closest('.saint-card-link');
      if (link) { ev.preventDefault(); openSaintProfile(link.dataset.slug); }
    });
  }

  global.HoursUI = { init, openMorning, openNight, openMidMorning, openAngelus, openMercy, loadSaints, openSaintProfile };
})(window);
