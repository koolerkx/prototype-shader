import { PLANET_STYLE, type MATERIAL_DEFAULTS, type PLANET_DEFAULTS, type PlanetPreset, type STYLIZED_DEFAULTS } from './tuning';

// Gallery presets ported from the four design canvases (values there are examples, so these are starting points):
//   Stylized PBR v2.0 (15), Pure Toon v1.0 (12, the same surfaces with a fully stepped diffuse),
//   New Ideas v3.0 (9) and Cat-Ear v1.0 (9).

type Planet = Partial<typeof PLANET_DEFAULTS>;
type Material = Partial<typeof MATERIAL_DEFAULTS>;
type Stylized = Partial<typeof STYLIZED_DEFAULTS>;

/** NPR layer shared by the canvas looks: toon mix, tinted dark side, light-side rim; no shade lift or terminator. */
const look = (toonness: number, shadeColor: string, rimColor: string, over: Stylized = {}): Stylized => ({
  ...PLANET_STYLE, toonness, toonSteps: 2, toonSoftness: 0.08, shadeColor, shadeStrength: 0, terminatorIntensity: 0,
  rimColor, rimIntensity: 0.6, rimWidth: 0.22, rimSoftness: 0.06, rimLightSide: 0.5, ...over,
});

// --- The 15 surfaces of v2.0. `steps` is the tone count of the v1.0 toon version (first 12 only). ---
type Surface = { toon: number; shade: string; rim: string; steps?: number; planet: Planet; material?: Material; stylized?: Stylized; light?: PlanetPreset['light'] };

