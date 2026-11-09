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
};

export const MATERIAL_MODES = ['standard', 'stylized'] as const;
export type MaterialMode = (typeof MATERIAL_MODES)[number];

// Realistic-leaning NPR layer on top of Default Lit. toonBlend 0 = pure PBR, 1 = hard ramp.
export const STYLIZED_DEFAULTS = {
  mode: 'stylized' as MaterialMode,
  toonBlend: 0.7,
  rampThreshold: 0, // raw N·L where the terminator sits
  rampSoftness: 0.05,
  shadowTint: '#9a8fd0', // multiplies sky diffuse, which fills unlit and shadowed areas
  rimColor: '#7fd8ff',
  rimIntensity: 0.6,
  rimWidth: 0.2,
};

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
  toonBlend: { min: 0, max: 1, step: 0.01 },
  rampThreshold: { min: -1, max: 1, step: 0.01 },
  rampSoftness: { min: 0, max: 0.5, step: 0.005 },
  rimIntensity: { min: 0, max: 5, step: 0.01 },
  rimWidth: { min: 0, max: 1, step: 0.01 },
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
