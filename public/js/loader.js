// One loading surface shared by every dashboard request and local navigation.
const GetpesLoader = (() => {
  let pending = 0, shownAt = 0, hideTimer, showTimer, surface, previousFocus;
  function show() {
    if (!pending || surface?.open) return;
    if (!surface) {
      surface = document.createElement('dialog');
      surface.id = 'getpes-loader';
      surface.setAttribute('aria-label', 'Cargando');
      surface.innerHTML = '<div class="getpes-loading-content" role="status" aria-live="polite"><svg class="getpes-plays" viewBox="0 0 190 100" fill="none" aria-hidden="true"><path d="M19 15 Q10 9 10 21 V79 Q10 91 19 85 L67 56 Q77 50 67 44 Z"/><path d="M69 15 Q60 9 60 21 V79 Q60 91 69 85 L117 56 Q127 50 117 44 Z"/><path d="M119 15 Q110 9 110 21 V79 Q110 91 119 85 L167 56 Q177 50 167 44 Z"/></svg><p>Cargando…</p></div>';
      surface.addEventListener('cancel', e => e.preventDefault());
      document.body.append(surface);
    }
    previousFocus = document.activeElement;
    surface.showModal();
    document.documentElement.classList.add('getpes-loading');
    shownAt = performance.now();
  }
  function begin(label = 'Cargando…') {
    pending++;
    clearTimeout(hideTimer);
    if (surface) surface.querySelector('p').textContent = label;
    // Let the initiating click finish before placing the dialog in the top layer.
    clearTimeout(showTimer);
    showTimer = setTimeout(() => { show(); if (surface) surface.querySelector('p').textContent = label; }, 0);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      pending--;
      if (pending) return;
      hideTimer = setTimeout(() => {
        if (pending) return;
        surface?.close();
        document.documentElement.classList.remove('getpes-loading');
        if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({preventScroll:true});
      }, Math.max(0, 360 - (performance.now() - shownAt)));
    };
  }
  async function run(operation, label) {
    const finish = begin(label);
    try { return await operation(); } finally { finish(); }
  }
  function transition() {
    const finish = begin();
    // Local tabs have no network request, but share the same visual transition.
    requestAnimationFrame(() => requestAnimationFrame(finish));
  }
  document.addEventListener('click', e => {
    const button = e.target.closest('[data-nav],[data-analytics]');
    if (button && !button.disabled && button.getAttribute('aria-current') !== 'page' && button.getAttribute('aria-selected') !== 'true') transition();
  }, true);
  return {begin, run, transition};
})();
