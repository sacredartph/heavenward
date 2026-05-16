// The Hearth - family presence, feed, candles.
(function (global) {
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }

  function isParent() { const u = api.user(); return u && (u.role === 'tatay' || u.role === 'nanay'); }

  function init() {
    const form = document.getElementById('form-add-member');
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const body = {
        display_name: fd.get('display_name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role'),
        date_of_birth: fd.get('date_of_birth') || null,
        patron_saint_slug: fd.get('patron_saint_slug') || null
      };
      try {
        const r = await api.post('/api/auth/member/add', body);
        const res = document.getElementById('add-member-result');
        res.classList.remove('hidden');
        res.innerHTML =
          '<div class="card" style="border-left:3px solid var(--gold);background:#fffdf6;margin-top:.75rem">' +
          '<h4>' + escape(r.user.display_name) + ' has been added.</h4>' +
          '<p class="muted small">Share these credentials with them:</p>' +
          '<p><strong>Email:</strong> ' + escape(body.email) + '</p>' +
          '<p><strong>Password:</strong> ' + escape(body.password) + '</p>' +
          '<p class="muted small">They sign in at this app with that email and password.</p>' +
          '</div>';
        ev.target.reset();
        toast('Welcome, ' + r.user.display_name + ', to the family.');
        load();
      } catch (e) {
        toast(e.message || 'Could not add member.');
      }
    });
  }

  async function load() {
    const r = await api.get('/api/hearth/presence');
    const f = await api.get('/api/hearth/feed');
    const me = api.user();
    const parent = me && (me.role === 'tatay' || me.role === 'nanay');

    const moodMap = {
      tired:      { color: '#7B8FA1', label: 'Tired' },
      grateful:   { color: '#C9A84C', label: 'Grateful' },
      working:    { color: '#5C7A5C', label: 'Working' },
      struggling: { color: '#8B4A4A', label: 'Struggling' },
      joyful:     { color: '#C9A84C', label: 'Joyful' },
      sick:       { color: '#A0522D', label: 'Sick' },
      angry:      { color: '#8B3A3A', label: 'Angry' },
      afraid:     { color: '#6A5C8B', label: 'Afraid' },
      peaceful:   { color: '#4A7A6A', label: 'Peaceful' },
      loved:      { color: '#8B2E4A', label: 'Loved' },
    };

    const statusColor = {
      now:       '#2D5A3D',
      today:     '#2D5A3D',
      yesterday: '#C9A84C',
      dim:       '#D0CFC4',
    };

    const statusPulse = { now: 'pulse', today: '', yesterday: '', dim: '' };

    function memberCard(m) {
      const initials = (m.display_name || '?').split(' ').map(p => p[0]).slice(0, 2).join('');
      const mood = moodMap[m.last_moment] || null;
      const dotColor = statusColor[m.status] || '#D0CFC4';
      const pulse = statusPulse[m.status] || '';

      if (parent) {
        const moodBorder = mood ? `3px solid ${mood.color}` : '3px solid rgba(26,26,46,0.08)';
        const chips = [];
        if (m.today_offered) chips.push('<span class="hw-chip chip-done">Offered day</span>');
        if ((m.rosaries_today || 0) > 0) chips.push('<span class="hw-chip chip-walk">Walked rosary</span>');
        if (mood) chips.push(`<span class="hw-chip" style="background:${mood.color}22;color:${mood.color}">${mood.label}</span>`);
        if (!m.today_offered && !m.rosaries_today && !mood) chips.push('<span class="hw-chip chip-miss">Not yet today</span>');

        return `<div class="hw-presence-row" style="border-left:${moodBorder}">
          <div class="hw-avatar-wrap">
            <div class="hw-avatar">${initials}</div>
            <div class="hw-status-dot ${pulse}" style="background:${dotColor}"></div>
          </div>
          <div class="hw-member-info">
            <div class="hw-member-name">${escape(m.display_name.split(' ')[0])}</div>
            <div class="hw-chips">${chips.join('')}</div>
            <div class="hw-member-meta">${m.steps_today ? m.steps_today + ' steps today' : ''}</div>
          </div>
          <div class="hw-member-right">
            <div class="hw-streak-num">${m.streak_days || 0}</div>
            <div class="hw-streak-lbl">days</div>
          </div>
        </div>`;
      } else {
        const isMe = m.id === me.id;
        return `<div class="hw-child-dot">
          <div class="hw-child-circle ${m.status === 'dim' ? 'dim' : 'on'}">${initials}</div>
          <div class="hw-child-name">${escape(m.display_name.split(' ')[0])}${isMe ? ' (you)' : ''}</div>
          ${isMe ? `<div class="hw-my-streak">${m.streak_days || 0} days</div>` : ''}
        </div>`;
      }
    }

    let offeredNotice = '';
    if (!parent) {
      const tatay = r.members.find(m => m.role === 'tatay');
      const nanay = r.members.find(m => m.role === 'nanay');
      const notices = [];
      if (tatay && tatay.status !== 'dim') notices.push('Tatay is praying today.');
      if (nanay && nanay.status !== 'dim') notices.push('Nanay is praying today.');
      if (notices.length) offeredNotice = `<div class="hw-notice">${notices.join(' ')}</div>`;
    }

    document.getElementById('hearth-presence').innerHTML = `
      <h3 class="hw-section-title">${parent ? 'Your children today' : 'Our family today'}</h3>
      ${offeredNotice}
      ${parent
        ? '<div class="hw-presence-list">' + r.members.filter(m => m.role !== 'tatay' && m.role !== 'nanay').map(memberCard).join('') + '</div>'
        : '<div class="hw-child-dots">' + r.members.map(memberCard).join('') + '</div>'
      }`;

    if (parent) {
      document.getElementById('hearth-presence').innerHTML += `
        <div class="hw-legend">
          <div class="hw-legend-title">Presence</div>
          <div class="hw-legend-rows">
            <div class="hw-legend-row"><div class="hw-legend-dot pulse" style="background:#2D5A3D"></div><span>Active right now</span></div>
            <div class="hw-legend-row"><div class="hw-legend-dot" style="background:#2D5A3D"></div><span>Active today</span></div>
            <div class="hw-legend-row"><div class="hw-legend-dot" style="background:#C9A84C"></div><span>Active yesterday</span></div>
            <div class="hw-legend-row"><div class="hw-legend-dot" style="background:#D0CFC4"></div><span>Not this week</span></div>
          </div>
          <div class="hw-legend-title" style="margin-top:10px">Mood (left border color)</div>
          <div class="hw-legend-rows">
            ${Object.entries(moodMap).map(([k,v]) => `<div class="hw-legend-row"><div class="hw-legend-dot" style="background:${v.color}"></div><span>${v.label}</span></div>`).join('')}
          </div>
        </div>`;
    }

    document.getElementById('hearth-candles').innerHTML =
      '<h3 class="hw-section-title">Candles lit today</h3>' +
      (r.candles_today.length
        ? r.candles_today.map(c => `<div class="hw-candle-row">&#128367; ${escape(c.full_name)}</div>`).join('')
        : '<p class="muted">No candles yet today.</p>');

    document.getElementById('add-member-card').classList.toggle('hidden', !parent);

    document.getElementById('hearth-feed').innerHTML =
      (f.feed.length ? f.feed.map(p => `
        <div class="hearth-item">
          <strong>${escape(p.author)}</strong>
          <span class="muted small">${escape(p.type)} &middot; ${escape(p.created_at)}</span>
          ${p.content ? '<p>' + escape(p.content) + '</p>' : ''}
        </div>`).join('')
        : '<p class="muted">No posts yet. Pray together and the family hearth will fill.</p>');
  }

  global.HearthUI = { init, load };
})(window);
