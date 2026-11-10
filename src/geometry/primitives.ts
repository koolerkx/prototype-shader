import * as THREE from 'three';
import type { ShapeName } from '../config/tuning';

const factories: Record<ShapeName, () => THREE.BufferGeometry> = {
  sphere: () => new THREE.SphereGeometry(0.6, 96, 64),
  cube: () => new THREE.BoxGeometry(1, 1, 1),
  cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1.2, 96),
  cone: () => new THREE.ConeGeometry(0.6, 1.2, 96),
  pyramid: () => {
    // Non-indexed so each face gets its own flat normal.
    const g = new THREE.ConeGeometry(0.7, 1.2, 4).rotateY(Math.PI / 4).toNonIndexed();
    g.computeVertexNormals();
    return g;
  },
  torus: () => new THREE.TorusGeometry(0.5, 0.2, 64, 128),
  torusKnot: () => new THREE.TorusKnotGeometry(0.45, 0.15, 256, 32),
  capsule: () => new THREE.CapsuleGeometry(0.4, 0.6, 16, 48),
  plane: () => new THREE.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2),
};

/** Creates the shape with its bounding-box bottom on y = 0. */
export function createPrimitive(name: ShapeName): THREE.BufferGeometry {
  const g = factories[name]();
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox!.min.y + (name === 'plane' ? 0.001 : 0), 0);
  return g;
}

