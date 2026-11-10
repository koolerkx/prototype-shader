// Gallery overlay: a card per preset with a rendered thumbnail; clicking a card hands the preset back.

export type GalleryItem<T> = { name: string; state: T };
export type GalleryGroup<T> = { title: string; items: GalleryItem<T>[] };

export function createGallery<T>(
  host: HTMLElement,
  render: (state: T) => HTMLCanvasElement,
  hooks: { begin: () => void; end: () => void; pick: (state: T) => void },
) {
  const root = document.createElement('div');
  root.id = 'gallery';
  root.hidden = true;
  const head = document.createElement('div');
  head.className = 'gallery-head';
  const title = document.createElement('span');
  title.textContent = 'Gallery — click a preset to edit it';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  head.append(title, close);
  const body = document.createElement('div');
  body.className = 'gallery-body';
  root.append(head, body);
  host.append(root);

  let run = 0; // cancels a thumbnail pass when the gallery closes
  let busy = false;
  let pending: T | undefined; // a pick made while thumbnails render waits until the scene is restored
  const hide = () => {
    run++;
    root.hidden = true;
  };
  close.addEventListener('click', hide);

  return {
    async open(groups: GalleryGroup<T>[]) {
      if (busy) return;
      const id = ++run;
      root.hidden = false;
      body.replaceChildren();
      const jobs: [HTMLElement, T][] = [];
      for (const g of groups) {
        if (!g.items.length) continue;
        const h = document.createElement('h4');
        h.textContent = g.title;
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
          card.addEventListener('click', () => {
            hide();
            if (busy) pending = item.state;
            else hooks.pick(item.state);
          });
          grid.append(card);
          jobs.push([thumb, item.state]);
        }
        body.append(h, grid);
      }
      // One thumbnail per task keeps the page responsive while each preset compiles its shader variant.
      // setTimeout, not requestAnimationFrame: frames pause in a background tab, timers do not.
      busy = true;
      hooks.begin();
      try {
        for (const [thumb, state] of jobs) {
          await new Promise((r) => setTimeout(r, 0));
          if (id !== run) return;
          thumb.replaceChildren(render(state));
        }
      } finally {
        hooks.end();
        busy = false;
        if (pending !== undefined) {
          const state = pending;
          pending = undefined;
          hooks.pick(state);
        }
      }
    },
  };
}