const SURFACES: Record<string, Surface> = {
  Terraced: {
    toon: 0.5, shade: '#8a80c8', rim: '#bfe6ff', steps: 2,
    planet: {
      seaLevel: 0, terrace: 1, noiseScale: 1.2, detail: 2, warp: 0.2, lowColor: '#7fc8a9', midColor: '#f2c57c',
      highColor: '#e58f8f', polarCap: 0.15, landRoughness: 0.65, atmoColor: '#bfe6ff', atmoIntensity: 0.6,
    },
  },
  Earthlike: {
    toon: 0.4, shade: '#6e78c0', rim: '#9fd8ff', steps: 2,
    planet: {
      seaLevel: 0.52, terrace: 1, noiseScale: 1.4, detail: 2, deepColor: '#2a59a0', shallowColor: '#3a7bd5', lowColor: '#f5e0a8',
      midColor: '#6cc66c', highColor: '#6cc66c', oceanRoughness: 0.12, landRoughness: 0.8, polarCap: 0.12,
      cloudCover: 0.4, cloudSoftness: 0.03, cloudSpeedDegPerSec: 14, atmoColor: '#9fd8ff',
    },
  },
  'Gas Giant': {
    toon: 0.4, shade: '#7a6fb8', rim: '#ffe6f0', steps: 3,
    planet: {
      tiltDeg: 25, seaLevel: 0, bands: 1, bandFrequency: 5, bandTurbulence: 0.5, terrace: 1, lowColor: '#c8b0e8',
      midColor: '#f8e8d0', highColor: '#ffc8a8', landRoughness: 0.45, bump: 0.4, atmoColor: '#ffe6f0', atmoIntensity: 0.6,
      ringOpacity: 0.85, ringInner: 1.3, ringOuter: 2.15, ringColorA: '#ffc8a8', ringColorB: '#f8e8d0',
    },
    material: { clearCoat: 0.4, clearCoatRoughness: 0.15, fuzzAmount: 0.2, fuzzColor: '#ffffff' },
  },
  Ice: {
    toon: 0.3, shade: '#7fa0e0', rim: '#cff4ff', steps: 3,
    planet: {
      seaLevel: 0, terrace: 1, noiseScale: 1.5, detail: 2, lowColor: '#cfe8ff', midColor: '#a8d0f0', highColor: '#a8d0f0',
      polarCap: 0.4, landRoughness: 0.18, cellScale: 4, cellCracks: 1, cellCrackWidth: 0.05, cellColor: '#6a90c8',
      atmoColor: '#cff4ff', atmoIntensity: 0.6,
    },
    material: { clearCoat: 0.6, clearCoatRoughness: 0.05, subsurfaceColor: '#3a6ea8', subsurfaceOpacity: 0.4 },
  },
  Lava: {
    toon: 0.5, shade: '#4a3050', rim: '#ff7a40', steps: 2,
    planet: {
      seaLevel: 0, noiseScale: 2, detail: 2, lowColor: '#3a2a30', midColor: '#2a2438', highColor: '#3a2a30',
      landRoughness: 0.85, cellScale: 3, cellCrackWidth: 0.08, cellGlow: 2.2, cellGlowColor: '#ff4a14',
      atmoColor: '#ff7a40', atmoIntensity: 0.6,
    },
  },
  'Neon Star': {
    toon: 0, shade: '#ffffff', rim: '#40f0ff', steps: 2,
    planet: {
      spinDegPerSec: 9, seaLevel: 0, terrace: 1, noiseScale: 1.5, detail: 2, warp: 1.2, flowSpeed: 0.15, bump: 0,
      lowColor: '#ff4fb0', midColor: '#ffb040', highColor: '#fff6d0', surfaceEmissive: 1.1,
      atmoColor: '#40f0ff', atmoIntensity: 0.9, atmoThickness: 0.3, atmoSunset: 0,
    },
    stylized: { rimIntensity: 1.5, rimWidth: 0.3, rimLightSide: 0, outlineWidth: 0 }, // unlit: no outline in the toon version either
  },
  'Candy Stripe': {
    toon: 0.5, shade: '#b080c0', rim: '#ffe0f0', steps: 2,
    planet: {
      tiltDeg: 20, seaLevel: 0, bands: 1, bandFrequency: 8, bandTurbulence: 0, bandTwist: 3, bandSpeedDegPerSec: 0,
      terrace: 1, lowColor: '#ff9ec8', midColor: '#ffffff', highColor: '#9ef0d0', landRoughness: 0.35, bump: 0.6,
      atmoColor: '#ffe0f0', atmoIntensity: 0.5,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.04, subsurfaceColor: '#7a2a50', subsurfaceOpacity: 0.6 },
  },
  'Mushroom Dots': {
    toon: 0.6, shade: '#9050a0', rim: '#ffe0d0', steps: 2,
    planet: {
      seaLevel: 0, lowColor: '#e8434a', midColor: '#e8434a', highColor: '#e8434a', landRoughness: 0.55, bump: 1.2,
      detail: 1, cellScale: 3, cellDots: 1, cellDotSize: 0.42, cellColor: '#fff4e8', atmoColor: '#ffe0d0', atmoIntensity: 0.5,
    },
    material: { clearCoat: 0.2, fuzzAmount: 0.2, fuzzColor: '#fff4e8' },
  },
  Crystal: {
    toon: 0.5, shade: '#5040a0', rim: '#d0c0ff', steps: 3,
    planet: {
      spinDegPerSec: 4, seaLevel: 0, bump: 0.5, lowColor: '#a070f0', midColor: '#50d8f0', highColor: '#f0e0ff',
      landRoughness: 0.08, cellScale: 3.5, cellFacets: 1, cellCrackWidth: 0.03, cellGlow: 1.2, cellGlowColor: '#80f0ff',
      atmoColor: '#d0c0ff', atmoIntensity: 0.6,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.03, subsurfaceColor: '#3a2a80', subsurfaceOpacity: 0.6 },
  },
  Desert: {
    toon: 0.5, shade: '#a0608a', rim: '#ffc080', steps: 2,
    planet: {
      seaLevel: 0, bands: 0.5, bandFrequency: 18, bandTurbulence: 0.5, bandSpeedDegPerSec: 0, warp: 0.8, terrace: 1,
      lowColor: '#c06838', midColor: '#e08848', highColor: '#f0a860', landRoughness: 0.9,
      craters: 1, craterScale: 1.6, craterDensity: 0.2, atmoColor: '#ffc080', atmoIntensity: 0.7,
    },
    material: { fuzzAmount: 0.3, fuzzColor: '#ffd9a8' },
    stylized: { rimWidth: 0.3 },
  },
  Aurora: {
    toon: 0.4, shade: '#303070', rim: '#6080ff', steps: 2,
    planet: {
      tiltDeg: 35, seaLevel: 0, noiseScale: 1.5, detail: 1, bump: 0.3, lowColor: '#1a2050', midColor: '#283070',
      highColor: '#283070', landRoughness: 0.5, auroraIntensity: 1.5, atmoColor: '#6080ff', atmoIntensity: 0.8,
    },
    material: { clearCoat: 0.3 },
  },
  'Moon Rock': {
    toon: 0.6, shade: '#5a5a90', rim: '#e0e0ff', steps: 2,
    planet: {
      seaLevel: 0, noiseScale: 1.5, detail: 3, bump: 1.5, heightAO: 1, lowColor: '#8c8ca0', midColor: '#a8a8b8',
      highColor: '#a8a8b8', landRoughness: 0.95, craters: 1, craterScale: 3, craterDensity: 0.5,
      atmoColor: '#e0e0ff', atmoIntensity: 0.3,
    },
    stylized: { rimWidth: 0.15, rimIntensity: 0.4 },
  },
  Jelly: {
    toon: 0.3, shade: '#c070b0', rim: '#ffe0f0',
    planet: {
      seaLevel: 0, noiseScale: 2, detail: 2, warp: 0.6, flowSpeed: 0.1, bump: 0.5, lowColor: '#ff8fc8', midColor: '#ffc0e0',
      highColor: '#ffc0e0', landRoughness: 0.25, cellScale: 2.6, cellDots: 1, cellShape: 2, cellDotSize: 0.36, cellColor: '#fff0f8',
      atmoColor: '#ffe0f0', atmoIntensity: 0.5,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.03, subsurfaceColor: '#ff4f9a', subsurfaceOpacity: 0.2 },
  },
  Machine: {
    toon: 0.5, shade: '#6a70a0', rim: '#d0e8ff',
    planet: {
      seaLevel: 0, warp: 0.3, panels: 1, panelScale: 5, panelSeam: 0.012, panelMetallic: 0.6, lowColor: '#c8ccd8',
      midColor: '#c8ccd8', highColor: '#8fd0ff', landRoughness: 0.28, bump: 1.2, cityColor: '#ff6fb0', cityIntensity: 3,
      cityDensity: 0.5, neonColor: '#ff6fb0', neonColorB: '#ff6fb0', neonIntensity: 2, atmoColor: '#d0e8ff', atmoIntensity: 0.3,
    },
  },
  'Cotton Cloud': {
    toon: 0.4, shade: '#a898d8', rim: '#ffffff',
    planet: {
      seaLevel: 0, terrace: 1, noiseScale: 1.8, detail: 2, warp: 0.3, flowSpeed: 0.05, bump: 1.2, lowColor: '#d8c8f8', midColor: '#ffffff',
      highColor: '#ffffff', landRoughness: 1, atmoColor: '#ffffff', atmoIntensity: 0.5,
    },
    material: { fuzzAmount: 0.6, fuzzColor: '#f4eeff', fuzzRoughness: 0.6, subsurfaceColor: '#6a5aa8', subsurfaceOpacity: 0.5 },
  },
};

