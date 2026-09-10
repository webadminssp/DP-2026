(() => {
  const section = document.querySelector('.home-shell .journey-section');
  const grid = section?.querySelector('.gallery-grid');
  if (!(section instanceof HTMLElement) || !(grid instanceof HTMLElement)) return;

  const prev = section.querySelector('.gallery-rail > button:first-child');
  const next = section.querySelector('.gallery-rail > button:last-child');
  const YEARS = Array.from({ length: 20 }, (_, index) => 2026 - index);
  const TARGET_COUNT = 10;
  const THUMB_WIDTH = 600;
  let photoPool = [];
  let loading = false;

  const shuffle = (values) => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const driveThumb = (id) =>
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${THUMB_WIDTH}`;

  const makeSkeletons = () => {
    grid.classList.add('journey-drive-grid', 'is-loading');
    grid.replaceChildren();
    for (let i = 0; i < TARGET_COUNT; i += 1) {
      const tile = document.createElement('div');
      tile.className = 'memory-photo journey-drive-photo journey-skeleton';
      tile.setAttribute('aria-hidden', 'true');
      grid.append(tile);
    }
  };

  const renderRandom = () => {
    if (!photoPool.length) return;
    const selected = shuffle(photoPool).slice(0, TARGET_COUNT);
    grid.classList.remove('is-loading');
    grid.replaceChildren();

    for (const photo of selected) {
      const tile = document.createElement('a');
      tile.className = 'memory-photo journey-drive-photo';
      tile.href = '/gallery';
      tile.setAttribute('aria-label', `${photo.year} Pujo memory — ${photo.name || 'photograph'}`);
      tile.title = `${photo.year} · ${photo.name || 'Pujo memory'}`;

      const img = document.createElement('img');
      img.src = driveThumb(photo.id);
      img.alt = `${photo.year} Durga Pujo memory`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;

      const year = document.createElement('span');
      year.textContent = String(photo.year);

      tile.append(img, year);
      grid.append(tile);
    }
  };

  const loadPool = async () => {
    if (loading || photoPool.length) return;
    loading = true;
    makeSkeletons();

    const queue = shuffle(YEARS);
    const collected = [];
    const workers = Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const year = queue.shift();
        if (!year) break;
        try {
          const response = await fetch(`/api/gallery?year=${year}`, {
            headers: { accept: 'application/json' },
          });
          if (!response.ok) continue;
          const data = await response.json();
          for (const item of data.media || []) {
            if (item?.type === 'image' && item.id) {
              collected.push({ id: item.id, name: item.name || '', year });
            }
          }
        } catch {
          // A single inaccessible year should not prevent the homepage archive from rendering.
        }
      }
    });

    await Promise.all(workers);

    const seen = new Set();
    photoPool = collected.filter((photo) => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });

    loading = false;
    if (photoPool.length) {
      renderRandom();
    } else {
      grid.classList.remove('is-loading');
      grid.innerHTML = '<p class="journey-gallery-empty">Gallery memories are being prepared.</p>';
    }
  };

  prev?.setAttribute('title', 'Show another set of memories');
  next?.setAttribute('title', 'Show another set of memories');
  prev?.addEventListener('click', () => (photoPool.length ? renderRandom() : loadPool()));
  next?.addEventListener('click', () => (photoPool.length ? renderRandom() : loadPool()));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadPool();
        }
      },
      { rootMargin: '500px 0px' },
    );
    observer.observe(section);
  } else {
    loadPool();
  }
})();
