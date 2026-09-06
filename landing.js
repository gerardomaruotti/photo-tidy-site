(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const targets = [...document.querySelectorAll('[data-reveal]')];
  let observer;
  const show = element => {
    element.classList.remove('reveal-pending');
    observer?.unobserve(element);
  };
  try {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) show(entry.target);
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    for (const element of targets) {
      // Never hide content already visible, including restored scroll positions.
      if (element.getBoundingClientRect().top < innerHeight) continue;
      element.classList.add('reveal-pending', 'reveal-active');
      observer.observe(element);
    }
    document.addEventListener('focusin', event => {
      const target = event.target.closest('[data-reveal]');
      if (target) show(target);
    });
    motion.addEventListener('change', event => {
      if (event.matches) { targets.forEach(show); observer.disconnect(); }
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) { targets.forEach(show); observer.disconnect(); }
    });
  } catch {
    targets.forEach(show);
    observer?.disconnect();
  }
})();
