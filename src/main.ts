import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import {
  APP_MODES, DEG2RAD, LIGHT_DEFAULTS, MATERIAL_DEFAULTS, MATERIAL_MODES, PLANET_DEFAULT_PRESET, PLANET_DEFAULTS,
  PLANET_PRESET_NAMES, PLANET_PRESETS, PLANET_SHAPES, PLANET_VIEW, PRESET_NAMES, PRESETS, RANGES, SCENE_DEFAULTS, SHAPES,
  STYLIZED_DEFAULTS, TONE_MAPPINGS, VIEW, type AppMode, type PlanetPreset, type PlanetPresetName, type Preset,
  type PresetName, type ToneMappingName,
} from './config/tuning';
import { createPlanetGeometry, createPrimitive } from './geometry/primitives';
import { applyDefaultLit, createDefaultLit } from './materials/defaultLit';
import {
  addPlanetLayer, applyAtmosphere, applyOrbits, applyPlanet, applyRing, createAtmosphere, createOrbits, createRing,
  updateOrbits, updatePlanetFrame, updatePlanetView,
} from './materials/planet';
import { addStylizedLayer, applyStylized, setStylizedBounds, updateStylizedView } from './materials/stylized';
import { createPanel } from './ui/panel';

const viewport = document.getElementById('viewport')!;
const panelRoot = document.getElementById('panel')!;

// --- Renderer / scene / camera ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.autoClear = false; // ViewHelper draws on top of the main pass
renderer.setClearColor(VIEW.background);
viewport.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(VIEW.fovDeg, 1, 0.05, 200);
camera.position.set(...VIEW.cameraPosition);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(...VIEW.target);
controls.enableDamping = true;
controls.update();

// --- Lighting: sun (directional) + sky (IBL), like a default UE5 level ---
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const sun = new THREE.DirectionalLight();
sun.castShadow = true;
sun.shadow.mapSize.setScalar(VIEW.shadowMapSize);
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, {
  left: -VIEW.shadowExtent, right: VIEW.shadowExtent, top: VIEW.shadowExtent, bottom: -VIEW.shadowExtent,
});
scene.add(sun);

// --- Helpers: grid, origin axes, shadow catcher, corner XYZ gizmo ---
const grid = new THREE.GridHelper(VIEW.gridSize, VIEW.gridDivisions, 0x5a5f68, 0x3c4047);
scene.add(grid);
const axes = new THREE.AxesHelper(VIEW.gridSize / 2);
axes.position.y = 0.002; // avoid z-fighting with the grid
scene.add(axes);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(VIEW.gridSize, VIEW.gridSize).rotateX(-Math.PI / 2),
  new THREE.ShadowMaterial({ opacity: 0.35 }),
);
ground.receiveShadow = true;
scene.add(ground);

const viewHelper = new ViewHelper(camera, renderer.domElement);
viewHelper.center = controls.target;
const down = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => down.set(e.clientX, e.clientY));
renderer.domElement.addEventListener('pointerup', (e) => {
  if (down.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) < 4) viewHelper.handleClick(e);
});

// --- Test object ---
const sceneParams = { ...SCENE_DEFAULTS };
const matParams = { ...MATERIAL_DEFAULTS };
const lightParams = { ...LIGHT_DEFAULTS };
const styleParams = { ...STYLIZED_DEFAULTS };

const material = createDefaultLit();
const styleUniforms = addStylizedLayer(material);
const planetUniforms = addPlanetLayer(material); // inert (uPlanet = 0) in material mode
const pivot = new THREE.Group(); // planet mode: centre height and axial tilt; identity in material mode
scene.add(pivot);
const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
mesh.castShadow = mesh.receiveShadow = true;
pivot.add(mesh);
const atmosphere = createAtmosphere(); // child of the mesh: spins and tilts with it
mesh.add(atmosphere);
const ring = createRing(); // child of the pivot: tilts with the axis, does not spin
pivot.add(ring);
const orbits = createOrbits(); // child of the pivot: own inclinations, do not spin with the surface
pivot.add(orbits);
const localCenter = new THREE.Vector3();
const meshCenter = new THREE.Vector3(); // world space, per frame
const sunDir = new THREE.Vector3();

