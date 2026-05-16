// Heavenward Phase 0.9 - Express server.
// Through the family, individuals go to heaven.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const PORT = Number(process.env.PORT) || 4200;

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

// API routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/family',  require('./routes/family'));
app.use('/api/walk',    require('./routes/walk'));
app.use('/api/whisper', require('./routes/whisper'));
app.use('/api/prayer',  require('./routes/prayer'));
app.use('/api/dead',    require('./routes/dead'));
app.use('/api/hours',   require('./routes/hours'));
app.use('/api/hearth',  require('./routes/hearth'));
app.use('/api/saints',  require('./routes/saints'));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Heavenward 0.9', pope: 'Pope Leo XIV' }));

// Static frontend
const frontDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontDir));

// SPA fallback - any non-/api path renders index.html
app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(frontDir, 'index.html')));

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal error', detail: String(err && err.message) });
});

app.listen(PORT, () => {
  console.log('Heavenward listening on http://localhost:' + PORT);
  console.log('Through the family, individuals go to heaven.');
});
