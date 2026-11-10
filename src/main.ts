import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import { GALLERY_PRESETS } from './config/galleryPresets';
import {
  APP_MODES, ATTACHMENTS, DEG2RAD, LIGHT_DEFAULTS, MATERIAL_DEFAULTS, MATERIAL_MODES, PLANET_DEFAULT_PRESET, PLANET_DEFAULTS,
  PLANET_PRESETS, PLANET_SHAPES, PLANET_VIEW, PRESET_NAMES, PRESETS, RANGES, SCENE_DEFAULTS, SHAPES,
  STYLIZED_DEFAULTS, TONE_MAPPINGS, VIEW, type AppMode, type PlanetPreset, type PlanetShapeName,
  type Preset, type PresetName, type ToneMappingName,
} from './config/tuning';
import { ueBadge, ueRating } from './config/ueFeasibility';
import { createPlanetGeometry, SHAPE_EXTENT, type PlanetGeometry } from './geometry/planetShapes';
import { createPrimitive } from './geometry/primitives';
import { createAttachments } from './materials/attachments';
import { applyDefaultLit, createDefaultLit } from './materials/defaultLit';
import { applyOutline, createOutline } from './materials/outline';
import {
  addPlanetLayer, applyAtmosphere, applyOrbits, applyPlanet, applyRing, applyShield, createAtmosphere, createOrbits,
  createRing, createShield, setAtmosphereShape, updatePlanetFrame, updatePlanetView,
} from './materials/planet';
import { addStylizedLayer, applyStylized, setStylizedBounds, updateStylizedView } from './materials/stylized';
import { createGallery, type GalleryItem } from './ui/gallery';
import { createPanel } from './ui/panel';
import {
  downloadPresets, loadUserPresets, parseImport, pickTextFile, sanitize, saveUserPresets, STATE_VERSION, upsert,
  type SavedState,
} from './ui/presetStore';

const viewport = document.getElementById('viewport')!;
const panelRoot = document.getElementById('panel')!;

// --- Renderer / scene / camera ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, VIEW.maxRenderScale));
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

// Each app mode keeps its own Material, NPR and Lighting params, so switching never overwrites the other mode's tweaks.
type ModeParams = { material: typeof matParams; stylized: typeof styleParams; light: typeof lightParams };
const ALL_PLANETS: Record<string, PlanetPreset> = { ...PLANET_PRESETS, ...GALLERY_PRESETS };
const firstPlanet: PlanetPreset = PLANET_PRESETS[PLANET_DEFAULT_PRESET];
const planetParams = { ...PLANET_DEFAULTS, ...firstPlanet.planet };
const modeLight = (mode: AppMode) =>
  mode === 'planet' ? { ...LIGHT_DEFAULTS, skyIntensity: PLANET_VIEW.skyIntensity } : { ...LIGHT_DEFAULTS };
const modeParams: Record<AppMode, ModeParams> = {
  material: { material: { ...matParams }, stylized: { ...styleParams }, light: { ...lightParams } },
  planet: {
    material: { ...MATERIAL_DEFAULTS, ...firstPlanet.material },
    stylized: { ...STYLIZED_DEFAULTS, ...firstPlanet.stylized },
    light: modeLight('planet'),
  },
};
let activeMode = sceneParams.appMode;
let planetTime = 0; // seconds, scaled by timeScale
let presetLight = false; // the applied preset carried its own light; the next one without a light restores the mode default
let ueButton: HTMLButtonElement | undefined; // panel row that shows the UE5 rating of the current settings

const material = createDefaultLit();
const styleUniforms = addStylizedLayer(material);
const planetUniforms = addPlanetLayer(material); // inert (uPlanet = 0) in material mode
const pivot = new THREE.Group(); // planet mode: centre height and axial tilt; identity in material mode
scene.add(pivot);
const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
mesh.castShadow = mesh.receiveShadow = true;
pivot.add(mesh);
const outline = createOutline(); // child of the mesh: shares its geometry and morph influences
mesh.add(outline);
const atmosphere = createAtmosphere(); // child of the mesh: marches in the planet's object space
mesh.add(atmosphere);
const ring = createRing(); // children of the pivot: tilt with the axis, do not spin
pivot.add(ring);
const orbits = createOrbits();
pivot.add(orbits);
const shield = createShield();
pivot.add(shield);
const attachments = createAttachments(styleUniforms); // siblings of the mesh: they follow its yaw, not its scale
pivot.add(attachments.group);
const localCenter = new THREE.Vector3();
const meshCenter = new THREE.Vector3(); // world space, per frame
const sunDir = new THREE.Vector3();

// All planet shapes live in one geometry as morph targets; only the star is rebuilt (when its roundness changes).
let planetGeometry: PlanetGeometry = createPlanetGeometry(planetParams.starRoundness);
let builtRoundness = planetParams.starRoundness;
const shapeIndex = (s: PlanetShapeName) => PLANET_SHAPES.indexOf(s);
const morph = { from: 0, to: 0, t: 1, cycle: 0 };
let extentNow: number = SHAPE_EXTENT.sphere;

// --- Params -> scene ---
const toneMappings: Record<ToneMappingName, THREE.ToneMapping> = {
  ACES: THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  Neutral: THREE.NeutralToneMapping,
  None: THREE.NoToneMapping,
};
const RADIAL_OUTLINE_SHAPES: readonly string[] = ['cube', 'pyramid', 'cylinder', 'cone']; // hard edges: push from the centre

const isPlanet = () => sceneParams.appMode === 'planet';
const smooth01 = (t: number) => t * t * (3 - 2 * t);

function attachPlanetGeometry() {
  mesh.geometry = planetGeometry;
  mesh.updateMorphTargets();
  outline.morphTargetInfluences = mesh.morphTargetInfluences; // same array: the hull morphs with the surface
}
function ensureStarGeometry() {
  if (planetParams.starRoundness === builtRoundness) return;
  const old = planetGeometry;
  planetGeometry = createPlanetGeometry(planetParams.starRoundness);
  builtRoundness = planetParams.starRoundness;
  if (mesh.geometry === old) {
    attachPlanetGeometry();
    outline.geometry = planetGeometry;
    applyMorph();
  }
  old.dispose();
}

