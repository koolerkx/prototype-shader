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
  outlineWidth: 0, // inverted hull, screen pixels; 0 = off
  outlineColor: '#2a1f4a',
  // Toon mix (UE: Emissive += Albedo * lerp(ShadeColor, 1, steppedNL) * SunColor * Toonness; BaseColor *= 1 - 0.9 * Toonness).
  // It does not see cast shadows.
  toonness: 0, // 0 = PBR diffuse, 1 = stepped diffuse with a 10% PBR residual
  toonSteps: 2, // tone count on the N·L ramp
  toonSoftness: 0.05, // N·L half-width of each step edge
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

export const ATTACHMENTS = ['none', 'catEars', 'islands', 'vortex', 'whaleTrail'] as const;
export type AttachName = (typeof ATTACHMENTS)[number];

// Fixed looks of the attachment meshes; sizes in planet radii.
export const ATTACH = {
  islandCount: 6,
  islandOrbit: 1.42,
  islandSpeed: 0.25, // rad/s
  islandGrass: '#7fdc5a',
  islandDirt: '#8a5a44',
  islandTree: '#ff80c8',
  tagColor: '#edbd80',
  zzzColor: '#bfe0ff',
};

// Order = morph target index; the atmosphere SDF uses the same ids.
export const PLANET_SHAPES = ['sphere', 'ellipsoid', 'dodecahedron', 'icosahedron', 'torus', 'starTorus', 'roundCube'] as const;
export type PlanetShapeName = (typeof PLANET_SHAPES)[number];

export const PLANET_VIEW = {
  centerY: 0.6, // world units; same centre as the material-mode sphere
  radius: 0.6,
  ellipsoidY: 0.8, // polar scale of the ellipsoid
  torusMajor: 0.68, // in planet radii
  torusTube: 0.3,
  starOuter: 0.85, // star centreline radius at the tips, in planet radii
  starInner: 0.5, // valley radius / tip radius
  starTube: 0.18,
  roundCubeSize: 0.75, // face distance of the rounded cube, in planet radii
  faceYawDeg: 40, // sway centre: turns the face (object +Z) towards the default camera
  swaySpeed: 0.6, // rad/s of the sway sine
  gridU: 256, // morph grid: every planet shape is the same UV grid, so any shape can morph into any other
  gridV: 128,
  ringMin: 1.1, // ring mesh extent, in planet radii; the shader cuts the visible band inside it
  ringMax: 3.2,
  orbitTube: 0.004, // orbit line thickness, world units
  spaceBackground: '#0b0d1a',
  skyIntensity: 0.03, // the room IBL would light the night side; space has almost no sky light
};

