// Synthesized bell tones using the Web Audio API. No MP3 files. Graceful fallback if blocked.
(function (global) {
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function tone(freq, durationMs, gain) {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch {} }
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain || 0.18, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    o.connect(g); g.connect(c.destination);
    o.start(now);
    o.stop(now + durationMs / 1000 + 0.05);
  }
  function bell(strength) {
    // soft church bell: two stacked overtones
    const s = strength || 1;
    tone(660, 1400, 0.16 * s);
    setTimeout(() => tone(990, 900, 0.10 * s), 25);
  }
  function ring() { tone(880, 200, 0.10); }
  function deep() { tone(330, 1800, 0.20); }
  global.HwAudio = { bell, ring, deep, ensure };
})(window);
