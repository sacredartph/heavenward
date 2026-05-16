// The Walk - rosary state and rendering.
(function (global) {
  const state = {
    walkId: null,
    mysterySet: null,
    mysteries: [],
    decadeIdx: 0,
    beadIdx: 0,
    steps: 0,
    pedometerSubId: null
  };

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
  }

  function advanceBead() {
    if (state.beadIdx < 10) {
      state.beadIdx += 1;
      renderBeads();
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
    list.innerHTML = sections.map(s => s.items.length
      ? '<div class="tail-section"><h4>' + s.title + '</h4>' + s.items.map(i => '<p>' + escape(i) + '</p>').join('') + '</div>'
      : ''
    ).join('') + '<div class="tail-section"><h4>Closing</h4><p style="font-style:italic">Hail, Holy Queen, Mother of Mercy, our life, our sweetness, and our hope. Amen.</p></div>';
    showScreen('walk-tail');
  }

  function escape(s) { return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  async function begin() {
    const mode = document.querySelector('input[name="walk-mode"]:checked').value;
    const r = await api.post('/api/walk/start', { mode });
    state.walkId = r.walk_id;
    state.mysterySet = r.mystery_set;
    const t = await api.get('/api/walk/today');
    state.mysteries = t.mysteries;
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
    showScreen('home');
    if (global.refreshHome) refreshHome();
  }

  async function endEarly() {
    stopPedometer();
    try { await api.post('/api/walk/' + state.walkId + '/complete', { steps: state.steps, decades_completed: state.decadeIdx, tail_completed: false }); } catch {}
    toast('Walk ended.');
    showScreen('home');
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

  function init() {
    document.getElementById('btn-begin-rosary').addEventListener('click', begin);
    document.getElementById('btn-next-decade').addEventListener('click', nextDecade);
    document.getElementById('btn-end-walk').addEventListener('click', endEarly);
    document.getElementById('btn-finish-walk').addEventListener('click', finishWalk);
    document.querySelector('.screen-walk-active').addEventListener('click', (ev) => {
      if (ev.target.tagName === 'BUTTON') return;
      advanceBead();
    });
  }

  global.WalkUI = { init };
})(window);