// Neutral base; every planet preset starts from these values.
export const PLANET_DEFAULTS = {
  tiltDeg: 15,
  spinDegPerSec: 6,
  timeScale: 1, // 0 = pause every animation
  starRoundness: 0.5, // star torus: 0 = sharp tips, 1 = round
  morphSeconds: 1.2, // shape change duration; 0 = instant
  morphCycleSeconds: 0, // > 0: morph through every shape on a timer
  scaleX: 1, // object scale (UE: non-uniform actor scale); patterns stretch with it
  scaleY: 1,
  scaleZ: 1,
  swayDeg: 0, // > 0: rocks left-right around the face direction instead of spinning
  breath: 0, // squash-and-stretch pulse, 1 = 4% of the scale
  // Hologram scan transition (UE: Masked material, OpacityMask from object height)
  scanProgress: 1, // 0 = hidden, 1 = fully built
  scanColor: '#5fe8ff',
  scanWidth: 0.08, // glowing band below the front, in object heights
  scanSeconds: 2.5,
  // Terrain
  seed: 0,
  noiseScale: 1.6,
  warp: 0.35,
  detail: 5, // fbm octaves
  flowSpeed: 0.03, // domain-warp animation; high values make the surface flow like a liquid
  bump: 1, // height relief for the normal; 1 = 5% of the radius
  // Ocean and land: height ramp below / above sea level
  seaLevel: 0.5, // 0 = no ocean
  deepColor: '#24407a',
  shallowColor: '#3f8fc4',
  lowColor: '#5f8a4a',
  midColor: '#a89060',
  highColor: '#e8e2d8',
  terrace: 0, // 1 = low / mid / high as three flat tones with stepped relief
  surfaceEmissive: 0, // > 0: the surface colour is emitted and takes no light (UE: Unlit)
  oceanRoughness: 0.15,
  landRoughness: 0.8,
  polarCap: 0, // 0 = none, 1 = whole planet
  iceColor: '#f4f8ff',
  // Gas-giant bands: replaces the terrain height with latitude stripes
  bands: 0,
  bandFrequency: 6,
  bandTurbulence: 0.6,
  bandSpeedDegPerSec: 4, // equator speed; poles are slower
  bandTwist: 0, // whole turns of swirl around the axis; keep it an integer (no seam)
  // Voronoi cells (UE: Voronoi noise or a baked cell texture): cracks on the borders, dots, flat facets
  cellScale: 3, // cells per radius
  cellCracks: 0, // border grooves tinted with Cell Color
  cellCrackWidth: 0.05,
  cellDots: 0, // one domed dot per cell, Cell Color
  cellDotSize: 0.3, // dot radius, in cells
  cellFacets: 0, // flat tone and faux facet normal per cell (gem)
  cellColor: '#ffffff',
  cellGlow: 0, // emissive on the cell borders
  cellGlowColor: '#ff5a1f',
  // Marble: folds the height into stripes (stirred paint / milk)
  marble: 0,
  marbleFrequency: 6,
  // Machine panels: raised plates on a 3D lattice, grooved seams
  panels: 0,
  panelScale: 8, // lattice cells per radius
  panelSeam: 0.012, // groove width, in planet radii
  panelMetallic: 0.8,
  // Craters: bowls with raised rims on a 3D cell grid
  craters: 0,
  craterScale: 4, // cells per radius
  craterDensity: 0.5, // fraction of cells with a crater
  // Bubble: Fresnel opacity + thin film that follows the surface pattern (needs Thin Film > 0 for colour)
  bubble: 0,
  // Clouds
  cloudCover: 0,
  cloudSoftness: 0.08,
  cloudScale: 2.5,
  cloudSpeedDegPerSec: 3,
  cloudColor: '#ffffff',
  cloudShadow: 0.5, // clouds darken the ground on the sun side
  // Emissive: magma below a height, cracks, and city lights on the night side
  glowColor: '#ff5a1f',
  glowIntensity: 0,
  glowLevel: 0,
  glowCracks: 0,
  glowPulse: 0.5,
  cityColor: '#ffc070',
  cityIntensity: 0,
  cityDensity: 0.4,
  // Neon: emissive panel seams and height contour lines
  neonColor: '#ff3fd8', // low areas
  neonColorB: '#3ff0ff', // high areas
  neonIntensity: 0,
  neonSeams: 1,
  neonContours: 0, // contour lines over the full height range; 0 = off
  neonSpeed: 2,
  neonGrid: 0, // emissive latitude / longitude lines in Neon Color (hologram globe)
  // Aurora: two counter-rotating emissive curtains around both poles
  auroraIntensity: 0,
  auroraColor: '#40ff90',
  auroraColorB: '#ff50c0',
  // Parcel: tape cross (Mid Color), label (High Color) and a lamp (Neon Color) on the +Z face
  parcel: 0,
  // Face on the +Z side, drawn on the unit sphere so it follows the object scale
  face: 0, // 0 = none, 1 = open eyes, 2 = closed eyes, 3 = blush only
  faceColor: '#33203a',
  faceGlow: 0, // > 0: the face lines are emissive
  blush: 0,
  blushColor: '#ff80ad',
  whiskers: 0,
  // Atmosphere shell (UE: translucent additive mesh)
  atmoColor: '#7fd8ff',
  atmoIntensity: 1,
  atmoThickness: 0.12, // in planet radii
  atmoSunsetColor: '#ff8a5a', // scattering colour at the terminator and when back-lit
  atmoSunset: 1,
  // Hexagon energy shield (UE: additive translucent sphere)
  shieldIntensity: 0,
  shieldColor: '#5fd8ff',
  shieldRadius: 1.35, // in planet radii
  shieldHexCount: 24, // hexagons around the equator
  shieldHitRate: 0.5, // impacts per second
  // Ring (UE: translucent mesh, planet shadow from a sphere test)
  ringOpacity: 0,
  ringInner: 1.5, // in planet radii
  ringOuter: 2.4,
  ringColorA: '#fff0f6',
  ringColorB: '#b9a4ff',
  // Orbit lines with neon pulses (UE: additive mesh, Panner on U)
  orbitCount: 0,
  orbitRadius: 1.6, // in planet radii
  orbitSpacing: 0.35,
  orbitInclinationDeg: 25,
  orbitColor: '#7fd8ff',
  orbitColorB: '#ff7ad8', // used by the second orbit
  orbitIntensity: 1,
  orbitSpeedDegPerSec: 45,
  orbitPulses: 2,
  orbitPulseLength: 0.35, // fraction of the gap between pulses
  // Attachments: extra basic meshes around the planet (UE: components beside the sphere, not children of a scaled one)
  attach: 'none' as AttachName,
  earSize: 1,
  earSpacingDeg: 29, // angle from the top of the head
  earAngleDeg: 0, // outward lean
  earFlatDeg: 0, // backward lean
  accentColor: '#ff80ad', // inner ear
  collar: 0, // cat ears only: 1 = collar with a cargo tag
  collarColor: '#4cc7f2',
  zzz: 0, // cat ears only: floating sleep marks
};