/** Sets the morph influences and everything that follows the shape: scan range, atmosphere SDF, shield size. */
function applyMorph() {
  const e = smooth01(morph.t);
  const infl = mesh.morphTargetInfluences;
  if (isPlanet() && infl) {
    infl.fill(0);
    infl[morph.from] += 1 - e;
    infl[morph.to] += e;
  }
  const [a, b] = [planetGeometry.userData.yRange[morph.from], planetGeometry.userData.yRange[morph.to]];
  planetUniforms.uScanRange.value.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e);
  const [ea, eb] = [SHAPE_EXTENT[PLANET_SHAPES[morph.from]], SHAPE_EXTENT[PLANET_SHAPES[morph.to]]];
  extentNow = ea + (eb - ea) * e;
  setAtmosphereShape(atmosphere, morph.from, morph.to, e, Math.max(ea, eb));
  shield.material.uniforms.uRadius.value = planetParams.shieldRadius * extentNow;
  outline.material.uniforms.uScanRange.value.copy(planetUniforms.uScanRange.value);
}
function startMorph(to: number, instant = false) {
  if (instant || planetParams.morphSeconds <= 0) Object.assign(morph, { from: to, to, t: 1 });
  else Object.assign(morph, { from: morph.t < 0.5 ? morph.from : morph.to, to, t: 0 });
  applyMorph();
}

function applyShape() {
  if (mesh.geometry !== planetGeometry) mesh.geometry.dispose();
  if (isPlanet()) {
    attachPlanetGeometry();
    startMorph(shapeIndex(sceneParams.planetShape), true);
  } else {
    mesh.geometry = createPrimitive(sceneParams.shape);
  }
  outline.geometry = mesh.geometry;
  setStylizedBounds(styleUniforms, mesh.geometry);
  mesh.geometry.boundingBox!.getCenter(localCenter);
  applyOutlineParams();
}
function applyOutlineParams() {
  const radial = !isPlanet() && RADIAL_OUTLINE_SHAPES.includes(sceneParams.shape) ? 1 : 0;
  applyOutline(outline, styleParams, localCenter, radial);
}
function applyMaterial() {
  applyDefaultLit(material, matParams);
  applyStylized(styleUniforms, styleParams, matParams);
  applyOutlineParams();
  applyAttachments();
}
/** Attachments copy the Default Lit layers, so material changes reach them too. Also refreshes the UE5 rating. */
function applyAttachments() {
  attachments.apply(planetParams, matParams, isPlanet());
  if (!ueButton) return;
  const badge = ueBadge(ueRating(matParams, styleParams, isPlanet() ? planetParams : undefined, sceneParams.planetShape));
  ueButton.textContent = badge.text;
  ueButton.title = badge.title;
  ueButton.className = `ue-${badge.level}`;
}
/** Object scale; `breath` is the current squash-and-stretch offset. */
function applyScale(breath = 0) {
  if (isPlanet()) mesh.scale.set(planetParams.scaleX * (1 + breath), planetParams.scaleY * (1 - 0.7 * breath), planetParams.scaleZ * (1 + breath));
  else mesh.scale.setScalar(1);
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
  applyAtmosphere(atmosphere, planetParams);
  applyRing(ring, planetParams);
  applyOrbits(orbits, planetParams);
  applyShield(shield, planetParams, extentNow);
  applyMorph();
  applyScale();
  applyAttachments();
  planetUniforms.uPlanet.value = planet ? 1 : 0;
  outline.material.uniforms.uScanProgress.value = planet ? planetParams.scanProgress : 1;
  pivot.position.y = planet ? PLANET_VIEW.centerY : 0;
  pivot.rotation.x = planet ? planetParams.tiltDeg * DEG2RAD : 0; // tips the north pole towards the default camera, so rings open up
  atmosphere.visible &&= planet;
  shield.visible &&= planet;
  ring.visible = planet && planetParams.ringOpacity > 0;
  orbits.visible = planet;
  // A bubble needs alpha blending; switching recompiles the program once.
  const bubble = planet && planetParams.bubble > 0;
  if (material.transparent !== bubble) {
    material.transparent = bubble;
    material.depthWrite = !bubble;
    material.needsUpdate = true;
  }
}
/** Applies the current mode to the scene: helpers, background, shape and every param group. */
function refreshScene() {
  const planet = isPlanet();
  grid.visible = axes.visible = ground.visible = !planet;
  renderer.setClearColor(planet ? PLANET_VIEW.spaceBackground : VIEW.background);
  if (!planet) mesh.rotation.set(0, 0, 0);
  ensureStarGeometry();
  applyShape();
  applyMaterial();
  applyPlanetParams();
  applyLight();
}
function applyAppMode() {
  modeParams[activeMode] = { material: { ...matParams }, stylized: { ...styleParams }, light: { ...lightParams } };
  activeMode = sceneParams.appMode;
  Object.assign(matParams, modeParams[activeMode].material);
  Object.assign(styleParams, modeParams[activeMode].stylized);
  Object.assign(lightParams, modeParams[activeMode].light);
  refreshScene();
  showModeControls();
  ui.refresh();
}
refreshScene();

// --- Hologram scan ---
let scanPlaying = false;
function playScan() {
  if (!isPlanet()) return;
  planetParams.scanProgress = 0;
  scanPlaying = true;
  applyPlanetParams();
}

// --- Presets: built-in, user (this browser), import / export ---
// Every preset is a SavedState, so built-in, user, imported and gallery presets share one apply path.
const USER = '★ ';
const userPresets = loadUserPresets();

