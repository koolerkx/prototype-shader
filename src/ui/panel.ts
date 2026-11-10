import type { Range } from '../config/tuning';
import { TOOLTIPS } from './tooltips';

type KeysOf<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

/**
 * Sidebar controls. Each control writes into `obj[key]`, calls `onChange`, and returns its element.
 * Controls go into the most recent section. Hovering a row shows `TOOLTIPS[key]`.
 */
export function createPanel(root: HTMLElement) {
  let parent: HTMLElement = root;
  const syncs: (() => void)[] = [];

  const row = (label: string, key: PropertyKey) => {
    const el = document.createElement('div');
    el.className = 'row';
    el.title = TOOLTIPS[String(key)] ?? label;
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
    /** Collapsible category; following controls go inside it. */
    section(title: string, open = true) {
      const d = document.createElement('details');
      d.open = open;
      const s = document.createElement('summary');
      s.textContent = title;
      d.append(s);
      root.append(d);
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
