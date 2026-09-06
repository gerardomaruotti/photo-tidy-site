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

// The ordinary figures are the complete experience. Sticky storytelling is
// optional, and its duplicate images are decorative for assistive technology.
(() => {
  const section = document.querySelector('.walkthrough');
  const layout = section?.querySelector('.story-layout');
  if (!layout) return;
  const chapters = [...layout.querySelectorAll('figure')];
  const images = chapters.map(chapter => chapter.querySelector('img'));
  const desktop = matchMedia('(min-width: 1024px) and (min-height: 700px)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let stage, starts = [], current = -1, frame = 0, generation = 0, failed = false;
  const eligible = () => desktop.matches && !motion.matches && !failed;
  const showChapters = () => chapters.forEach(chapter => {
    chapter.classList.remove('reveal-pending', 'reveal-active');
  });
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    section.classList.remove('story-enhanced');
    stage?.remove();
    stage = undefined;
    current = -1;
    chapters.forEach(chapter => chapter.classList.remove('is-current'));
  };
  const fail = () => {
    failed = true;
    generation++;
    reset();
    showChapters();
  };
  const update = () => {
    frame = 0;
    if (!stage) return;
    try {
      // Geometry is cached at setup/resize, not read for every scroll frame.
      const midpoint = scrollY + innerHeight / 2;
      let next = 0;
      starts.forEach((top, index) => { if (midpoint >= top) next = index; });
      if (next === current) return;
      current = next;
      chapters.forEach((chapter, index) => chapter.classList.toggle('is-current', index === next));
      [...stage.children].forEach((image, index) => image.classList.toggle('is-current', index === next));
    } catch { fail(); }
  };
  const schedule = () => { if (stage && !frame) frame = requestAnimationFrame(update); };
  const measure = () => {
    if (!stage) return;
    starts = chapters.map(chapter => chapter.getBoundingClientRect().top + scrollY);
    update();
  };
  const configure = async () => {
    const token = ++generation;
    if (!eligible()) {
      reset();
      // A fallback must never depend on another scroll to become visible.
      if (motion.matches || failed) showChapters();
      return;
    }
    if (stage) { measure(); return; }
    let timeout;
    try {
      images.forEach(image => { image.loading = 'eager'; });
      await Promise.race([
        Promise.all([...images.map(image => image.decode()), document.fonts.ready]),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Screenshot decode timeout')), 8000); })
      ]);
      if (token !== generation || !eligible()) return;
      stage = document.createElement('div');
      stage.className = 'story-visual';
      stage.setAttribute('aria-hidden', 'true');
      for (const image of images) {
        const copy = image.cloneNode();
        copy.alt = '';
        copy.loading = 'eager';
        stage.append(copy);
      }
      layout.append(stage);
      showChapters();
      section.classList.add('story-enhanced');
      measure();
    } catch {
      if (token === generation) fail();
    } finally { clearTimeout(timeout); }
  };
  try {
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', configure, { passive: true });
    addEventListener('pageshow', configure);
    desktop.addEventListener('change', configure);
    motion.addEventListener('change', configure);
    document.fonts.addEventListener('loadingdone', measure);
    configure();
  } catch { fail(); }
})();