const builtinStates = new Map<string, SavedState>(); // one object per preset: the gallery caches thumbnails by state
function builtinState(mode: AppMode, name: string): SavedState | undefined {
  const id = `${mode}/${name}`;
  let s = builtinStates.get(id);
  if (s) return s;
  if (mode === 'planet') {
    const p: PlanetPreset | undefined = ALL_PLANETS[name];
    s = p && {
      version: STATE_VERSION, name, appMode: mode, planetShape: p.shape ?? 'sphere',
      planet: p.planet, material: p.material, stylized: p.stylized, light: p.light,
    };
  } else {
    const p: Preset | undefined = PRESETS[name as PresetName];
    s = p && { version: STATE_VERSION, name, appMode: mode, material: p.material, stylized: p.stylized };
  }
  if (s) builtinStates.set(id, s);
  return s;
}
function stateFor(mode: AppMode, option: string): SavedState | undefined {
  if (!option.startsWith(USER)) return builtinState(mode, option);
  return userPresets.find((p) => p.appMode === mode && p.name === option.slice(USER.length));
}
function presetOptions(mode: AppMode): string[] {
  const builtins: string[] = mode === 'planet' ? Object.keys(ALL_PLANETS) : ['—', ...PRESET_NAMES];
  return [...builtins, ...userPresets.filter((p) => p.appMode === mode).map((p) => USER + p.name)];
}

function captureState(name: string): SavedState {
  return {
    version: STATE_VERSION, name, appMode: sceneParams.appMode, shape: sceneParams.shape,
    planetShape: sceneParams.planetShape, planet: isPlanet() ? { ...planetParams, scanProgress: 1 } : undefined,
    material: { ...matParams }, stylized: { ...styleParams }, light: { ...lightParams },
  };
}

/** Unknown keys are dropped and missing keys take today's defaults (see presetStore), so old files still load. */
function applyState(s: SavedState, opt: { instant?: boolean; thumbnail?: boolean } = {}) {
  if (sceneParams.appMode !== s.appMode) {
    sceneParams.appMode = s.appMode;
    applyAppMode();
  }
  Object.assign(matParams, sanitize(MATERIAL_DEFAULTS, s.material));
  Object.assign(styleParams, sanitize(STYLIZED_DEFAULTS, s.stylized, { mode: MATERIAL_MODES }));
  if (s.light) Object.assign(lightParams, sanitize(modeLight(s.appMode), s.light, { toneMapping: TONE_MAPPINGS }));
  else if (opt.thumbnail || presetLight) Object.assign(lightParams, modeLight(s.appMode)); // same light for every thumbnail
  if (!opt.thumbnail) presetLight = !!s.light;
  if (s.appMode === 'planet') {
    Object.assign(planetParams, sanitize(PLANET_DEFAULTS, s.planet, { attach: ATTACHMENTS }));
    ensureStarGeometry();
    const shape = PLANET_SHAPES.find((x) => x === s.planetShape);
    if (shape) {
      sceneParams.planetShape = shape;
      startMorph(shapeIndex(shape), opt.instant);
    }
  } else {
    const shape = SHAPES.find((x) => x === s.shape);
    if (shape && shape !== sceneParams.shape) {
      sceneParams.shape = shape;
      applyShape();
    }
  }
  applyMaterial();
  applyPlanetParams();
  applyLight();
  if (!opt.thumbnail) {
    showModeControls();
    ui.refresh();
  }
}

// --- Panel ---
// Header: App Mode, the preset of the current mode, preset tools. Tabs: Object, Surface / FX / Space (planet only),
// Material, NPR, Light. `materialOnly` / `planetOnly` hold rows and sections that exist in one mode only.
const ui = createPanel(panelRoot);
const materialOnly: HTMLElement[] = [];
const planetOnly: HTMLElement[] = [];
ui.select('App Mode', sceneParams, 'appMode', APP_MODES, applyAppMode);

const presetParams = { preset: '—' }; // '—' keeps the current values
const planetPresetParams = { planetPreset: PLANET_DEFAULT_PRESET as string };
const presetValue = () => (isPlanet() ? planetPresetParams.planetPreset : presetParams.preset);
const onPreset = () => {
  const s = stateFor(sceneParams.appMode, presetValue());
  if (s) applyState(s);
  gallery.select(s);
  if (planetParams.scanOnSelect > 0) playScan();
};
const materialPresetRow = ui.select('Preset', presetParams, 'preset', presetOptions('material'), onPreset);
const planetPresetRow = ui.select('Planet Preset', planetPresetParams, 'planetPreset', presetOptions('planet'), onPreset);
materialOnly.push(materialPresetRow);
planetOnly.push(planetPresetRow);

function selectPreset(option: string) {
  if (isPlanet()) planetPresetParams.planetPreset = option;
  else presetParams.preset = option;
  ui.setOptions(materialPresetRow, presetOptions('material'));
  ui.setOptions(planetPresetRow, presetOptions('planet'));
  ui.refresh();
  showGallery(); // user presets may have changed; cached thumbnails are reused
  gallery.select(stateFor(sceneParams.appMode, option));
}
const flash = (b: HTMLButtonElement, text: string) => {
  const old = b.textContent;
  b.textContent = text;
  setTimeout(() => (b.textContent = old), 1200);
};
const persist = (b: HTMLButtonElement) => {
  if (!saveUserPresets(userPresets)) flash(b, 'Storage blocked');
};

