# Heavenward — Phase 0.9

A Catholic family companion app.
**Through the family, individuals go to heaven.**

Built for the Manubag family of Sibonga, Cebu, Philippines.
Founding family patron saints: St. Lorenzo Ruiz and Bl. Pedro Calungsod.

---

## Run

From `C:\heavenward`:

```bash
npm install
node database/init.js
node database/seed.js
node backend/server.js
```

Or in one line:

```bash
npm install && node database/init.js && node database/seed.js && node backend/server.js
```

Then open: <http://localhost:4200>

The Cloudflare tunnel target is `heavenward.sacredartph.com -> 127.0.0.1:4200` (not configured by this script).

## Test credentials (Manubag family)

| Role  | Email                 | Password         |
|-------|-----------------------|------------------|
| Tatay | tatay@manubag.ph      | heavenward2026   |
| Nanay | nanay@manubag.ph      | heavenward2026   |

Both have **identical admin permissions**. Either can add members, pin petitions, upgrade urgency, manage the Book of the Dead.

## What is seeded

| Table                    | Count |
|--------------------------|------:|
| prayer_hierarchy_config  |     4 |
| rosary_mysteries         |    20 |
| saints                   |    57 |
| whisper_library          |   512 |
| liturgical_calendar      | 1,095 (3 years) |
| Manubag family + Tatay + Nanay + 2 patron saints in Book |  ready |

The two Filipino founding patrons (St. Lorenzo Ruiz, Bl. Pedro Calungsod) have full child / teen / adult stories. The remaining 55 saints have adult stories and shorter age-tier summaries.

The 512 whispers cover 20 categories: corrected originals, morning, St. Joseph, Our Lady, failure / sin / mercy, temptation, the Eucharist, sacraments, family daily life, the spiritual life, the saints, vocation and identity, faith and reason, the last things, the Church and history, the Holy Spirit, Scripture, body and health, Philippines and the world, the night.

All Scripture is RSV-CE, RSV-2CE, or Douay-Rheims. All saint quotes are verified. The Holy Father is **Pope Leo XIV** throughout. Filter compliance verified: zero hits for `transgender`, `my truth`, `self-care`, `Pope Francis`, `trigger warning`, `non-binary`, `cisgender`, `gender identity`, `lived experience`, `intersectional`.

## Stack

- **Node.js + Express** backend on port 4200
- **SQLite** via `better-sqlite3` (single-file `database/heavenward.db`)
- **Vanilla HTML / CSS / JS** frontend — no framework, no build step
- **JWT** auth in `localStorage`
- **Web Audio API** synthesized bell tones — no MP3 files required, graceful fallback when unavailable
- BUKIDIC SSO accepted at `POST /api/auth/sso` with `bukidic_uid` + `email`

## Architecture

```
backend/
  server.js             Express app, mounts /api/* routes, serves frontend
  middleware/auth.js    JWT issue / verify, requireAuth, requireParent
  models/db.js          shared SQLite connection
  routes/
    auth.js     register / login / me / sso / member add
    family.js   family details + members + milestones
    walk.js     rosary: today, start, join, advance, complete, tail
    whisper.js  log moment + pick whisper + history
    prayer.js   petitions / sick / thanksgiving / inventory / carriers
    dead.js     Book of the Dead + candles
    hours.js    morning / night / saint-of-day / hour log
    hearth.js   feed / posts / presence
    saints.js   saints library + search + profile

database/
  init.js               create tables & indexes (idempotent)
  seed.js               load all seed data (idempotent)
  data/
    mysteries.js        20 rosary mysteries
    saints.js           57 saints (with Filipino patrons full)
    calendar.js         year-by-year liturgical calendar generator (Easter via Meeus)
    whispers_part1..4   512 whispers across 20 categories

frontend/
  index.html            all screens in one document, hidden until .visible
  css/main.css          base + tokens + bottom nav + forms
  css/components.css    splash, login, home, walk, whisper, prayer, etc.
  css/animations.css    candle flame flicker, gentle pulse
  js/api.js             fetch helper + token storage
  js/audio.js           Web Audio synthesized bells / ring / deep
  js/app.js             screen router, home page assembly, login, register
  js/walk.js            rosary mechanics, pedometer (DeviceMotion), tail
  js/whisper.js         moment log -> whisper display
  js/prayer.js          tabs: petitions / sick / thanksgiving / inventory / dead
  js/dead.js            (placeholder for future expansion)
  js/hours.js           morning / night / saints library / saint profile
  js/hearth.js          family presence dots + feed + candles
```

## Screens