export type PlanetPreset = Preset & {
  planet?: Partial<typeof PLANET_DEFAULTS>;
  shape?: PlanetShapeName;
  group?: string; // gallery heading; default 'Planets'
  light?: Partial<typeof LIGHT_DEFAULTS>; // only where the look needs its own sun (faces)
};
// Planets are round, so the object-height gradient and spherical normal are off by default.
export const PLANET_STYLE = { normalSoften: 0, gradientStrength: 0 };

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
      seaLevel: 0, lowColor: '#1a1016', midColor: '#3a2228', highColor: '#5e4040', landRoughness: 0.9, bump: 1.2, warp: 0.6, noiseScale: 1.4,
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
      orbitCount: 2, orbitColor: '#7fd8ff', orbitColorB: '#ffb35a', orbitIntensity: 0.8, orbitPulses: 1,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#3a4aff', shadeStrength: 0.1, terminatorColor: '#ff7a4a', terminatorIntensity: 0.25,
      terminatorWidth: 0.12, rimColor: '#7fd8ff', rimIntensity: 0.6, rimLightSide: 0.7,
    },
  },
  'Desert Dune': {
    planet: {
      seaLevel: 0, bands: 0.35, bandFrequency: 10, bandSpeedDegPerSec: 0, warp: 1.2, bump: 1,
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
  'Cyberpunk Megacity': {
    planet: {
      seaLevel: 0.42, deepColor: '#07051a', shallowColor: '#1a0f3d', lowColor: '#1b1830', midColor: '#2c2547',
      highColor: '#4a3d6b', landRoughness: 0.45, oceanRoughness: 0.08,
      panels: 0.6, panelScale: 14, panelSeam: 0.006, panelMetallic: 0.6,
      cityColor: '#ff4fd8', cityIntensity: 6, cityDensity: 0.6,
      neonColor: '#ff3fd8', neonColorB: '#3ff0ff', neonIntensity: 3, neonSeams: 0.6,
      cloudCover: 0.15, cloudColor: '#6a5a9a', atmoColor: '#ff4fd8', atmoIntensity: 1.2,
      orbitCount: 3, orbitColor: '#3ff0ff', orbitColorB: '#ff3fd8', orbitIntensity: 1.5, orbitPulses: 3,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#3a1aff', shadeStrength: 0.3, terminatorColor: '#ff3f8a', terminatorIntensity: 0.3,
      rimColor: '#3ff0ff', rimIntensity: 0.6, rimLightSide: -0.3,
    },
  },
  'Machine Star': {
    planet: {
      seaLevel: 0, lowColor: '#5a6170', midColor: '#8a919e', highColor: '#c9ced8', landRoughness: 0.4, warp: 0.3,
      panels: 1, panelScale: 6, panelSeam: 0.006, panelMetallic: 0.85, bump: 1.2,
      neonColor: '#5fd8ff', neonColorB: '#5fd8ff', neonIntensity: 3, neonSeams: 1, neonSpeed: 1.5,
      cityColor: '#9fe8ff', cityIntensity: 2, cityDensity: 0.5, atmoColor: '#5fd8ff', atmoIntensity: 0.3,
      orbitCount: 2, orbitColor: '#5fd8ff', orbitColorB: '#ffb35a', orbitRadius: 1.5, orbitPulses: 4,
      orbitPulseLength: 0.2, orbitSpeedDegPerSec: 90,
    },
    material: { clearCoat: 0.5, clearCoatRoughness: 0.1 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#4a5aff', shadeStrength: 0.2, terminatorColor: '#ff9a6a', terminatorIntensity: 0.15,
      terminatorWidth: 0.12, rimColor: '#9fe8ff', rimIntensity: 0.6, rimLightSide: -0.6,
    },
  },
  'Neon Synthwave': {
    planet: {
      seaLevel: 0, noiseScale: 1.2, detail: 3, lowColor: '#120a2a', midColor: '#1d1040', highColor: '#2a1650',
      landRoughness: 0.3, neonColor: '#ff3fa8', neonColorB: '#3fe8ff', neonIntensity: 2, neonContours: 8,
      neonSpeed: 3, atmoColor: '#ff3fa8', atmoIntensity: 1.5,
      orbitCount: 2, orbitColor: '#3fe8ff', orbitColorB: '#ff3fa8', orbitInclinationDeg: 15, orbitIntensity: 1.5,
    },
    material: { clearCoat: 0.8, clearCoatRoughness: 0.08 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#5a1aff', shadeStrength: 0.4, terminatorColor: '#ff3fa8', terminatorIntensity: 0.3,
      rimColor: '#ff7ad8', rimIntensity: 0.8, rimLightSide: 0,
    },
  },
  'Liquid Pearl': {
    planet: {
      seaLevel: 0, noiseScale: 1.5, detail: 3, warp: 1.2, flowSpeed: 0.25, bump: 1.2,
      lowColor: '#9aa3b8', midColor: '#c9cfe0', highColor: '#eef0ff', landRoughness: 0.08,
      atmoColor: '#d6a8ff', atmoIntensity: 0.8,
    },
    // Low metallic: planet mode has almost no sky light, so a full metal would only reflect the sun.
    material: { metallic: 0.2, clearCoat: 1, clearCoatRoughness: 0.05, thinFilm: 0.7, thinFilmThicknessNm: 450 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#7b5cff', shadeStrength: 0.3, terminatorColor: '#ff9ad8', terminatorIntensity: 0.3,
      rimColor: '#d6a8ff', rimIntensity: 0.7, rimWidth: 0.3,
    },
  },
  'Strawberry Milk': {
    planet: {
      seaLevel: 0, noiseScale: 1.2, detail: 2, warp: 1, flowSpeed: 0.12, marble: 1, marbleFrequency: 3, bump: 0.3,
      lowColor: '#ff8fb8', midColor: '#fff0f5', highColor: '#ff5c93', landRoughness: 0.3,
      atmoColor: '#ffb8d6', atmoIntensity: 1, orbitCount: 1, orbitColor: '#ffffff', orbitIntensity: 0.8,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.05, subsurfaceColor: '#5a1a2a', subsurfaceOpacity: 0.4 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#b45cff', shadeStrength: 0.35, terminatorColor: '#ff7a8a', terminatorIntensity: 0.4,
      rimColor: '#ffffff', rimIntensity: 0.5, rimWidth: 0.25,
    },
  },
  'Soap Bubble': {
    planet: {
      seaLevel: 0, bubble: 1, noiseScale: 0.9, detail: 3, warp: 1.2, flowSpeed: 0.15, bump: 0.15,
      lowColor: '#ffffff', midColor: '#eef6ff', highColor: '#fff0fa', landRoughness: 0.03, cloudShadow: 0,
      atmoColor: '#cfe8ff', atmoIntensity: 0.4, atmoSunset: 0.3, orbitCount: 1, orbitColor: '#ffd6f0', orbitIntensity: 0.8,
    },
    material: { thinFilm: 1, thinFilmThicknessNm: 900, thinFilmIor: 1.33, clearCoat: 0.5, clearCoatRoughness: 0.02 },
    stylized: { ...PLANET_STYLE, shadeStrength: 0, terminatorIntensity: 0, rimColor: '#ffffff', rimIntensity: 0.5, rimWidth: 0.15 },
  },
  'Mochi Moon': {
    planet: {
      seaLevel: 0, noiseScale: 1.5, detail: 3, warp: 0.2, bump: 1.2, craters: 1, craterScale: 4, craterDensity: 0.55,
      lowColor: '#c9b8d8', midColor: '#e8dcef', highColor: '#fff6fb', landRoughness: 0.85,
      atmoColor: '#ffd6f0', atmoIntensity: 0.3, atmoSunset: 0.5,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#9b7bff', shadeStrength: 0.4, terminatorColor: '#ff9ab8', terminatorIntensity: 0.4,
      rimColor: '#ffffff', rimIntensity: 0.3, outlineWidth: 2, outlineColor: '#5a3a6b',
    },
  },
  'Sunset Terra': {
    planet: {
      seaLevel: 0.5, noiseScale: 1.3, detail: 4, warp: 0.3, deepColor: '#16367a', shallowColor: '#2f7fb8',
      lowColor: '#4f7a3a', midColor: '#a8925a', highColor: '#ece6dc', polarCap: 0.15,
      cloudCover: 0.45, cloudSoftness: 0.12, cloudShadow: 0.8,
      atmoColor: '#5fb0ff', atmoIntensity: 1.4, atmoThickness: 0.1, atmoSunsetColor: '#ff6a2a', atmoSunset: 1.6,
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#3a4aff', shadeStrength: 0.15, terminatorColor: '#ff7a3a', terminatorIntensity: 0.2,
      terminatorWidth: 0.15, rimIntensity: 0,
    },
  },
  'Aegis Fortress': {
    planet: {
      seaLevel: 0, lowColor: '#4a5266', midColor: '#7a8396', highColor: '#b8c0d0', landRoughness: 0.4, warp: 0.3,
      panels: 1, panelScale: 10, panelSeam: 0.005, panelMetallic: 0.8,
      cityColor: '#ffb35a', cityIntensity: 3, cityDensity: 0.5,
      shieldIntensity: 1.2, shieldColor: '#5fd8ff', shieldRadius: 1.35, shieldHexCount: 24, shieldHitRate: 0.6,
      atmoIntensity: 0.3, atmoColor: '#5fd8ff', orbitCount: 2, orbitRadius: 1.7, orbitColor: '#ffb35a', orbitColorB: '#5fd8ff',
    },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#4a5aff', shadeStrength: 0.2, terminatorColor: '#ff9a6a', terminatorIntensity: 0.15,
      rimColor: '#9fe8ff', rimIntensity: 0.4, rimLightSide: -0.6,
    },
  },
  'Holo Blueprint': {
    planet: {
      seaLevel: 0, noiseScale: 1.2, detail: 3, lowColor: '#08142a', midColor: '#0c2140', highColor: '#123060',
      landRoughness: 0.35, neonColor: '#3fd8ff', neonColorB: '#9ff0ff', neonIntensity: 1.5, neonContours: 10,
      panels: 0.35, panelScale: 8, panelSeam: 0.004, neonSeams: 1, scanColor: '#5fe8ff', scanWidth: 0.12,
      atmoColor: '#3fd8ff', atmoIntensity: 0.8, orbitCount: 3, orbitColor: '#3fd8ff', orbitColorB: '#9ff0ff',
    },
    stylized: { ...PLANET_STYLE, shadeColor: '#1a3aff', shadeStrength: 0.3, terminatorIntensity: 0, rimColor: '#3fd8ff', rimIntensity: 0.8 },
  },
  'Donut Party': {
    shape: 'torus',
    planet: {
      tiltDeg: 55, seaLevel: 0.55, deepColor: '#d9a066', shallowColor: '#e8b47a', lowColor: '#ff9ec7', midColor: '#ffc4dd',
      highColor: '#fff0f6', oceanRoughness: 0.7, landRoughness: 0.35, noiseScale: 1.4, detail: 3, warp: 0.6, bump: 0.8,
      cityColor: '#ffffff', cityIntensity: 0, atmoColor: '#ffd6f0', atmoIntensity: 0.6,
      orbitCount: 2, orbitRadius: 1.4, orbitColor: '#7fd8ff', orbitColorB: '#ffe08a',
    },
    material: { clearCoat: 0.6, clearCoatRoughness: 0.1 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#b45cff', shadeStrength: 0.35, terminatorColor: '#ff7a8a', terminatorIntensity: 0.35,
      rimColor: '#ffffff', rimIntensity: 0.4, outlineWidth: 2, outlineColor: '#6b2a4a',
    },
  },
  'Lucky Star': {
    shape: 'starTorus',
    planet: {
      tiltDeg: 70, starRoundness: 0.6, seaLevel: 0, lowColor: '#ffb84a', midColor: '#ffd84a', highColor: '#fff2a8',
      landRoughness: 0.25, noiseScale: 1.3, detail: 3, bump: 0.6, neonColor: '#ff7ad8', neonColorB: '#ffe08a',
      neonIntensity: 1, neonContours: 6, atmoColor: '#ffe08a', atmoIntensity: 0.8,
      orbitCount: 2, orbitRadius: 1.45, orbitColor: '#ff7ad8', orbitColorB: '#7fd8ff',
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.05 },
    stylized: {
      ...PLANET_STYLE, shadeColor: '#ff7a5a', shadeStrength: 0.35, terminatorColor: '#ff5a8a', terminatorIntensity: 0.3,
      rimColor: '#fff6d0', rimIntensity: 0.5, outlineWidth: 2, outlineColor: '#7a4a1a',
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
  appMode: 'planet' as AppMode, // the page opens on the planet gallery
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
  flowSpeed: { min: 0, max: 1, step: 0.005 },
  marbleFrequency: { min: 1, max: 30, step: 0.1 },
  panelScale: { min: 2, max: 30, step: 0.1 },
  panelSeam: { min: 0.002, max: 0.05, step: 0.001 },
  neonIntensity: { min: 0, max: 20, step: 0.1 },
  neonContours: { min: 0, max: 40, step: 1 },
  neonSpeed: { min: -10, max: 10, step: 0.1 },
  orbitCount: { min: 0, max: 3, step: 1 },
  orbitRadius: { min: 1.1, max: 4, step: 0.01 },
  orbitSpacing: { min: 0, max: 1, step: 0.01 },
  orbitInclinationDeg: { min: 0, max: 90, step: 0.5 },
  orbitIntensity: { min: 0, max: 10, step: 0.1 },
  orbitSpeedDegPerSec: { min: -360, max: 360, step: 1 },
  orbitPulses: { min: 1, max: 12, step: 1 },
  orbitPulseLength: { min: 0.05, max: 1, step: 0.01 },
  morphSeconds: { min: 0, max: 5, step: 0.05 },
  morphCycleSeconds: { min: 0, max: 10, step: 0.1 },
  scanWidth: { min: 0.01, max: 0.4, step: 0.005 },
  scanSeconds: { min: 0.2, max: 10, step: 0.1 },
  craterScale: { min: 1, max: 12, step: 0.1 },
  atmoSunset: { min: 0, max: 3, step: 0.01 },
  shieldIntensity: { min: 0, max: 5, step: 0.01 },
  shieldRadius: { min: 1.05, max: 2.5, step: 0.01 },
  shieldHexCount: { min: 6, max: 64, step: 1 },
  shieldHitRate: { min: 0, max: 3, step: 0.05 },
  outlineWidth: { min: 0, max: 8, step: 0.1 },
  toonSteps: { min: 2, max: 4, step: 1 },
  toonSoftness: { min: 0, max: 0.5, step: 0.005 },
  scale: { min: 0.3, max: 1.5, step: 0.01 },
  swayDeg: { min: 0, max: 90, step: 1 },
  bandTwist: { min: -8, max: 8, step: 1 },
  cellScale: { min: 1, max: 12, step: 0.1 },
  cellCrackWidth: { min: 0.005, max: 0.3, step: 0.005 },
  cellDotSize: { min: 0.05, max: 0.6, step: 0.01 },
  cellGlow: { min: 0, max: 20, step: 0.1 },
  face: { min: 0, max: 3, step: 1 },
  earSize: { min: 0.6, max: 1.4, step: 0.01 },
  earSpacingDeg: { min: 10, max: 60, step: 1 },
  earAngleDeg: { min: -20, max: 40, step: 1 },
  earFlatDeg: { min: 0, max: 60, step: 1 },
  toggle: { min: 0, max: 1, step: 1 },
  renderScale: { min: 0.5, max: 2, step: 0.05 },
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
  maxRenderScale: 1.5, // default pixel-ratio cap; 2 on a Retina screen costs about 1.8x the GPU time
};
