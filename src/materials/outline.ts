import * as THREE from 'three';
import type { StylizedParams } from './stylized';
import { OUTLINE_FRAGMENT, OUTLINE_VERTEX } from '../shaders/outline';

export type Outline = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

/** Inverted hull; share the target mesh's geometry and morph influences with it. */
export function createOutline(): Outline {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color() },
      uWidth: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector3() },
      uRadial: { value: 0 },
      uScanProgress: { value: 1 },
      uScanRange: { value: new THREE.Vector2(-1, 1) },
    },
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(new THREE.BufferGeometry(), material);
}

/** `radial` = 1 pushes away from `center` instead of along the normal, so hard-edged shapes get no gaps. */
export function applyOutline(o: Outline, p: StylizedParams, center: THREE.Vector3, radial: number): void {
  const u = o.material.uniforms;
  u.uColor.value.set(p.outlineColor);
  u.uWidth.value = p.outlineWidth;
  u.uCenter.value.copy(center);
  u.uRadial.value = radial;
  o.visible = p.mode === 'stylized' && p.outlineWidth > 0;
}
