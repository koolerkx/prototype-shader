import * as THREE from 'three';
import { DEG2RAD, PLANET_VIEW, type PLANET_DEFAULTS } from '../config/tuning';
import { POLYHEDRA } from '../geometry/planetShapes';
import {
  ATMOSPHERE_FRAGMENT, ATMOSPHERE_VERTEX, ORBIT_FRAGMENT, ORBIT_VERTEX, PLANET_ALBEDO, PLANET_ALPHA, PLANET_EMISSIVE,
  PLANET_FILM, PLANET_METALNESS, PLANET_NORMAL, PLANET_ROUGHNESS, PLANET_UNIFORMS, PLANET_VERTEX, PLANET_VERTEX_PARS,
  RING_FRAGMENT, RING_VERTEX, SHIELD_FRAGMENT, SHIELD_VERTEX,
} from '../shaders/planet';
import { after, replaceOnce } from './stylized';

export type PlanetParams = typeof PLANET_DEFAULTS;
export type PlanetUniforms = ReturnType<typeof createUniforms>;

// Uniform names are `u` + the PlanetParams key, so applyPlanet can copy them by name.
const createUniforms = () => ({
  uPlanet: { value: 0 },
  uPlanetTime: { value: 0 },
  uPlanetObjToView: { value: new THREE.Matrix3() }, // per frame; its transpose brings the sun into object space (cloud shadow)
  uPlanetInvRadius: { value: 1 / PLANET_VIEW.radius },
  uScanProgress: { value: 1 },
  uScanRange: { value: new THREE.Vector2(-1, 1) }, // object-space y range of the current shape
  uScanColor: { value: new THREE.Color() },
  uScanWidth: { value: 0.1 },
  uSeed: { value: 0 },
  uNoiseScale: { value: 1 },
  uWarp: { value: 0 },
  uDetail: { value: 5 },
  uFlowSpeed: { value: 0 },
  uBump: { value: 0 },
  uSeaLevel: { value: 0 },
  uDeepColor: { value: new THREE.Color() },
  uShallowColor: { value: new THREE.Color() },
  uLowColor: { value: new THREE.Color() },
  uMidColor: { value: new THREE.Color() },
  uHighColor: { value: new THREE.Color() },
  uOceanRoughness: { value: 0.5 },
  uLandRoughness: { value: 0.5 },
  uPolarCap: { value: 0 },
  uIceColor: { value: new THREE.Color() },
  uBands: { value: 0 },
  uBandFrequency: { value: 1 },
  uBandTurbulence: { value: 0 },
  uBandSpeed: { value: 0 }, // rad/s
  uMarble: { value: 0 },
  uMarbleFrequency: { value: 1 },
  uPanels: { value: 0 },
  uPanelScale: { value: 1 },
  uPanelSeam: { value: 0.01 },
  uPanelMetallic: { value: 0 },
  uCraters: { value: 0 },
  uCraterScale: { value: 1 },
  uCraterDensity: { value: 0 },
  uBubble: { value: 0 },
  uCloudShadow: { value: 0 },
  uCloudCover: { value: 0 },
  uCloudSoftness: { value: 0.1 },
  uCloudScale: { value: 1 },
  uCloudSpeed: { value: 0 }, // rad/s
  uCloudColor: { value: new THREE.Color() },
  uGlowColor: { value: new THREE.Color() },
  uGlowIntensity: { value: 0 },
  uGlowLevel: { value: 0 },
  uGlowCracks: { value: 0 },
  uGlowPulse: { value: 0 },
  uCityColor: { value: new THREE.Color() },
  uCityIntensity: { value: 0 },
  uCityDensity: { value: 0 },
  uNeonColor: { value: new THREE.Color() },
  uNeonColorB: { value: new THREE.Color() },
  uNeonIntensity: { value: 0 },
  uNeonSeams: { value: 0 },
  uNeonContours: { value: 0 },
  uNeonSpeed: { value: 0 },
});

/** Chains onto the stylized patch; call after addStylizedLayer (it reads uSunDirView). uPlanet = 0 leaves it inert. */
export function addPlanetLayer(m: THREE.MeshPhysicalMaterial): PlanetUniforms {
  const uniforms = createUniforms();
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    base.call(m, shader, renderer);
    Object.assign(shader.uniforms, uniforms);

    const vs = after(shader.vertexShader, '#include <common>', PLANET_VERTEX_PARS);
    shader.vertexShader = replaceOnce(vs, '#include <project_vertex>', `${PLANET_VERTEX}\n#include <project_vertex>`);

    // `after` inserts right behind the anchor, so these run before the stylized code at the same anchors.
    let fs = after(shader.fragmentShader, '#include <common>', PLANET_UNIFORMS);
    fs = after(fs, '#include <color_fragment>', PLANET_ALBEDO);
    fs = after(fs, '#include <roughnessmap_fragment>', PLANET_ROUGHNESS);
    fs = after(fs, '#include <metalnessmap_fragment>', PLANET_METALNESS);
    fs = after(fs, '#include <normal_fragment_maps>', PLANET_NORMAL);
    fs = after(fs, '#include <emissivemap_fragment>', PLANET_EMISSIVE);
    fs = after(fs, '#include <lights_physical_fragment>', PLANET_FILM);
    fs = after(fs, '#include <opaque_fragment>', PLANET_ALPHA);
    shader.fragmentShader = fs;
  };
  return uniforms;
}

