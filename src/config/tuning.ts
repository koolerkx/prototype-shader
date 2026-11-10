export const DEG2RAD = Math.PI / 180;

export const SHAPES = ['sphere', 'cube', 'cylinder', 'cone', 'pyramid', 'torus', 'torusKnot', 'capsule', 'plane'] as const;
export type ShapeName = (typeof SHAPES)[number];

export const TONE_MAPPINGS = ['ACES', 'AgX', 'Neutral', 'None'] as const;
export type ToneMappingName = (typeof TONE_MAPPINGS)[number];

export type Range = { min: number; max: number; step: number };

// Parameter names follow the UE5 Default Lit material inputs.
export const MATERIAL_DEFAULTS = {
  baseColor: '#b4b4b4',
  metallic: 0,
  specular: 0.5, // UE5 default: F0 = 0.08 * specular = 0.04
  roughness: 0.5,
  emissiveColor: '#ffffff',
  emissiveIntensity: 0,
  // UE built-in shading layers. All default off, so the result stays plain Default Lit.
  clearCoat: 0,
  clearCoatRoughness: 0.1,
  fuzzAmount: 0, // UE Cloth / Substrate Fuzz
  fuzzColor: '#ffd6f0',
  fuzzRoughness: 0.5,
  subsurfaceColor: '#000000', // UE legacy Subsurface; black = off
  subsurfaceOpacity: 0.5,
  thinFilm: 0, // Substrate Thin Film
  thinFilmThicknessNm: 400,
  thinFilmIor: 1.3,
  anisotropy: 0,
  anisotropyRotationDeg: 0,
};

export const MATERIAL_MODES = ['standard', 'stylized'] as const;
export type MaterialMode = (typeof MATERIAL_MODES)[number];

// Material-level NPR layer: only inputs a UE 5.7 material instance can drive (no post-process, no shading model change).
export const STYLIZED_DEFAULTS = {
  mode: 'stylized' as MaterialMode,
  normalSoften: 0.35, // 0 = mesh normal, 1 = spherical normal from the object centre
  gradientColor: '#6b5cff', // tints the bottom of the object
  gradientStrength: 0.3,
  shadeColor: '#8a7bff', // emissive lift on the side facing away from the sun
  shadeStrength: 0.35,
  terminatorColor: '#ff8a7a', // warm band where N·L crosses 0
  terminatorIntensity: 0.4,
  terminatorWidth: 0.2, // N·L half-width of the band
  rimColor: '#7fd8ff',
  rimIntensity: 0.6,
  rimWidth: 0.2,
  rimSoftness: 0.1,
  rimLightSide: 0, // -1 = back-lit side only, 0 = everywhere, 1 = sun-lit side only
};

// Each preset starts from the defaults above and overrides only the listed values. Lighting is not touched.
export type Preset = {
  material?: Partial<typeof MATERIAL_DEFAULTS>;
  stylized?: Partial<typeof STYLIZED_DEFAULTS>;
};
const OFF = { gradientStrength: 0, shadeStrength: 0, terminatorIntensity: 0, rimIntensity: 0, normalSoften: 0 };

