import * as THREE from 'three';
import type { STYLIZED_DEFAULTS } from '../config/tuning';
import { STYLIZED_DIRECT, STYLIZED_POST_LIGHTS, STYLIZED_UNIFORMS } from '../shaders/stylized';

export type StylizedParams = typeof STYLIZED_DEFAULTS;
export type StylizedUniforms = ReturnType<typeof createUniforms>;

const createUniforms = () => ({
  uStylize: { value: 1 },
  uToonBlend: { value: 0 },
  uRampThreshold: { value: 0 },
  uRampSoftness: { value: 0 },
  uShadowTint: { value: new THREE.Color() },
  uRimColor: { value: new THREE.Color() },
  uRimIntensity: { value: 0 },
  uRimWidth: { value: 0 },
});

function replaceOnce(src: string, find: string, replacement: string): string {
  // Fails loudly if a three upgrade renames the chunk text we patch.
  if (!src.includes(find)) throw new Error(`stylized patch: "${find}" not found`);
  return src.replace(find, replacement);
}

/** Adds the stylized layer to a Default Lit material. With uStylize = 0 it renders as plain PBR. */
export function addStylizedLayer(m: THREE.MeshPhysicalMaterial): StylizedUniforms {
  const uniforms = createUniforms();
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    let fs = replaceOnce(shader.fragmentShader, '#include <common>', `#include <common>\n${STYLIZED_UNIFORMS}`);
    const direct = replaceOnce(
      THREE.ShaderChunk.lights_physical_pars_fragment,
      'vec3 irradiance = dotNL * directLight.color;',
      STYLIZED_DIRECT,
    );
    fs = replaceOnce(fs, '#include <lights_physical_pars_fragment>', direct);
    fs = replaceOnce(fs, '#include <lights_fragment_end>', `#include <lights_fragment_end>\n${STYLIZED_POST_LIGHTS}`);
    shader.fragmentShader = fs;
  };
  return uniforms;
}

export function applyStylized(u: StylizedUniforms, p: StylizedParams): void {
  u.uStylize.value = p.mode === 'stylized' ? 1 : 0;
  u.uToonBlend.value = p.toonBlend;
  u.uRampThreshold.value = p.rampThreshold;
  u.uRampSoftness.value = p.rampSoftness;
  u.uShadowTint.value.set(p.shadowTint);
  u.uRimColor.value.set(p.rimColor);
  u.uRimIntensity.value = p.rimIntensity;
  u.uRimWidth.value = p.rimWidth;
}