ui.buttons('Presets', 'presetTools', [
  {
    text: 'Save',
    onClick: (b) => {
      const current = presetValue().replace(USER, '');
      const name = window.prompt('Save preset as', current === '—' ? 'My Preset' : current)?.trim();
      if (!name) return;
      upsert(userPresets, captureState(name));
      persist(b);
      selectPreset(USER + name);
      flash(b, 'Saved');
    },
  },
  {
    text: 'Delete',
    onClick: (b) => {
      const option = presetValue();
      if (!option.startsWith(USER)) return flash(b, 'Built-in');
      const name = option.slice(USER.length);
      if (!window.confirm(`Delete preset "${name}" from this browser?`)) return;
      const i = userPresets.findIndex((p) => p.appMode === sceneParams.appMode && p.name === name);
      if (i >= 0) userPresets.splice(i, 1);
      persist(b);
      selectPreset(isPlanet() ? PLANET_DEFAULT_PRESET : '—');
    },
  },
  {
    text: 'Import',
    onClick: async (b) => {
      const text = await pickTextFile();
      if (!text) return;
      try {
        const list = parseImport(text);
        for (const s of list) upsert(userPresets, s);
        persist(b);
        selectPreset(presetValue());
        flash(b, `+${list.length}`);
      } catch {
        flash(b, 'Bad file');
      }
    },
  },
  {
    text: 'Export',
    // All user presets; with none saved yet, the current settings.
    onClick: () => downloadPresets(userPresets.length ? userPresets : [captureState(presetValue().replace(USER, ''))]),
  },
]);
ui.buttons('View', 'presetView', [
  { text: 'Gallery', onClick: () => gallery.setFull(true) },
  {
    text: 'Copy name',
    onClick: (b) => {
      const name = presetValue().replace(USER, '');
      navigator.clipboard.writeText(name).then(
        () => flash(b, 'Copied'),
        () => flash(b, copyWithTextarea(name) ? 'Copied' : 'Copy failed'),
      );
    },
  },
]);

// UE5 feasibility of the current settings; click for the notes. Updated by applyAttachments on every change.
ueButton = ui.buttons('UE5', 'ueRating', [{ text: '', onClick: (b) => window.alert(b.title) }]).querySelector('button')!;

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

// --- Tab: Object ---
ui.tab('Object');
materialOnly.push(ui.section('Shape'));
ui.select('Shape', sceneParams, 'shape', SHAPES, applyShape);
planetOnly.push(ui.section('Planet Shape & Motion'));
ui.select('Planet Shape', sceneParams, 'planetShape', PLANET_SHAPES, () => {
  startMorph(shapeIndex(sceneParams.planetShape));
  applyAttachments();
});
ui.range('Star Roundness', planetParams, 'starRoundness', RANGES.unit, () => {
  ensureStarGeometry();
  applyPlanetParams();
});
ui.range('Morph Seconds', planetParams, 'morphSeconds', RANGES.morphSeconds, applyPlanetParams);
ui.range('Morph Cycle s', planetParams, 'morphCycleSeconds', RANGES.morphCycleSeconds, applyPlanetParams);
ui.range('Axial Tilt°', planetParams, 'tiltDeg', RANGES.tiltDeg, applyPlanetParams);
ui.range('Spin °/s', planetParams, 'spinDegPerSec', RANGES.degPerSec, applyPlanetParams);
ui.range('Time Scale', planetParams, 'timeScale', RANGES.timeScale, applyPlanetParams);
ui.range('Scale X', planetParams, 'scaleX', RANGES.scale, applyPlanetParams);
ui.range('Scale Y', planetParams, 'scaleY', RANGES.scale, applyPlanetParams);
ui.range('Scale Z', planetParams, 'scaleZ', RANGES.scale, applyPlanetParams);
ui.range('Sway°', planetParams, 'swayDeg', RANGES.swayDeg, applyPlanetParams);
ui.range('Breath', planetParams, 'breath', RANGES.unit, applyPlanetParams);

planetOnly.push(ui.section('Attachment', false));
ui.select('Attachment', planetParams, 'attach', ATTACHMENTS, applyPlanetParams);
ui.range('Ear Size', planetParams, 'earSize', RANGES.earSize, applyPlanetParams);
ui.range('Ear Spacing°', planetParams, 'earSpacingDeg', RANGES.earSpacingDeg, applyPlanetParams);
ui.range('Ear Lean°', planetParams, 'earAngleDeg', RANGES.earAngleDeg, applyPlanetParams);
ui.range('Ear Flat°', planetParams, 'earFlatDeg', RANGES.earFlatDeg, applyPlanetParams);
ui.color('Accent Color', planetParams, 'accentColor', applyPlanetParams);
ui.range('Collar', planetParams, 'collar', RANGES.toggle, applyPlanetParams);
ui.color('Collar Color', planetParams, 'collarColor', applyPlanetParams);
ui.range('Zzz', planetParams, 'zzz', RANGES.toggle, applyPlanetParams);

planetOnly.push(ui.section('Hologram Scan'));
ui.buttons('Scan', 'scanPlay', [{ text: 'Play scan', onClick: playScan }]);
ui.range('Scan Progress', planetParams, 'scanProgress', RANGES.unit, applyPlanetParams);
ui.color('Scan Color', planetParams, 'scanColor', applyPlanetParams);
ui.range('Scan Width', planetParams, 'scanWidth', RANGES.scanWidth, applyPlanetParams);
ui.range('Scan Seconds', planetParams, 'scanSeconds', RANGES.scanSeconds, applyPlanetParams);
ui.range('Scan On Select', planetParams, 'scanOnSelect', RANGES.toggle, applyPlanetParams);

// --- Tabs: Surface, FX, Space (planet only) ---
const planetTabs = [ui.tab('Surface')];
ui.section('Terrain');
ui.range('Seed', planetParams, 'seed', RANGES.seed, applyPlanetParams);
ui.range('Noise Scale', planetParams, 'noiseScale', RANGES.noiseScale, applyPlanetParams);
ui.range('Warp', planetParams, 'warp', RANGES.warp, applyPlanetParams);
ui.range('Detail', planetParams, 'detail', RANGES.detail, applyPlanetParams);
ui.range('Flow Speed', planetParams, 'flowSpeed', RANGES.flowSpeed, applyPlanetParams);
ui.range('Height (Bump)', planetParams, 'bump', RANGES.bump, applyPlanetParams);

