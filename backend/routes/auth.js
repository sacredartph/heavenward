// Auth routes: register a family, login, me, BUKIDIC SSO, add member.
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/db');
const { sign, requireAuth, requireParent } = require('../middleware/auth');

const router = express.Router();

function ageTierFromDob(dobStr) {
  if (!dobStr) return 'adult';
  const dob = new Date(dobStr);
  if (isNaN(dob)) return 'adult';
  const ageMs = Date.now() - dob.getTime();
  const yrs = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  if (yrs < 10) return 'child';
  if (yrs < 13) return 'preteen';
  if (yrs < 20) return 'teen';
  if (yrs < 65) return 'adult';
  return 'elderly';
}

router.post('/register', (req, res) => {
  const { family_name, patron_saint_slug, country_code, tatay, nanay } = req.body || {};
  if (!family_name || !tatay || !tatay.email || !tatay.password) {
    return res.status(400).json({ error: 'family_name, tatay.email, tatay.password are required' });
  }
  try {
    const tx = db.transaction(() => {
      const famR = db.prepare('INSERT INTO families (name,patron_saint_slug,country_code) VALUES (?,?,?)')
        .run(family_name, patron_saint_slug || 'lorenzo-ruiz', country_code || 'PH');
      const familyId = famR.lastInsertRowid;

      const tatayHash = bcrypt.hashSync(tatay.password, 10);
      const tatayR = db.prepare('INSERT INTO users (email,display_name,password_hash,role,family_id,patron_saint_slug,date_of_birth,age_tier,vocation) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(tatay.email, tatay.display_name || 'Tatay', tatayHash, 'tatay', familyId, tatay.patron_saint_slug || 'joseph', tatay.date_of_birth || null, ageTierFromDob(tatay.date_of_birth), 'married');
      const tatayId = tatayR.lastInsertRowid;
      db.prepare('UPDATE families SET created_by_user_id = ? WHERE id = ?').run(tatayId, familyId);

      let nanayId = null;
      if (nanay && nanay.email && nanay.password) {
        const nanayHash = bcrypt.hashSync(nanay.password, 10);
        const nanayR = db.prepare('INSERT INTO users (email,display_name,password_hash,role,family_id,patron_saint_slug,date_of_birth,age_tier,vocation) VALUES (?,?,?,?,?,?,?,?,?)')
          .run(nanay.email, nanay.display_name || 'Nanay', nanayHash, 'nanay', familyId, nanay.patron_saint_slug || 'mary', nanay.date_of_birth || null, ageTierFromDob(nanay.date_of_birth), 'married');
        nanayId = nanayR.lastInsertRowid;
      }
      return { familyId, tatayId, nanayId };
    })();

    const user = db.prepare('SELECT id,email,display_name,role,family_id FROM users WHERE id = ?').get(tx.tatayId);
    return res.json({ token: sign(user), user });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email already registered' });
    return res.status(500).json({ error: 'registration failed', detail: String(e.message || e) });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare('SELECT id,email,display_name,password_hash,role,family_id FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'invalid credentials' });
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  const safe = { id: user.id, email: user.email, display_name: user.display_name, role: user.role, family_id: user.family_id };
  return res.json({ token: sign(user), user: safe });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

router.post('/sso', (req, res) => {
  // Accept a BUKIDIC token (or any external JWT we trust). For Phase 0.9 we treat the bukidic_uid
  // as a lookup key: existing user logs in, new user is silently created with a default family.
  const { bukidic_uid, email, display_name, family_name } = req.body || {};
  if (!bukidic_uid || !email) return res.status(400).json({ error: 'bukidic_uid and email required' });
  let user = db.prepare('SELECT id,email,display_name,role,family_id FROM users WHERE bukidic_uid = ? OR email = ?').get(bukidic_uid, email);
  if (!user) {
    let familyId;
    const fam = db.prepare('SELECT id FROM families WHERE name = ?').get(family_name || 'Bukidic Family');
    if (fam) familyId = fam.id;
    else {
      const r = db.prepare('INSERT INTO families (name,country_code) VALUES (?,?)').run(family_name || 'Bukidic Family', 'PH');
      familyId = r.lastInsertRowid;
    }
    const placeholderHash = bcrypt.hashSync('bukidic-sso-' + bukidic_uid, 10);
    const r = db.prepare('INSERT INTO users (email,display_name,password_hash,role,family_id,bukidic_uid,age_tier,vocation) VALUES (?,?,?,?,?,?,?,?)')
      .run(email, display_name || email.split('@')[0], placeholderHash, 'child', familyId, bukidic_uid, 'adult', 'single');
    user = db.prepare('SELECT id,email,display_name,role,family_id FROM users WHERE id = ?').get(r.lastInsertRowid);
  }
  return res.json({ token: sign(user), user });
});

router.post('/member/add', requireParent, (req, res) => {
  const { email, password, display_name, role, date_of_birth, patron_saint_slug, vocation } = req.body || {};
  if (!email || !password || !display_name) return res.status(400).json({ error: 'email, password, display_name required' });
  const allowedRoles = ['tatay', 'nanay', 'child', 'grandparent', 'other'];
  const r = allowedRoles.includes(role) ? role : 'child';
  try {
    const hash = bcrypt.hashSync(password, 10);
    const ins = db.prepare('INSERT INTO users (email,display_name,password_hash,role,family_id,patron_saint_slug,date_of_birth,age_tier,vocation) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(email, display_name, hash, r, req.user.family_id, patron_saint_slug || null, date_of_birth || null, ageTierFromDob(date_of_birth), vocation || 'single');
    const member = db.prepare('SELECT id,email,display_name,role,family_id FROM users WHERE id = ?').get(ins.lastInsertRowid);
    return res.json({ user: member });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email already exists' });
    return res.status(500).json({ error: 'add member failed', detail: String(e.message || e) });
  }
});

module.exports = router;