const stylizedPbr = Object.entries(SURFACES).map(([name, s]): [string, PlanetPreset] => [name, {
  group: 'Stylized PBR v2.0', planet: s.planet, material: s.material, light: s.light,
  stylized: look(s.toon, s.shade, s.rim, s.stylized),
}]);

// v1.0: stepped diffuse only (10% PBR residual), hard rim, inverted-hull outline, no shading layers.
const pureToon = Object.entries(SURFACES).filter(([, s]) => s.steps).map(([name, s]): [string, PlanetPreset] => [`Toon ${name}`, {
  group: 'Pure Toon v1.0', planet: s.planet, light: s.light,
  stylized: look(1, s.shade, s.rim, { toonSteps: s.steps, toonSoftness: 0, rimSoftness: 0, outlineWidth: 1.5, outlineColor: '#2a2040', ...s.stylized }),
}]);

// --- v3.0: nine new ideas. ---
const IDEAS: Record<string, PlanetPreset> = {
  'Floating Islands': {
    planet: {
      spinDegPerSec: 8, scaleX: 0.62, scaleY: 0.62, scaleZ: 0.62, seaLevel: 0, bands: 1, bandFrequency: 0.5, bandTurbulence: 0.35,
      bandSpeedDegPerSec: 0, terrace: 1, bump: 0, lowColor: '#ff99c7', midColor: '#a8bfe0', highColor: '#4de0e6',
      landRoughness: 0.18, attach: 'islands', atmoColor: '#66fff2', atmoIntensity: 0.8,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.05, subsurfaceColor: '#5a1a3a', subsurfaceOpacity: 0.5 },
    stylized: look(0.4, '#8a70c8', '#66fff2', { rimIntensity: 0.9 }),
  },
  'Pastel Ring Giant': {
    planet: {
      tiltDeg: 25, seaLevel: 0, bands: 1, bandFrequency: 5, bandTurbulence: 0.7, terrace: 1, bump: 0.3, lowColor: '#fff2d6',
      midColor: '#ffc9a8', highColor: '#c9b3f0', landRoughness: 0.4, atmoColor: '#d9b3ff', atmoIntensity: 0.9,
      ringOpacity: 0.8, ringInner: 1.35, ringOuter: 2.15, ringColorA: '#ffeed1', ringColorB: '#d1b8fa',
    },
    material: { clearCoat: 0.5, clearCoatRoughness: 0.1, anisotropy: 0.6 },
    stylized: look(0.4, '#8a70c8', '#d9b3ff', { rimIntensity: 0.9 }),
  },
  Amethyst: {
    planet: {
      spinDegPerSec: 5, seaLevel: 0, bump: 0.4, lowColor: '#662ed1', midColor: '#cc9eff', highColor: '#e8d8ff',
      landRoughness: 0.06, cellScale: 2.3, cellFacets: 1, cellCrackWidth: 0.035, cellGlow: 0.5, cellGlowColor: '#ebd1ff',
      atmoColor: '#b366ff', atmoIntensity: 0.7,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.03, thinFilm: 0.7, thinFilmThicknessNm: 450 },
    stylized: look(0.4, '#5040a0', '#bf80ff', { rimIntensity: 0.9 }),
  },
  // Opaque glossy shell with the galaxy marched inside it; real see-through glass is left out (see ueFeasibility).
  'Nebula Glass': {
    planet: {
      tiltDeg: 50, spinDegPerSec: 10, seaLevel: 0, detail: 1, bump: 0, heightAO: 0, lowColor: '#0d0826', midColor: '#0d0826',
      highColor: '#0d0826', landRoughness: 0.04, nebula: 1.6, neonColor: '#ff59d9', neonColorB: '#59d9ff',
      atmoColor: '#cc99ff', atmoIntensity: 0.9,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.02 },
    stylized: look(0, '#ffffff', '#ccb3ff', { rimIntensity: 0.9, rimWidth: 0.3, rimLightSide: 0 }),
  },
  Hologram: {
    planet: {
      spinDegPerSec: 20, seaLevel: 0, bump: 0, lowColor: '#04121c', midColor: '#04121c', highColor: '#04121c', landRoughness: 0.4,
      bubble: 1, neonGrid: 1.4, neonColor: '#40e6ff', scanColor: '#40e6ff', scanOnSelect: 1, atmoColor: '#40e6ff', atmoIntensity: 0.6, atmoSunset: 0,
      orbitCount: 1, orbitRadius: 1.32, orbitInclinationDeg: 0, orbitColor: '#40e6ff', orbitIntensity: 1.2, orbitPulses: 4,
    },
    stylized: look(0, '#ffffff', '#40e6ff', { rimIntensity: 1, rimWidth: 0.35, rimSoftness: 0.3, rimLightSide: 0 }),
  },
  Portal: {
    shape: 'torus',
    planet: {
      tiltDeg: 55, spinDegPerSec: 0, seaLevel: 0, bump: 0, lowColor: '#f259d9', midColor: '#f259d9', highColor: '#f259d9',
      landRoughness: 0.2, attach: 'vortex', deepColor: '#40107a', neonColor: '#ff4de6', neonColorB: '#66f2ff',
      atmoColor: '#ff66f2', atmoIntensity: 1,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.05, emissiveColor: '#ff59e6', emissiveIntensity: 0.5 },
    stylized: look(0.4, '#7030c0', '#ff80ff', { rimIntensity: 1, rimLightSide: 0 }),
  },
  'Cat Ear': {
    planet: {
      tiltDeg: 5, swayDeg: 20, seaLevel: 0, bump: 0, lowColor: '#ffb4ad', midColor: '#ffb4ad', highColor: '#ffb4ad',
      landRoughness: 0.28, attach: 'catEars', accentColor: '#ff80ad', face: 3, blush: 1, blushColor: '#ff7399',
      atmoColor: '#ffb8d9', atmoIntensity: 0.4,
    },
    material: { clearCoat: 0.8, clearCoatRoughness: 0.05, subsurfaceColor: '#a03a50', subsurfaceOpacity: 0.4 },
    stylized: look(0.4, '#b088d0', '#ffb8d9', { rimIntensity: 0.7 }),
  },
  'Whale Trail': {
    planet: {
      scaleX: 0.75, scaleY: 0.75, scaleZ: 0.75, seaLevel: 0, bands: 1, bandFrequency: 0.5, bandTurbulence: 0.5, bandSpeedDegPerSec: 0,
      bump: 0, lowColor: '#73e6ff', midColor: '#b8c7f5', highColor: '#ffa8e6', landRoughness: 0.15, attach: 'whaleTrail',
      neonColor: '#ff80e6', neonColorB: '#4df2ff', atmoColor: '#73f2ff', atmoIntensity: 0.8,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.05, subsurfaceColor: '#205a70', subsurfaceOpacity: 0.5 },
    stylized: look(0.4, '#7080d0', '#73f2ff', { rimIntensity: 0.9 }),
  },
  'Parcel Box': {
    shape: 'roundCube',
    planet: {
      tiltDeg: 20, spinDegPerSec: 14, seaLevel: 0, detail: 1, bump: 0.6, lowColor: '#ffadcc', midColor: '#fad18c', highColor: '#fff7eb',
      landRoughness: 0.25, parcel: 1, neonColor: '#66f2ff', atmoColor: '#ffb3d9', atmoIntensity: 0.4,
    },
    material: { clearCoat: 0.8, clearCoatRoughness: 0.08 },
    stylized: look(0.4, '#b080c8', '#ffb3d9'),
  },
};

