// Web Push subscribe / unsubscribe routes.
const express = require('express');
const webpush = require('web-push');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

router.get('/vapid-public', (req, res) => {
  if (!VAPID_PUBLIC) return res.status(500).json({ error: 'VAPID not configured' });
  return res.json({ key: VAPID_PUBLIC });
});

router.post('/subscribe', requireAuth, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'endpoint and keys.p256dh + keys.auth required' });
  }
  const ua = (req.headers['user-agent'] || '').slice(0, 240);
  const existing = db.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?').get(endpoint);
  if (existing) {
    db.prepare('UPDATE push_subscriptions SET user_id = ?, family_id = ?, p256dh = ?, auth = ?, user_agent = ? WHERE id = ?')
      .run(req.user.id, req.user.family_id, keys.p256dh, keys.auth, ua, existing.id);
    return res.json({ ok: true, id: existing.id, replaced: true });
  }
  const r = db.prepare('INSERT INTO push_subscriptions (user_id,family_id,endpoint,p256dh,auth,user_agent) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, req.user.family_id, endpoint, keys.p256dh, keys.auth, ua);
  return res.json({ ok: true, id: r.lastInsertRowid });
});

router.post('/unsubscribe', requireAuth, (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  const r = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').run(endpoint, req.user.id);
  return res.json({ ok: true, removed: r.changes });
});

// Send a test push to all the current user's devices. Useful for verifying.
router.post('/test', requireAuth, async (req, res) => {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.status(500).json({ error: 'VAPID not configured' });
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(req.user.id);
  if (!subs.length) return res.status(404).json({ error: 'no subscriptions for this user' });
  const payload = JSON.stringify({
    title: 'Heavenward - test',
    body: 'If you can read this, push notifications are working. Soli Deo gloria.',
    url: '/'
  });
  const results = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      results.push({ id: s.id, ok: true });
    } catch (e) {
      results.push({ id: s.id, ok: false, status: e.statusCode, body: String(e.body || '') });
      if (e.statusCode === 404 || e.statusCode === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id);
      }
    }
  }
  return res.json({ sent: subs.length, results });
});

router.get('/my-subscriptions', requireAuth, (req, res) => {
  const subs = db.prepare('SELECT id, user_agent, created_at, last_pushed_at FROM push_subscriptions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  return res.json({ subscriptions: subs });
});

module.exports = router;
