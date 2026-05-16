// Main controller: routing between screens, auth flow, home page assembly.
(function (global) {
  const SCREENS = ['splash','login','onboard','home','walk-launch','walk-active','walk-tail','whisper-moment','whisper-display','prayer','hearth','morning','night','saints','saint-profile'];

  global.showScreen = function showScreen(name) {
    SCREENS.forEach(s => {
      const el = document.getElementById('screen-' + s);
      if (el) el.classList.toggle('visible', s === name);
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
    if (name === 'home')         refreshHome();
    if (name === 'walk-launch')  refreshWalkLaunch();
    if (name === 'prayer')       PrayerUI.loadPetitions();
    if (name === 'hearth')       HearthUI.load();
    if (name === 'saints')       HoursUI.loadSaints();
  };

  global.toast = function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  };

  function whoGreeting() {
    const u = api.user();
    if (!u) return 'Welcome home.';
    const hour = new Date().getHours();
    const part = hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = (u.display_name || '').split(' ')[0];
    return part + (name ? ', ' + name : '') + '.';
  }

  global.refreshHome = async function refreshHome() {
    const u = api.user();
    if (!u) return;
    document.getElementById('who-name').textContent = u.display_name || u.email;
    document.getElementById('greeting-line').textContent = whoGreeting();

    try {
      const today = await api.get('/api/hours/today');
      const lit = today.liturgical;
      const litLine = lit ? [lit.season && capitalize(lit.season) + ' season', lit.feast_name].filter(Boolean).join(' · ') : '';
      document.getElementById('liturgical-line').textContent = litLine || '';
      const s = today.saint;
      document.getElementById('home-saint').innerHTML = s ? `
        <h4>Saint of the day - ${escape(s.name)}</h4>
        <p>${escape(s.brief || '')}</p>
        ${s.key_quote ? '<p class="quote">"' + escape(s.key_quote) + '"</p>' : ''}
      ` : '';
      // Mark morning/night unfinished glow
      const morningDone = (today.done || {}).morning_offering > 0;
      const nightDone   = (today.done || {}).examen > 0;
      document.getElementById('card-morning').classList.toggle('unfinished', !morningDone);
      document.getElementById('card-night').classList.toggle('unfinished', !nightDone);
    } catch (e) {}

    try {
      const w = await api.get('/api/walk/today');
      document.getElementById('rosary-set').textContent = capitalize(w.mystery_set) + ' Mysteries';
    } catch {}

    try {
      const pr = await api.get('/api/hearth/presence');
      document.getElementById('presence-row').innerHTML = pr.members.map(m => {
        const active = (m.rosaries_today || 0) > 0 || (m.hours_today || 0) > 0;
        const init = (m.display_name || '?').split(' ').map(p => p[0]).slice(0, 2).join('');
        return `<div class="presence-dot ${active ? 'active' : ''}">
          <div class="circle">${escape(init)}</div>
          <div class="label">${escape((m.display_name || '').split(' ')[0])}</div>
          <div class="streak">${m.streak_days ? '🕯 ' + m.streak_days : ''}</div>
        </div>`;
      }).join('');
    } catch {}

    try {
      const pp = await api.get('/api/prayer/petitions');
      const e = pp.petitions.find(p => p.level === 1);
      const card = document.getElementById('emergency-card');
      if (e) {
        card.classList.remove('hidden');
        card.innerHTML = '<h3 style="color:var(--rose)">Emergency petition</h3>' +
          '<p><strong>' + escape(e.person_name || 'Family') + '</strong> - ' + escape(e.petition) + '</p>' +
          '<p class="muted small">Stop and pray a Hail Mary for this now.</p>';
      } else {
        card.classList.add('hidden');
      }
    } catch {}
  };

  async function refreshWalkLaunch() {
    try {
      const w = await api.get('/api/walk/today');
      document.getElementById('walk-set-name').textContent = capitalize(w.mystery_set) + ' Mysteries';
    } catch {}
  }

  function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  // --- BOOT ---
  function boot() {
    // Wire shared listeners
    document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => showScreen(b.dataset.screen)));
    document.getElementById('btn-logout').addEventListener('click', () => { api.setToken(null); api.setUser(null); showScreen('login'); });
    document.getElementById('btn-go-register').addEventListener('click', () => showScreen('onboard'));
    document.getElementById('btn-onboard-back').addEventListener('click', () => showScreen('login'));

    document.getElementById('card-morning').addEventListener('click', () => HoursUI.openMorning());
    document.getElementById('card-rosary').addEventListener('click',  () => showScreen('walk-launch'));
    document.getElementById('card-night').addEventListener('click',   () => HoursUI.openNight());

    document.getElementById('form-login').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      try {
        const r = await api.post('/api/auth/login', { email: fd.get('email'), password: fd.get('password') });
        api.setToken(r.token);
        api.setUser(r.user);
        toast('Welcome home, ' + (r.user.display_name || r.user.email) + '.');
        showScreen('home');
      } catch (e) { toast(e.message || 'Sign in failed.'); }
    });

    document.getElementById('form-register').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      try {
        const body = {
          family_name: fd.get('family_name'),
          patron_saint_slug: fd.get('patron_saint_slug'),
          tatay: { display_name: fd.get('tatay_name'), email: fd.get('tatay_email'), password: fd.get('tatay_password') }
        };
        if (fd.get('nanay_email') && fd.get('nanay_password')) {
          body.nanay = { display_name: fd.get('nanay_name'), email: fd.get('nanay_email'), password: fd.get('nanay_password') };
        }
        const r = await api.post('/api/auth/register', body);
        api.setToken(r.token); api.setUser(r.user);
        toast('Family sealed. Lord, bless this house.');
        showScreen('home');
      } catch (e) { toast(e.message || 'Registration failed.'); }
    });

    // Subsystem inits
    WalkUI.init();
    WhisperUI.init();
    PrayerUI.init();
    HearthUI.init();
    HoursUI.init();

    // Splash -> next screen
    setTimeout(() => {
      if (api.token()) showScreen('home');
      else showScreen('login');
    }, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
