import * as THREE from 'three';
import { PLANET_SHAPES, PLANET_VIEW, type PlanetShapeName } from '../config/tuning';

// Every planet shape is the same UV grid (u around Y, v from the north pole) mapped to a different surface,
// so any shape morphs into any other by lerping vertex positions. UE: bake each shape into the static mesh
// (vertex colour / UVs / a vertex animation texture) and lerp in World Position Offset.

const R = PLANET_VIEW.radius;
const NU = PLANET_VIEW.gridU;
const NV = PLANET_VIEW.gridV;
const TAU = Math.PI * 2;

export type Polyhedron = { normals: THREE.Vector3[]; inradius: number };

/** Unique face normals and the inradius of a convex polyhedron with circumradius R. Also feeds the atmosphere SDF. */
function polyhedron(g: THREE.BufferGeometry): Polyhedron {
  const pos = g.getAttribute('position');
  const normals: THREE.Vector3[] = [];
  let inradius = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1).sub(a);
    c.fromBufferAttribute(pos, i + 2).sub(a);
    const n = b.cross(c).normalize();
    if (n.dot(a) < 0) n.negate();
    if (normals.some((m) => m.distanceTo(n) < 1e-4)) continue;
    normals.push(n.clone());
    inradius = n.dot(a);
  }
  g.dispose();
  return { normals, inradius };
}

export const POLYHEDRA = {
  dodecahedron: polyhedron(new THREE.DodecahedronGeometry(R, 0)),
  icosahedron: polyhedron(new THREE.IcosahedronGeometry(R, 0)),
};

/** Radius of the 5-point star centreline at angle u. roundness 0 = straight edges and sharp tips, 1 = round. */
export function starRadius(u: number, roundness: number): number {
  const ro = PLANET_VIEW.starOuter * R;
  const ri = ro * PLANET_VIEW.starInner;
  u = ((u % TAU) + TAU) % TAU;
  const seg = Math.PI / 5;
  const i = Math.floor(u / seg);
  const tipFirst = i % 2 === 0; // tip at u = 0
  const a0 = i * seg;
  const r0 = tipFirst ? ro : ri;
  const r1 = tipFirst ? ri : ro;
  const p0x = r0 * Math.cos(a0);
  const p0y = r0 * Math.sin(a0);
  const dx = r1 * Math.cos(a0 + seg) - p0x;
  const dy = r1 * Math.sin(a0 + seg) - p0y;
  // Ray from the centre at angle u against the straight edge p0 -> p1.
  const sharp = (p0x * dy - p0y * dx) / (Math.cos(u) * dy - Math.sin(u) * dx);
  const round = ri + (ro - ri) * (0.5 + 0.5 * Math.cos(5 * u));
  return sharp + (round - sharp) * roundness;
}

function radialDistance(shape: PlanetShapeName, x: number, y: number, z: number): number {
  if (shape === 'ellipsoid') return R / Math.sqrt(x * x + (y / PLANET_VIEW.ellipsoidY) ** 2 + z * z);
  if (shape === 'dodecahedron' || shape === 'icosahedron') {
    const { normals, inradius } = POLYHEDRA[shape];
    let t = Infinity;
    for (const n of normals) {
      const d = n.x * x + n.y * y + n.z * z;
      if (d > 1e-6) t = Math.min(t, inradius / d);
    }
    return t;
  }
  return R;
}

/** Surface point for grid coordinates u in [0, 2pi], v in [0, pi]. */
function surfacePoint(shape: PlanetShapeName, u: number, v: number, roundness: number, out: number[]): void {
  const cu = Math.cos(u);
  const su = Math.sin(u);
  if (shape === 'torus' || shape === 'starTorus') {
    // v runs inner -> top -> outer -> bottom -> inner, so the sphere's top half becomes the ring's top half.
    const phi = Math.PI - 2 * v;
    let cx: number, cz: number, ox: number, oz: number, tube: number;
    if (shape === 'torus') {
      const rm = PLANET_VIEW.torusMajor * R;
      [cx, cz, ox, oz, tube] = [rm * cu, rm * su, cu, su, PLANET_VIEW.torusTube * R];
    } else {
      const r = starRadius(u, roundness);
      [cx, cz] = [r * cu, r * su];
      const e = 1e-3;
      const tx = starRadius(u + e, roundness) * Math.cos(u + e) - starRadius(u - e, roundness) * Math.cos(u - e);
      const tz = starRadius(u + e, roundness) * Math.sin(u + e) - starRadius(u - e, roundness) * Math.sin(u - e);
      const len = Math.hypot(tx, tz);
      [ox, oz, tube] = [tz / len, -tx / len, PLANET_VIEW.starTube * R]; // outward = up x tangent
    }
    out[0] = cx + tube * Math.cos(phi) * ox;
    out[1] = tube * Math.sin(phi);
    out[2] = cz + tube * Math.cos(phi) * oz;
    return;
  }
  const sv = Math.sin(v);
  const x = sv * cu;
  const y = Math.cos(v);
  const z = sv * su;
  const t = radialDistance(shape, x, y, z);
  out[0] = x * t;
  out[1] = y * t;
  out[2] = z * t;
}

