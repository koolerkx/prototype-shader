import * as THREE from 'three';
import { SKY } from '../config/tuning';
import { SKY_FRAGMENT, SKY_VERTEX } from '../shaders/sky';

export type Sky = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

/** Space sky box for planet mode: drawn first, behind everything. */
export function createSky(): Sky {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStars: { value: 1 }, uBrightness: { value: SKY.brightness } },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY.radius, 32, 16), material);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return sky;
}

/** Environment map of the sky without the stars (they would only add fireflies). Call before the sky joins the scene. */
export function bakeSkyEnvironment(renderer: THREE.WebGLRenderer, sky: Sky): THREE.Texture {
  const scene = new THREE.Scene();
  scene.add(sky);
  sky.material.uniforms.uStars.value = 0;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0, 0.1, SKY.radius * 2).texture;
  pmrem.dispose();
  sky.material.uniforms.uStars.value = 1;
  scene.remove(sky);
  return texture;
}
