// JWT auth middleware. Also accepts BUKIDIC tokens passed via ?token= or Authorization header.
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const SECRET = process.env.JWT_SECRET || 'heavenward-manubag-family-deo-gratias-phase-0-9';

// Heavenward is a PRIVATE family app on the family's own devices. There is no
// security reason to ever log a family member out. Behavior change (declared):
//   old: tokens expired after 7d -> whole family had to re-login periodically.
//   new: tokens last 10 years (effectively never), AND verification ignores
//        expiration so any token already issued keeps working - no family
//        re-login is ever forced again.
function sign(user) {
  return jwt.sign(
    { uid: user.id, email: user.email, role: user.role, family_id: user.family_id, name: user.display_name },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '3650d' }
  );
}

function extractToken(req) {
  const h = req.headers['authorization'];
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  if (req.query && req.query.token) return req.query.token;
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'authentication required' });
  try {
    // ignoreExpiration: a family member's device should never be kicked out.
    // Even a token issued under the old 7d policy (now "expired") keeps working,
    // so deploying this fix requires ZERO re-logins across the family.
    const payload = jwt.verify(token, SECRET, { ignoreExpiration: true });
    const user = db.prepare('SELECT id,email,display_name,role,family_id,patron_saint_slug,age_tier,vocation,streak_days FROM users WHERE id = ?').get(payload.uid);
    if (!user) return res.status(401).json({ error: 'user not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

function requireParent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'tatay' && req.user.role !== 'nanay') {
      return res.status(403).json({ error: 'tatay or nanay only' });
    }
    next();
  });
}

module.exports = { sign, extractToken, requireAuth, requireParent, SECRET };
