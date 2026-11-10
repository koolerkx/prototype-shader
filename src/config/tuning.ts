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

// --- Planet mode: one master planet material (UE: material instance switches), procedural from 3D noise ---
export const APP_MODES = ['material', 'planet'] as const;
export type AppMode = (typeof APP_MODES)[number];

export const PLANET_SHAPES = ['sphere', 'ellipsoid', 'dodecahedron', 'icosahedron'] as const;
export type PlanetShapeName = (typeof PLANET_SHAPES)[number];

export const PLANET_VIEW = {
  centerY: 0.6, // world units; same centre as the material-mode sphere
  radius: 0.6,
  ellipsoidY: 0.8, // polar scale of the ellipsoid
  ringMin: 1.1, // ring mesh extent, in planet radii; the shader cuts the visible band inside it
  ringMax: 3.2,
  spaceBackground: '#0b0d1a',
  skyIntensity: 0.03, // the room IBL would light the night side; space has almost no sky light
};

// Neutral base; every planet preset starts from these values.
export const PLANET_DEFAULTS = {
  tiltDeg: 15,
  spinDegPerSec: 6,
  timeScale: 1, // 0 = pause every animation
  // Terrain
  seed: 0,
  noiseScale: 1.6,
  warp: 0.35,
  detail: 5, // fbm octaves
  bump: 1,
  // Ocean and land: height ramp below / above sea level
  seaLevel: 0.5, // 0 = no ocean
  deepColor: '#24407a',
  shallowColor: '#3f8fc4',
  lowColor: '#5f8a4a',
  midColor: '#a89060',
  highColor: '#e8e2d8',
  oceanRoughness: 0.15,
  landRoughness: 0.8,
  polarCap: 0, // 0 = none, 1 = whole planet
  iceColor: '#f4f8ff',
  // Gas-giant bands: replaces the terrain height with latitude stripes
  bands: 0,
  bandFrequency: 6,
  bandTurbulence: 0.6,
  bandSpeedDegPerSec: 4, // equator speed; poles are slower
  // Clouds
  cloudCover: 0,
  cloudSoftness: 0.08,
  cloudScale: 2.5,
  cloudSpeedDegPerSec: 3,
  cloudColor: '#ffffff',
  // Emissive: magma below a height, cracks, and city lights on the night side
  glowColor: '#ff5a1f',
  glowIntensity: 0,
  glowLevel: 0,
  glowCracks: 0,
  glowPulse: 0.5,
  cityColor: '#ffc070',
  cityIntensity: 0,
  cityDensity: 0.4,
  // Atmosphere shell (UE: translucent additive mesh)
  atmoColor: '#7fd8ff',
  atmoIntensity: 1,
  atmoThickness: 0.12, // in planet radii
  // Ring (UE: translucent mesh, planet shadow from a sphere test)
  ringOpacity: 0,
  ringInner: 1.5, // in planet radii
  ringOuter: 2.4,
  ringColorA: '#fff0f6',
  ringColorB: '#b9a4ff',
};

export type PlanetPreset = Preset & { planet?: Partial<typeof PLANET_DEFAULTS> };
// Planets are round, so the object-height gradient and spherical normal are off by default.
const PLANET_STYLE = { normalSoften: 0, gradientStrength: 0 };

