// Main controller: routing between screens, auth flow, home page assembly.
(function (global) {
  const SCREENS = ['splash','login','onboard','home','walk-launch','walk-active','walk-tail','camino-pick','pilgrim','pilgrim-complete','whisper-moment','whisper-display','prayer','hearth','morning','midmorning','angelus','mercy','night','saints','saint-profile'];

  // ============================================================
  // Browser history integration - so back/forward behave naturally.
  // Every showScreen pushes a history entry (unless coming FROM popstate).
  // Modals (saint picker, gestures) push their own marker; back closes
  // the modal before navigating. Initial boot uses replaceState so the
  // very first back press exits the app (platform-correct behavior).
  // ============================================================
  let __navFromHistory = false;

  function _navigateState(name, replace) {
    const cur = history.state;
    // Don't push a duplicate of the same screen back-to-back.
    if (cur && cur.screen === name && !cur.modal) {
      history.replaceState({ screen: name }, '', '#' + name);
      return;
    }
    if (replace) history.replaceState({ screen: name }, '', '#' + name);
    else         history.pushState({ screen: name }, '', '#' + name);
  }

  function _renderScreen(name) {
    SCREENS.forEach(s => {
      const el = document.getElementById('screen-' + s);
      if (el) el.classList.toggle('visible', s === name);
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
    if (name === 'home')         { refreshHome(); if (global.ScheduleUI) ScheduleUI.renderHomeNextPrayer(); }
    if (name === 'walk-launch')  { refreshWalkLaunch(); if (global.WalkUI && WalkUI.refreshWalkLaunch) WalkUI.refreshWalkLaunch(); }
    if (name === 'whisper-moment') { if (global.WhisperUI && WhisperUI.refresh) WhisperUI.refresh(); }
    if (name === 'prayer')       PrayerUI.loadPetitions();
    if (name === 'hearth')       { HearthUI.load(); if (global.ScheduleUI) ScheduleUI.refreshEditor(); }
    if (name === 'saints')       HoursUI.loadSaints();
  }

  global.showScreen = function showScreen(name, opts) {
    opts = opts || {};
    _renderScreen(name);
    if (!__navFromHistory) _navigateState(name, opts.replace);
  };

  // Modals push their own history state so the back button closes them
  // before navigating away. Frontend modules call openModalState / closeModalState.
  global.openModalState = function openModalState(modalId) {
    const cur = history.state || { screen: 'home' };
    history.pushState({ screen: cur.screen, modal: modalId }, '', '#' + modalId);
  };
  global.closeModalState = function closeModalState(modalId) {
    // If we are currently on the modal state, going back will pop it -
    // the popstate listener handles actually hiding the modal element.
    if (history.state && history.state.modal === modalId) {
      history.back();
    }
  };

  window.addEventListener('popstate', function (event) {
    __navFromHistory = true;
    const newState = event.state || { screen: 'home' };

    // 1) If any modal is currently visible and isn't in the new state, close it.
    //    (back consumes the modal entry, no screen change happens.)
    const modals = ['saint-picker', 'hearth-gestures', 'diary-history-modal'];
    let modalClosed = false;
    for (const m of modals) {
      const el = document.getElementById(m);
      if (el && !el.classList.contains('hidden') && newState.modal !== m) {
        el.classList.add('hidden');
        modalClosed = true;
      }
    }

    // 2) If only a modal closed and the screen is the same, do nothing more.
    const currentVisible = Array.from(document.querySelectorAll('.screen.visible')).map(s => s.id.replace(/^screen-/, ''))[0];
    if (modalClosed && currentVisible === newState.screen) {
      __navFromHistory = false;
      return;
    }

    // 3) Navigate to the screen the new state describes.
    _renderScreen(newState.screen || 'home');
    __navFromHistory = false;
  });

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
      const litLine = lit ? capitalize(lit.season || 'ordinary') + ' season' : '';
      document.getElementById('liturgical-line').textContent = litLine;

      // Today in the Church: one composite card showing the day's character.
      const s = today.saint;
      const headline = today.headline || (s ? s.name : 'Today');
      const rankBadge = today.kind && today.kind !== 'ordinary' && today.kind !== 'season'
        ? '<span class="rank-badge rank-' + escape(today.kind) + '">' + escape(today.kind) + '</span>'
        : '';
      const headingHtml = s
        ? '<h3 class="saint-link" data-saint-slug="' + escape(s.slug) + '">' + escape(headline) + '</h3>'
        : '<h3>' + escape(headline) + '</h3>';
      let composite = '<div class="today-headline">' + rankBadge + headingHtml + '</div>';
      if (s) {
        composite += '<p class="today-brief">' + escape(s.brief || '') + '</p>';
        if (s.key_quote) composite += '<p class="today-quote">"' + escape(s.key_quote) + '"<span class="muted small"> &mdash; ' + escape(s.name) + '</span></p>';
      }
      if (lit && lit.gospel_ref) {
        composite += '<div class="today-gospel">';
        composite += '<span class="muted small">Gospel today</span> <strong>' + escape(lit.gospel_ref) + '</strong>';
        if (lit.gospel_question) composite += '<p class="gospel-question">' + escape(lit.gospel_question) + '</p>';
        composite += '</div>';
      }
      const homeCard = document.getElementById('home-saint');
      homeCard.innerHTML = composite;
      // Make the saint headline tappable to open the saint profile.
      const link = homeCard.querySelector('.saint-link');
      if (link && window.HoursUI && HoursUI.openSaintProfile) {
        link.addEventListener('click', () => HoursUI.openSaintProfile(link.dataset.saintSlug));
      }

      // Render the "Pray Without Ceasing" 2x3 grid with gift labels and next-due highlight.
      renderHoursGrid(today);
    } catch (e) {}

    try {
      const w = await api.get('/api/walk/today');
      // rosary mystery set name surfaces inside the Hours grid card subtitle
      window.__rosarySetLabel = capitalize(w.mystery_set) + ' Mysteries';
    } catch {}

    try {
      const pr = await api.get('/api/hearth/presence');
      const me = api.user();
      document.getElementById('presence-row').innerHTML = pr.members.map(m => {
        const active = (m.rosaries_today || 0) > 0 || (m.hours_today || 0) > 0;
        const isMe = me && m.id === me.id;
        const avatar = window.Avatars ? Avatars.avatarHTML(m, { size: 56 }) : '';
        return `<div class="presence-dot ${active ? 'active' : ''}${isMe ? ' me clickable-self' : ''}" data-self="${isMe ? '1' : '0'}">
          ${avatar}
          <div class="label">${escape((m.display_name || '').split(' ')[0])}${isMe ? ' <span class="muted small">(tap to change)</span>' : ''}</div>
          <div class="streak">${m.streak_days ? '🕯 ' + m.streak_days : ''}</div>
        </div>`;
      }).join('');
      // Own dot opens the saint picker.
      document.querySelectorAll('#presence-row .clickable-self').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => global.SaintPicker && SaintPicker.open());
      });
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

  // The six Hours, in order. Each carries its hour_log key, its opener, and its gift phrase.
  const HOURS = [
    { key: 'morning_time',    short: 'Morning',     full: 'Morning Offering',     log_key: 'morning_offering', opener: 'openMorning',    gift: 'Offered the day',           cta: 'Offer the day before the day takes you.' },
    { key: 'midmorning_time', short: 'Mid-Morning', full: 'Mid-Morning Prayer',   log_key: 'reading',          opener: 'openMidMorning', gift: 'Consecrated the work hour', cta: 'Give him this hour of work.' },
    { key: 'angelus_time',    short: 'Angelus',     full: 'Angelus',              log_key: 'angelus',          opener: 'openAngelus',    gift: 'Welcomed the Word at noon', cta: 'Pause where you are. The Word was made flesh.' },
    { key: 'mercy_time',      short: 'Mercy',       full: 'Hour of Divine Mercy', log_key: 'reading',          opener: 'openMercy',      gift: 'Begged mercy at three',     cta: 'It is the hour he died for you.' },
    { key: 'rosary_time',     short: 'Rosary',      full: 'Family Rosary',        log_key: 'rosary',           opener: null,             gift: null,                        cta: 'Whom will you name today?' },
    { key: 'night_time',      short: 'Night',       full: 'Night Prayer & Examen', log_key: 'examen',          opener: 'openNight',      gift: 'Examined the day',          cta: 'Sleep in him. He keeps watch.' }
  ];

  let __schedCache = null;
  async function loadSched() {
    if (__schedCache) return __schedCache;
    try { __schedCache = (await api.get('/api/family/schedule')).schedule; } catch { __schedCache = null; }
    return __schedCache;
  }

  function minutesUntilHHMM(target) {
    if (!target) return Infinity;
    const [h, m] = target.split(':').map(Number);
    const now = new Date();
    const t = new Date(now); t.setHours(h, m, 0, 0);
    if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
    return Math.round((t.getTime() - now.getTime()) / 60000);
  }
  function fmtCountdown(mins) {
    if (mins < 60) return 'in ' + mins + 'm';
    const h = Math.floor(mins / 60), m = mins % 60;
    return 'in ' + h + 'h' + (m ? ' ' + m + 'm' : '');
  }

  async function renderHoursGrid(today) {
    const grid = document.getElementById('hours-grid');
    if (!grid) return;
    const sched = await loadSched();
    const done = today.done || {};

    let bestIdx = -1, bestMins = Infinity;
    const cells = HOURS.map((h, i) => {
      const time = sched ? sched[h.key] : null;
      const mins = minutesUntilHHMM(time);
      if (mins < bestMins) { bestMins = mins; bestIdx = i; }
      return { hour: h, time, mins };
    });

    grid.innerHTML = cells.map((c, i) => {
      const h = c.hour;
      const prayedToday = (done[h.log_key] && done[h.log_key].count > 0);
      // The "gift" sentence replaces the time when it's been prayed today.
      let subtitle;
      if (prayedToday) subtitle = '<span class="hour-gift">' + escape(h.gift || 'Prayed today') + '</span>';
      else if (h.key === 'rosary_time' && window.__rosarySetLabel) subtitle = escape(c.time || '—') + ' &middot; ' + escape(window.__rosarySetLabel);
      else subtitle = escape(c.time || '—');
      const nextDue = i === bestIdx ? ' next-due' : '';
      const prayedCls = prayedToday ? ' prayed' : '';
      return `<button class="hour-card${nextDue}${prayedCls}" data-opener="${escape(h.opener || '')}" data-screen="${escape(h.opener ? '' : 'walk-launch')}">
        <div class="hour-name">${escape(h.short)}</div>
        <div class="hour-sub muted small">${subtitle}</div>
      </button>`;
    }).join('');

    grid.querySelectorAll('.hour-card').forEach(b => b.addEventListener('click', () => {
      const op = b.dataset.opener;
      const sc = b.dataset.screen;
      if (op && window.HoursUI && typeof HoursUI[op] === 'function') HoursUI[op]();
      else if (sc) showScreen(sc);
    }));

    // Subtle call to action below the grid - keyed to the next-due hour.
    const cta = document.getElementById('hours-cta');
    if (cta && bestIdx >= 0) {
      const h = HOURS[bestIdx];
      cta.innerHTML = '<em>' + escape(h.cta) + '</em> <span class="muted small">&middot; ' + escape(h.full) + ' ' + escape(fmtCountdown(bestMins)) + '</span>';
    }
  }

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

    // (Build chip text + tap-to-reset are wired in the inline updater script
    //  in index.html, which has direct access to document.documentElement.dataset.build.
    //  See the STALE-PROOF UPDATE PIPELINE block at the bottom of index.html.)
    document.getElementById('btn-go-register').addEventListener('click', () => showScreen('onboard'));
    document.getElementById('btn-onboard-back').addEventListener('click', () => showScreen('login'));

    // Legacy card-morning / card-rosary / card-night were replaced by the
    // "Pray Without Ceasing" Hours grid (rendered by renderHoursGrid). Wire only
    // if they exist - so the boot does not crash on missing elements.
    const wireOpt = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    wireOpt('card-morning', () => HoursUI.openMorning());
    wireOpt('card-rosary',  () => showScreen('walk-launch'));
    wireOpt('card-night',   () => HoursUI.openNight());

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
    if (global.ScheduleUI) ScheduleUI.init();
    if (global.SaintPicker) SaintPicker.init();

    // Tap own name in topbar -> open picker.
    document.querySelectorAll('.who #who-name, .topbar #who-name').forEach(el => {
      el.style.cursor = 'pointer';
      el.title = 'Choose your patron saint';
      el.addEventListener('click', () => global.SaintPicker && SaintPicker.open());
    });

    // Splash -> next screen.
    // Honor a ?screen=<key> deep link (used by prayer push notifications) so
    // tapping a "Time for the Angelus" notification opens straight to the Angelus screen.
    setTimeout(() => {
      const params = new URLSearchParams(location.search);
      const deepScreen = params.get('screen');
      // Replace splash with the appropriate root - so the very first back press
      // exits the app, not falls back into the splash.
      if (!api.token()) { showScreen('login', { replace: true }); return; }
      const deepLinkHandlers = {
        morning:    () => HoursUI.openMorning(),
        midmorning: () => HoursUI.openMidMorning(),
        angelus:    () => HoursUI.openAngelus(),
        mercy:      () => HoursUI.openMercy(),
        night:      () => HoursUI.openNight(),
        'walk-launch': () => showScreen('walk-launch'),
        prayer:     () => showScreen('prayer'),
        hearth:     () => showScreen('hearth')
      };
      // Set the root to home FIRST, then navigate to deep link so back goes to home.
      showScreen('home', { replace: true });
      if (deepScreen && deepLinkHandlers[deepScreen]) {
        deepLinkHandlers[deepScreen]();
        // Clean the ?screen= param so refreshes don't re-deep-link.
        const cleanUrl = location.pathname + (history.state ? '#' + (history.state.screen || '') : '');
        history.replaceState(history.state, '', cleanUrl.replace(/\?[^#]*/, ''));
      }
    }, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
