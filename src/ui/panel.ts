import type { Range } from '../config/tuning';

type KeysOf<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

/** Sidebar controls. Each control writes into `obj[key]`, then calls `onChange`. */
export function createPanel(root: HTMLElement) {
  const row = (label: string) => {
    const el = document.createElement('div');
    el.className = 'row';
    const l = document.createElement('label');
    l.textContent = label;
    l.title = label;
    el.append(l);
    root.append(el);
    return el;
  };
  const input = (type: string) => {
    const el = document.createElement('input');
    el.type = type;
    return el;
  };

  return {
    section(title: string) {
      const h = document.createElement('h3');
      h.textContent = title;
      root.append(h);
    },

    /** Slider + number box, kept in sync. The number box accepts values outside the slider range. */
    range<T extends object>(label: string, obj: T, key: KeysOf<T, number>, r: Range, onChange: () => void) {
      const slider = input('range');
      const box = input('number');
      for (const el of [slider, box]) Object.assign(el, { min: r.min, max: r.max, step: r.step });
      slider.value = box.value = String(obj[key]);
      const set = (v: number, from: HTMLInputElement) => {
        if (!Number.isFinite(v)) return;
        (obj[key] as number) = v;
        if (from !== slider) slider.value = String(v);
        if (from !== box) box.value = String(v);
        onChange();
      };
      slider.addEventListener('input', () => set(slider.valueAsNumber, slider));
      box.addEventListener('change', () => set(box.valueAsNumber, box));
      row(label).append(slider, box);
    },

    /** Color picker + hex text box. */
    color<T extends object>(label: string, obj: T, key: KeysOf<T, string>, onChange: () => void) {
      const picker = input('color');
      const text = input('text');
      picker.value = text.value = String(obj[key]);
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
      row(label).append(picker, text);
    },

    select<T extends object>(label: string, obj: T, key: KeysOf<T, string>, options: readonly string[], onChange: () => void) {
      const sel = document.createElement('select');
      for (const o of options) sel.add(new Option(o, o));
      sel.value = String(obj[key]);
      sel.addEventListener('change', () => {
        (obj[key] as string) = sel.value;
        onChange();
      });
      row(label).append(sel);
    },
  };
}
