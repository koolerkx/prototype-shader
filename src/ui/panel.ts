import type { Range } from '../config/tuning';
import { TOOLTIPS } from './tooltips';

type KeysOf<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

type Tab = { button: HTMLButtonElement; page: HTMLElement };

/**
 * Sidebar controls. Each control writes into `obj[key]`, calls `onChange`, and returns its element.
 * Layout: a sticky header (controls added before the first tab, a search box, the tab bar), then one page per tab.
 * Controls go into the most recent section, else the current page or the header. Hovering a row shows `TOOLTIPS[key]`.
 */
export function createPanel(root: HTMLElement) {
  const head = div('panel-head');
  const headRows = div('');
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search label or 說明…';
  const tabBar = div('tabs');
  const body = div('panel-body');
  head.append(headRows, search, tabBar);
  root.append(head, body);

  let page: HTMLElement = headRows;
  let parent: HTMLElement = headRows;
  const syncs: (() => void)[] = [];
  const tabs: Tab[] = [];
  let active: Tab | undefined;

  const select = (t: Tab) => {
    active = t;
    for (const x of tabs) {
      x.page.classList.toggle('inactive', x !== t);
      x.button.classList.toggle('active', x === t);
    }
  };

  // Search shows matching rows from every tab of the current mode; an empty query restores the tab view.
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    root.classList.toggle('searching', q !== '');
    for (const r of body.querySelectorAll<HTMLElement>('.row')) {
      r.classList.toggle('no-match', q !== '' && !r.dataset.search!.includes(q));
    }
    for (const d of body.querySelectorAll('details')) {
      const any = [...d.querySelectorAll<HTMLElement>('.row')].some((r) => !r.classList.contains('no-match'));
      d.classList.toggle('no-match', q !== '' && !any);
      if (q !== '') d.open = true;
    }
  });

  const row = (label: string, key: PropertyKey) => {
    const el = document.createElement('div');
    el.className = 'row';
    el.title = TOOLTIPS[String(key)] ?? label;
    el.dataset.search = `${label} ${el.title}`.toLowerCase();
    const l = document.createElement('label');
    l.textContent = label;
    el.append(l);
    parent.append(el);
    return el;
  };
  const input = (type: string) => {
    const el = document.createElement('input');
    el.type = type;
    return el;
  };

  return {
    /** New tab page; following sections go into it. The first tab starts active. */
    tab(name: string): Tab {
      const t: Tab = { button: document.createElement('button'), page: div('tab-page') };
      t.button.type = 'button';
      t.button.textContent = name;
      t.button.addEventListener('click', () => select(t));
      tabBar.append(t.button);
      body.append(t.page);
      tabs.push(t);
      page = parent = t.page;
      if (active) t.page.classList.add('inactive');
      else select(t);
      return t;
    },

    /** Shows or hides a tab for the current mode; moves to the first visible tab if the active one is hidden. */
    showTab(t: Tab, visible: boolean) {
      t.button.hidden = !visible;
      t.page.classList.toggle('off-mode', !visible);
      if (!visible && active === t) {
        const first = tabs.find((x) => !x.button.hidden);
        if (first) select(first);
      }
    },

    /** Collapsible category; following controls go inside it. */
    section(title: string, open = true) {
      const d = document.createElement('details');
      d.open = open;
      const s = document.createElement('summary');
      s.textContent = title;
      d.append(s);
      page.append(d);
      parent = d;
      return d;
    },

    /** Re-reads every control from its object, e.g. after a preset replaced the params. */
    refresh() {
      for (const sync of syncs) sync();
    },

    /** Slider + number box, kept in sync. The number box accepts values outside the slider range. */
    range<T extends object>(label: string, obj: T, key: KeysOf<T, number>, r: Range, onChange: () => void) {
      const slider = input('range');
      const box = input('number');
      for (const el of [slider, box]) Object.assign(el, { min: r.min, max: r.max, step: r.step });
      const sync = () => (slider.value = box.value = String(obj[key]));
      sync();
      syncs.push(sync);
      const set = (v: number, from: HTMLInputElement) => {
        if (!Number.isFinite(v)) return;
        (obj[key] as number) = v;
        if (from !== slider) slider.value = String(v);
        if (from !== box) box.value = String(v);
        onChange();
      };
      slider.addEventListener('input', () => set(slider.valueAsNumber, slider));
      box.addEventListener('change', () => set(box.valueAsNumber, box));
      const el = row(label, key);
      el.append(slider, box);
      return el;
    },

    /** Color picker + hex text box. */
    color<T extends object>(label: string, obj: T, key: KeysOf<T, string>, onChange: () => void) {
      const picker = input('color');
      const text = input('text');
      const sync = () => (picker.value = text.value = String(obj[key]));
      sync();
      syncs.push(sync);
      const set = (v: string, from: HTMLInputElement) => {
        if (!/^#[0-9a-f]{6}$/i.test(v)) {
          text.value = String(obj[key]);
          return;
        }
        (obj[key] as string) = v.toLowerCase();
        if (from !== picker) picker.value = v;
        if (from !== text) text.value = v;
        onChange();
      };
      picker.addEventListener('input', () => set(picker.value, picker));
      text.addEventListener('change', () => set(text.value.trim(), text));
      const el = row(label, key);
      el.append(picker, text);
      return el;
    },

    /** Several buttons in one row; `key` picks the tooltip. */
    buttons(label: string, key: string, defs: { text: string; onClick: (b: HTMLButtonElement) => void }[]) {
      const wrap = div('btns');
      for (const d of defs) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = d.text;
        b.addEventListener('click', () => d.onClick(b));
        wrap.append(b);
      }
      const el = row(label, key);
      el.append(wrap);
      return el;
    },

    /** Replaces the options of a row made by `select`; keeps the value when it still exists. */
    setOptions(el: HTMLElement, options: readonly string[]) {
      const sel = el.querySelector('select')!;
      const value = sel.value;
      sel.replaceChildren(...options.map((o) => new Option(o, o)));
      sel.value = options.includes(value) ? value : options[0];
    },

    select<T extends object>(label: string, obj: T, key: KeysOf<T, string>, options: readonly string[], onChange: () => void) {
      const sel = document.createElement('select');
      for (const o of options) sel.add(new Option(o, o));
      const sync = () => (sel.value = String(obj[key]));
      sync();
      syncs.push(sync);
      sel.addEventListener('change', () => {
        (obj[key] as string) = sel.value;
        onChange();
      });
      const el = row(label, key);
      el.append(sel);
      return el;
    },
  };
}

function div(className: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  return el;
}