1. **Splash** — full-screen navy, real animated candle flame, the dedication
2. **Login** / **Onboarding** — sacred language only ("Begin a new family", "Seal this family")
3. **Home** — time-aware greeting, liturgical line, saint of the day card, three prayer cards (Morning, Rosary, Night), family presence dots with streaks, emergency petition card when present, moment buttons, bottom nav
4. **Walk launch** — mystery set for today, solo/family toggle
5. **Walk active** — full-screen navy, mystery name, scripture in gold italic, reflection, decade question, 10-bead counter (tap anywhere to advance), step counter, bell sound on decade complete
6. **Walk tail** — full-screen night, Repository → Sick → Petitions (L1 first) → Thanksgiving → Church / Pope Leo XIV
7. **Whisper moment** → **Whisper display** — full-screen cream, Scripture in gold italic, saint quote with gold left border, Truth in large Georgia centered, "I received this"
8. **Prayer** — five tabs: Petitions, Sick (with recovered/deceased dignity flows), Thanksgiving, Inventory (searchable), Book of the Dead (with November banner, candle lighting)
9. **Hearth** — family presence dots, candles lit today, feed of family acts
10. **Morning** — saint of day, Morning Offering, Lauds, Gospel of day, intentions to carry
11. **Night** — genuine `#0A0A18` darkness, Psalm 91, Nunc Dimittis, age-tiered examen (3 / 5 / 5 / 6 / 5 questions for child / preteen / teen / adult / elderly), Salve Regina
12. **Saints library** — saint of day, Filipino patrons featured, search by name / patronage / nationality
13. **Saint profile** — full age-appropriate story, key quote styled as Whisper, patronage, feast day

## Language rules enforced

- No "Submit" buttons anywhere. All actions are sacred verbs: *Offer*, *Begin*, *Carry*, *Light*, *Seal*, *Receive*.
- **Tatay** / **Nanay** only — never Papa / Mama / Dad / Mom / Father / Mother in the UI.
- **Pope Leo XIV** throughout.
- All Scripture RSV-CE, RSV-2CE, or Douay-Rheims.
- No therapeutic language. No gender ideology. (Verified by grep — zero hits.)
- Catholic vocabulary only: virtue, conscience, grace, vocation, mercy, the Magisterium, the Catechism, the saints.

## Known limitations (Phase 0.9 → 1.0)

- **Recovery keys for child diaries** are documented in the schema (Phase 1) but the diary feature itself ships in Phase 1.
- **Saint feast-day fallback** for an ordinary weekday with no fixed feast uses a stable day-of-year cycle through the 57 seeded saints; replace with the full Roman Martyrology lookup in Phase 1.
- **Pedometer** uses the browser DeviceMotion API. On iOS Safari it requires explicit permission, which the Walk screen requests on first launch. Desktop browsers without an accelerometer will simply show 0 steps.
- **BUKIDIC SSO** accepts the `bukidic_uid` directly; cryptographic verification of the BUKIDIC JWT signature is Phase 1.
- **Push notifications** for emergency petitions are surfaced in-app only (the emergency card on Home). Native push integration is Phase 1.
- **Liturgical calendar** generates Sundays + 50+ fixed feasts; the full lectionary cycle (ABC weekday readings) is Phase 1.
- **Anniversary surfacing** for the dead reads from the `repository_of_dead.death_date` column on the Morning prayer — the November banner appears in Prayer → Book of the Dead automatically when the month is 11.
- **Hearth posts** are append-only; an edit/delete flow is Phase 1.

## Endpoints (summary)

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/sso
POST /api/auth/member/add        (Tatay / Nanay)

GET  /api/family
GET  /api/family/members
PUT  /api/family/member/:id      (Tatay / Nanay)
GET  /api/family/milestones
POST /api/family/milestone       (Tatay / Nanay)

GET  /api/walk/today
POST /api/walk/start
POST /api/walk/:id/join
PUT  /api/walk/:id/advance
POST /api/walk/:id/complete
GET  /api/walk/tail

POST /api/whisper/log
GET  /api/whisper/history

GET  /api/prayer/petitions
POST /api/prayer/petition
PUT  /api/prayer/petition/:id
POST /api/prayer/petition/:id/answer
POST /api/prayer/petition/:id/carrier   (Tatay / Nanay)
GET  /api/prayer/sick
POST /api/prayer/sick
PUT  /api/prayer/sick/:id
GET  /api/prayer/thanksgiving
POST /api/prayer/thanksgiving
GET  /api/prayer/inventory

GET  /api/dead
POST /api/dead                          (Tatay / Nanay)
POST /api/dead/:id/candle
GET  /api/dead/candles/today

GET  /api/hours/today
POST /api/hours/log
GET  /api/hours/saint
GET  /api/hours/morning
GET  /api/hours/night

GET  /api/hearth/feed
POST /api/hearth/post
GET  /api/hearth/presence

GET  /api/saints
GET  /api/saints/today
GET  /api/saints/search?q=
GET  /api/saints/:slug

GET  /api/health
```

---

*Soli Deo gloria.*