// Each app mode keeps its own Material, NPR and Lighting params, so switching never overwrites the other mode's tweaks.
type ModeParams = { material: typeof matParams; stylized: typeof styleParams; light: typeof lightParams };
const firstPlanet: PlanetPreset = PLANET_PRESETS[PLANET_DEFAULT_PRESET];
const planetParams = { ...PLANET_DEFAULTS, ...firstPlanet.planet };
const modeParams: Record<AppMode, ModeParams> = {
  material: { material: { ...matParams }, stylized: { ...styleParams }, light: { ...lightParams } },
  planet: {
    material: { ...MATERIAL_DEFAULTS, ...firstPlanet.material },
    stylized: { ...STYLIZED_DEFAULTS, ...firstPlanet.stylized },
    light: { ...LIGHT_DEFAULTS, skyIntensity: PLANET_VIEW.skyIntensity },
  },
};
let activeMode = sceneParams.appMode;
let planetTime = 0; // seconds, scaled by timeScale

// --- Params -> scene ---
const toneMappings: Record<ToneMappingName, THREE.ToneMapping> = {
  ACES: THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  Neutral: THREE.NeutralToneMapping,
  None: THREE.NoToneMapping,
};

const isPlanet = () => sceneParams.appMode === 'planet';

function applyShape() {
  mesh.geometry.dispose();
  mesh.geometry = isPlanet() ? createPlanetGeometry(sceneParams.planetShape) : createPrimitive(sceneParams.shape);
  setStylizedBounds(styleUniforms, mesh.geometry);
  mesh.geometry.boundingBox!.getCenter(localCenter);
}
function applyMaterial() {
  applyDefaultLit(material, matParams);
  applyStylized(styleUniforms, styleParams, matParams);
}
function applyLight() {
  const az = lightParams.sunAzimuthDeg * DEG2RAD;
  const el = lightParams.sunElevationDeg * DEG2RAD;
  sun.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(VIEW.sunDistance);
  sun.color.set(lightParams.sunColor);
  sun.intensity = lightParams.sunIntensity;
  scene.environmentIntensity = lightParams.skyIntensity;
  renderer.toneMapping = toneMappings[lightParams.toneMapping];
  renderer.toneMappingExposure = lightParams.exposure;
}
function applyPlanetParams() {
  const planet = isPlanet();
  applyPlanet(planetUniforms, planetParams);
  applyAtmosphere(atmosphere, planetParams, sceneParams.planetShape === 'ellipsoid' ? PLANET_VIEW.ellipsoidY : 1);
  applyRing(ring, planetParams);
  applyOrbits(orbits, planetParams);
  planetUniforms.uPlanet.value = planet ? 1 : 0;
  pivot.position.y = planet ? PLANET_VIEW.centerY : 0;
  pivot.rotation.z = planet ? planetParams.tiltDeg * DEG2RAD : 0;
  atmosphere.visible = planet;
  ring.visible = planet && planetParams.ringOpacity > 0;
  orbits.visible = planet;
}
function applyAppMode() {
  modeParams[activeMode] = { material: { ...matParams }, stylized: { ...styleParams }, light: { ...lightParams } };
  activeMode = sceneParams.appMode;
  Object.assign(matParams, modeParams[activeMode].material);
  Object.assign(styleParams, modeParams[activeMode].stylized);
  Object.assign(lightParams, modeParams[activeMode].light);
  const planet = isPlanet();
  grid.visible = axes.visible = ground.visible = !planet;
  renderer.setClearColor(planet ? PLANET_VIEW.spaceBackground : VIEW.background);
  mesh.rotation.set(0, 0, 0);
  applyShape();
  applyMaterial();
  applyPlanetParams();
  applyLight();
  showModeControls();
  ui.refresh();
}
applyShape();
applyMaterial();
applyPlanetParams();
applyLight();

// --- Panel ---
const ui = createPanel(panelRoot);
const materialOnly: HTMLElement[] = [];
const planetOnly: HTMLElement[] = [];
ui.section('App');
ui.select('App Mode', sceneParams, 'appMode', APP_MODES, applyAppMode);

