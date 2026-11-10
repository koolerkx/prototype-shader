// Gallery: a card per preset with a rendered thumbnail and a UE5 feasibility badge. It is always on screen:
// full (covers the viewport, shown at startup) or docked as a sidebar. Clicking a card hands the preset back.

export type GalleryBadge = { text: string; level: string; title: string };
export type GalleryItem<T> = { name: string; state: T; badge?: GalleryBadge };
export type GalleryGroup<T> = { title: string; items: GalleryItem<T>[] };

export function createGallery<T extends object>(
  host: HTMLElement,
  render: (state: T) => HTMLCanvasElement,
  hooks: { begin: () => void; end: () => void; pick: (state: T) => void },
) {
  const root = document.createElement('div');
  root.id = 'gallery';
  const head = document.createElement('div');
  head.className = 'gallery-head';
  const title = document.createElement('span');
  title.textContent = 'Gallery';
  const legend = document.createElement('span');
  legend.className = 'gallery-legend';
  legend.innerHTML =
    'UE5: <b class="gallery-badge mi">MI</b> material instance only <b class="gallery-badge sub">SUB</b> needs Substrate ' +
    '<b class="gallery-badge extra">EXTRA</b> extra mesh / Blueprint / HLSL — hover a badge for details';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  head.append(title, legend, toggle);
  const body = document.createElement('div');
  body.className = 'gallery-body';
  root.append(head, body);
  host.prepend(root);

  const thumbs = new Map<T, HTMLCanvasElement>(); // rendered once per state object
  const cards = new Map<T, HTMLElement>();
  let active: T | undefined;
  let pumping = false;

  // Thumbnails render lazily: only cards scrolled into (or near) view. Each one may compile a shader variant,
  // so rendering every preset at startup froze the page.
  const waiting = new Map<Element, T>();
  const queue: [HTMLElement, T][] = [];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const state = waiting.get(e.target);
      if (!e.isIntersecting || !state) continue;
      io.unobserve(e.target);
      waiting.delete(e.target);
      queue.push([e.target as HTMLElement, state]);
    }
    void pump();
  }, { root: body, rootMargin: '200px' });

  // One thumbnail per task, each inside its own begin / end, so the viewport keeps animating between them
  // and a click never waits for the queue.
  // setTimeout, not requestAnimationFrame: frames pause in a background tab, timers do not.
  async function pump() {
    if (pumping) return;
    pumping = true;
    while (queue.length) {
      const [thumb, state] = queue.shift()!;
      await new Promise((r) => setTimeout(r, 0));
      let canvas = thumbs.get(state);
      if (!canvas) {
        hooks.begin();
        try {
          canvas = render(state);
        } finally {
          hooks.end();
        }
        thumbs.set(state, canvas);
      }
      if (thumb.isConnected) thumb.replaceChildren(canvas);
    }
    pumping = false;
  }

  const setFull = (full: boolean) => {
    root.classList.toggle('full', full);
    toggle.textContent = full ? 'Dock' : 'Expand';
  };
  toggle.addEventListener('click', () => setFull(!root.classList.contains('full')));
  setFull(false);

  const select = (state: T | undefined) => {
    active = state;
    for (const [s, card] of cards) card.classList.toggle('active', s === state);
    if (state) cards.get(state)?.scrollIntoView({ block: 'nearest' });
  };

  function show(groups: GalleryGroup<T>[]) {
    io.disconnect();
    waiting.clear();
    queue.length = 0;
    body.replaceChildren();
    cards.clear();
    for (const g of groups) {
      if (!g.items.length) continue;
      const h = document.createElement('h4');
      h.textContent = `${g.title} (${g.items.length})`;
      const grid = document.createElement('div');
      grid.className = 'gallery-grid';
      for (const item of g.items) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'gallery-card';
        const thumb = document.createElement('div');
        thumb.className = 'gallery-thumb';
        const label = document.createElement('span');
        label.textContent = item.name;
        card.append(thumb, label);
        if (item.badge) {
          const badge = document.createElement('b');
          badge.className = `gallery-badge ${item.badge.level}`;
          badge.textContent = item.badge.text;
          badge.title = item.badge.title;
          card.append(badge);
        }
        card.addEventListener('click', () => {
          setFull(false);
          select(item.state);
          hooks.pick(item.state);
        });
        grid.append(card);
        cards.set(item.state, card);
        const done = thumbs.get(item.state);
        if (done) thumb.append(done);
        else {
          waiting.set(thumb, item.state);
          io.observe(thumb);
        }
      }
      body.append(h, grid);
    }
    select(active);
  }

  return { show, setFull, select, isFull: () => root.classList.contains('full') };
}
