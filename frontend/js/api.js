// API helper with JWT support stored in localStorage.
(function (global) {
  const TOKEN_KEY = 'heavenward.token';
  const USER_KEY  = 'heavenward.user';

  function token() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }
  function user() { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
  function setUser(u) { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); }

  async function call(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) headers['Authorization'] = 'Bearer ' + t;
    const res = await fetch(path, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined
    });
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      // A 401 means the stored token is genuinely no longer valid (e.g. the
      // account was removed). Rather than leave the page blank and "broken",
      // clear the dead token and send the user cleanly to the login screen.
      if (res.status === 401 && t) {
        try { setToken(null); setUser(null); } catch {}
        if (typeof window !== 'undefined' && window.showScreen) {
          try { window.showScreen('login', { replace: true }); } catch {}
          try { window.toast && window.toast('Please sign in again.'); } catch {}
        }
      }
      const err = new Error((data && data.error) || ('HTTP ' + res.status));
      err.status = res.status;
      err.detail = data && data.detail;
      throw err;
    }
    return data;
  }

  global.api = {
    token, setToken, user, setUser,
    get:  (p)    => call('GET',  p),
    post: (p, b) => call('POST', p, b || {}),
    put:  (p, b) => call('PUT',  p, b || {}),
    del:  (p)    => call('DELETE', p)
  };
})(window);
