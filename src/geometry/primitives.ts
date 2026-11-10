import * as THREE from 'three';
import { PLANET_VIEW, type PlanetShapeName, type ShapeName } from '../config/tuning';

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

const R = PLANET_VIEW.radius;
const planetFactories: Record<PlanetShapeName, () => THREE.BufferGeometry> = {
  sphere: () => new THREE.SphereGeometry(R, 128, 96),
  ellipsoid: () => new THREE.SphereGeometry(R, 128, 96).scale(1, PLANET_VIEW.ellipsoidY, 1),
  // Detail 0 keeps the flat faces (non-indexed, per-face normals).
  dodecahedron: () => new THREE.DodecahedronGeometry(R, 0),
  icosahedron: () => new THREE.IcosahedronGeometry(R, 0),
};

/** Planet shapes are centred on the origin so they can spin in place. */
export function createPlanetGeometry(name: PlanetShapeName): THREE.BufferGeometry {
  const g = planetFactories[name]();
  g.computeBoundingBox();
  return g;
}
