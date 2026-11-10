import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ATTACH, DEG2RAD, PLANET_VIEW } from '../config/tuning';
import { TRAIL_FRAGMENT, TRAIL_VERTEX, VORTEX_FRAGMENT, VORTEX_VERTEX } from '../shaders/attachments';
import { applyDefaultLit, createDefaultLit, type DefaultLitParams } from './defaultLit';
import type { PlanetParams } from './planet';
import { addStylizedLayer, type StylizedUniforms } from './stylized';

// Extra basic meshes around the planet: cat ears, floating islands, portal vortex, whale trail.
// They sit beside the planet mesh, not under it, so its non-uniform scale does not squash them
// (UE: sibling components / sockets). Lit parts share the planet's NPR uniforms and Default Lit layers.

const R = PLANET_VIEW.radius;
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

// Params that change the meshes; a change in any of them rebuilds the group.
const KEYS = [
  'attach', 'scaleX', 'scaleY', 'scaleZ', 'earSize', 'earSpacingDeg', 'earAngleDeg', 'earFlatDeg', 'accentColor',
  'collar', 'collarColor', 'zzz', 'lowColor', 'landRoughness', 'faceGlow', 'deepColor', 'neonColor', 'neonColorB',
] as const;

export function createAttachments(style: StylizedUniforms) {
  const group = new THREE.Group();
  let key = '';
  let enabled = false;
  let tick: (time: number) => void = () => {};

  const lit = (mat: DefaultLitParams, color: string, over: Partial<DefaultLitParams> = {}) => {
    const m = createDefaultLit();
    addStylizedLayer(m, style);
    applyDefaultLit(m, { ...mat, baseColor: color, ...over });
    return m;
  };
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = material instanceof THREE.MeshPhysicalMaterial;
    parent.add(mesh);
    return mesh;
  };

  function clear() {
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      } else if (o instanceof THREE.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    group.clear();
    tick = () => {};
  }

  function catEars(p: PlanetParams, mat: DefaultLitParams) {
    const rad = new THREE.Vector3(p.scaleX, p.scaleY, p.scaleZ).multiplyScalar(R); // ellipsoid radii
    // One cone per ear. The inner-ear colour is painted on its front by vertex colour (UE: a mask on the local normal).
    const ear = lit(mat, '#ffffff', { roughness: p.landRoughness });
    ear.vertexColors = true;
    const bodyColor = new THREE.Color(p.lowColor);
    const innerColor = new THREE.Color(p.accentColor);
    const h = 0.66 * p.earSize * R;
    const r = 0.42 * p.earSize * R;
    const a = p.earSpacingDeg * DEG2RAD;
    for (const sg of [1, -1]) {
      // Surface point of the ellipsoid in direction d, and its normal p / r^2.
      const d = new THREE.Vector3(sg * Math.sin(a), Math.cos(a), 0);
      const sp = d.clone().divideScalar(d.clone().divide(rad).length());
      const n = sp.clone().divide(rad).divide(rad).normalize();
      const lean = Math.atan2(n.x, n.y) + sg * p.earAngleDeg * DEG2RAD;
      const axis = new THREE.Vector3(Math.sin(lean), Math.cos(lean), 0).applyAxisAngle(X, -p.earFlatDeg * DEG2RAD);
      const geometry = new THREE.ConeGeometry(r, h, 48);
      const normals = geometry.getAttribute('normal');
      const colors = new Float32Array(normals.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < normals.count; i++) {
        c.copy(bodyColor).lerp(innerColor, THREE.MathUtils.smoothstep(normals.getZ(i), 0.55, 0.8)).toArray(colors, i * 3);
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const cone = add(group, geometry, ear);
      cone.quaternion.setFromUnitVectors(Y, axis);
      cone.position.copy(sp).addScaledVector(n, -0.07 * R).addScaledVector(axis, h * 0.4);
    }

    if (p.collar > 0) {
      const cy = -0.42 * rad.y;
      const cf = Math.sqrt(1 - 0.42 ** 2);
      const ax = rad.x * cf + 0.01 * R;
      const az = rad.z * cf + 0.01 * R;
      const av = (ax + az) / 2;
      const band = add(group, new THREE.TorusGeometry(av, 0.06 * R, 12, 48).rotateX(Math.PI / 2), lit(mat, p.collarColor, { roughness: 0.35 }));
      band.position.y = cy;
      band.scale.set(ax / av, 1, az / av);
      const tag = add(group, new RoundedBoxGeometry(0.22 * R, 0.2 * R, 0.05 * R, 3, 0.02 * R), lit(mat, ATTACH.tagColor, { roughness: 0.6, clearCoat: 0.2 }));
      tag.position.set(0, cy - 0.17 * R, az + 0.05 * R);
      const lamp = add(group, new THREE.SphereGeometry(0.035 * R, 12, 8), lit(mat, '#000000', { emissiveColor: p.collarColor, emissiveIntensity: 2.2 }));
      lamp.position.set(0, cy - 0.17 * R, az + 0.08 * R);
      lamp.scale.z = 0.3;
    }

    if (p.zzz > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText('Z', 32, 34);
      const map = new THREE.CanvasTexture(canvas);
      const marks = [0, 1, 2].map(() => {
        const material = new THREE.SpriteMaterial({ map, color: ATTACH.zzzColor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const s = new THREE.Sprite(material);
        group.add(s);
        return s;
      });
      tick = (time) => marks.forEach((s, i) => {
        const ph = (time * 0.22 + i / 3) % 1; // each mark rises, grows and fades
        s.position.set((0.5 + ph * 0.3) * R, (0.75 + ph * 0.6) * R, 0.3 * R);
        s.scale.setScalar((0.1 + ph * 0.12) * R);
        s.material.opacity = Math.sin(ph * Math.PI);
      });
    }
  }

  function islands(_p: PlanetParams, mat: DefaultLitParams) {
    const grass = lit(mat, ATTACH.islandGrass, { roughness: 0.7, clearCoat: 0 });
    const dirt = lit(mat, ATTACH.islandDirt, { roughness: 0.9, clearCoat: 0 });
    const tree = lit(mat, ATTACH.islandTree, { roughness: 0.35, clearCoat: 0.6 });
    const ring = new THREE.Group();
    group.add(ring);
    for (let i = 0; i < ATTACH.islandCount; i++) {
      const isle = new THREE.Group();
      const a = (i / ATTACH.islandCount) * Math.PI * 2;
      isle.position.set(Math.cos(a) * ATTACH.islandOrbit * R, 0.12 * Math.sin(i * 1.7) * R, Math.sin(a) * ATTACH.islandOrbit * R);
      isle.scale.setScalar(0.8 + 0.35 * ((i * 0.37) % 1));
      add(isle, new THREE.CylinderGeometry(0.26 * R, 0.26 * R, 0.12 * R, 24), grass);
      const bottom = add(isle, new THREE.ConeGeometry(0.27 * R, 0.26 * R, 24), dirt);
      bottom.rotation.x = Math.PI;
      bottom.position.y = -0.19 * R;
      if (i % 3 !== 1) add(isle, new THREE.ConeGeometry(0.11 * R, 0.3 * R, 16), tree).position.set(0.05 * R, 0.21 * R, 0);
      ring.add(isle);
    }
    tick = (time) => (ring.rotation.y = time * ATTACH.islandSpeed);
  }

  function vortex(p: PlanetParams) {
    const radius = (PLANET_VIEW.torusMajor - PLANET_VIEW.torusTube * 0.5) * R;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: new THREE.Color(p.deepColor) },
        uColorB: { value: new THREE.Color(p.neonColor) },
        uColorC: { value: new THREE.Color(p.neonColorB) },
        uRadius: { value: radius },
        uTime: { value: 0 },
      },
      vertexShader: VORTEX_VERTEX,
      fragmentShader: VORTEX_FRAGMENT,
      side: THREE.DoubleSide,
    });
    add(group, new THREE.CircleGeometry(radius, 64).rotateX(-Math.PI / 2), material);
    tick = (time) => (material.uniforms.uTime.value = time);
  }

  function whaleTrail(p: PlanetParams) {
    // Ribbon path: three quarters of a turn around the planet, dipping below it and rising at the tail.
    const point = (s: number) => {
      const a = Math.PI - s * Math.PI * 1.15;
      const rr = 1.1 + 0.2 * s;
      const y = -0.05 - 0.42 * Math.sin(s * Math.PI) * (1 - 0.3 * s) + THREE.MathUtils.smoothstep(s, 0.62, 1) * 1.05;
      return new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr).multiplyScalar(R);
    };
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 61 }, (_, i) => point(i / 60)));
    const SEG = 120;
    const RAD = 10;
    /** A unit tube whose rings are scaled about their centre: thin at the head, wide at the tail. */
    const ribbon = (width: number) => {
      const geometry = new THREE.TubeGeometry(curve, SEG, 1, RAD, false);
      const pos = geometry.getAttribute('position');
      const c = new THREE.Vector3();
      const v = new THREE.Vector3();
      for (let i = 0; i <= SEG; i++) {
        curve.getPointAt(i / SEG, c);
        const w = (0.03 + (0.07 * i) / SEG) * R * width;
        for (let j = 0; j <= RAD; j++) {
          const k = i * (RAD + 1) + j;
          v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(w).add(c);
          pos.setXYZ(k, v.x, v.y, v.z);
        }
      }
      return geometry;
    };
    const trail = (gain: number, soft: number) => new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: new THREE.Color(p.neonColorB) },
        uColorB: { value: new THREE.Color(p.neonColor) },
        uTime: { value: 0 },
        uGain: { value: gain },
        uSoft: { value: soft },
      },
      vertexShader: TRAIL_VERTEX,
      fragmentShader: TRAIL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const core = trail(1.6, 1);
    const halo = trail(0.4, 3); // ponytail: a wide dim copy stands in for Bloom, which this sandbox does not have
    add(group, ribbon(1), core);
    add(group, ribbon(2.8), halo);

    // Tail fluke: two flat lobes at the end of the ribbon.
    const end = point(1);
    const fluke = new THREE.Group();
    fluke.position.copy(end);
    fluke.quaternion.setFromUnitVectors(Z, end.clone().sub(point(0.97)).normalize());
    const flukeMaterial = new THREE.MeshBasicMaterial({
      color: p.neonColor, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    for (const sg of [1, -1]) {
      const lobe = add(fluke, new THREE.SphereGeometry(1, 16, 12), flukeMaterial);
      lobe.scale.set(0.1 * R, 0.035 * R, 0.24 * R);
      lobe.position.set(sg * 0.14 * R, 0, 0.1 * R);
      lobe.rotation.y = sg * 0.45;
    }
    group.add(fluke);
    tick = (time) => {
      core.uniforms.uTime.value = halo.uniforms.uTime.value = time;
    };
  }

  return {
    group,

    /** Rebuilds the meshes when a param in KEYS or a Default Lit value changed. `on` = planet mode. */
    apply(p: PlanetParams, mat: DefaultLitParams, on: boolean) {
      enabled = on && p.attach !== 'none';
      const next = enabled ? JSON.stringify([KEYS.map((k) => p[k]), mat]) : '';
      if (next === key) return;
      key = next;
      clear();
      if (!enabled) return;
      if (p.attach === 'catEars') catEars(p, mat);
      else if (p.attach === 'islands') islands(p, mat);
      else if (p.attach === 'vortex') vortex(p);
      else if (p.attach === 'whaleTrail') whaleTrail(p);
    },

    /** Per frame: follow the planet yaw, run the animation. */
    update(time: number, yaw: number, fade: number) {
      // ponytail: attachments pop in when the hologram scan ends; give them the scan cut if the pop is visible.
      group.visible = enabled && fade >= 1;
      group.rotation.y = yaw;
      tick(time);
    },
  };
}
