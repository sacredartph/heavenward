// The Whisper - moment to display.
(function (global) {
  let last = null;

  async function logMoment(momentType, freeText) {
    try {
      const w = await api.post('/api/whisper/log', { moment_type: momentType, free_text: freeText || null });
      render(w);
      showScreen('whisper-display');
    } catch (e) {
      toast('Could not load a whisper. ' + (e.message || ''));
    }
  }

  function render(w) {
    last = w;
    document.getElementById('w-scripture').textContent = w.scripture.text;
    document.getElementById('w-ref').textContent = w.scripture.ref;
    document.getElementById('w-saint-name').textContent = w.saint.name;
    document.getElementById('w-saint-text').textContent = w.saint.text;
    document.getElementById('w-truth').textContent = w.truth;
  }

  function init() {
    // Both home and dedicated whisper screen have .moment-buttons - delegate.
    document.querySelectorAll('.moment-buttons').forEach(group => {
      group.addEventListener('click', (ev) => {
        const t = ev.target.closest('button[data-moment]');
        if (!t) return;
        const free = (document.getElementById('whisper-free') || {}).value || null;
        logMoment(t.dataset.moment, free);
      });
    });
    document.getElementById('btn-whisper-received').addEventListener('click', () => {
      toast('Received.');
      showScreen('home');
    });
    document.getElementById('btn-whisper-dismiss').addEventListener('click', () => {
      showScreen('home');
    });
    // Swipe-up to dismiss on whisper screen.
    let ys = 0;
    const ws = document.getElementById('screen-whisper-display');
    ws.addEventListener('touchstart', (e) => { ys = e.touches[0].clientY; });
    ws.addEventListener('touchend', (e) => {
      const dy = ys - (e.changedTouches[0] ? e.changedTouches[0].clientY : ys);
      if (dy > 80) showScreen('home');
    });
  }

  global.WhisperUI = { init, logMoment };
})(window);