ui.section('Ocean & Land');
ui.range('Sea Level', planetParams, 'seaLevel', RANGES.unit, applyPlanetParams);
ui.color('Deep Color', planetParams, 'deepColor', applyPlanetParams);
ui.color('Shallow Color', planetParams, 'shallowColor', applyPlanetParams);
ui.color('Low Color', planetParams, 'lowColor', applyPlanetParams);
ui.color('Mid Color', planetParams, 'midColor', applyPlanetParams);
ui.color('High Color', planetParams, 'highColor', applyPlanetParams);
ui.range('Terrace', planetParams, 'terrace', RANGES.unit, applyPlanetParams);
ui.range('Surface Emissive', planetParams, 'surfaceEmissive', RANGES.glowIntensity, applyPlanetParams);
ui.range('Ocean Rough.', planetParams, 'oceanRoughness', RANGES.unit, applyPlanetParams);
ui.range('Land Rough.', planetParams, 'landRoughness', RANGES.unit, applyPlanetParams);
ui.range('Polar Cap', planetParams, 'polarCap', RANGES.unit, applyPlanetParams);
ui.color('Ice Color', planetParams, 'iceColor', applyPlanetParams);

ui.section('Bands & Marble', false);
ui.range('Bands', planetParams, 'bands', RANGES.unit, applyPlanetParams);
ui.range('Band Frequency', planetParams, 'bandFrequency', RANGES.bandFrequency, applyPlanetParams);
ui.range('Band Turbulence', planetParams, 'bandTurbulence', RANGES.bandTurbulence, applyPlanetParams);
ui.range('Band Speed °/s', planetParams, 'bandSpeedDegPerSec', RANGES.degPerSec, applyPlanetParams);
ui.range('Band Twist', planetParams, 'bandTwist', RANGES.bandTwist, applyPlanetParams);
ui.range('Marble', planetParams, 'marble', RANGES.unit, applyPlanetParams);
ui.range('Marble Frequency', planetParams, 'marbleFrequency', RANGES.marbleFrequency, applyPlanetParams);

ui.section('Craters', false);
ui.range('Craters', planetParams, 'craters', RANGES.unit, applyPlanetParams);
ui.range('Crater Scale', planetParams, 'craterScale', RANGES.craterScale, applyPlanetParams);
ui.range('Crater Density', planetParams, 'craterDensity', RANGES.unit, applyPlanetParams);

ui.section('Cells (Voronoi)', false);
ui.range('Cell Scale', planetParams, 'cellScale', RANGES.cellScale, applyPlanetParams);
ui.range('Cell Cracks', planetParams, 'cellCracks', RANGES.unit, applyPlanetParams);
ui.range('Crack Width', planetParams, 'cellCrackWidth', RANGES.cellCrackWidth, applyPlanetParams);
ui.range('Cell Dots', planetParams, 'cellDots', RANGES.unit, applyPlanetParams);
ui.range('Dot Size', planetParams, 'cellDotSize', RANGES.cellDotSize, applyPlanetParams);
ui.range('Cell Facets', planetParams, 'cellFacets', RANGES.unit, applyPlanetParams);
ui.color('Cell Color', planetParams, 'cellColor', applyPlanetParams);
ui.range('Cell Glow', planetParams, 'cellGlow', RANGES.cellGlow, applyPlanetParams);
ui.color('Cell Glow Color', planetParams, 'cellGlowColor', applyPlanetParams);

ui.section('Face & Parcel', false);
ui.range('Face', planetParams, 'face', RANGES.face, applyPlanetParams);
ui.color('Face Color', planetParams, 'faceColor', applyPlanetParams);
ui.range('Face Glow', planetParams, 'faceGlow', RANGES.cellGlow, applyPlanetParams);
ui.range('Blush', planetParams, 'blush', RANGES.unit, applyPlanetParams);
ui.color('Blush Color', planetParams, 'blushColor', applyPlanetParams);
ui.range('Whiskers', planetParams, 'whiskers', RANGES.toggle, applyPlanetParams);
ui.range('Parcel', planetParams, 'parcel', RANGES.unit, applyPlanetParams);

ui.section('Bubble', false);
ui.range('Bubble', planetParams, 'bubble', RANGES.unit, applyPlanetParams);

ui.section('Machine Panels', false);
ui.range('Panels', planetParams, 'panels', RANGES.unit, applyPlanetParams);
ui.range('Panel Scale', planetParams, 'panelScale', RANGES.panelScale, applyPlanetParams);
ui.range('Panel Seam', planetParams, 'panelSeam', RANGES.panelSeam, applyPlanetParams);
ui.range('Panel Metallic', planetParams, 'panelMetallic', RANGES.unit, applyPlanetParams);

planetTabs.push(ui.tab('FX'));
ui.section('Clouds');
ui.range('Cloud Cover', planetParams, 'cloudCover', RANGES.unit, applyPlanetParams);
ui.range('Cloud Softness', planetParams, 'cloudSoftness', RANGES.unit, applyPlanetParams);
ui.range('Cloud Scale', planetParams, 'cloudScale', RANGES.cloudScale, applyPlanetParams);
ui.range('Cloud Speed °/s', planetParams, 'cloudSpeedDegPerSec', RANGES.degPerSec, applyPlanetParams);
ui.color('Cloud Color', planetParams, 'cloudColor', applyPlanetParams);
ui.range('Cloud Shadow', planetParams, 'cloudShadow', RANGES.unit, applyPlanetParams);

ui.section('Glow & City Lights');
ui.color('Glow Color', planetParams, 'glowColor', applyPlanetParams);
ui.range('Glow Intensity', planetParams, 'glowIntensity', RANGES.glowIntensity, applyPlanetParams);
ui.range('Glow Level', planetParams, 'glowLevel', RANGES.unit, applyPlanetParams);
ui.range('Glow Cracks', planetParams, 'glowCracks', RANGES.unit, applyPlanetParams);
ui.range('Glow Pulse', planetParams, 'glowPulse', RANGES.unit, applyPlanetParams);
ui.color('City Color', planetParams, 'cityColor', applyPlanetParams);
ui.range('City Intensity', planetParams, 'cityIntensity', RANGES.cityIntensity, applyPlanetParams);
ui.range('City Density', planetParams, 'cityDensity', RANGES.unit, applyPlanetParams);

