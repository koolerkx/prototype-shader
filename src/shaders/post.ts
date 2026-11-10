// Post-process helpers for the Bloom chain.

// Runs before Bloom. One NaN or Inf pixel (anisotropy without tangents, a pow() of a varying that MSAA pushed
// below zero) would be blurred over the whole frame and turn it black, so those pixels become black here.
// The clamp keeps very bright emissive parts from flooding the frame with glow.
// UE: not needed; its Bloom clamps and its scene colour is NaN-safe.
export const SANITIZE_SHADER = {
  uniforms: { tDiffuse: { value: null }, uMax: { value: 8 } },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uMax;
varying vec2 vUv;
void main() {
	vec3 c = texture2D( tDiffuse, vUv ).rgb;
	if ( any( isnan( c ) ) || any( isinf( c ) ) ) c = vec3( 0.0 );
	gl_FragColor = vec4( clamp( c, 0.0, uMax ), 1.0 );
}
`,
};
