// The Whisper - the interior life.
// Five sections: You are carried / Today's Word + Letter to God / A teaching to live /
// Your moments today / Stained-glass moment picker.
// The original moment-disc -> color wash -> Whisper display flow is preserved (logMoment).
(function (global) {
  const PILL_KEY = 'heavenward.moment.pill';
  const DIARY_DRAFT_KEY = 'heavenward.diary.draft';
  let last = null;
  let activeColor = null;
  let __wordCache = null;       // { verse:{ref,text}, prompt }
  let __teachingCache = null;   // { teaching:{...} }

  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  function setPill(moment) {
    if (!moment) return;
    activeColor = moment.color;
    const pill = document.getElementById('moment-pill');
    const picker = document.getElementById('moment-picker');
    if (!pill || !picker) return;
    document.getElementById('pill-glass').style.background =
      'radial-gradient(circle at 35% 30%, ' + lighten(moment.color, 25) + ' 0%, ' + moment.color + ' 60%, ' + darken(moment.color, 15) + ' 100%)';
    document.getElementById('pill-echo').textContent = moment.echo;
    pill.style.borderColor = moment.color;
    pill.style.background = withAlpha(moment.color, 0.07);
    pill.classList.remove('hidden');
    picker.classList.add('hidden');
    try { localStorage.setItem(PILL_KEY, JSON.stringify({ key: moment.key, ts: Date.now() })); } catch {}
  }

  function showPicker() {
    document.getElementById('moment-pill').classList.add('hidden');
    document.getElementById('moment-picker').classList.remove('hidden');
  }

  function restorePillFromStorage() {
    try {
      const raw = localStorage.getItem(PILL_KEY);
      if (!raw) return;
      const { key, ts } = JSON.parse(raw);
      if (!ts || (Date.now() - ts) > 16 * 60 * 60 * 1000) { localStorage.removeItem(PILL_KEY); return; }
      const m = Moments.BY_KEY[key];
      if (m) setPill(m);
    } catch {}
  }

  // Hex color helpers
  function clamp(n) { return Math.max(0, Math.min(255, n)); }
  function parseHex(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function toHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join(''); }
  function lighten(hex, amt) { const [r, g, b] = parseHex(hex); return toHex(r + amt, g + amt, b + amt); }
  function darken(hex, amt)  { const [r, g, b] = parseHex(hex); return toHex(r - amt, g - amt, b - amt); }
  function withAlpha(hex, a) { const [r, g, b] = parseHex(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }

  async function logMoment(momentKey, freeText) {
    const moment = Moments.BY_KEY[momentKey] || null;
    if (moment) washColor(moment.color);
    try {
      const w = await api.post('/api/whisper/log', { moment_type: momentKey, free_text: freeText || null });
      render(w, moment);
      showScreen('whisper-display');
    } catch (e) {
      toast('Could not load a whisper. ' + (e.message || ''));
    }
  }

  function washColor(color) {
    const screen = document.getElementById('screen-whisper-display');
    if (!screen) return;
    screen.style.background = 'linear-gradient(180deg, ' + withAlpha(color, 0.22) + ' 0%, ' + withAlpha(color, 0.06) + ' 60%, var(--cream) 100%)';
    const saintBlock = screen.querySelector('.whisper-saint');
    if (saintBlock) saintBlock.style.borderLeftColor = color;
    const ref = screen.querySelector('#w-ref');
    if (ref) ref.style.color = darken(color, 30);
  }

  function render(w, moment) {
    last = w;
    document.getElementById('w-scripture').textContent = w.scripture.text;
    document.getElementById('w-ref').textContent = w.scripture.ref;
    document.getElementById('w-saint-name').textContent = w.saint.name;
    document.getElementById('w-saint-text').textContent = w.saint.text;
    document.getElementById('w-truth').textContent = w.truth;
    window.__lastMoment = moment || null;
  }

  // ============================================================
  // 1) You are carried - load + render
  // ============================================================
  function relativeWhen(iso) {
    if (!iso) return '';
    const t = new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime();
    if (isNaN(t)) return '';
    const d = (Date.now() - t) / 1000;
    if (d < 60)    return 'just now';
    if (d < 3600)  return Math.floor(d / 60) + 'm ago';
    if (d < 86400) return Math.floor(d / 3600) + 'h ago';
    return Math.floor(d / 86400) + 'd ago';
  }

  async function loadCarried() {
    const box = document.getElementById('carried-list');
    if (!box) return;
    try {
      const r = await api.get('/api/whisper/carried-for-me');
      const list = r.carried || [];
      if (!list.length) {
        box.innerHTML = '<p class="muted small empty-line">No prayers offered for you yet today. Tomorrow is another day, and you are still held.</p>';
        return;
      }
      box.innerHTML = list.map(c => {
        const slug = c.from_slug || 'cross';
        const glyph = (window.Avatars && Avatars.SAINT_TO_GLYPH[slug]) || 'cross';
        const av = '<span class="carried-avatar">' + (window.Avatars ? Avatars.svg(glyph) : '') + '</span>';
        return '<div class="carried-row">' +
          av +
          '<div class="carried-body">' +
            '<div class="carried-text">' + escape(c.text || '') + '</div>' +
            '<div class="carried-when muted small">' + escape(relativeWhen(c.at)) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      box.innerHTML = '<p class="muted small">Could not load right now.</p>';
    }
  }

  // ============================================================
  // 2) Today's Word + Letter to God (diary)
  // ============================================================
  function todayHuman() {
    const d = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[d.getMonth()] + ' ' + d.getDate();
  }

  // The diary privacy line. Tailored to who is reading:
  //   - parents (tatay/nanay) ARE the parents, so we don't say "not Tatay/Nanay"
  //   - children call them Mommy/Daddy in this family, so the child-facing line uses those words
  //   - grandparents/other adults get the simple parent-free line
  function privacyLineFor(user) {
    const role = user && user.role;
    if (role === 'child') {
      return 'Only you can read this. Not Mommy, not Daddy, not the family. <em>Just him.</em>';
    }
    return 'Only you can read this. Not your family. <em>Just him.</em>';
  }

  async function loadTodayWord() {
    const ref = document.getElementById('word-ref');
    const verse = document.getElementById('word-verse');
    const dateEl = document.getElementById('word-date');
    const promptEl = document.getElementById('word-prompt');
    if (!ref || !verse) return;
    dateEl.textContent = todayHuman();
    const privLine = document.getElementById('diary-privacy-line');
    if (privLine) privLine.innerHTML = privacyLineFor(api.user());
    try {
      __wordCache = await api.get('/api/whisper/today-word');
      verse.textContent = '"' + (__wordCache.verse.text || '') + '"';
      ref.textContent = __wordCache.verse.ref || '';
      promptEl.textContent = __wordCache.prompt || '';
    } catch (e) {
      verse.textContent = '"Be still, and know that I am God."';
      ref.textContent = 'Psalm 46:10';
      promptEl.textContent = 'Letter to God - what do you want to tell him today?';
    }
    // Load today's diary entry if exists, else restore draft
    try {
      const r = await api.get('/api/whisper/diary/today');
      const t = document.getElementById('diary-body');
      const status = document.getElementById('diary-status');
      if (r.entry && r.entry.body) {
        t.value = r.entry.body;
        t.dataset.entryId = r.entry.id;
        status.textContent = 'Saved earlier today. Edit and re-send to update.';
      } else {
        const draft = localStorage.getItem(DIARY_DRAFT_KEY);
        if (draft) { t.value = draft; status.textContent = 'A draft from earlier - not yet sent.'; }
        else status.textContent = '';
      }
    } catch {}
  }

  async function saveDiary() {
    const t = document.getElementById('diary-body');
    const status = document.getElementById('diary-status');
    const body = (t.value || '').trim();
    if (!body) { status.textContent = 'Write something for him, even one sentence.'; return; }
    try {
      const payload = {
        body,
        verse_ref:  __wordCache && __wordCache.verse  ? __wordCache.verse.ref  : null,
        verse_text: __wordCache && __wordCache.verse  ? __wordCache.verse.text : null,
        prompt:     __wordCache ? __wordCache.prompt : null
      };
      if (t.dataset.entryId) {
        await api.put('/api/whisper/diary/' + t.dataset.entryId, { body });
        status.textContent = 'Letter updated. He has received it.';
      } else {
        const r = await api.post('/api/whisper/diary', payload);
        t.dataset.entryId = r.id;
        status.textContent = 'Letter sent. He has received it.';
      }
      localStorage.removeItem(DIARY_DRAFT_KEY);
      toast('He heard you.');
    } catch (e) {
      status.textContent = 'Could not save. We kept your draft.';
    }
  }

  function autosaveDraft() {
    const t = document.getElementById('diary-body');
    if (!t) return;
    if (t.dataset.entryId) return; // already on server; do not double-store
    const v = (t.value || '').trim();
    if (v) try { localStorage.setItem(DIARY_DRAFT_KEY, v); } catch {}
    else   try { localStorage.removeItem(DIARY_DRAFT_KEY); } catch {}
  }

  async function openDiaryHistory() {
    const modal = document.getElementById('diary-history-modal');
    const list  = document.getElementById('diary-history-list');
    if (!modal || !list) return;
    list.innerHTML = '<p class="muted small">Loading...</p>';
    modal.classList.remove('hidden');
    if (global.openModalState) global.openModalState('diary-history-modal');
    try {
      const r = await api.get('/api/whisper/diary?limit=50');
      const entries = r.entries || [];
      if (!entries.length) {
        list.innerHTML = '<p class="muted small empty-line">No letters yet. Today is a good day to begin.</p>';
        return;
      }
      list.innerHTML = entries.map(e => {
        return '<div class="diary-entry">' +
          '<div class="diary-entry-head"><strong>' + escape(e.entry_date || '') + '</strong>' +
            (e.verse_ref ? ' <span class="muted small">&middot; ' + escape(e.verse_ref) + '</span>' : '') +
            ' <button class="link small diary-del" data-id="' + e.id + '">delete</button>' +
          '</div>' +
          (e.verse_text ? '<p class="muted small diary-entry-verse">"' + escape(e.verse_text) + '"</p>' : '') +
          '<p class="diary-entry-body">' + escape(e.body) + '</p>' +
        '</div>';
      }).join('');
      list.querySelectorAll('.diary-del').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Delete this letter? This cannot be undone.')) return;
        try { await api.del('/api/whisper/diary/' + b.dataset.id); openDiaryHistory(); } catch {}
      }));
    } catch (e) {
      list.innerHTML = '<p class="muted small">Could not load right now.</p>';
    }
  }
  function closeDiaryHistory() {
    if (global.closeModalState && history.state && history.state.modal === 'diary-history-modal') {
      global.closeModalState('diary-history-modal');
    } else {
      document.getElementById('diary-history-modal').classList.add('hidden');
    }
  }

  // ============================================================
  // 3) A teaching to live
  // ============================================================
  const TEACHING_LABEL = { gift: 'Gift of the Holy Spirit', fruit: 'Fruit of the Holy Spirit', work: 'Work of Mercy', beatitude: 'Beatitude' };
  async function loadTeaching() {
    const titleEl = document.getElementById('teaching-title');
    const kindEl  = document.getElementById('teaching-kind');
    const srcEl   = document.getElementById('teaching-source');
    const teachEl = document.getElementById('teaching-teach');
    const moveEl  = document.getElementById('teaching-move');
    if (!titleEl) return;
    try {
      __teachingCache = await api.get('/api/whisper/teaching');
      const t = __teachingCache.teaching;
      titleEl.textContent = t.title || '';
      kindEl.textContent  = TEACHING_LABEL[t.kind] || '';
      srcEl.textContent   = t.source || '';
      teachEl.textContent = t.teach || '';
      moveEl.innerHTML    = '<em>Today: </em>' + escape(t.move || '');
    } catch (e) {
      titleEl.textContent = 'Peace';
      teachEl.textContent = 'Peace is what remains when worry has been handed back to God.';
      moveEl.innerHTML    = '<em>Today: </em>When anxious, breathe and say: "Jesus, I trust in you."';
    }
  }

  // ============================================================
  // 4) Your moments today
  // ============================================================
  async function loadMyMoments() {
    const box = document.getElementById('mine-list');
    if (!box) return;
    try {
      const r = await api.get('/api/whisper/my-moments-today');
      const list = r.moments || [];
      if (!list.length) {
        box.innerHTML = '<p class="muted small empty-line">Tap a color below to begin.</p>';
        return;
      }
      box.innerHTML = list.map(m => {
        const meta = window.Moments && Moments.BY_KEY[m.moment_type];
        const color = meta ? meta.color : '#888';
        const label = meta ? meta.label : (m.moment_type || '');
        const echo  = meta ? meta.echo  : '';
        return '<div class="mine-row" style="border-left-color:' + color + '">' +
          '<span class="mine-disc" style="background:' + color + '"></span>' +
          '<div class="mine-body">' +
            '<strong>' + escape(label) + '</strong>' +
            (echo ? ' <span class="muted small">&middot; ' + escape(echo) + '</span>' : '') +
            '<div class="muted small">' + escape(relativeWhen(m.logged_at)) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      box.innerHTML = '';
    }
  }

  // Public: refresh the whole Whisper screen.
  async function refresh() {
    await Promise.all([
      loadCarried(),
      loadTodayWord(),
      loadTeaching(),
      loadMyMoments()
    ]);
  }

  function init() {
    // Render the disc rows on Home + Whisper screens from the shared Moments data.
    const homeDiscs    = document.getElementById('moment-discs-home');
    const whisperDiscs = document.getElementById('moment-discs-whisper');
    if (homeDiscs)    homeDiscs.innerHTML    = Moments.discsHTML('home');
    if (whisperDiscs) whisperDiscs.innerHTML = Moments.discsHTML('whisper');

    document.addEventListener('click', (ev) => {
      const disc = ev.target.closest('.moment-disc');
      if (!disc) return;
      const free = (document.getElementById('whisper-free') || {}).value || null;
      logMoment(disc.dataset.moment, free);
    });

    const pill = document.getElementById('moment-pill');
    if (pill) pill.addEventListener('click', showPicker);

    const recv = document.getElementById('btn-whisper-received');
    if (recv) recv.addEventListener('click', () => {
      const m = window.__lastMoment;
      if (m) setPill(m);
      toast(m ? m.echo : 'Received.');
      showScreen('home', { replace: true });
    });
    const dism = document.getElementById('btn-whisper-dismiss');
    if (dism) dism.addEventListener('click', () => {
      const m = window.__lastMoment;
      if (m) setPill(m);
      showScreen('home', { replace: true });
    });

    // Swipe-up dismiss on whisper display.
    let ys = 0;
    const ws = document.getElementById('screen-whisper-display');
    if (ws) {
      ws.addEventListener('touchstart', (e) => { ys = e.touches[0].clientY; });
      ws.addEventListener('touchend', (e) => {
        const dy = ys - (e.changedTouches[0] ? e.changedTouches[0].clientY : ys);
        if (dy > 80) {
          const m = window.__lastMoment;
          if (m) setPill(m);
          showScreen('home', { replace: true });
        }
      });
    }

    // Diary wiring
    const dSave = document.getElementById('diary-save');
    if (dSave) dSave.addEventListener('click', saveDiary);
    const dHist = document.getElementById('diary-history');
    if (dHist) dHist.addEventListener('click', openDiaryHistory);
    const dBody = document.getElementById('diary-body');
    if (dBody) dBody.addEventListener('input', autosaveDraft);

    const histClose    = document.getElementById('diary-history-close');
    if (histClose)    histClose.addEventListener('click', closeDiaryHistory);
    const histBackdrop = document.getElementById('diary-history-backdrop');
    if (histBackdrop) histBackdrop.addEventListener('click', closeDiaryHistory);

    restorePillFromStorage();
  }

  global.WhisperUI = { init, logMoment, setPill, showPicker, refresh };
})(window);