ui.section('Neon');
ui.color('Neon Color', planetParams, 'neonColor', applyPlanetParams);
ui.color('Neon Color B', planetParams, 'neonColorB', applyPlanetParams);
ui.range('Neon Intensity', planetParams, 'neonIntensity', RANGES.neonIntensity, applyPlanetParams);
ui.range('Neon Seams', planetParams, 'neonSeams', RANGES.unit, applyPlanetParams);
ui.range('Neon Contours', planetParams, 'neonContours', RANGES.neonContours, applyPlanetParams);
ui.range('Neon Speed', planetParams, 'neonSpeed', RANGES.neonSpeed, applyPlanetParams);
ui.range('Neon Grid', planetParams, 'neonGrid', RANGES.neonIntensity, applyPlanetParams);

ui.section('Aurora', false);
ui.range('Aurora Intensity', planetParams, 'auroraIntensity', RANGES.neonIntensity, applyPlanetParams);
ui.color('Aurora Color', planetParams, 'auroraColor', applyPlanetParams);
ui.color('Aurora Color B', planetParams, 'auroraColorB', applyPlanetParams);

planetTabs.push(ui.tab('Space'));
ui.section('Atmosphere');
ui.color('Atmo Color', planetParams, 'atmoColor', applyPlanetParams);
ui.range('Atmo Intensity', planetParams, 'atmoIntensity', RANGES.atmoIntensity, applyPlanetParams);
ui.range('Atmo Thickness', planetParams, 'atmoThickness', RANGES.atmoThickness, applyPlanetParams);
ui.color('Sunset Color', planetParams, 'atmoSunsetColor', applyPlanetParams);
ui.range('Sunset Strength', planetParams, 'atmoSunset', RANGES.atmoSunset, applyPlanetParams);

ui.section('Hex Shield');
ui.range('Shield Intensity', planetParams, 'shieldIntensity', RANGES.shieldIntensity, applyPlanetParams);
ui.color('Shield Color', planetParams, 'shieldColor', applyPlanetParams);
ui.range('Shield Radius', planetParams, 'shieldRadius', RANGES.shieldRadius, applyPlanetParams);
ui.range('Hex Count', planetParams, 'shieldHexCount', RANGES.shieldHexCount, applyPlanetParams);
ui.range('Hit Rate', planetParams, 'shieldHitRate', RANGES.shieldHitRate, applyPlanetParams);

ui.section('Ring');
ui.range('Ring Opacity', planetParams, 'ringOpacity', RANGES.unit, applyPlanetParams);
ui.range('Ring Inner', planetParams, 'ringInner', RANGES.ringRadius, applyPlanetParams);
ui.range('Ring Outer', planetParams, 'ringOuter', RANGES.ringRadius, applyPlanetParams);
ui.color('Ring Color A', planetParams, 'ringColorA', applyPlanetParams);
ui.color('Ring Color B', planetParams, 'ringColorB', applyPlanetParams);

ui.section('Orbit Lines');
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

// --- Tab: Material (UE Default Lit + built-in shading layers; both modes) ---
ui.tab('Material');
ui.section('Default Lit');
// The planet layer drives Base Color and Roughness, so these rows are hidden in planet mode.
materialOnly.push(ui.color('Base Color', matParams, 'baseColor', applyMaterial));
ui.range('Metallic', matParams, 'metallic', RANGES.metallic, applyMaterial);
ui.range('Specular', matParams, 'specular', RANGES.specular, applyMaterial);
materialOnly.push(ui.range('Roughness', matParams, 'roughness', RANGES.roughness, applyMaterial));

ui.section('Emissive');
ui.color('Emissive Color', matParams, 'emissiveColor', applyMaterial);
ui.range('Emissive Int.', matParams, 'emissiveIntensity', RANGES.emissiveIntensity, applyMaterial);

ui.section('Clear Coat');
ui.range('Clear Coat', matParams, 'clearCoat', RANGES.unit, applyMaterial);
ui.range('Clear Coat Rough.', matParams, 'clearCoatRoughness', RANGES.unit, applyMaterial);

ui.section('Fuzz');
ui.range('Fuzz Amount', matParams, 'fuzzAmount', RANGES.unit, applyMaterial);
ui.color('Fuzz Color', matParams, 'fuzzColor', applyMaterial);
ui.range('Fuzz Roughness', matParams, 'fuzzRoughness', RANGES.unit, applyMaterial);

ui.section('Subsurface');
ui.color('Subsurface Color', matParams, 'subsurfaceColor', applyMaterial);
ui.range('Subsurface Opacity', matParams, 'subsurfaceOpacity', RANGES.subsurfaceOpacity, applyMaterial);

ui.section('Thin Film', false);
ui.range('Thin Film', matParams, 'thinFilm', RANGES.unit, applyMaterial);
ui.range('Thin Film nm', matParams, 'thinFilmThicknessNm', RANGES.thinFilmThicknessNm, applyMaterial);
ui.range('Thin Film IOR', matParams, 'thinFilmIor', RANGES.thinFilmIor, applyMaterial);

ui.section('Anisotropy', false);
ui.range('Anisotropy', matParams, 'anisotropy', RANGES.unit, applyMaterial);
ui.range('Aniso. Rotation°', matParams, 'anisotropyRotationDeg', RANGES.anisotropyRotationDeg, applyMaterial);