export const PRESETS = {
  'UE Default Lit': { stylized: { mode: 'standard' } },
  'Party Toy Plastic': {
    material: { baseColor: '#ff7a59', roughness: 0.45, clearCoat: 0.6, clearCoatRoughness: 0.15 },
    stylized: {
      normalSoften: 0.4, gradientColor: '#c04a7a', gradientStrength: 0.25, shadeColor: '#7b5cff', shadeStrength: 0.35,
      terminatorColor: '#ffb38a', terminatorIntensity: 0.35, rimColor: '#ffe2b8', rimIntensity: 0.4, rimWidth: 0.25,
    },
  },
  'Kawaii Soft Vinyl': {
    material: {
      baseColor: '#ffc7dd', roughness: 0.6, subsurfaceColor: '#ff6f91', subsurfaceOpacity: 0.4,
      fuzzAmount: 0.3, fuzzColor: '#ffffff', fuzzRoughness: 0.6,
    },
    stylized: {
      normalSoften: 0.6, gradientColor: '#b48cff', gradientStrength: 0.3, shadeColor: '#9b7bff', shadeStrength: 0.4,
      terminatorColor: '#ff7a8a', terminatorIntensity: 0.5, terminatorWidth: 0.25,
      rimColor: '#ffffff', rimIntensity: 0.5, rimWidth: 0.25, rimSoftness: 0.15,
    },
  },
  'Plush Mascot': {
    material: { baseColor: '#f2d0a4', roughness: 0.9, specular: 0.3, fuzzAmount: 1, fuzzColor: '#fff1dc', fuzzRoughness: 0.8 },
    stylized: {
      normalSoften: 0.5, gradientStrength: 0, shadeColor: '#a088ff', shadeStrength: 0.3,
      terminatorColor: '#ffa07a', terminatorIntensity: 0.3, rimColor: '#fff4e0', rimIntensity: 0.3, rimWidth: 0.3, rimLightSide: 1,
    },
  },
  'Ace Jet Paint': {
    material: { baseColor: '#e8ecf2', roughness: 0.35, clearCoat: 1, clearCoatRoughness: 0.05 },
    stylized: {
      normalSoften: 0.15, gradientColor: '#3a4a8a', gradientStrength: 0.2, shadeColor: '#5a6cff', shadeStrength: 0.25,
      terminatorColor: '#ff9a6a', terminatorIntensity: 0.15, terminatorWidth: 0.12,
      rimColor: '#7fd8ff', rimIntensity: 0.9, rimWidth: 0.2, rimSoftness: 0.05, rimLightSide: -0.6,
    },
  },
  'Sci-fi Brushed Metal': {
    material: { baseColor: '#c9ccd6', metallic: 1, roughness: 0.35, anisotropy: 0.8 },
    stylized: { ...OFF, normalSoften: 0.1, rimColor: '#9fe8ff', rimIntensity: 0.6, rimLightSide: -0.5 },
  },
  'Crystal Canopy': {
    material: {
      baseColor: '#3b2a6b', roughness: 0.08, specular: 0.8, clearCoat: 0.5,
      thinFilm: 1, thinFilmThicknessNm: 450, thinFilmIor: 1.3,
    },
    stylized: {
      ...OFF, gradientColor: '#7fd8ff', gradientStrength: 0.3, shadeColor: '#6b5cff', shadeStrength: 0.3,
      rimColor: '#d6a8ff', rimIntensity: 1, rimWidth: 0.35, rimSoftness: 0.2,
    },
  },
} satisfies Record<string, Preset>;
export type PresetName = keyof typeof PRESETS;
export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];

export const LIGHT_DEFAULTS = {
  sunColor: '#fff4e5',
  sunIntensity: 3,
  sunAzimuthDeg: -40, // side light relative to the default camera, so the terminator is visible
  sunElevationDeg: 45,
  skyIntensity: 0.3,
  exposure: 1,
  toneMapping: 'ACES' as ToneMappingName, // UE5 filmic tonemapper is ACES-based
};

export const SCENE_DEFAULTS = {
  shape: 'sphere' as ShapeName,
};

export const RANGES: Record<string, Range> = {
  metallic: { min: 0, max: 1, step: 0.01 },
  specular: { min: 0, max: 1, step: 0.01 },
  roughness: { min: 0, max: 1, step: 0.01 },
  emissiveIntensity: { min: 0, max: 20, step: 0.1 },
  unit: { min: 0, max: 1, step: 0.01 },
  subsurfaceOpacity: { min: 0, max: 1, step: 0.01 },
  thinFilmThicknessNm: { min: 100, max: 1200, step: 10 },
  thinFilmIor: { min: 1, max: 2.333, step: 0.01 },
  anisotropyRotationDeg: { min: -180, max: 180, step: 1 },
  stylizeStrength: { min: 0, max: 2, step: 0.01 },
  terminatorWidth: { min: 0.01, max: 1, step: 0.01 },
  rimIntensity: { min: 0, max: 5, step: 0.01 },
  rimWidth: { min: 0, max: 1, step: 0.01 },
  rimSoftness: { min: 0, max: 0.5, step: 0.005 },
  rimLightSide: { min: -1, max: 1, step: 0.01 },
  sunIntensity: { min: 0, max: 20, step: 0.1 },
  sunAzimuthDeg: { min: -180, max: 180, step: 1 },
  sunElevationDeg: { min: -10, max: 90, step: 1 },
  skyIntensity: { min: 0, max: 5, step: 0.01 },
  exposure: { min: 0, max: 5, step: 0.01 },
};

export const VIEW = {
  background: '#2b2e33',
  fovDeg: 45,
  cameraPosition: [3, 2.2, 3.6] as const,
  target: [0, 0.6, 0] as const,
  gridSize: 10, // world units
  gridDivisions: 20,
  sunDistance: 10,
  shadowExtent: 3,
  shadowMapSize: 2048,
};
