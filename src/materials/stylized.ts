import * as THREE from 'three';
import type { STYLIZED_DEFAULTS } from '../config/tuning';
import type { DefaultLitParams } from './defaultLit';
import {
  STYLIZED_ALBEDO, STYLIZED_NORMAL, STYLIZED_POST_LIGHTS, STYLIZED_UNIFORMS, STYLIZED_VERTEX, STYLIZED_VERTEX_PARS,
  SUBSURFACE_DIRECT,
} from '../shaders/stylized';

export type StylizedParams = typeof STYLIZED_DEFAULTS;
export type StylizedUniforms = ReturnType<typeof createUniforms>;

const createUniforms = () => ({
  uStylize: { value: 1 },
  uSunDirView: { value: new THREE.Vector3(0, 1, 0) },
  uCenterView: { value: new THREE.Vector3() },
  uHeightRange: { value: new THREE.Vector2(0, 1) },
  uNormalSoften: { value: 0 },
  uGradientColor: { value: new THREE.Color() },
  uGradientStrength: { value: 0 },
  uShadeColor: { value: new THREE.Color() },
  uShadeStrength: { value: 0 },
  uTerminatorColor: { value: new THREE.Color() },
  uTerminatorIntensity: { value: 0 },
  uTerminatorWidth: { value: 0.2 },
  uRimColor: { value: new THREE.Color() },
  uRimIntensity: { value: 0 },
  uRimWidth: { value: 0 },
  uRimSoftness: { value: 0 },
  uRimLightSide: { value: 0 },
  uSubsurfaceColor: { value: new THREE.Color(0, 0, 0) },
  uSubsurfaceOpacity: { value: 0.5 },
  uToonness: { value: 0 },
  uToonSteps: { value: 2 },
  uToonSoftness: { value: 0.05 },
  uSunRadiance: { value: new THREE.Color() }, // per frame: sun colour * intensity
});

export function replaceOnce(src: string, find: string, replacement: string): string {
  // Fails loudly if a three upgrade renames the chunk text we patch.
  if (!src.includes(find)) throw new Error(`stylized patch: "${find}" not found`);
  return src.replace(find, replacement);
}

export const after = (src: string, find: string, code: string) => replaceOnce(src, find, `${find}\n${code}`);

/**
 * Adds the material-level NPR layer and the subsurface term. With uStylize = 0 and black subsurface it is plain PBR.
 * Pass the uniforms of another material to share one NPR look (planet attachments).
 */
export function addStylizedLayer(m: THREE.MeshPhysicalMaterial, uniforms: StylizedUniforms = createUniforms()): StylizedUniforms {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    let vs = after(shader.vertexShader, '#include <common>', STYLIZED_VERTEX_PARS);
    vs = after(vs, '#include <begin_vertex>', STYLIZED_VERTEX);
    shader.vertexShader = vs;

    const direct = after(
      THREE.ShaderChunk.lights_physical_pars_fragment,
      'reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );',
      SUBSURFACE_DIRECT,
    );
    let fs = after(shader.fragmentShader, '#include <common>', STYLIZED_UNIFORMS);
    fs = replaceOnce(fs, '#include <lights_physical_pars_fragment>', direct);
    fs = after(fs, '#include <color_fragment>', STYLIZED_ALBEDO);
    fs = after(fs, '#include <normal_fragment_maps>', STYLIZED_NORMAL);
    fs = after(fs, '#include <lights_fragment_end>', STYLIZED_POST_LIGHTS);
    shader.fragmentShader = fs;
  };
  return uniforms;
}

export function applyStylized(u: StylizedUniforms, p: StylizedParams, mat: DefaultLitParams): void {
  u.uStylize.value = p.mode === 'stylized' ? 1 : 0;
  u.uNormalSoften.value = p.normalSoften;
  u.uGradientColor.value.set(p.gradientColor);
  u.uGradientStrength.value = p.gradientStrength;
  u.uShadeColor.value.set(p.shadeColor);
  u.uShadeStrength.value = p.shadeStrength;
  u.uTerminatorColor.value.set(p.terminatorColor);
  u.uTerminatorIntensity.value = p.terminatorIntensity;
  u.uTerminatorWidth.value = p.terminatorWidth;
  u.uRimColor.value.set(p.rimColor);
  u.uRimIntensity.value = p.rimIntensity;
  u.uRimWidth.value = p.rimWidth;
  u.uRimSoftness.value = p.rimSoftness;
  u.uRimLightSide.value = p.rimLightSide;
  u.uSubsurfaceColor.value.set(mat.subsurfaceColor);
  u.uSubsurfaceOpacity.value = mat.subsurfaceOpacity;
  u.uToonness.value = p.toonness;
  u.uToonSteps.value = p.toonSteps;
  u.uToonSoftness.value = p.toonSoftness;
}

/** Object-space height range for the albedo gradient (UE: ObjectLocalBounds). */
export function setStylizedBounds(u: StylizedUniforms, geometry: THREE.BufferGeometry): void {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  u.uHeightRange.value.set(geometry.boundingBox!.min.y, geometry.boundingBox!.max.y);
}

/** Per-frame view-space inputs; the MPC equivalent. Call after the camera matrix is current. */
export function updateStylizedView(
  u: StylizedUniforms, sunDirWorld: THREE.Vector3, centerWorld: THREE.Vector3, camera: THREE.Camera,
  sun: THREE.DirectionalLight,
): void {
  u.uSunRadiance.value.copy(sun.color).multiplyScalar(sun.intensity);
  u.uSunDirView.value.copy(sunDirWorld).transformDirection(camera.matrixWorldInverse);
  u.uCenterView.value.copy(centerWorld).applyMatrix4(camera.matrixWorldInverse);
}