// --- Tab: NPR (material-level stylized layer; its sections hide in standard mode) ---
ui.tab('NPR');
ui.section('Mode');
ui.select('Mode', styleParams, 'mode', MATERIAL_MODES, () => {
  applyMaterial();
  showModeControls();
});
const stylizedSections: HTMLElement[] = [];
stylizedSections.push(ui.section('Form'));
ui.range('Normal Soften', styleParams, 'normalSoften', RANGES.unit, applyMaterial);
ui.color('Gradient Color', styleParams, 'gradientColor', applyMaterial);
ui.range('Gradient Strength', styleParams, 'gradientStrength', RANGES.unit, applyMaterial);

stylizedSections.push(ui.section('Toon'));
ui.range('Toonness', styleParams, 'toonness', RANGES.unit, applyMaterial);
ui.range('Toon Steps', styleParams, 'toonSteps', RANGES.toonSteps, applyMaterial);
ui.range('Toon Softness', styleParams, 'toonSoftness', RANGES.toonSoftness, applyMaterial);

stylizedSections.push(ui.section('Shade & Terminator'));
ui.color('Shade Color', styleParams, 'shadeColor', applyMaterial);
ui.range('Shade Strength', styleParams, 'shadeStrength', RANGES.stylizeStrength, applyMaterial);
ui.color('Terminator Color', styleParams, 'terminatorColor', applyMaterial);
ui.range('Terminator Int.', styleParams, 'terminatorIntensity', RANGES.stylizeStrength, applyMaterial);
ui.range('Terminator Width', styleParams, 'terminatorWidth', RANGES.terminatorWidth, applyMaterial);

stylizedSections.push(ui.section('Rim'));
ui.color('Rim Color', styleParams, 'rimColor', applyMaterial);
ui.range('Rim Intensity', styleParams, 'rimIntensity', RANGES.rimIntensity, applyMaterial);
ui.range('Rim Width', styleParams, 'rimWidth', RANGES.rimWidth, applyMaterial);
ui.range('Rim Softness', styleParams, 'rimSoftness', RANGES.rimSoftness, applyMaterial);
ui.range('Rim Light Side', styleParams, 'rimLightSide', RANGES.rimLightSide, applyMaterial);

stylizedSections.push(ui.section('Outline'));
ui.range('Outline Width', styleParams, 'outlineWidth', RANGES.outlineWidth, applyMaterial);
ui.color('Outline Color', styleParams, 'outlineColor', applyMaterial);

// --- Tab: Light ---
ui.tab('Light');
ui.section('Lighting');
ui.color('Sun Color', lightParams, 'sunColor', applyLight);
ui.range('Sun Intensity', lightParams, 'sunIntensity', RANGES.sunIntensity, applyLight);
ui.range('Sun Azimuth°', lightParams, 'sunAzimuthDeg', RANGES.sunAzimuthDeg, applyLight);
ui.range('Sun Elevation°', lightParams, 'sunElevationDeg', RANGES.sunElevationDeg, applyLight);
ui.range('Sky Intensity', lightParams, 'skyIntensity', RANGES.skyIntensity, applyLight);

ui.section('Post');
ui.select('Tone Mapping', lightParams, 'toneMapping', TONE_MAPPINGS, applyLight);
ui.range('Exposure', lightParams, 'exposure', RANGES.exposure, applyLight);