// --- Cat-Ear v1.0: nine variants of one material; only params change. ---
const cat = (body: string, inner: string, planet: Planet, material: Material = {}, stylized: Stylized = {}): PlanetPreset => ({
  planet: {
    tiltDeg: 5, swayDeg: 20, seaLevel: 0, bump: 0, detail: 2, lowColor: body, midColor: body, highColor: body, deepColor: body,
    shallowColor: body, oceanRoughness: 0.28, landRoughness: 0.28, attach: 'catEars', accentColor: inner, face: 1, blush: 1,
    blushColor: inner, atmoColor: inner, atmoIntensity: 0.3, ...planet,
  },
  material: { clearCoat: 0.9, clearCoatRoughness: 0.05, subsurfaceColor: '#803048', subsurfaceOpacity: 0.5, ...material },
  stylized: look(0.4, '#b088d0', '#ffd0e4', { rimIntensity: 0.7, ...stylized }),
});
const SOFT: Material = { clearCoat: 0.35, clearCoatRoughness: 0.2, subsurfaceColor: '#ff8fa8', subsurfaceOpacity: 0.2 }; // mochi

const CATS: Record<string, PlanetPreset> = {
  'Cat Classic': cat('#ffb8b3', '#ff80ad', {}),
  'Cat Mochi': cat('#fff2ed', '#ff99bd', {
    tiltDeg: 8, scaleX: 1.15, scaleY: 0.7, scaleZ: 1, earSize: 0.85, earAngleDeg: 3, earSpacingDeg: 41, breath: 0.5,
    oceanRoughness: 0.5, landRoughness: 0.5,
  }, SOFT),
  'Cat Egg': cat('#ccb8ff', '#ff99d1', { scaleX: 0.8, scaleY: 1.12, scaleZ: 0.84, earSize: 0.9, earAngleDeg: 20, earSpacingDeg: 24 }),
  'Cat Tabby': cat('#ffc780', '#ff99b3', {
    tiltDeg: 8, scaleX: 1, scaleY: 0.93, scaleZ: 0.95, earAngleDeg: 6, earSpacingDeg: 30, whiskers: 1,
    bands: 1, bandFrequency: 4.8, bandTurbulence: 0.8, bandSpeedDegPerSec: 0, terrace: 1, highColor: '#e0732f',
  }),
  // Sea level shifts the terrace cuts, so most of the coat stays white.
  'Cat Calico': cat('#fff7eb', '#ff9eb8', {
    tiltDeg: 8, scaleX: 1.02, scaleY: 0.92, scaleZ: 0.96, earSize: 0.95, earAngleDeg: 6, earSpacingDeg: 32,
    seaLevel: 0.25, noiseScale: 1.7, terrace: 1, midColor: '#ff994d', highColor: '#47383f',
  }),
  'Cat Sleeping': cat('#c2dbff', '#ffa8cc', {
    tiltDeg: 10, swayDeg: 8, scaleX: 1.15, scaleY: 0.7, scaleZ: 0.98, earSize: 0.85, earAngleDeg: 11, earSpacingDeg: 38,
    earFlatDeg: 43, face: 2, breath: 1, zzz: 1, oceanRoughness: 0.5, landRoughness: 0.5,
  }, SOFT),
  'Cat Neon': cat('#1f1a3d', '#ff59d9', {
    earAngleDeg: 3, earSpacingDeg: 30, whiskers: 1, blush: 0, faceColor: '#4df2ff', faceGlow: 2, oceanRoughness: 0.3, landRoughness: 0.3,
  }, { clearCoat: 1, subsurfaceColor: '#000000' }, { rimColor: '#4df2ff', rimIntensity: 1.4, rimLightSide: 0, shadeColor: '#4a3a90' }),
  'Cat Plush': cat('#fac7db', '#ff99bf', {
    tiltDeg: 6, scaleX: 1.06, scaleY: 0.9, scaleZ: 1, earSize: 0.95, earAngleDeg: 6, earSpacingDeg: 32, noiseScale: 8, detail: 1,
    bump: 0.5, oceanRoughness: 0.85, landRoughness: 0.85,
  }, { clearCoat: 0, fuzzAmount: 1, fuzzColor: '#ffffff', fuzzRoughness: 0.7 }),
  'Cat Courier': cat('#ffb3cc', '#ff8cb8', {
    tiltDeg: 10, scaleX: 1, scaleY: 0.88, scaleZ: 0.95, earSize: 0.95, earAngleDeg: 6, earSpacingDeg: 31, collar: 1,
  }),
};

