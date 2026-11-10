// User presets: saved in this browser (localStorage), exported and imported as JSON.
// Backward compatible by design: unknown keys are dropped, missing keys take today's defaults,
// and a value is only accepted when its type (and colour format / enum) matches the default.

import type { AppMode } from '../config/tuning';

export const STATE_VERSION = 1;
const STORAGE_KEY = 'prototype-shader.presets';
const FILE_FORMAT = 'prototype-shader-presets';

export type SavedState = {
  version: number;
  name: string;
  appMode: AppMode;
  shape?: string;
  planetShape?: string;
  planet?: Record<string, unknown>;
  material?: Record<string, unknown>;
  stylized?: Record<string, unknown>;
  light?: Record<string, unknown>;
};

/** Defaults with every valid value from `part` copied in. */
export function sanitize<T extends object>(
  defaults: T, part: unknown, enums: Partial<Record<keyof T, readonly string[]>> = {},
): T {
  const out = { ...defaults };
  if (!part || typeof part !== 'object') return out;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const v = (part as Record<string, unknown>)[key as string];
    const d = defaults[key];
    if (typeof v !== typeof d) continue;
    if (typeof v === 'number' && !Number.isFinite(v)) continue;
    if (typeof d === 'string' && d.startsWith('#') && !/^#[0-9a-f]{6}$/i.test(v as string)) continue;
    const allowed = enums[key];
    if (allowed && !allowed.includes(v as string)) continue;
    out[key] = v as T[keyof T];
  }
  return out;
}

/** Accepts any version; fills the fields older files may lack. Returns undefined for unusable entries. */
export function normalize(x: unknown): SavedState | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const s = x as Partial<SavedState>;
  if (typeof s.name !== 'string' || !s.name.trim()) return undefined;
  const appMode: AppMode = s.appMode === 'planet' || s.appMode === 'material' ? s.appMode : s.planet ? 'planet' : 'material';
  return { ...s, version: typeof s.version === 'number' ? s.version : 1, name: s.name.trim(), appMode };
}

export function loadUserPresets(): SavedState[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(list) ? list.map(normalize).filter((s): s is SavedState => !!s) : [];
  } catch {
    return [];
  }
}

export function saveUserPresets(list: SavedState[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // private mode or quota: the list still lives in memory for this session
  }
}

/** Adds or replaces (same name and mode). */
export function upsert(list: SavedState[], s: SavedState): void {
  const i = list.findIndex((x) => x.name === s.name && x.appMode === s.appMode);
  if (i >= 0) list[i] = s;
  else list.push(s);
}

/** Reads an export file, a bare array, or a single preset object. */
export function parseImport(text: string): SavedState[] {
  const data: unknown = JSON.parse(text);
  const d = data as { presets?: unknown };
  const list = Array.isArray(data) ? data : Array.isArray(d?.presets) ? d.presets : [data];
  return list.map(normalize).filter((s): s is SavedState => !!s);
}

export function downloadPresets(list: SavedState[], fileName = 'shader-presets.json'): void {
  const json = JSON.stringify({ format: FILE_FORMAT, version: STATE_VERSION, presets: list }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function pickTextFile(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) file.text().then(resolve, () => resolve(undefined));
      else resolve(undefined);
    });
    input.click();
  });
}

// Self-check of the compatibility rules (runs once at load; cheap).
{
  const d = { a: 1, c: '#ffffff', m: 'x' };
  const r = sanitize(d, { a: '2', c: 'red', m: 'y', extra: 5 }, { m: ['x', 'z'] });
  console.assert(r.a === 1 && r.c === '#ffffff' && r.m === 'x' && !('extra' in r), 'sanitize rejects bad values');
  console.assert(sanitize(d, { a: 3, c: '#00FF00', m: 'z' }).a === 3, 'sanitize keeps good values');
  console.assert(normalize({ name: 'old', planet: {} })?.appMode === 'planet', 'normalize infers mode for old files');
}
