import { NOISE } from './planet';

// Space sky box: two nebula layers and twinkling stars on a large inside-out sphere, by view direction only.
// The same sky is baked into the environment map, so Clear Coat and low-roughness surfaces reflect it.
// UE: a sky sphere with an Unlit material; a Sky Light captures it (or a baked cube map of the same nebula).

export const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
	vDir = position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const SKY_FRAGMENT = /* glsl */ `
#include <common>
${NOISE}
uniform float uTime;
uniform float uStars;
uniform float uBrightness;
varying vec3 vDir;
vec3 skyHash3( vec3 p ) {
	p = vec3( dot( p, vec3( 127.1, 311.7, 74.7 ) ), dot( p, vec3( 269.5, 183.3, 246.1 ) ), dot( p, vec3( 113.5, 271.9, 124.6 ) ) );
	return fract( sin( p ) * 43758.5453123 );
}
void main() {
	vec3 d = normalize( vDir );
	float n1 = saturate( planetFbm( d * 2.2 + 1.3, 5.0 ) * 0.8 + 0.5 );
	float n2 = saturate( planetFbm( d * 4.0 + 5.1, 4.0 ) * 0.8 + 0.5 );
	// Linear colours: deep blue to violet base, magenta and blue clouds.
	vec3 col = mix( vec3( 0.002, 0.002, 0.02 ), vec3( 0.03, 0.006, 0.1 ), saturate( d.y * 0.5 + 0.5 + ( n1 - 0.5 ) * 0.8 ) );
	col += vec3( 0.7, 0.07, 0.7 ) * ( pow( smoothstep( 0.5, 0.9, n1 ), 2.0 ) * 0.16 );
	col += vec3( 0.03, 0.32, 0.9 ) * ( pow( smoothstep( 0.55, 0.9, n2 ), 2.0 ) * 0.12 );

	// Stars: one candidate per cell of a 3D grid cut by the sphere; each is a few pixels wide and twinkles.
	vec3 g = d * 70.0;
	vec3 h = skyHash3( floor( g ) );
	float star = step( 0.94, h.x ) * ( 1.0 - smoothstep( 0.0, 0.07 + 0.1 * h.y, length( fract( g ) - 0.5 - ( h.yzx - 0.5 ) * 0.5 ) ) );
	star *= 0.6 + 0.4 * sin( uTime * ( 1.0 + h.z * 3.0 ) + h.x * 40.0 );
	col += vec3( 1.0, 0.92, 1.0 ) * ( star * 1.5 * uStars );

	gl_FragColor = vec4( col * uBrightness, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;
