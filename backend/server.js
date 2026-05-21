// Heavenward Phase 0.9 - Express server.
// Through the family, individuals go to heaven.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const build   = require('./lib/build');

const PORT = Number(process.env.PORT) || 4200;
const frontDir = path.join(__dirname, '..', 'frontend');

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

// ----- Build identity --------------------------------------------------------
// SHA-1 of every frontend file's content. Changes on any edit. This is the
// ONE source of truth for "what version is current."  See lib/build.js.
const BUILD = build.start(frontDir);

// Public version endpoint. The client polls this; mismatch with loaded build
// triggers an instant reload. Always uncached at every layer.
function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
  res.setHeader('Surrogate-Control', 'no-store');
}
app.get('/version.txt', (req, res) => {
  noStore(res);
  res.type('text/plain').send(BUILD.get());
});

// ----- API routes ------------------------------------------------------------
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/family',  require('./routes/family'));
app.use('/api/walk',    require('./routes/walk'));
app.use('/api/whisper', require('./routes/whisper'));
app.use('/api/prayer',  require('./routes/prayer'));
app.use('/api/dead',    require('./routes/dead'));
app.use('/api/hours',   require('./routes/hours'));
app.use('/api/hearth',  require('./routes/hearth'));
app.use('/api/saints',  require('./routes/saints'));
app.use('/api/push',    require('./routes/push'));
app.use('/api/people',  require('./routes/people'));
app.get('/api/health',  (req, res) => res.json({ ok: true, app: 'Heavenward 0.9', build: BUILD.get(), pope: 'Pope Leo XIV' }));

// ----- HTML middleware -------------------------------------------------------
// Every HTML response gets the current build stamped in two ways:
//   (1) every  ?v=<anything>  query is rewritten to  ?v=<BUILD>  so the
//       browser sees a brand-new URL for every asset the moment any file
//       changes - no manual version bumps anywhere in source.
//   (2) <html data-build="<BUILD>">  so the client-side updater knows what
//       build it's currently running and can compare against /version.txt.
function serveHtml(req, res, relPath) {
  fs.readFile(path.join(frontDir, relPath), 'utf8', (err, html) => {
    if (err) return res.status(404).type('text/plain').send('Not found');
    const b = BUILD.get();
    // (1) Stamp every local <link href> / <script src> pointing at .css/.js/.json
    //     with the current build. Replaces any existing ?v=... query so old
    //     hardcoded versions never leak through.
    html = html.replace(
      /(href|src)="(\/[^"?#\s]+\.(?:css|js|json))(?:\?[^"]*)?"/g,
      (_m, attr, p) => `${attr}="${p}?v=${b}"`
    );
    // (2) Any leftover ?v=<something> elsewhere in HTML (manifest links, etc.).
    html = html.replace(/\?v=[A-Za-z0-9_-]+/g, '?v=' + b);
    // (3) Expose build to the client via <html data-build="...">.
    if (/<html\b[^>]*data-build=/i.test(html)) {
      html = html.replace(/(<html\b[^>]*data-build=)"[^"]*"/i, '$1"' + b + '"');
    } else {
      html = html.replace(/<html\b/i, '<html data-build="' + b + '"');
    }
    noStore(res);
    res.type('html').send(html);
  });
}

// ----- SW middleware ---------------------------------------------------------
// Serve /sw.js with the current build substituted for __BUILD__. The SW's
// bytes therefore change every time the frontend changes, which is what
// triggers Chrome's SW update check to install the new SW. This MUST be
// registered before express.static or static would win the race.
app.get('/sw.js', (req, res) => {
  fs.readFile(path.join(frontDir, 'sw.js'), 'utf8', (err, js) => {
    if (err) return res.status(404).type('text/plain').send('Not found');
    js = js.replace(/__BUILD__/g, BUILD.get());
    noStore(res);
    res.type('application/javascript').send(js);
  });
});

// ----- HTML intercept (MUST be before express.static) ------------------------
// Catch / and any *.html request and run them through serveHtml so the build
// stamping always happens. Without this, express.static would serve raw
// index.html with no data-build attribute and no ?v= stamps on assets.
app.get('/', (req, res) => serveHtml(req, res, 'index.html'));
app.get(/^\/[^?]*\.html$/, (req, res) => serveHtml(req, res, req.path.replace(/^\//, '')));

// ----- Static frontend (everything else) -------------------------------------
// JS/CSS/images: short-lived edge cache (5min) - safe because the URL is
// pinned with ?v=<BUILD>, so a new build means a new URL means a clean fetch.
app.use(express.static(frontDir, {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.html') || lower.endsWith('manifest.json') || lower.endsWith('sw.js')) {
      // Belt-and-braces: anything we let through here also goes uncached.
      noStore(res);
    } else {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    }
  }
}));

// SPA fallback - any non-/api path that didn't match static renders the
// build-stamped index.html so deep links still load the app shell.
app.get(/^(?!\/api).*/, (req, res) => serveHtml(req, res, 'index.html'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal error', detail: String(err && err.message) });
});

app.listen(PORT, () => {
  console.log('Heavenward listening on http://localhost:' + PORT);
  console.log('Through the family, individuals go to heaven.');
  console.log('Build:', BUILD.get());
  try { require('./prayer_cron').start(); }
  catch (e) { console.error('Prayer cron failed to start:', e); }
});