// --- Toy Squadron v4.0: Mario Kart cute + ASTRO BOT toy plastic + Ace Combat cool. ---
// Shared cues: a tinted fill on the dark side (never black), a wide soft Clear Coat highlight (moulded plastic),
// chunky low-detail shapes with bevel strips, and squadron accents (orbit pulses, panel seams, city lights).
const toyLook = (toon: number, shade: string, rim: string, over: Stylized = {}): Stylized =>
  look(toon, shade, rim, { shadeStrength: 0.12, rimIntensity: 0.6, ...over });
const PLASTIC: Material = { clearCoat: 0.8, clearCoatRoughness: 0.16 };

const TOYS: Record<string, PlanetPreset> = {
  'Toy Terra': {
    planet: {
      seaLevel: 0.5, terrace: 1, noiseScale: 1.3, detail: 2, warp: 0.2, bump: 1.4, deepColor: '#1f55c8', shallowColor: '#3fa8f0',
      lowColor: '#6fd05a', midColor: '#38a85a', highColor: '#e8b86a', oceanRoughness: 0.1, landRoughness: 0.45, polarCap: 0.1,
      bevel: 1, foam: 1, cloudCover: 0.28, cloudSoftness: 0.02, cloudScale: 2, cloudPuff: 1, cloudSpeedDegPerSec: 10,
      atmoColor: '#9fe0ff', atmoIntensity: 0.8,
    },
    material: PLASTIC,
    stylized: toyLook(0.5, '#7a70d8', '#bfeaff'),
  },
  'Night Sortie': {
    planet: {
      tiltDeg: 23.4, spinDegPerSec: 4, seaLevel: 0.5, noiseScale: 1.4, detail: 3, warp: 0.3, bump: 1.2, deepColor: '#0c1c40',
      shallowColor: '#1f4a8a', lowColor: '#2c4a52', midColor: '#3f6260', highColor: '#9aa8b0', oceanRoughness: 0.1, landRoughness: 0.6,
      polarCap: 0.1, bevel: 0.7, foam: 0.6, cloudCover: 0.38, cloudSoftness: 0.04, cloudPuff: 1, cloudShadow: 0.8,
      cityColor: '#ffb35a', cityIntensity: 5, cityDensity: 0.5,
      atmoColor: '#4fb6ff', atmoIntensity: 1.5, atmoThickness: 0.09, atmoSunsetColor: '#ff6a2a', atmoSunset: 1.6,
      orbitCount: 2, orbitRadius: 1.45, orbitColor: '#7fd8ff', orbitColorB: '#ffb35a', orbitPulses: 1, orbitPulseLength: 0.2, orbitSpeedDegPerSec: 80,
    },
    material: { clearCoat: 0.5, clearCoatRoughness: 0.14 },
    stylized: toyLook(0.3, '#3a4ac8', '#7fd8ff', { shadeStrength: 0.2, terminatorColor: '#ff7a4a', terminatorIntensity: 0.25, terminatorWidth: 0.12, rimLightSide: 0.7 }),
  },
  'Candy Circuit': {
    planet: {
      tiltDeg: 22, seaLevel: 0, bands: 1, bandFrequency: 4, bandTurbulence: 0.25, bandSpeedDegPerSec: 6, terrace: 1, bump: 0.8,
      lowColor: '#ff8fc0', midColor: '#fff3d0', highColor: '#6fd8f0', landRoughness: 0.3, bevel: 1, sparkle: 0.7,
      atmoColor: '#ffd0ec', atmoIntensity: 0.6, ringOpacity: 0.85, ringInner: 1.35, ringOuter: 2.1, ringColorA: '#fff3d0', ringColorB: '#ff9ed0',
      orbitCount: 2, orbitRadius: 2.3, orbitSpacing: 0.2, orbitInclinationDeg: 8, orbitColor: '#6ff0ff', orbitColorB: '#ffe066', orbitPulses: 5,
      orbitPulseLength: 0.5, orbitSpeedDegPerSec: 70,
    },
    material: { ...PLASTIC, clearCoat: 1 },
    stylized: toyLook(0.5, '#a070d0', '#ffe0f4'),
  },
  // White plastic shell, a few blue plates, glowing eyes that blink.
  'Robo Pal': {
    planet: {
      tiltDeg: 6, swayDeg: 14, breath: 0.5, seaLevel: 0, warp: 0, terrace: 1, panels: 1, panelScale: 2.5, panelSeam: 0.014, panelMetallic: 0,
      bump: 1.2, lowColor: '#cfd6e6', midColor: '#2f78f0', highColor: '#cfd6e6', landRoughness: 0.3, bevel: 0.6,
      face: 1, faceColor: '#4fe8ff', faceGlow: 1.1, blink: 1, blush: 0.6, blushColor: '#8fd8ff',
      neonColor: '#4fe8ff', neonColorB: '#4fe8ff', neonIntensity: 0.6, neonSeams: 1, neonSpeed: 1.5,
      atmoColor: '#9fe8ff', atmoIntensity: 0.4, orbitCount: 1, orbitRadius: 1.4, orbitColor: '#4fe8ff', orbitPulses: 3,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.12 },
    stylized: toyLook(0.4, '#8a90e0', '#cfeeff'),
  },
  'Strike Base': {
    planet: {
      tiltDeg: 18, spinDegPerSec: 5, seaLevel: 0, warp: 0.2, terrace: 1, panels: 1, panelScale: 5, panelSeam: 0.01, panelMetallic: 0.45,
      bump: 1.3, lowColor: '#46536e', midColor: '#ff8a2a', highColor: '#5c6b8a', landRoughness: 0.38, bevel: 0.8,
      cityColor: '#ffd08a', cityIntensity: 3, cityDensity: 0.5, neonColor: '#5fd8ff', neonColorB: '#5fd8ff', neonIntensity: 2.5,
      neonSeams: 1, neonSpeed: 1.5, shieldIntensity: 0.9, shieldColor: '#5fd8ff', shieldRadius: 1.3, shieldHexCount: 20, shieldHitRate: 0.5,
      atmoColor: '#5fd8ff', atmoIntensity: 0.3, orbitCount: 2, orbitRadius: 1.65, orbitColor: '#ff8a2a', orbitColorB: '#5fd8ff',
      orbitPulses: 2, orbitPulseLength: 0.2, orbitSpeedDegPerSec: 90,
    },
    material: { clearCoat: 0.6, clearCoatRoughness: 0.14 },
    stylized: toyLook(0.35, '#4a5ad0', '#9fe8ff', { shadeStrength: 0.22, rimLightSide: -0.5 }),
  },
  // Two shells and a seam band, like a capsule-toy ball.
  'Gacha Capsule': {
    planet: {
      tiltDeg: 28, spinDegPerSec: 12, seaLevel: 0, bands: 1, bandFrequency: 0.5, bandTurbulence: 0, bandSpeedDegPerSec: 0, terrace: 1,
      bump: 1, lowColor: '#fff6ee', midColor: '#ffd23f', highColor: '#ff4f6a', landRoughness: 0.22, bevel: 1, sparkle: 0.5,
      atmoColor: '#ffd0d8', atmoIntensity: 0.4, orbitCount: 1, orbitRadius: 1.4, orbitInclinationDeg: 20, orbitColor: '#ffe066', orbitPulses: 4,
    },
    material: { clearCoat: 1, clearCoatRoughness: 0.1, subsurfaceColor: '#7a1a2a', subsurfaceOpacity: 0.5 },
    stylized: toyLook(0.45, '#b070c8', '#ffe8ee'),
  },
  'Polka Cube': {
    shape: 'roundCube',
    planet: {
      tiltDeg: 22, spinDegPerSec: 12, seaLevel: 0, detail: 1, bump: 1.2, lowColor: '#3fc8b8', midColor: '#3fc8b8', highColor: '#3fc8b8',
      landRoughness: 0.3, cellScale: 2.6, cellDots: 1, cellDotSize: 0.4, cellColor: '#fff8e8', sparkle: 0.8,
      atmoColor: '#bff4ea', atmoIntensity: 0.4,
    },
    material: PLASTIC,
    stylized: toyLook(0.5, '#6a70c8', '#dffff8', { outlineWidth: 1.5, outlineColor: '#1f5a5a' }),
  },
  // Squadron livery on a cat: white coat, navy stripes, orange accents, blinking eyes.
  'Pilot Cat': cat('#eef2fa', '#ff9a3a', {
    tiltDeg: 8, scaleX: 1.02, scaleY: 0.92, scaleZ: 0.96, earAngleDeg: 6, earSpacingDeg: 31, whiskers: 1, blink: 1,
    bands: 1, bandFrequency: 3.6, bandTurbulence: 0.5, bandSpeedDegPerSec: 0, terrace: 1, highColor: '#3d4f85', bevel: 0.6,
    collar: 1, collarColor: '#ff9a3a', blushColor: '#ffb0a0',
    orbitCount: 1, orbitRadius: 1.75, orbitInclinationDeg: 12, orbitColor: '#ff9a3a', orbitPulses: 2, orbitPulseLength: 0.2, orbitSpeedDegPerSec: 80,
  }, { clearCoat: 0.9, clearCoatRoughness: 0.14 }, { shadeStrength: 0.3 }),
};

const grouped = (group: string, presets: Record<string, PlanetPreset>) =>
  Object.entries(presets).map(([name, p]): [string, PlanetPreset] => [name, { ...p, group }]);

export const GALLERY_PRESETS: Record<string, PlanetPreset> = Object.fromEntries([
  ...grouped('Toy Squadron v4.0', TOYS), ...stylizedPbr, ...pureToon, ...grouped('New Ideas v3.0', IDEAS), ...grouped('Cat-Ear v1.0', CATS),
]);