function gridIndex(): number[] {
  const index: number[] = [];
  for (let iy = 0; iy < NV; iy++) {
    for (let ix = 0; ix < NU; ix++) {
      const a = iy * (NU + 1) + ix;
      const b = a + 1;
      const c = a + NU + 1;
      const d = c + 1;
      // Keep the pole triangles: they are degenerate on the sphere but real on the torus.
      index.push(a, b, c, b, d, c);
    }
  }
  return index;
}
const INDEX = gridIndex();

/** Positions and smooth normals of one shape. Vertices that share a position (seam, poles) share one normal. */
function buildTarget(shape: PlanetShapeName, roundness: number): { position: Float32Array; normal: Float32Array; yRange: [number, number] } {
  const position = new Float32Array((NU + 1) * (NV + 1) * 3);
  const p = [0, 0, 0];
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let iy = 0; iy <= NV; iy++) {
    for (let ix = 0; ix <= NU; ix++) {
      surfacePoint(shape, (ix / NU) * TAU, (iy / NV) * Math.PI, roundness, p);
      position.set(p, (iy * (NU + 1) + ix) * 3);
      yMin = Math.min(yMin, p[1]);
      yMax = Math.max(yMax, p[1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(position, 3));
  g.setIndex(INDEX);
  g.computeVertexNormals();
  const normal = (g.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array;
  g.dispose();

  const groups = new Map<string, number[]>();
  for (let i = 0; i < position.length; i += 3) {
    const key = `${Math.round(position[i] * 1e4)},${Math.round(position[i + 1] * 1e4)},${Math.round(position[i + 2] * 1e4)}`;
    const list = groups.get(key);
    if (list) list.push(i);
    else groups.set(key, [i]);
  }
  const n = new THREE.Vector3();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    n.set(0, 0, 0);
    for (const i of list) n.x += normal[i], n.y += normal[i + 1], n.z += normal[i + 2];
    n.normalize();
    for (const i of list) normal.set([n.x, n.y, n.z], i);
  }
  return { position, normal, yRange: [yMin, yMax] };
}

export type PlanetGeometry = THREE.BufferGeometry & { userData: { yRange: [number, number][] } };
type Target = ReturnType<typeof buildTarget>;
const cache = new Map<PlanetShapeName, Target>();

/**
 * One geometry with a morph target per shape (absolute positions). Shapes other than the star are cached;
 * the star is rebuilt when its roundness changes.
 */
export function createPlanetGeometry(starRoundness: number): PlanetGeometry {
  const targets = PLANET_SHAPES.map((shape) => {
    if (shape === 'starTorus') return buildTarget(shape, starRoundness);
    let t = cache.get(shape);
    if (!t) cache.set(shape, (t = buildTarget(shape, 0)));
    return t;
  });
  const g = new THREE.BufferGeometry() as PlanetGeometry;
  g.setAttribute('position', new THREE.BufferAttribute(targets[0].position.slice(), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(targets[0].normal.slice(), 3));
  g.setIndex(INDEX);
  g.morphAttributes.position = targets.map((t) => new THREE.BufferAttribute(t.position, 3));
  g.morphAttributes.normal = targets.map((t) => new THREE.BufferAttribute(t.normal, 3));
  g.morphTargetsRelative = false;
  g.userData.yRange = targets.map((t) => t.yRange);
  g.computeBoundingBox(); // includes every morph target, so culling stays correct while morphing
  g.computeBoundingSphere();
  return g;
}

/** Largest distance from the centre, per shape: bounds the atmosphere and shield. */
export const SHAPE_EXTENT: Record<PlanetShapeName, number> = {
  sphere: R,
  ellipsoid: R,
  dodecahedron: R,
  icosahedron: R,
  torus: (PLANET_VIEW.torusMajor + PLANET_VIEW.torusTube) * R,
  starTorus: (PLANET_VIEW.starOuter + PLANET_VIEW.starTube) * R,
};
