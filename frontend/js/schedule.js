// Family prayer schedule: editor + clock-watcher + banner + notification + bell.
// Fires when the app is open (any tab). Web Push (sleeping device) is Phase 1.
(function (global) {
  const PRAYERS = [
    { key: 'morning_time',    label: 'Morning Offering',       screen: 'morning',     opener: 'openMorning'    },
    { key: 'midmorning_time', label: 'Mid-Morning Prayer',     screen: 'midmorning',  opener: 'openMidMorning' },
    { key: 'angelus_time',    label: 'Angelus',                screen: 'angelus',     opener: 'openAngelus'    },
    { key: 'mercy_time',      label: 'Hour of Divine Mercy',   screen: 'mercy',       opener: 'openMercy'      },
    { key: 'rosary_time',     label: 'Family Rosary',          screen: 'walk-launch', opener: null             },
    { key: 'night_time',      label: 'Night Prayer & Examen',  screen: 'night',       opener: 'openNight'      }
  ];

  let scheduleCache = null;
  let firedToday = new Set();   // set of "YYYY-MM-DD|key" so we only fire once per day per prayer
  let nextTick = null;
  let bannerForKey = null;

  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
  function isParent() { const u = api.user(); return u && (u.role === 'tatay' || u.role === 'nanay'); }

  async function loadSchedule() {
    try {
      const r = await api.get('/api/family/schedule');
      scheduleCache = r.schedule;
      return scheduleCache;
    } catch (e) { return null; }
  }

  function fillEditor(s) {
    const form = document.getElementById('form-schedule');
    if (!form || !s) return;
    form.morning_time.value     = s.morning_time     || '06:00';
    if (form.midmorning_time)    form.midmorning_time.value  = s.midmorning_time  || '09:00';
    form.angelus_time.value     = s.angelus_time     || '12:00';
    if (form.mercy_time)         form.mercy_time.value       = s.mercy_time       || '15:00';
    form.rosary_time.value      = s.rosary_time      || '18:00';
    form.night_time.value       = s.night_time       || '21:00';
    form.active.checked         = !!s.active;
  }

  async function refreshEditor() {
    const card = document.getElementById('prayer-schedule-card');
    if (!card) return;
    card.classList.toggle('hidden', !isParent());
    if (!isParent()) return;
    const s = await loadSchedule();
    fillEditor(s);
    updateNotifState();
  }

  function updateNotifState() {
    const el = document.getElementById('schedule-notif-state');
    if (!el) return;
    if (!('Notification' in window)) { el.textContent = 'This browser does not support notifications.'; return; }
    if (Notification.permission === 'granted') el.textContent = 'Notifications are on for this device.';
    else if (Notification.permission === 'denied') el.textContent = 'Notifications are blocked. Enable them in your browser/site settings.';
    else el.textContent = 'Notifications: not yet allowed. Save the rhythm to be prompted.';

    // iOS hint: Safari only delivers push to home-screen installed PWAs.
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hint = document.getElementById('ios-install-hint');
    if (hint) hint.classList.toggle('hidden', !(isIOS && !isStandalone));
  }

  // PHT calendar day (yyyy-mm-dd). Used as an idempotency key for the schedule
  // banner so a single banner only fires once per Cebu day, never UTC midnight.
  function todayKey() {
    const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }

  function nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function minutesUntil(targetHHMM) {
    const [th, tm] = targetHHMM.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(th, tm, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    return Math.round((target.getTime() - now.getTime()) / 60000);
  }

  function findNext(s) {
    if (!s) return null;
    let best = null;
    for (const p of PRAYERS) {
      const t = s[p.key];
      if (!t) continue;
      const m = minutesUntil(t);
      if (best === null || m < best.minutes) best = { prayer: p, time: t, minutes: m };
    }
    return best;
  }

  function fmtCountdown(mins) {
    if (mins < 60) return mins + 'm';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h + 'h ' + (m ? m + 'm' : '');
  }

  async function renderHomeNextPrayer() {
    const card = document.getElementById('home-next-prayer');
    if (!card) return;
    if (!scheduleCache) await loadSchedule();
    const s = scheduleCache;
    if (!s || !s.active) { card.classList.add('hidden'); return; }
    const n = findNext(s);
    if (!n) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    card.innerHTML =
      '<h4>Next: ' + escape(n.prayer.label) + '</h4>' +
      '<p class="muted small">at ' + escape(n.time) + ' &middot; in ' + fmtCountdown(n.minutes) + '</p>';
    card.style.cursor = 'pointer';
    card.onclick = () => openPrayer(n.prayer);
  }

  // Open a prayer screen by its full opener function when available, so the
  // screen renders its content (Angelus text, etc) - not just the empty shell.
  function openPrayer(prayer) {
    if (prayer.opener && window.HoursUI && typeof HoursUI[prayer.opener] === 'function') {
      HoursUI[prayer.opener]();
    } else {
      global.showScreen(prayer.screen);
    }
  }

  // Banner + notification + bell
  function fireBanner(prayer, timeStr) {
    bannerForKey = prayer.key;
    const banner = document.getElementById('prayer-banner');
    if (!banner) return;
    document.getElementById('prayer-banner-title').textContent = 'Time for the ' + prayer.label + '.';
    document.getElementById('prayer-banner-sub').textContent = 'Family prayer at ' + timeStr + '. Begin together.';
    banner.classList.remove('hidden');
    if (global.HwAudio) HwAudio.bell(1.2);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('Heavenward — ' + prayer.label, {
          body: 'It is ' + timeStr + '. Let us pray together.',
          tag: 'heavenward-' + prayer.key + '-' + todayKey(),
          requireInteraction: false,
          silent: false
        });
        n.onclick = () => { window.focus(); global.showScreen(prayer.screen); n.close(); };
      } catch (e) { /* ignore */ }
    }
    // auto-dismiss banner after 5 min
    setTimeout(() => { if (bannerForKey === prayer.key) dismissBanner(); }, 5 * 60 * 1000);
  }

  function dismissBanner() {
    bannerForKey = null;
    const banner = document.getElementById('prayer-banner');
    if (banner) banner.classList.add('hidden');
  }

  // Returns prayer object if we are at or just past a scheduled time and have not fired it today.
  // Window: 0 to 5 minutes past the scheduled time, so a missed tick still surfaces.
  function dueNow(s) {
    if (!s || !s.active) return null;
    const now = new Date();
    const day = todayKey();
    for (const p of PRAYERS) {
      const t = s[p.key];
      if (!t) continue;
      const [h, m] = t.split(':').map(Number);
      const scheduled = new Date(now); scheduled.setHours(h, m, 0, 0);
      const diffMin = (now.getTime() - scheduled.getTime()) / 60000;
      if (diffMin >= 0 && diffMin <= 5) {
        const k = day + '|' + p.key;
        if (!firedToday.has(k)) {
          firedToday.add(k);
          return p;
        }
      }
    }
    return null;
  }

  async function tick() {
    try {
      const s = scheduleCache || await loadSchedule();
      if (s) {
        const due = dueNow(s);
        if (due) fireBanner(due, s[due.key]);
      }
      renderHomeNextPrayer();
    } catch {}
  }

  function startClock() {
    if (nextTick) return;
    tick();
    nextTick = setInterval(tick, 30 * 1000); // every 30 seconds
  }

  async function requestNotifPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }
    updateNotifState();
    if (Notification.permission === 'granted') {
      // Permission granted - subscribe this device for server-side push so notifications
      // continue to fire even when the app is closed.
      try { await subscribePush(); } catch (e) { console.error('push subscribe failed', e); }
    }
    return Notification.permission;
  }

  function urlBase64ToUint8Array(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  async function subscribePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const r = await api.get('/api/push/vapid-public');
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(r.key)
      });
    }
    const json = sub.toJSON();
    await api.post('/api/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
    return sub;
  }

  async function sendTestPush() {
    try {
      const r = await api.post('/api/push/test', {});
      toast('Test push sent to ' + r.sent + ' device(s).');
    } catch (e) { toast(e.message || 'Test failed.'); }
  }

  function init() {
    const form = document.getElementById('form-schedule');
    if (form) {
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const body = {
          morning_time: fd.get('morning_time'),
          angelus_time: fd.get('angelus_time'),
          rosary_time:  fd.get('rosary_time'),
          night_time:   fd.get('night_time'),
          active: fd.get('active') === 'on'
        };
        try {
          const r = await api.put('/api/family/schedule', body);
          scheduleCache = r.schedule;
          firedToday = new Set();
          toast('Family rhythm saved. The bell will sound.');
          await requestNotifPermission();
          renderHomeNextPrayer();
        } catch (e) { toast(e.message || 'Could not save the rhythm.'); }
      });
    }

    const banner = document.getElementById('prayer-banner');
    if (banner) {
      document.getElementById('prayer-banner-open').addEventListener('click', () => {
        const p = PRAYERS.find(x => x.key === bannerForKey);
        dismissBanner();
        if (p) openPrayer(p);
      });
      document.getElementById('prayer-banner-dismiss').addEventListener('click', dismissBanner);
    }

    // Register the service worker (push receiver + offline cache).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(e => console.warn('SW register failed:', e));
    }

    // Test-push button (only renders if the API succeeds).
    const tb = document.getElementById('btn-test-push');
    if (tb) tb.addEventListener('click', sendTestPush);

    // Best-effort permission request as soon as the user is signed in.
    if (api.user()) {
      requestNotifPermission();
      startClock();
    } else {
      // Defer until a login event from app.js by polling token presence briefly.
      const wait = setInterval(() => {
        if (api.user()) {
          clearInterval(wait);
          requestNotifPermission();
          startClock();
        }
      }, 1000);
    }
  }

  global.ScheduleUI = {
    init, loadSchedule, refreshEditor, renderHomeNextPrayer, requestNotifPermission,
    subscribePush, sendTestPush,
    _debug: () => ({
      scheduleCache, firedToday: Array.from(firedToday),
      tickRunning: !!nextTick, bannerForKey
    }),
    _forceTick: tick
  };
})(window);