export function applyPlanet(u: PlanetUniforms, p: PlanetParams): void {
  const byName = u as unknown as Record<string, { value: unknown }>;
  for (const [key, v] of Object.entries(p)) {
    const uniform = byName[`u${key[0].toUpperCase()}${key.slice(1)}`];
    if (!uniform) continue; // motion, atmosphere and ring params are not surface uniforms
    if (uniform.value instanceof THREE.Color) uniform.value.set(v as string);
    else uniform.value = v;
  }
  u.uBandSpeed.value = p.bandSpeedDegPerSec * DEG2RAD;
  u.uCloudSpeed.value = p.cloudSpeedDegPerSec * DEG2RAD;
}

// --- Atmosphere: raymarched through the planet SDF ---
export type Atmosphere = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

export function createAtmosphere(): Atmosphere {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color() },
      uSunsetColor: { value: new THREE.Color() },
      uSunset: { value: 1 },
      uIntensity: { value: 1 },
      uThickness: { value: 0.1 },
      uBound: { value: 1 },
      uCamObj: { value: new THREE.Vector3() },
      uSunObj: { value: new THREE.Vector3(0, 1, 0) },
      uFade: { value: 1 },
      uDodecaN: { value: POLYHEDRA.dodecahedron.normals },
      uIcosaN: { value: POLYHEDRA.icosahedron.normals },
      uPolyInradius: { value: POLYHEDRA.icosahedron.inradius }, // the same for both at equal circumradius
      uRoundness: { value: 0.5 },
      uShapeA: { value: 0 },
      uShapeB: { value: 0 },
      uMorph: { value: 0 },
    },
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  // Unit sphere scaled in the shader to the bound; the march does the shape.
  return new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), material);
}

export function applyAtmosphere(a: Atmosphere, p: PlanetParams): void {
  const u = a.material.uniforms;
  u.uColor.value.set(p.atmoColor);
  u.uSunsetColor.value.set(p.atmoSunsetColor);
  u.uSunset.value = p.atmoSunset;
  u.uIntensity.value = p.atmoIntensity;
  u.uThickness.value = p.atmoThickness * PLANET_VIEW.radius;
  u.uRoundness.value = p.starRoundness;
  a.visible = p.atmoIntensity > 0;
}

/** Morph state shared by the atmosphere SDF: shape ids, blend 0..1, and the bound that encloses both shapes. */
export function setAtmosphereShape(a: Atmosphere, shapeA: number, shapeB: number, morph: number, extent: number): void {
  const u = a.material.uniforms;
  u.uShapeA.value = shapeA;
  u.uShapeB.value = shapeB;
  u.uMorph.value = morph;
  u.uBound.value = extent + u.uThickness.value * 3;
}

// --- Hexagon shield ---
export type Shield = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

export function createShield(): Shield {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color() },
      uIntensity: { value: 0 },
      uRadius: { value: 1 },
      uHexCount: { value: 24 },
      uTime: { value: 0 },
      uHitRate: { value: 0 },
      uFade: { value: 1 },
    },
    vertexShader: SHIELD_VERTEX,
    fragmentShader: SHIELD_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), material);
}

/** `extent` is the planet's largest radius, so the shield clears the torus and the star too. */
export function applyShield(shield: Shield, p: PlanetParams, extent: number): void {
  const u = shield.material.uniforms;
  u.uColor.value.set(p.shieldColor);
  u.uIntensity.value = p.shieldIntensity;
  u.uRadius.value = p.shieldRadius * extent;
  u.uHexCount.value = Math.round(p.shieldHexCount); // integer, so the hex grid wraps without a seam
  u.uHitRate.value = p.shieldHitRate;
  shield.visible = p.shieldIntensity > 0;
}

// --- Ring ---
export type Ring = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

export function createRing(): Ring {
  const r = PLANET_VIEW.radius;
  const geometry = new THREE.RingGeometry(r * PLANET_VIEW.ringMin, r * PLANET_VIEW.ringMax, 256, 1).rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
      uOpacity: { value: 0 },
      uInner: { value: 1 },
      uOuter: { value: 2 },
      uSeed: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunRadiance: { value: new THREE.Color() },
      uPlanetCenter: { value: new THREE.Vector3() },
      uPlanetRadius: { value: r },
      uFade: { value: 1 },
    },
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

