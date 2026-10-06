(() => {
  const frame = document.querySelector('[data-mascot-scanner]');
  if (!frame) return;
  const roles = [...frame.querySelectorAll('.mascot-role')];
  const line = frame.querySelector('.visual-scan');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const names = ['G camarógrafo', 'G productor', 'G editor'];
  const HOLD = 1800, SWEEP = 1700;
  let current = 0, next = 1, direction = 1, elapsed = 0, last = 0, raf = 0, visible = true;

  function render() {
    const sweeping = elapsed >= HOLD;
    const progress = Math.min(1, Math.max(0, (elapsed - HOLD) / SWEEP));
    const position = direction === 1 ? progress : 1 - progress;
    roles.forEach((role, index) => {
      role.style.zIndex = index === next ? '2' : '1';
      role.style.visibility = index === current || (sweeping && index === next) ? 'visible' : 'hidden';
      role.style.clipPath = index === next
        ? (direction === 1 ? `inset(0 0 ${100 - position * 100}% 0)` : `inset(${position * 100}% 0 0 0)`)
        : (sweeping && index === current
          ? (direction === 1 ? `inset(${position * 100}% 0 0 0)` : `inset(0 0 ${100 - position * 100}% 0)`)
          : 'inset(0)');
    });
    line.style.top = `${position * 100}%`;
    line.style.opacity = sweeping ? String(Math.min(1, progress * 12, (1 - progress) * 12)) : '0';
  }

  function tick(now) {
    raf = 0;
    if (!visible || document.hidden || motion.matches) { last = 0; return; }
    if (last) elapsed += Math.min(now - last, 80);
    last = now;
    if (elapsed >= HOLD + SWEEP) {
      elapsed -= HOLD + SWEEP;
      current = next;
      next = (current + 1) % roles.length;
      direction *= -1;
      frame.setAttribute('aria-label', `La G de Getpes: ${names[current]}`);
    }
    render();
    raf = requestAnimationFrame(tick);
  }

  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    if (motion.matches) {
      elapsed = 0; render(); line.style.opacity = '0';
    } else if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  }
  render();
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold: .1}).observe(frame);
  }
  sync();
})();
