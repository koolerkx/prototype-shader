// Inverted hull outline: a second copy of the mesh, back faces only, pushed out along the normal by a fixed
// number of screen pixels. UE: the same as a second mesh (or material slot) with WPO along the normal and
// reversed culling; no post-process.

export const OUTLINE_VERTEX = /* glsl */ `
#include <common>
#include <morphtarget_pars_vertex>
uniform float uWidth; // screen pixels
uniform vec2 uResolution;
uniform vec3 uCenter;
uniform float uRadial; // 1 = push away from the centre instead of along the normal (hard-edged shapes)
varying float vObjY;
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	vObjY = transformed.y;
	vec3 dir = normalize( mix( normalize( objectNormal ), normalize( transformed - uCenter ), uRadial ) );
	vec4 clip = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
	clip.xy += normalize( ( normalMatrix * dir ).xy + 1e-5 ) * ( uWidth * 2.0 / uResolution ) * clip.w;
	gl_Position = clip;
}
`;

export const OUTLINE_FRAGMENT = /* glsl */ `
#include <common>
uniform vec3 uColor;
uniform float uScanProgress; // follows the planet scan, so the outline builds with the surface
uniform vec2 uScanRange;
varying float vObjY;
void main() {
	if ( uScanProgress < 1.0 && ( vObjY - uScanRange.x ) / max( uScanRange.y - uScanRange.x, 1e-4 ) > uScanProgress * 1.1 - 0.05 ) discard;
	gl_FragColor = vec4( uColor, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;
