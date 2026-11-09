import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import {
  DEG2RAD, LIGHT_DEFAULTS, MATERIAL_DEFAULTS, MATERIAL_MODES, RANGES, SCENE_DEFAULTS, SHAPES, STYLIZED_DEFAULTS,
  TONE_MAPPINGS, VIEW, type ToneMappingName,
} from './config/tuning';
import { createPrimitive } from './geometry/primitives';
import { applyDefaultLit, createDefaultLit } from './materials/defaultLit';
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
const mesh = new THREE.Mesh(createPrimitive(sceneParams.shape), material);
mesh.castShadow = mesh.receiveShadow = true;
scene.add(mesh);
const meshCenter = new THREE.Vector3(); // world space; the mesh has an identity transform
const sunDir = new THREE.Vector3();

// --- Params -> scene ---
const toneMappings: Record<ToneMappingName, THREE.ToneMapping> = {
  ACES: THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  Neutral: THREE.NeutralToneMapping,
  None: THREE.NoToneMapping,
};

function updateBounds() {
  setStylizedBounds(styleUniforms, mesh.geometry);
  mesh.geometry.boundingBox!.getCenter(meshCenter);
}
function applyShape() {
  mesh.geometry.dispose();
  mesh.geometry = createPrimitive(sceneParams.shape);
  updateBounds();
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
updateBounds();
applyMaterial();
applyLight();

// --- Panel ---
const ui = createPanel(panelRoot);
ui.section('Object');
ui.select('Shape', sceneParams, 'shape', SHAPES, applyShape);

ui.section('Material');
ui.select('Mode', styleParams, 'mode', MATERIAL_MODES, () => {
  applyMaterial();
  showModeControls();
});
ui.color('Base Color', matParams, 'baseColor', applyMaterial);
ui.range('Metallic', matParams, 'metallic', RANGES.metallic, applyMaterial);
ui.range('Specular', matParams, 'specular', RANGES.specular, applyMaterial);
ui.range('Roughness', matParams, 'roughness', RANGES.roughness, applyMaterial);
ui.color('Emissive Color', matParams, 'emissiveColor', applyMaterial);
ui.range('Emissive Int.', matParams, 'emissiveIntensity', RANGES.emissiveIntensity, applyMaterial);

// UE built-in shading layers; apply in both modes.
ui.section('Shading Layers (UE built-in)');
ui.range('Clear Coat', matParams, 'clearCoat', RANGES.unit, applyMaterial);
ui.range('Clear Coat Rough.', matParams, 'clearCoatRoughness', RANGES.unit, applyMaterial);
ui.range('Fuzz Amount', matParams, 'fuzzAmount', RANGES.unit, applyMaterial);
ui.color('Fuzz Color', matParams, 'fuzzColor', applyMaterial);
ui.range('Fuzz Roughness', matParams, 'fuzzRoughness', RANGES.unit, applyMaterial);
ui.color('Subsurface Color', matParams, 'subsurfaceColor', applyMaterial);
ui.range('Subsurface Opacity', matParams, 'subsurfaceOpacity', RANGES.subsurfaceOpacity, applyMaterial);
ui.range('Thin Film', matParams, 'thinFilm', RANGES.unit, applyMaterial);
ui.range('Thin Film nm', matParams, 'thinFilmThicknessNm', RANGES.thinFilmThicknessNm, applyMaterial);
ui.range('Thin Film IOR', matParams, 'thinFilmIor', RANGES.thinFilmIor, applyMaterial);
ui.range('Anisotropy', matParams, 'anisotropy', RANGES.unit, applyMaterial);
ui.range('Aniso. Rotation°', matParams, 'anisotropyRotationDeg', RANGES.anisotropyRotationDeg, applyMaterial);

// Controls that only apply in stylized mode; hidden otherwise.
const stylizedControls = [
  ui.section('Stylized (NPR layer)'),
  ui.range('Normal Soften', styleParams, 'normalSoften', RANGES.unit, applyMaterial),
  ui.color('Gradient Color', styleParams, 'gradientColor', applyMaterial),
  ui.range('Gradient Strength', styleParams, 'gradientStrength', RANGES.unit, applyMaterial),
  ui.color('Shade Color', styleParams, 'shadeColor', applyMaterial),
  ui.range('Shade Strength', styleParams, 'shadeStrength', RANGES.stylizeStrength, applyMaterial),
  ui.color('Terminator Color', styleParams, 'terminatorColor', applyMaterial),
  ui.range('Terminator Int.', styleParams, 'terminatorIntensity', RANGES.stylizeStrength, applyMaterial),
  ui.range('Terminator Width', styleParams, 'terminatorWidth', RANGES.terminatorWidth, applyMaterial),
  ui.color('Rim Color', styleParams, 'rimColor', applyMaterial),
  ui.range('Rim Intensity', styleParams, 'rimIntensity', RANGES.rimIntensity, applyMaterial),
  ui.range('Rim Width', styleParams, 'rimWidth', RANGES.rimWidth, applyMaterial),
  ui.range('Rim Softness', styleParams, 'rimSoftness', RANGES.rimSoftness, applyMaterial),
  ui.range('Rim Light Side', styleParams, 'rimLightSide', RANGES.rimLightSide, applyMaterial),
];
function showModeControls() {
  for (const el of stylizedControls) el.hidden = styleParams.mode !== 'stylized';
}
showModeControls();

ui.section('Lighting');
ui.color('Sun Color', lightParams, 'sunColor', applyLight);
ui.range('Sun Intensity', lightParams, 'sunIntensity', RANGES.sunIntensity, applyLight);
ui.range('Sun Azimuth°', lightParams, 'sunAzimuthDeg', RANGES.sunAzimuthDeg, applyLight);
ui.range('Sun Elevation°', lightParams, 'sunElevationDeg', RANGES.sunElevationDeg, applyLight);
ui.range('Sky Intensity', lightParams, 'skyIntensity', RANGES.skyIntensity, applyLight);

ui.section('Post');
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
  camera.updateMatrixWorld();
  updateStylizedView(styleUniforms, sunDir.copy(sun.position).normalize(), meshCenter, camera);
  renderer.clear();
  renderer.render(scene, camera);
  viewHelper.render(renderer);
});