export function applyRing(ring: Ring, p: PlanetParams): void {
  const u = ring.material.uniforms;
  u.uColorA.value.set(p.ringColorA);
  u.uColorB.value.set(p.ringColorB);
  u.uOpacity.value = p.ringOpacity;
  u.uInner.value = p.ringInner * PLANET_VIEW.radius;
  u.uOuter.value = Math.max(p.ringOuter, p.ringInner) * PLANET_VIEW.radius;
  u.uSeed.value = p.seed;
}

/** Per-frame object-to-view rotation for the height normal. Call after the camera matrix is current. */
export function updatePlanetView(u: PlanetUniforms, mesh: THREE.Object3D, camera: THREE.Camera): void {
  modelView.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
  u.uPlanetObjToView.value.getNormalMatrix(modelView);
}
const modelView = new THREE.Matrix4();

// --- Orbit lines ---
export type Orbits = THREE.Group;
type OrbitMesh = THREE.Mesh<THREE.TorusGeometry, THREE.ShaderMaterial>;
const orbitMeshes = (o: Orbits) => o.children as OrbitMesh[];

// Per-orbit inclination factor, yaw and pulse phase, so the lines cross like an atom model.
const ORBIT_LAYOUT = [
  { tilt: 1, yawDeg: 0, phase: 0 },
  { tilt: -0.75, yawDeg: 60, phase: 0.33 },
  { tilt: 0.4, yawDeg: 120, phase: 0.66 },
];

export function createOrbits(): Orbits {
  const group = new THREE.Group();
  for (const layout of ORBIT_LAYOUT) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color() },
        uIntensity: { value: 1 },
        uTime: { value: 0 },
        uSpeed: { value: 0 },
        uPulses: { value: 1 },
        uPulseLength: { value: 0.3 },
        uPhase: { value: layout.phase },
        uBase: { value: 0.15 },
        uFade: { value: 1 },
      },
      vertexShader: ORBIT_VERTEX,
      fragmentShader: ORBIT_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Mesh(new THREE.TorusGeometry(), material));
  }
  return group;
}

export function applyOrbits(orbits: Orbits, p: PlanetParams): void {
  orbitMeshes(orbits).forEach((mesh, i) => {
    const layout = ORBIT_LAYOUT[i];
    mesh.visible = i < p.orbitCount && p.orbitIntensity > 0;
    // Rebuilt only when the radius changes (not on every slider move), so the tube keeps its width at any radius.
    const radius = (p.orbitRadius + i * p.orbitSpacing) * PLANET_VIEW.radius;
    if (mesh.userData.radius !== radius) {
      mesh.userData.radius = radius;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TorusGeometry(radius, PLANET_VIEW.orbitTube, 6, 256).rotateX(-Math.PI / 2);
    }
    mesh.rotation.set(0, layout.yawDeg * DEG2RAD, 0);
    mesh.rotateX(p.orbitInclinationDeg * layout.tilt * DEG2RAD);
    const u = mesh.material.uniforms;
    u.uColor.value.set(i === 1 ? p.orbitColorB : p.orbitColor);
    u.uIntensity.value = p.orbitIntensity;
    u.uSpeed.value = (p.orbitSpeedDegPerSec / 360) * (i % 2 === 0 ? 1 : -1) * (1 - 0.2 * i); // outer orbits slower
    u.uPulses.value = p.orbitPulses;
    u.uPulseLength.value = p.orbitPulseLength;
  });
}

/** Per-frame inputs: sun and camera for the shells, time for the shield, and the scan fade-in of everything around the planet. */
export function updatePlanetFrame(
  a: Atmosphere, ring: Ring, orbits: Orbits, shield: Shield, planet: THREE.Object3D, camera: THREE.Camera,
  sunDirWorld: THREE.Vector3, sun: THREE.DirectionalLight, centerWorld: THREE.Vector3, time: number, fade: number,
): void {
  inverse.copy(planet.matrixWorld).invert();
  const au = a.material.uniforms;
  au.uCamObj.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inverse);
  au.uSunObj.value.copy(sunDirWorld).transformDirection(inverse);
  au.uFade.value = fade;
  const u = ring.material.uniforms;
  u.uSunDir.value.copy(sunDirWorld);
  u.uSunRadiance.value.copy(sun.color).multiplyScalar(sun.intensity);
  u.uPlanetCenter.value.copy(centerWorld);
  u.uFade.value = fade;
  shield.material.uniforms.uTime.value = time;
  shield.material.uniforms.uFade.value = fade;
  for (const mesh of orbitMeshes(orbits)) {
    mesh.material.uniforms.uTime.value = time;
    mesh.material.uniforms.uFade.value = fade;
  }
}
const inverse = new THREE.Matrix4();