materialOnly.push(ui.section('Object'));
ui.select('Shape', sceneParams, 'shape', SHAPES, applyShape);

// Presets reset Material + NPR params to defaults, then apply overrides. '—' keeps the current values.
const presetParams = { preset: '—' };
materialOnly.push(ui.section('Presets'));
ui.select('Preset', presetParams, 'preset', ['—', ...PRESET_NAMES], () => {
  const p: Preset | undefined = PRESETS[presetParams.preset as PresetName];
  if (!p) return;
  Object.assign(matParams, MATERIAL_DEFAULTS, p.material);
  Object.assign(styleParams, STYLIZED_DEFAULTS, p.stylized);
  applyMaterial();
  showModeControls();
  ui.refresh();
});

// Planet presets reset Planet + Material + NPR params to defaults, then apply overrides.
const planetPresetParams = { planetPreset: PLANET_DEFAULT_PRESET as string };
planetOnly.push(ui.section('Planet · Presets'));
ui.select('Planet Preset', planetPresetParams, 'planetPreset', PLANET_PRESET_NAMES, () => {
  const p: PlanetPreset = PLANET_PRESETS[planetPresetParams.planetPreset as PlanetPresetName];
  Object.assign(planetParams, PLANET_DEFAULTS, p.planet);
  Object.assign(matParams, MATERIAL_DEFAULTS, p.material);
  Object.assign(styleParams, STYLIZED_DEFAULTS, p.stylized);
  applyMaterial();
  applyPlanetParams();
  showModeControls();
  ui.refresh();
});
ui.button('Planet Name', 'Copy name', 'copyPlanetName', (b) => {
  const show = (text: string) => {
    b.textContent = text;
    setTimeout(() => (b.textContent = 'Copy name'), 1200);
  };
  const name = planetPresetParams.planetPreset;
  navigator.clipboard.writeText(name).then(
    () => show(`Copied: ${name}`),
    () => show(copyWithTextarea(name) ? `Copied: ${name}` : 'Copy failed'),
  );
});

// Fallback for pages where the Clipboard API is blocked (embedded or permission-restricted browsers).
function copyWithTextarea(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  return ok;
}

planetOnly.push(ui.section('Planet · Shape & Motion'));
ui.select('Planet Shape', sceneParams, 'planetShape', PLANET_SHAPES, () => {
  applyShape();
  applyPlanetParams();
});
ui.range('Axial Tilt°', planetParams, 'tiltDeg', RANGES.tiltDeg, applyPlanetParams);
ui.range('Spin °/s', planetParams, 'spinDegPerSec', RANGES.degPerSec, applyPlanetParams);
ui.range('Time Scale', planetParams, 'timeScale', RANGES.timeScale, applyPlanetParams);

planetOnly.push(ui.section('Planet · Terrain'));
ui.range('Seed', planetParams, 'seed', RANGES.seed, applyPlanetParams);
ui.range('Noise Scale', planetParams, 'noiseScale', RANGES.noiseScale, applyPlanetParams);
ui.range('Warp', planetParams, 'warp', RANGES.warp, applyPlanetParams);
ui.range('Detail', planetParams, 'detail', RANGES.detail, applyPlanetParams);
ui.range('Flow Speed', planetParams, 'flowSpeed', RANGES.flowSpeed, applyPlanetParams);
ui.range('Height (Bump)', planetParams, 'bump', RANGES.bump, applyPlanetParams);

planetOnly.push(ui.section('Planet · Ocean & Land'));
ui.range('Sea Level', planetParams, 'seaLevel', RANGES.unit, applyPlanetParams);
ui.color('Deep Color', planetParams, 'deepColor', applyPlanetParams);
ui.color('Shallow Color', planetParams, 'shallowColor', applyPlanetParams);
ui.color('Low Color', planetParams, 'lowColor', applyPlanetParams);
ui.color('Mid Color', planetParams, 'midColor', applyPlanetParams);
ui.color('High Color', planetParams, 'highColor', applyPlanetParams);
ui.range('Ocean Rough.', planetParams, 'oceanRoughness', RANGES.unit, applyPlanetParams);
ui.range('Land Rough.', planetParams, 'landRoughness', RANGES.unit, applyPlanetParams);
ui.range('Polar Cap', planetParams, 'polarCap', RANGES.unit, applyPlanetParams);
ui.color('Ice Color', planetParams, 'iceColor', applyPlanetParams);

