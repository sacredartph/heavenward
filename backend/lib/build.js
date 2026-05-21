// Build identity for the frontend. The single source of truth for "what version
// is the user's browser running." Computed from the SHA-1 of every shipped
// frontend file's content (HTML, SW, JS, CSS) - so the build string changes
// the instant ANY of those files change, with zero manual bumping.
//
// Consumers:
//   - Express HTML middleware rewrites ?v=<anything> -> ?v=<BUILD> and injects
//     data-build="<BUILD>" on the <html> element.
//   - /sw.js middleware substitutes __BUILD__ -> <BUILD> when serving the SW.
//   - /version.txt endpoint returns the current BUILD as plain text. The
//     client polls this every 30s; mismatch with the loaded build = reload.
//
// fs.watch on the frontend dir recomputes on any change (debounced 250ms).
// Also recomputed at every server startup, so node-watcher-blind file changes
// (e.g. SMB writes from another host) are picked up on the next restart.

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

// Files that participate in the build hash. Add/remove if the manifest grows.
// Order is irrelevant - we hash all of them into one digest.
const TRACKED = [
  'index.html', 'sw.js',
  'css/main.css', 'css/components.css', 'css/animations.css',
  'js/app.js', 'js/api.js', 'js/audio.js', 'js/avatars.js',
  'js/dead.js', 'js/hearth.js', 'js/hours.js', 'js/moments.js',
  'js/prayer.js', 'js/saint_picker.js', 'js/schedule.js',
  'js/walk.js', 'js/whisper.js'
];

function compute(frontDir) {
  const h = crypto.createHash('sha1');
  for (const rel of TRACKED) {
    const full = path.join(frontDir, rel);
    try { h.update(rel); h.update('\0'); h.update(fs.readFileSync(full)); }
    catch (e) { h.update(rel); h.update('\0MISSING\0'); }
  }
  return 'b' + h.digest('hex').slice(0, 10);
}

function start(frontDir) {
  let current = compute(frontDir);
  console.log('[build] initial:', current);

  // Debounced recompute on any frontend file change.
  let timer = null;
  function recompute() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const next = compute(frontDir);
      if (next !== current) {
        console.log('[build] changed:', current, '->', next);
        current = next;
      }
    }, 250);
  }
  try {
    fs.watch(frontDir, { recursive: true }, recompute);
  } catch (e) {
    console.warn('[build] fs.watch unavailable, falling back to per-request stat:', e.message);
  }

  return {
    get: () => current,
    recompute: () => { current = compute(frontDir); return current; }
  };
}

module.exports = { start, compute, TRACKED };
