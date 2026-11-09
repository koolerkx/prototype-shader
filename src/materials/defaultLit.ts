import * as THREE from 'three';
import type { MATERIAL_DEFAULTS } from '../config/tuning';

export type DefaultLitParams = typeof MATERIAL_DEFAULTS;

/**
 * UE5 "Default Lit" equivalent: Lambert diffuse + GGX specular, the same model as MeshPhysicalMaterial.
 * UE Specular maps to F0 = 0.08 * specular; three derives F0 from IOR, so we solve IOR for that F0.
 */
export function createDefaultLit(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ specularIntensity: 1 });
}

export function applyDefaultLit(m: THREE.MeshPhysicalMaterial, p: DefaultLitParams): void {
  m.color.set(p.baseColor);
  m.metalness = p.metallic;
  m.roughness = p.roughness;
  const r = Math.sqrt(0.08 * p.specular); // (ior - 1) / (ior + 1)
  m.ior = THREE.MathUtils.clamp((1 + r) / (1 - r), 1, 2.333);
  m.emissive.set(p.emissiveColor);
  m.emissiveIntensity = p.emissiveIntensity;
}