planetOnly.push(ui.section('Planet · Bands & Marble', false));
ui.range('Bands', planetParams, 'bands', RANGES.unit, applyPlanetParams);
ui.range('Band Frequency', planetParams, 'bandFrequency', RANGES.bandFrequency, applyPlanetParams);
ui.range('Band Turbulence', planetParams, 'bandTurbulence', RANGES.bandTurbulence, applyPlanetParams);
ui.range('Band Speed °/s', planetParams, 'bandSpeedDegPerSec', RANGES.degPerSec, applyPlanetParams);
ui.range('Marble', planetParams, 'marble', RANGES.unit, applyPlanetParams);
ui.range('Marble Frequency', planetParams, 'marbleFrequency', RANGES.marbleFrequency, applyPlanetParams);

planetOnly.push(ui.section('Planet · Machine Panels', false));
ui.range('Panels', planetParams, 'panels', RANGES.unit, applyPlanetParams);
ui.range('Panel Scale', planetParams, 'panelScale', RANGES.panelScale, applyPlanetParams);
ui.range('Panel Seam', planetParams, 'panelSeam', RANGES.panelSeam, applyPlanetParams);
ui.range('Panel Metallic', planetParams, 'panelMetallic', RANGES.unit, applyPlanetParams);

planetOnly.push(ui.section('Planet · Neon', false));
ui.color('Neon Color', planetParams, 'neonColor', applyPlanetParams);
ui.color('Neon Color B', planetParams, 'neonColorB', applyPlanetParams);
ui.range('Neon Intensity', planetParams, 'neonIntensity', RANGES.neonIntensity, applyPlanetParams);
ui.range('Neon Seams', planetParams, 'neonSeams', RANGES.unit, applyPlanetParams);
ui.range('Neon Contours', planetParams, 'neonContours', RANGES.neonContours, applyPlanetParams);
ui.range('Neon Speed', planetParams, 'neonSpeed', RANGES.neonSpeed, applyPlanetParams);

planetOnly.push(ui.section('Planet · Clouds'));
ui.range('Cloud Cover', planetParams, 'cloudCover', RANGES.unit, applyPlanetParams);
ui.range('Cloud Softness', planetParams, 'cloudSoftness', RANGES.unit, applyPlanetParams);
ui.range('Cloud Scale', planetParams, 'cloudScale', RANGES.cloudScale, applyPlanetParams);
ui.range('Cloud Speed °/s', planetParams, 'cloudSpeedDegPerSec', RANGES.degPerSec, applyPlanetParams);
ui.color('Cloud Color', planetParams, 'cloudColor', applyPlanetParams);

planetOnly.push(ui.section('Planet · Glow & City Lights', false));
ui.color('Glow Color', planetParams, 'glowColor', applyPlanetParams);
ui.range('Glow Intensity', planetParams, 'glowIntensity', RANGES.glowIntensity, applyPlanetParams);
ui.range('Glow Level', planetParams, 'glowLevel', RANGES.unit, applyPlanetParams);
ui.range('Glow Cracks', planetParams, 'glowCracks', RANGES.unit, applyPlanetParams);
ui.range('Glow Pulse', planetParams, 'glowPulse', RANGES.unit, applyPlanetParams);
ui.color('City Color', planetParams, 'cityColor', applyPlanetParams);
ui.range('City Intensity', planetParams, 'cityIntensity', RANGES.cityIntensity, applyPlanetParams);
ui.range('City Density', planetParams, 'cityDensity', RANGES.unit, applyPlanetParams);

planetOnly.push(ui.section('Planet · Atmosphere', false));
ui.color('Atmo Color', planetParams, 'atmoColor', applyPlanetParams);
ui.range('Atmo Intensity', planetParams, 'atmoIntensity', RANGES.atmoIntensity, applyPlanetParams);
ui.range('Atmo Thickness', planetParams, 'atmoThickness', RANGES.atmoThickness, applyPlanetParams);

