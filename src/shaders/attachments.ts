import { NOISE } from './planet';

// Unlit shaders of the planet attachments. UE: Unlit materials on a Plane / Spline Mesh; time from the material.

// --- Portal vortex: a disc inside the torus, polar-warped noise turning around the centre. ---
export const VORTEX_VERTEX = /* glsl */ `
varying vec2 vDisc;
void main() {
	vDisc = position.xz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const VORTEX_FRAGMENT = /* glsl */ `
#include <common>
${NOISE}
uniform vec3 uColorA; // deep
uniform vec3 uColorB; // arms
uniform vec3 uColorC; // sparks
uniform float uRadius;
uniform float uTime;
varying vec2 vDisc;
void main() {
	vec2 p = vDisc / uRadius;
	float r = length( p );
	float a = atan( p.y, p.x );
	float swirl = a + 2.2 / ( r + 0.18 ) - uTime * 0.9; // inner part turns faster
	float sw = saturate( planetFbm( vec3( cos( swirl ) * r * 3.0, sin( swirl ) * r * 3.0, uTime * 0.1 ), 3.0 ) * 0.8 + 0.5 );
	float arms = 0.5 + 0.5 * sin( a * 3.0 + 5.0 / ( r + 0.2 ) - uTime * 2.0 );
	vec3 col = mix( uColorA, uColorB, smoothstep( 0.35, 0.8, sw * arms + r * 0.3 ) );
	col += uColorC * ( pow( smoothstep( 0.6, 0.95, sw ), 3.0 ) * 1.5 );
	col *= smoothstep( 0.0, 0.3, r ) * 0.9 + 0.1; // dark centre marks the entrance
	gl_FragColor = vec4( col * 1.6, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// --- Whale trail: additive ribbon, colour gradient along its length with bright bands flowing to the tail.
// It fades towards its silhouette, so a wide dim copy of it reads as a glow. ---
export const TRAIL_VERTEX = /* glsl */ `
varying float vAlong;
varying float vFacing;
void main() {
	vAlong = uv.x;
	vec4 mv = modelViewMatrix * vec4( position, 1.0 );
	vFacing = abs( dot( normalize( normalMatrix * normal ), normalize( - mv.xyz ) ) );
	gl_Position = projectionMatrix * mv;
}
`;

export const TRAIL_FRAGMENT = /* glsl */ `
#include <common>
uniform vec3 uColorA; // head
uniform vec3 uColorB; // tail
uniform float uTime;
uniform float uGain;
uniform float uSoft; // falloff towards the silhouette
varying float vAlong;
varying float vFacing;
void main() {
	vec3 col = mix( mix( uColorA, vec3( 0.72, 0.5, 1.0 ), smoothstep( 0.0, 0.6, vAlong ) ), uColorB, smoothstep( 0.6, 1.0, vAlong ) );
	float flow = 0.6 + 0.4 * sin( vAlong * 24.0 - uTime * 4.0 );
	gl_FragColor = vec4( col * ( flow * uGain * pow( max( vFacing, 0.0 ), uSoft ) ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;
