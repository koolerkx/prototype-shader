import * as THREE from 'three';
import { SKY } from '../config/tuning';
import { SKY_FRAGMENT, SKY_NEBULA_FRAGMENT, SKY_VERTEX } from '../shaders/sky';

export type Sky = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

/**
 * Space sky box for planet mode, and the environment map filtered from the same nebula.
 * The nebula is baked once into a cube map; the sky mesh samples it and is drawn first, behind everything.
 */
export function createSky(renderer: THREE.WebGLRenderer): { sky: Sky; environment: THREE.Texture } {
  const geometry = new THREE.SphereGeometry(SKY.radius, 32, 16);

  const bakeMaterial = new THREE.ShaderMaterial({ vertexShader: SKY_VERTEX, fragmentShader: SKY_NEBULA_FRAGMENT, side: THREE.BackSide });
  const target = new THREE.WebGLCubeRenderTarget(SKY.cubeSize, { type: THREE.HalfFloatType });
  const bakeScene = new THREE.Scene();
  bakeScene.add(new THREE.Mesh(geometry, bakeMaterial));
  new THREE.CubeCamera(0.1, SKY.radius * 2, target).update(renderer, bakeScene);
  bakeMaterial.dispose();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromCubemap(target.texture).texture;
  pmrem.dispose();

  const material = new THREE.ShaderMaterial({
    uniforms: { uNebulaMap: { value: target.texture }, uTime: { value: 0 }, uBrightness: { value: SKY.brightness } },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return { sky, environment };
}