planetOnly.push(ui.section('Planet · Ring', false));
ui.range('Ring Opacity', planetParams, 'ringOpacity', RANGES.unit, applyPlanetParams);
ui.range('Ring Inner', planetParams, 'ringInner', RANGES.ringRadius, applyPlanetParams);
ui.range('Ring Outer', planetParams, 'ringOuter', RANGES.ringRadius, applyPlanetParams);
ui.color('Ring Color A', planetParams, 'ringColorA', applyPlanetParams);
ui.color('Ring Color B', planetParams, 'ringColorB', applyPlanetParams);

planetOnly.push(ui.section('Planet · Orbit Lines', false));
ui.range('Orbit Count', planetParams, 'orbitCount', RANGES.orbitCount, applyPlanetParams);
ui.range('Orbit Radius', planetParams, 'orbitRadius', RANGES.orbitRadius, applyPlanetParams);
ui.range('Orbit Spacing', planetParams, 'orbitSpacing', RANGES.orbitSpacing, applyPlanetParams);
ui.range('Orbit Incline°', planetParams, 'orbitInclinationDeg', RANGES.orbitInclinationDeg, applyPlanetParams);
ui.color('Orbit Color', planetParams, 'orbitColor', applyPlanetParams);
ui.color('Orbit Color B', planetParams, 'orbitColorB', applyPlanetParams);
ui.range('Orbit Intensity', planetParams, 'orbitIntensity', RANGES.orbitIntensity, applyPlanetParams);
ui.range('Pulse Speed °/s', planetParams, 'orbitSpeedDegPerSec', RANGES.orbitSpeedDegPerSec, applyPlanetParams);
ui.range('Pulse Count', planetParams, 'orbitPulses', RANGES.orbitPulses, applyPlanetParams);
ui.range('Pulse Length', planetParams, 'orbitPulseLength', RANGES.orbitPulseLength, applyPlanetParams);

ui.section('Material (Default Lit)');
ui.select('Mode', styleParams, 'mode', MATERIAL_MODES, () => {
  applyMaterial();
  showModeControls();
});
// The planet layer drives Base Color and Roughness, so these rows are hidden in planet mode.
materialOnly.push(ui.color('Base Color', matParams, 'baseColor', applyMaterial));
ui.range('Metallic', matParams, 'metallic', RANGES.metallic, applyMaterial);
ui.range('Specular', matParams, 'specular', RANGES.specular, applyMaterial);
materialOnly.push(ui.range('Roughness', matParams, 'roughness', RANGES.roughness, applyMaterial));

ui.section('Emissive', false);
ui.color('Emissive Color', matParams, 'emissiveColor', applyMaterial);
ui.range('Emissive Int.', matParams, 'emissiveIntensity', RANGES.emissiveIntensity, applyMaterial);

// UE built-in shading layers; apply in both modes.
ui.section('Layer · Clear Coat');
ui.range('Clear Coat', matParams, 'clearCoat', RANGES.unit, applyMaterial);
ui.range('Clear Coat Rough.', matParams, 'clearCoatRoughness', RANGES.unit, applyMaterial);

ui.section('Layer · Fuzz');
ui.range('Fuzz Amount', matParams, 'fuzzAmount', RANGES.unit, applyMaterial);
ui.color('Fuzz Color', matParams, 'fuzzColor', applyMaterial);
ui.range('Fuzz Roughness', matParams, 'fuzzRoughness', RANGES.unit, applyMaterial);

ui.section('Layer · Subsurface');
ui.color('Subsurface Color', matParams, 'subsurfaceColor', applyMaterial);
ui.range('Subsurface Opacity', matParams, 'subsurfaceOpacity', RANGES.subsurfaceOpacity, applyMaterial);

ui.section('Layer · Thin Film', false);
ui.range('Thin Film', matParams, 'thinFilm', RANGES.unit, applyMaterial);
ui.range('Thin Film nm', matParams, 'thinFilmThicknessNm', RANGES.thinFilmThicknessNm, applyMaterial);
ui.range('Thin Film IOR', matParams, 'thinFilmIor', RANGES.thinFilmIor, applyMaterial);