export const PLANET_PRESETS = {
  'Kawaii Terra': {
    planet: {
      seaLevel: 0.52, deepColor: '#4a5cff', shallowColor: '#6fe3ff', lowColor: '#8fe08a', midColor: '#f7e08a',
      highColor: '#ff9ec7', oceanRoughness: 0.12, landRoughness: 0.7, polarCap: 0.18,
      noiseScale: 1.2, warp: 0.25, detail: 3, cloudCover: 0.4, atmoColor: '#7fd8ff', atmoIntensity: 1.2,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#7b5cff', shadeStrength: 0.4, terminatorColor: '#ff8a9a', terminatorIntensity: 0.35,
      rimColor: '#9fe8ff', rimIntensity: 0.5, rimWidth: 0.25, rimLightSide: 0.6,
    },
  },
  'Candy Gas Giant': {
    planet: {
      tiltDeg: 25, seaLevel: 0, bands: 1, bandFrequency: 7, bandTurbulence: 0.8, warp: 1,
      lowColor: '#ffd1e8', midColor: '#c9a8ff', highColor: '#fff3c4', landRoughness: 0.55, bump: 0,
      atmoColor: '#ffb8e6', atmoIntensity: 0.8, atmoThickness: 0.1,
      ringOpacity: 0.85, ringInner: 1.45, ringOuter: 2.5, ringColorA: '#ffe9f4', ringColorB: '#b9a4ff',
    },
    material: { fuzzAmount: 0.3, fuzzColor: '#ffffff', fuzzRoughness: 0.6 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#9b7bff', shadeStrength: 0.45, terminatorColor: '#ff7aa8', terminatorIntensity: 0.4,
      rimColor: '#ffd6f0', rimIntensity: 0.4, rimLightSide: 0.5,
    },
  },
  'Magma Core': {
    planet: {
      seaLevel: 0, lowColor: '#1a1016', midColor: '#3a2228', highColor: '#5e4040', landRoughness: 0.9, bump: 2, warp: 0.6, noiseScale: 1.4,
      glowColor: '#ff5a1f', glowIntensity: 3, glowLevel: 0.3, glowCracks: 1, glowPulse: 0.6,
      atmoColor: '#ff6a3a', atmoIntensity: 0.7,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#ff4a6a', shadeStrength: 0.15, terminatorIntensity: 0,
      rimColor: '#ff9a5a', rimIntensity: 0.4, rimLightSide: -0.5,
    },
  },
  'Frost Crystal': {
    planet: {
      seaLevel: 0.45, deepColor: '#2a3c8f', shallowColor: '#6fb8ff', lowColor: '#8fc4ff', midColor: '#c8e4ff',
      highColor: '#ffffff', oceanRoughness: 0.05, landRoughness: 0.25, polarCap: 0.3, iceColor: '#ffffff',
      cloudCover: 0.2, cloudColor: '#e8f0ff', atmoColor: '#a8d8ff',
    },
    material: { clearCoat: 0.6, clearCoatRoughness: 0.05, thinFilm: 0.8, thinFilmThicknessNm: 500 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#6b5cff', shadeStrength: 0.35, terminatorIntensity: 0,
      rimColor: '#d6a8ff', rimIntensity: 0.8, rimWidth: 0.3, rimSoftness: 0.2,
    },
  },
  'Ace Ops Night': {
    planet: {
      tiltDeg: 23.4, spinDegPerSec: 4, seaLevel: 0.48, deepColor: '#0b1a33', shallowColor: '#1d3a66',
      lowColor: '#2a3d4a', midColor: '#4a5a5a', highColor: '#8a9aa0', polarCap: 0.12, iceColor: '#cfe0ea',
      cloudCover: 0.35, cloudSoftness: 0.2, cloudColor: '#e8eef5',
      cityColor: '#ffb35a', cityIntensity: 4, cityDensity: 0.45,
      atmoColor: '#4fb6ff', atmoIntensity: 1.5, atmoThickness: 0.08,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#3a4aff', shadeStrength: 0.1, terminatorColor: '#ff7a4a', terminatorIntensity: 0.25,
      terminatorWidth: 0.12, rimColor: '#7fd8ff', rimIntensity: 0.6, rimLightSide: 0.7,
    },
  },
  'Desert Dune': {
    planet: {
      seaLevel: 0, bands: 0.35, bandFrequency: 10, bandSpeedDegPerSec: 0, warp: 1.2, bump: 1.5,
      lowColor: '#c9733a', midColor: '#f0a35a', highColor: '#ffe1a8', polarCap: 0.1, iceColor: '#fff4e0',
      cloudCover: 0.1, atmoColor: '#ffb37a', atmoIntensity: 0.9,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#8a5cff', shadeStrength: 0.35, terminatorColor: '#ff6a5a', terminatorIntensity: 0.3,
      rimColor: '#ffd6a0', rimIntensity: 0.4, rimLightSide: 0.6,
    },
  },
  'Toxic Jelly': {
    planet: {
      seaLevel: 0.55, deepColor: '#3a0f6b', shallowColor: '#a14bff', lowColor: '#6bff8a', midColor: '#c8ff4a',
      highColor: '#fff6a8', oceanRoughness: 0.05, landRoughness: 0.4, warp: 0.8, noiseScale: 1.3, cloudCover: 0.15, cloudColor: '#e6ffd6',
      glowColor: '#7dff6b', glowIntensity: 1.2, glowLevel: 0.4, glowPulse: 1, atmoColor: '#b06bff', atmoIntensity: 1.2,
    },
    material: { clearCoat: 0.8, clearCoatRoughness: 0.1, subsurfaceColor: '#1a5a2a', subsurfaceOpacity: 0.3 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#7b2cff', shadeStrength: 0.4, terminatorColor: '#c8ff4a', terminatorIntensity: 0.3,
      rimColor: '#d6a8ff', rimIntensity: 0.6, rimLightSide: 0.3,
    },
  },
} satisfies Record<string, PlanetPreset>;
export type PlanetPresetName = keyof typeof PLANET_PRESETS;
export const PLANET_PRESET_NAMES = Object.keys(PLANET_PRESETS) as PlanetPresetName[];
export const PLANET_DEFAULT_PRESET: PlanetPresetName = 'Kawaii Terra';

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
  appMode: 'material' as AppMode,
  shape: 'sphere' as ShapeName,
  planetShape: 'sphere' as PlanetShapeName,
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
  // Planet
  tiltDeg: { min: -90, max: 90, step: 0.1 },
  degPerSec: { min: -60, max: 60, step: 0.5 },
  timeScale: { min: 0, max: 10, step: 0.1 },
  seed: { min: 0, max: 100, step: 0.1 },
  noiseScale: { min: 0.5, max: 8, step: 0.05 },
  warp: { min: 0, max: 3, step: 0.01 },
  detail: { min: 1, max: 6, step: 1 },
  bump: { min: 0, max: 5, step: 0.01 },
  bandFrequency: { min: 1, max: 30, step: 0.1 },
  bandTurbulence: { min: 0, max: 3, step: 0.01 },
  cloudScale: { min: 0.5, max: 10, step: 0.05 },
  glowIntensity: { min: 0, max: 20, step: 0.1 },
  cityIntensity: { min: 0, max: 20, step: 0.1 },
  atmoIntensity: { min: 0, max: 5, step: 0.01 },
  atmoThickness: { min: 0.01, max: 0.5, step: 0.005 },
  ringRadius: { min: 1.1, max: 3.2, step: 0.01 },
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