// View setting, not part of presets: pixels rendered per CSS pixel.
const viewParams = { renderScale: renderer.getPixelRatio() };
ui.section('Performance');
ui.range('Render Scale', viewParams, 'renderScale', RANGES.renderScale, () => {
  renderer.setPixelRatio(viewParams.renderScale);
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

function showModeControls() {
  for (const el of stylizedSections) el.hidden = styleParams.mode !== 'stylized';
  for (const el of planetOnly) el.hidden = !isPlanet();
  for (const el of materialOnly) el.hidden = isPlanet();
  for (const t of planetTabs) ui.showTab(t, isPlanet());
}
showModeControls();

// --- Per-frame view inputs (also used for gallery thumbnails) ---
function updateFrame(cam: THREE.Camera) {
  pivot.updateMatrixWorld();
  cam.updateMatrixWorld();
  meshCenter.copy(localCenter).applyMatrix4(mesh.matrixWorld);
  sunDir.copy(sun.position).normalize();
  updateStylizedView(styleUniforms, sunDir, meshCenter, cam, sun);
  updatePlanetView(planetUniforms, mesh, cam);
  const fade = isPlanet() ? smooth01(planetParams.scanProgress) : 1;
  updatePlanetFrame(atmosphere, ring, orbits, shield, mesh, cam, sunDir, sun, meshCenter, planetTime, fade);
  attachments.update(planetTime, mesh.rotation.y, fade);
}

// --- Gallery: thumbnails rendered with the main renderer into a corner, then copied out ---
const THUMB_PX = 168;
const thumbCamera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
let snapshot: {
  scene: typeof sceneParams; planet: typeof planetParams; mat: typeof matParams; style: typeof styleParams;
  light: typeof lightParams; modes: Record<AppMode, ModeParams>; activeMode: AppMode; morph: typeof morph; scanPlaying: boolean;
} | undefined;

function renderThumbnail(state: SavedState): HTMLCanvasElement {
  applyState(state, { instant: true, thumbnail: true });
  const yaw = mesh.rotation.y;
  if (isPlanet() && planetParams.swayDeg > 0) mesh.rotation.y = 0; // a face looks at the thumbnail camera
  if (isPlanet()) thumbCamera.position.set(0, PLANET_VIEW.centerY + 1.6, 3.4);
  else thumbCamera.position.set(2.0, 1.5, 2.4);
  thumbCamera.lookAt(0, isPlanet() ? PLANET_VIEW.centerY : 0.55, 0);
  const resolution = outline.material.uniforms.uResolution.value;
  const saved = resolution.clone();
  resolution.set(THUMB_PX, THUMB_PX);
  updateFrame(thumbCamera);
  const size = renderer.getSize(new THREE.Vector2());
  const tooSmall = size.x < THUMB_PX || size.y < THUMB_PX; // hidden or collapsed viewport: borrow a thumbnail-sized buffer
  if (tooSmall) renderer.setSize(THUMB_PX, THUMB_PX, false);
  renderer.setScissorTest(true);
  renderer.setViewport(0, 0, THUMB_PX, THUMB_PX);
  renderer.setScissor(0, 0, THUMB_PX, THUMB_PX);
  renderer.clear();
  renderer.render(scene, thumbCamera);
  // Copy in the same task as the render, before the browser presents the frame.
  const px = Math.round(THUMB_PX * renderer.getPixelRatio());
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  canvas.getContext('2d')!.drawImage(renderer.domElement, 0, renderer.domElement.height - px, px, px, 0, 0, px, px);
  renderer.setScissorTest(false);
  if (tooSmall) renderer.setSize(size.x, size.y, false);
  renderer.setViewport(0, 0, size.x, size.y);
  resolution.copy(saved);
  mesh.rotation.y = yaw;
  return canvas;
}

const gallery = createGallery<SavedState>(document.getElementById('app')!, renderThumbnail, {
  begin() {
    // Thumbnails render lazily, also while a scan plays in the viewport: keep it and resume it afterwards.
    snapshot = {
      scanPlaying,
      scene: { ...sceneParams }, planet: { ...planetParams }, mat: { ...matParams }, style: { ...styleParams },
      light: { ...lightParams }, modes: structuredClone(modeParams), activeMode, morph: { ...morph },
    };
    scanPlaying = false;
  },
  end() {
    const s = snapshot!;
    Object.assign(modeParams, s.modes);
    activeMode = s.activeMode;
    Object.assign(sceneParams, s.scene);
    Object.assign(planetParams, s.planet);
    Object.assign(matParams, s.mat);
    Object.assign(styleParams, s.style);
    Object.assign(lightParams, s.light);
    refreshScene();
    Object.assign(morph, s.morph);
    applyMorph();
    showModeControls();
    ui.refresh();
    scanPlaying = s.scanPlaying;
    if (!gallery.isFull()) drawFrame(); // the thumbnail used a corner of the canvas: repaint before the browser presents
  },
  pick(state) {
    applyState(state);
    selectPreset(userPresets.includes(state) ? USER + state.name : state.name);
    if (planetParams.scanOnSelect > 0) playScan(); // only presets that use the scan as their effect
  },
});

/** Fills the gallery: planet presets under their group heading, user presets, then material presets. */
function showGallery() {
  const item = (mode: AppMode, option: string): GalleryItem<SavedState> => {
    const state = stateFor(mode, option)!;
    const rating = ueRating(
      sanitize(MATERIAL_DEFAULTS, state.material), sanitize(STYLIZED_DEFAULTS, state.stylized, { mode: MATERIAL_MODES }),
      mode === 'planet' ? sanitize(PLANET_DEFAULTS, state.planet, { attach: ATTACHMENTS }) : undefined, state.planetShape,
    );
    return { name: option, state, badge: ueBadge(rating) };
  };
  const groups = new Map<string, GalleryItem<SavedState>[]>();
  const put = (title: string, it: GalleryItem<SavedState>) => groups.set(title, [...(groups.get(title) ?? []), it]);
  for (const o of presetOptions('planet')) put(o.startsWith(USER) ? 'My Planets' : ALL_PLANETS[o].group ?? 'Planets', item('planet', o));
  for (const o of presetOptions('material')) if (o !== '—') put(o.startsWith(USER) ? 'My Materials' : 'Material', item('material', o));
  gallery.show([...groups].map(([title, items]) => ({ title, items })));
}

// --- Resize / loop ---
const resize = () => {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  outline.material.uniforms.uResolution.value.set(w, h);
};
new ResizeObserver(resize).observe(viewport);

// The page opens on the full gallery. The thumbnails use the main canvas, so it needs its size first.
gallery.setFull(true);
resize();
showGallery();
gallery.select(stateFor('planet', PLANET_DEFAULT_PRESET));

let last = 0;
renderer.setAnimationLoop((t) => {
  const dt = Math.min((t - last) / 1000, 0.1); // clamp: no jump after a hidden tab
  last = t;
  if (gallery.isFull()) return; // the full gallery covers the viewport: no frame needed
  if (viewHelper.animating) viewHelper.update(dt);
  controls.update(dt);
  if (isPlanet()) {
    const step = dt * planetParams.timeScale;
    planetTime += step;
    planetUniforms.uPlanetTime.value = planetTime;
    if (planetParams.swayDeg > 0) {
      mesh.rotation.y = (PLANET_VIEW.faceYawDeg + Math.sin(planetTime * PLANET_VIEW.swaySpeed) * planetParams.swayDeg) * DEG2RAD;
    } else mesh.rotation.y += planetParams.spinDegPerSec * DEG2RAD * step;
    if (planetParams.breath > 0) applyScale(planetParams.breath * 0.04 * Math.sin(planetTime * 1.6));
    if (morph.t < 1) {
      morph.t = Math.min(1, morph.t + dt / Math.max(planetParams.morphSeconds, 1e-3));
      applyMorph();
    } else if (planetParams.morphCycleSeconds > 0 && (morph.cycle += dt) >= planetParams.morphCycleSeconds) {
      morph.cycle = 0;
      sceneParams.planetShape = PLANET_SHAPES[(morph.to + 1) % PLANET_SHAPES.length];
      startMorph(shapeIndex(sceneParams.planetShape));
      ui.refresh();
    }
    if (scanPlaying) {
      planetParams.scanProgress = Math.min(1, planetParams.scanProgress + dt / planetParams.scanSeconds);
      planetUniforms.uScanProgress.value = outline.material.uniforms.uScanProgress.value = planetParams.scanProgress;
      if (planetParams.scanProgress >= 1) {
        scanPlaying = false;
        ui.refresh();
      }
    }
  }
  drawFrame();
});

function drawFrame() {
  updateFrame(camera);
  renderer.clear();
  renderer.render(scene, camera);
  viewHelper.render(renderer);
}