ui.section('Layer · Anisotropy', false);
ui.range('Anisotropy', matParams, 'anisotropy', RANGES.unit, applyMaterial);
ui.range('Aniso. Rotation°', matParams, 'anisotropyRotationDeg', RANGES.anisotropyRotationDeg, applyMaterial);

// Categories that only apply in stylized mode; hidden otherwise.
const stylizedSections: HTMLElement[] = [];
stylizedSections.push(ui.section('NPR · Form'));
ui.range('Normal Soften', styleParams, 'normalSoften', RANGES.unit, applyMaterial);
ui.color('Gradient Color', styleParams, 'gradientColor', applyMaterial);
ui.range('Gradient Strength', styleParams, 'gradientStrength', RANGES.unit, applyMaterial);

stylizedSections.push(ui.section('NPR · Shade'));
ui.color('Shade Color', styleParams, 'shadeColor', applyMaterial);
ui.range('Shade Strength', styleParams, 'shadeStrength', RANGES.stylizeStrength, applyMaterial);
ui.color('Terminator Color', styleParams, 'terminatorColor', applyMaterial);
ui.range('Terminator Int.', styleParams, 'terminatorIntensity', RANGES.stylizeStrength, applyMaterial);
ui.range('Terminator Width', styleParams, 'terminatorWidth', RANGES.terminatorWidth, applyMaterial);

stylizedSections.push(ui.section('NPR · Rim'));
ui.color('Rim Color', styleParams, 'rimColor', applyMaterial);
ui.range('Rim Intensity', styleParams, 'rimIntensity', RANGES.rimIntensity, applyMaterial);
ui.range('Rim Width', styleParams, 'rimWidth', RANGES.rimWidth, applyMaterial);
ui.range('Rim Softness', styleParams, 'rimSoftness', RANGES.rimSoftness, applyMaterial);
ui.range('Rim Light Side', styleParams, 'rimLightSide', RANGES.rimLightSide, applyMaterial);

function showModeControls() {
  for (const el of stylizedSections) el.hidden = styleParams.mode !== 'stylized';
  for (const el of planetOnly) el.hidden = !isPlanet();
  for (const el of materialOnly) el.hidden = isPlanet();
}
showModeControls();

ui.section('Lighting');
ui.color('Sun Color', lightParams, 'sunColor', applyLight);
ui.range('Sun Intensity', lightParams, 'sunIntensity', RANGES.sunIntensity, applyLight);
ui.range('Sun Azimuth°', lightParams, 'sunAzimuthDeg', RANGES.sunAzimuthDeg, applyLight);
ui.range('Sun Elevation°', lightParams, 'sunElevationDeg', RANGES.sunElevationDeg, applyLight);
ui.range('Sky Intensity', lightParams, 'skyIntensity', RANGES.skyIntensity, applyLight);

ui.section('Post', false);
ui.select('Tone Mapping', lightParams, 'toneMapping', TONE_MAPPINGS, applyLight);
ui.range('Exposure', lightParams, 'exposure', RANGES.exposure, applyLight);

// --- Resize / loop ---
new ResizeObserver(() => {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}).observe(viewport);

let last = 0;
renderer.setAnimationLoop((t) => {
  const dt = (t - last) / 1000;
  last = t;
  if (viewHelper.animating) viewHelper.update(dt);
  controls.update(dt);
  if (isPlanet()) {
    const step = Math.min(dt, 0.1) * planetParams.timeScale; // clamp: no jump after a hidden tab
    planetTime += step;
    planetUniforms.uPlanetTime.value = planetTime;
    mesh.rotation.y += planetParams.spinDegPerSec * DEG2RAD * step;
  }
  pivot.updateMatrixWorld();
  meshCenter.copy(localCenter).applyMatrix4(mesh.matrixWorld);
  sunDir.copy(sun.position).normalize();
  camera.updateMatrixWorld();
  updateStylizedView(styleUniforms, sunDir, meshCenter, camera);
  updatePlanetFrame(atmosphere, ring, sunDir, sun, meshCenter);
  updatePlanetView(planetUniforms, mesh, camera);
  updateOrbits(orbits, planetTime);
  renderer.clear();
  renderer.render(scene, camera);
  viewHelper.render(renderer);
});
