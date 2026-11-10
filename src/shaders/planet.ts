// Planet surface: patched into the same MeshPhysicalMaterial as the stylized layer, so UE lighting, the built-in
// layers and the NPR layer all still apply. It only drives material inputs: Base Color, Roughness, Normal, Emissive.
// UE: one master material with 3D noise on the object-space direction. Production would bake the noise into
// textures (cube map or tri-planar), because the UE Noise node is expensive.

export const PLANET_VERTEX_PARS = /* glsl */ `
varying vec3 vPlanetObj;
`;

export const PLANET_VERTEX = /* glsl */ `
vPlanetObj = transformed;
`;

// 3D simplex noise: Ashima Arts / Stefan Gustavson, MIT licence.
const NOISE = /* glsl */ `
vec3 planetMod289( vec3 x ) { return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0; }
vec4 planetMod289( vec4 x ) { return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0; }
vec4 planetPermute( vec4 x ) { return planetMod289( ( ( x * 34.0 ) + 10.0 ) * x ); }
float planetNoise( vec3 v ) {
	const vec2 C = vec2( 1.0 / 6.0, 1.0 / 3.0 );
	const vec4 D = vec4( 0.0, 0.5, 1.0, 2.0 );
	vec3 i = floor( v + dot( v, C.yyy ) );
	vec3 x0 = v - i + dot( i, C.xxx );
	vec3 g = step( x0.yzx, x0.xyz );
	vec3 l = 1.0 - g;
	vec3 i1 = min( g.xyz, l.zxy );
	vec3 i2 = max( g.xyz, l.zxy );
	vec3 x1 = x0 - i1 + C.xxx;
	vec3 x2 = x0 - i2 + C.yyy;
	vec3 x3 = x0 - D.yyy;
	i = planetMod289( i );
	vec4 p = planetPermute( planetPermute( planetPermute(
		i.z + vec4( 0.0, i1.z, i2.z, 1.0 ) ) + i.y + vec4( 0.0, i1.y, i2.y, 1.0 ) ) + i.x + vec4( 0.0, i1.x, i2.x, 1.0 ) );
	vec3 ns = 0.142857142857 * D.wyz - D.xzx;
	vec4 j = p - 49.0 * floor( p * ns.z * ns.z );
	vec4 x_ = floor( j * ns.z );
	vec4 y_ = floor( j - 7.0 * x_ );
	vec4 x = x_ * ns.x + ns.yyyy;
	vec4 y = y_ * ns.x + ns.yyyy;
	vec4 h = 1.0 - abs( x ) - abs( y );
	vec4 b0 = vec4( x.xy, y.xy );
	vec4 b1 = vec4( x.zw, y.zw );
	vec4 s0 = floor( b0 ) * 2.0 + 1.0;
	vec4 s1 = floor( b1 ) * 2.0 + 1.0;
	vec4 sh = - step( h, vec4( 0.0 ) );
	vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
	vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
	vec3 p0 = vec3( a0.xy, h.x );
	vec3 p1 = vec3( a0.zw, h.y );
	vec3 p2 = vec3( a1.xy, h.z );
	vec3 p3 = vec3( a1.zw, h.w );
	vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) );
	p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
	vec4 m = max( 0.5 - vec4( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ), dot( x3, x3 ) ), 0.0 );
	m = m * m;
	return 105.0 * dot( m * m, vec4( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ), dot( p3, x3 ) ) );
}
float planetFbm( vec3 p, float octaves ) {
	float sum = 0.0, amp = 0.5;
	for ( int i = 0; i < 6; i ++ ) {
		if ( float( i ) >= octaves ) break;
		sum += amp * planetNoise( p );
		p = p * 2.03 + 11.7;
		amp *= 0.5;
	}
	return sum;
}
vec3 planetRotY( vec3 p, float a ) {
	float c = cos( a ), s = sin( a );
	return vec3( c * p.x + s * p.z, p.y, - s * p.x + c * p.z );
}
`;

export const PLANET_UNIFORMS = /* glsl */ `
varying vec3 vPlanetObj;
uniform float uPlanet;
uniform float uPlanetTime;
uniform mat3 uPlanetObjToView;
uniform float uSeed;
uniform float uNoiseScale;
uniform float uWarp;
uniform float uDetail;
uniform float uFlowSpeed;
uniform float uBump;
uniform float uSeaLevel;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uLowColor;
uniform vec3 uMidColor;
uniform vec3 uHighColor;
uniform float uOceanRoughness;
uniform float uLandRoughness;
uniform float uPolarCap;
uniform vec3 uIceColor;
uniform float uBands;
uniform float uBandFrequency;
uniform float uBandTurbulence;
uniform float uBandSpeed;
uniform float uMarble;
uniform float uMarbleFrequency;
uniform float uPanels;
uniform float uPanelScale;
uniform float uPanelSeam;
uniform float uPanelMetallic;
uniform float uCloudCover;
uniform float uCloudSoftness;
uniform float uCloudScale;
uniform float uCloudSpeed;
uniform vec3 uCloudColor;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform float uGlowLevel;
uniform float uGlowCracks;
uniform float uGlowPulse;
uniform vec3 uCityColor;
uniform float uCityIntensity;
uniform float uCityDensity;
uniform vec3 uNeonColor;
uniform vec3 uNeonColorB;
uniform float uNeonIntensity;
uniform float uNeonSeams;
uniform float uNeonContours;
uniform float uNeonSpeed;
${NOISE}

// Surface height 0..1 on the unit direction. One function feeds both the colour pass and the normal,
// so colour and relief always match (UE: one height texture drives Base Color and the normal map).
float planetHeight( vec3 dir, out vec3 warp, out float terrain, out float seam, out float cellHash ) {
	float t = uPlanetTime;
	vec3 p = dir * uNoiseScale + uSeed;
	// Domain warp; flow speed animates it, so the surface swirls like a liquid.
	vec3 pw = p * 0.7;
	vec3 fl = vec3( 0.0, 0.0, t * uFlowSpeed );
	warp = vec3( planetNoise( pw + fl ), planetNoise( pw + 17.3 - fl ), planetNoise( pw - 9.1 + fl.zxy ) );
	terrain = saturate( planetFbm( p + warp * uWarp, uDetail ) * 0.8 + 0.5 );
	float h = terrain;

	// Gas-giant bands: latitude stripes, differential rotation (equator faster than poles).
	if ( uBands > 0.0 ) {
		float lat = dir.y;
		vec3 bandDir = planetRotY( dir, t * uBandSpeed * ( 0.4 + 0.6 * ( 1.0 - lat * lat ) ) );
		float turb = planetFbm( bandDir * uNoiseScale * 1.5 + uSeed + warp * uWarp, 4.0 );
		float stripes = 0.5 + 0.5 * sin( ( lat * uBandFrequency + turb * uBandTurbulence ) * PI );
		h = mix( h, stripes, uBands );
	}

	// Marble: folds the height into stripes, like stirred paint or milk.
	h = mix( h, 0.5 + 0.5 * sin( h * uMarbleFrequency * PI ), uMarble );

	// Machine panels: a 3D lattice cut by the surface. Each cell is a raised plate, the seams are grooves.
	seam = 1.0;
	cellHash = 0.0;
	if ( uPanels > 0.0 ) {
		vec3 q = dir * uPanelScale + uSeed * 0.37;
		vec3 f = fract( q );
		// Surface distance to each lattice plane: divide by how fast that axis changes along the surface.
		vec3 rate = sqrt( max( 1.0 - dir * dir, 1e-3 ) ) * uPanelScale;
		vec3 d = min( f, 1.0 - f ) / rate;
		seam = min( d.x, min( d.y, d.z ) );
		cellHash = fract( sin( dot( floor( q ), vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 );
		// About a third of the cells split into smaller plates, so the grid reads as machinery, not a globe grid.
		if ( cellHash > 0.65 ) {
			vec3 f2 = fract( q * 2.0 );
			vec3 d2 = min( f2, 1.0 - f2 ) / ( rate * 2.0 );
			seam = min( seam, min( d2.x, min( d2.y, d2.z ) ) );
			cellHash = fract( sin( dot( floor( q * 2.0 ), vec3( 39.346, 11.135, 83.155 ) ) ) * 43758.5453 );
		}
		float plate = ( 0.5 + 0.35 * cellHash ) * smoothstep( 0.0, uPanelSeam, seam );
		h = mix( h, plate + ( terrain - 0.5 ) * 0.1, uPanels );
	}
	return h;
}

// Liquids are flat: ocean and magma do not take relief.
float planetReliefHeight( float h ) {
	float floorH = uSeaLevel;
	if ( uGlowIntensity > 0.0 ) floorH = max( floorH, uGlowLevel );
	return max( h, floorH );
}
`;

// After <color_fragment>, before the stylized albedo gradient. Writes Base Color and the values later blocks use.
export const PLANET_ALBEDO = /* glsl */ `
vec3 planetGrad = vec3( 0.0 ); // object-space height gradient for the normal
float planetRelief = 0.0; // relief strength mask: 0 under clouds
float planetRough = 1.0;
float planetMetal = 0.0; // panel metallic mask
float planetCity = 0.0;
vec3 planetGlow = vec3( 0.0 );
if ( uPlanet > 0.5 ) {
	vec3 dir = normalize( vPlanetObj );
	float t = uPlanetTime;
	float lat = dir.y;
	vec3 p = dir * uNoiseScale + uSeed;
	vec3 warp;
	float terrain, seam, cellHash;
	float h = planetHeight( dir, warp, terrain, seam, cellHash );

	// Height gradient by forward differences on the sphere (2 extra height samples).
	// UE: the same height, baked to a texture, gives the normal map (NormalFromHeightmap).
	if ( uBump > 0.0 ) {
		vec3 tx = normalize( cross( abs( dir.y ) < 0.99 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ), dir ) );
		vec3 ty = cross( dir, tx );
		const float e = 0.002;
		vec3 w; float a, b, c;
		float h0 = planetReliefHeight( h );
		float hx = planetReliefHeight( planetHeight( normalize( dir + tx * e ), w, a, b, c ) );
		float hy = planetReliefHeight( planetHeight( normalize( dir + ty * e ), w, a, b, c ) );
		planetGrad = ( tx * ( hx - h0 ) + ty * ( hy - h0 ) ) / e;
		planetRelief = 1.0;
	}

	// Ocean and land height ramps.
	float edge = fwidth( h ) + 1e-3;
	float land = smoothstep( uSeaLevel - edge, uSeaLevel + edge, h );
	float landH = saturate( ( h - uSeaLevel ) / max( 1.0 - uSeaLevel, 1e-3 ) );
	vec3 landCol = mix( uLowColor, uMidColor, smoothstep( 0.0, 0.5, landH ) );
	landCol = mix( landCol, uHighColor, smoothstep( 0.5, 1.0, landH ) );
	vec3 seaCol = mix( uDeepColor, uShallowColor, smoothstep( uSeaLevel - 0.12, uSeaLevel, h ) );
	vec3 col = mix( seaCol, landCol, land );
	planetRough = mix( uOceanRoughness, uLandRoughness, land );

	// Panels: per-plate tone and roughness variation, darker grooves (cavity baked into Base Color), metallic plates.
	if ( uPanels > 0.0 ) {
		float groove = 1.0 - smoothstep( 0.0, uPanelSeam, seam );
		col *= 1.0 - uPanels * ( 0.15 * cellHash + 0.75 * groove );
		planetRough = saturate( planetRough + uPanels * ( ( cellHash - 0.5 ) * 0.3 + 0.3 * groove ) );
		planetMetal = uPanels * land;
	}

	// Polar ice caps with a noisy edge.
	float ice = uPolarCap > 0.0 ? smoothstep( 1.0 - uPolarCap, 1.04 - uPolarCap, abs( lat ) + ( terrain - 0.5 ) * 0.3 ) : 0.0;
	col = mix( col, uIceColor, ice );
	planetRough = mix( planetRough, 0.35, ice );
	planetRelief *= 1.0 - 0.7 * ice;
	planetMetal *= 1.0 - ice;

	// Magma: low areas and ridged cracks glow, with a slow pulse.
	if ( uGlowIntensity > 0.0 ) {
		float low = 1.0 - smoothstep( uGlowLevel - 0.04, uGlowLevel + 0.04, h );
		float crack = pow( 1.0 - abs( planetNoise( p * 2.5 + warp * 1.5 + vec3( t * 0.02 ) ) ), 12.0 ) * uGlowCracks;
		float glow = saturate( low + crack ) * ( 1.0 - ice );
		float pulse = 0.75 + 0.25 * sin( t * 2.0 + planetNoise( p * 2.0 ) * 6.0 );
		planetGlow = uGlowColor * ( uGlowIntensity * glow * mix( 1.0, pulse, uGlowPulse ) );
		col = mix( col, uGlowColor * 0.25, glow );
	}

	// Neon: glowing panel seams and height contour lines, with a wave travelling over the surface.
	if ( uNeonIntensity > 0.0 ) {
		float seamLine = uPanels > 0.0 ? ( 1.0 - smoothstep( 0.0, uPanelSeam * 0.5, seam ) ) * uNeonSeams : 0.0;
		float contour = 0.0;
		if ( uNeonContours > 0.0 ) {
			float x = h * uNeonContours - t * uNeonSpeed * 0.05;
			float dl = abs( fract( x + 0.5 ) - 0.5 );
			float fw = fwidth( x ) + 1e-4;
			contour = 1.0 - smoothstep( fw * 0.6, fw * 1.6, dl ); // about 1.5 px core
			contour += 0.3 * ( 1.0 - smoothstep( 0.0, fw * 6.0, dl ) ); // soft halo
		}
		float wave = 0.5 + 0.5 * sin( dot( dir, vec3( 9.0, 7.0, 5.0 ) ) - t * uNeonSpeed );
		float sweep = pow( wave, 6.0 ); // seams light up only in narrow bands sweeping over the surface
		vec3 neonCol = mix( uNeonColor, uNeonColorB, smoothstep( 0.2, 0.8, h ) );
		float neon = seamLine * sweep + contour * ( 0.55 + 0.45 * wave );
		planetGlow += neonCol * ( uNeonIntensity * saturate( neon ) * ( 1.0 - ice ) );
	}

	// City lights: clustered speckles on land; shown on the night side after the normal is known.
	if ( uCityIntensity > 0.0 ) {
		float region = smoothstep( 1.0 - uCityDensity, 1.3 - uCityDensity, planetNoise( p * 2.0 + 40.0 ) * 0.5 + 0.5 );
		float speck = smoothstep( 0.55, 0.9, planetNoise( p * 25.0 ) * 0.5 + 0.5 );
		planetCity = region * speck * land * ( 1.0 - ice );
	}

	// Clouds drift around the spin axis relative to the ground.
	if ( uCloudCover > 0.0 ) {
		vec3 cp = planetRotY( dir, t * uCloudSpeed ) * uCloudScale + uSeed + 31.7;
		float cw = planetNoise( cp * 0.5 + vec3( t * 0.05 ) );
		float c = saturate( planetFbm( cp + cw * 0.5, 5.0 ) * 0.8 + 0.5 );
		float cloud = smoothstep( 1.0 - uCloudCover, 1.0 - uCloudCover + uCloudSoftness + 1e-3, c );
		col = mix( col, uCloudColor, cloud );
		planetRough = mix( planetRough, 1.0, cloud );
		planetRelief *= 1.0 - cloud;
		planetMetal *= 1.0 - cloud;
		planetCity *= 1.0 - cloud;
		planetGlow *= 1.0 - 0.8 * cloud;
	}
	diffuseColor.rgb = col;
}
`;

// After <roughnessmap_fragment>.
export const PLANET_ROUGHNESS = /* glsl */ `
if ( uPlanet > 0.5 ) roughnessFactor = planetRough;
`;

// After <metalnessmap_fragment>: panels take their own metallic; the rest keeps the Material slider.
export const PLANET_METALNESS = /* glsl */ `
if ( uPlanet > 0.5 ) metalnessFactor = mix( metalnessFactor, uPanelMetallic, planetMetal );
`;

// After <normal_fragment_maps>, before the stylized normal soften. Tilts the normal against the height gradient;
// uBump = 1 means a relief of 5% of the radius, so the silhouette stays round and only the shading changes.
export const PLANET_NORMAL = /* glsl */ `
if ( uPlanet > 0.5 && uBump > 0.0 ) {
	normal = normalize( normal - ( uPlanetObjToView * planetGrad ) * ( uBump * 0.05 * planetRelief ) );
}
`;

// After <emissivemap_fragment>. City lights use the sun direction from the stylized layer (UE: MPC).
export const PLANET_EMISSIVE = /* glsl */ `
if ( uPlanet > 0.5 ) {
	float night = smoothstep( 0.15, - 0.25, dot( normal, uSunDirView ) );
	totalEmissiveRadiance += planetGlow + uCityColor * ( uCityIntensity * planetCity * night );
}
`;

// --- Atmosphere shell: back faces of a larger copy of the planet, additive. UE: Translucent, Additive, Unlit. ---
export const ATMOSPHERE_VERTEX = /* glsl */ `
varying vec3 vNormalView;
varying vec3 vNormalWorld;
varying vec3 vViewDir;
void main() {
	vec4 mv = modelViewMatrix * vec4( position, 1.0 );
	vNormalView = normalize( normalMatrix * normal );
	vNormalWorld = normalize( mat3( modelMatrix ) * normal );
	vViewDir = normalize( - mv.xyz );
	gl_Position = projectionMatrix * mv;
}
`;

export const ATMOSPHERE_FRAGMENT = /* glsl */ `
#include <common>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uLimb; // view-facing value at the planet limb, from the shell scale
uniform vec3 uSunDir; // world space
varying vec3 vNormalView;
varying vec3 vNormalWorld;
varying vec3 vViewDir;
void main() {
	// Back face: 0 at the outer edge of the shell, rising towards the planet limb.
	float f = saturate( - dot( normalize( vNormalView ), normalize( vViewDir ) ) / uLimb );
	float day = smoothstep( - 0.35, 0.4, dot( normalize( vNormalWorld ), uSunDir ) );
	gl_FragColor = vec4( uColor * ( uIntensity * f * f * f * day ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// --- Ring: flat translucent band with the planet shadow from a ray-sphere test. UE: Translucent material + MPC. ---
export const RING_VERTEX = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormalWorld;
varying float vRadius;
void main() {
	vec4 wp = modelMatrix * vec4( position, 1.0 );
	vWorldPos = wp.xyz;
	vNormalWorld = normalize( mat3( modelMatrix ) * normal );
	vRadius = length( position );
	gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const RING_FRAGMENT = /* glsl */ `
#include <common>
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
uniform float uInner; // object-space radii
uniform float uOuter;
uniform float uSeed;
uniform vec3 uSunDir; // world space
uniform vec3 uSunRadiance; // sun colour * intensity
uniform vec3 uPlanetCenter;
uniform float uPlanetRadius;
varying vec3 vWorldPos;
varying vec3 vNormalWorld;
varying float vRadius;
void main() {
	float r = ( vRadius - uInner ) / max( uOuter - uInner, 1e-4 );
	if ( r < 0.0 || r > 1.0 ) discard;
	float density = 0.55 + 0.25 * sin( r * 40.0 + uSeed ) + 0.12 * sin( r * 97.0 + uSeed * 2.3 ) + 0.08 * sin( r * 211.0 );
	float gap = smoothstep( 0.0, 0.025, abs( r - 0.62 ) ); // one Cassini-like gap
	float alpha = saturate( density ) * gap * smoothstep( 0.0, 0.04, r ) * smoothstep( 1.0, 0.92, r ) * uOpacity;
	vec3 albedo = mix( uColorA, uColorB, smoothstep( 0.15, 0.95, r ) );

	// Planet shadow: closest approach of the ray towards the sun.
	vec3 oc = vWorldPos - uPlanetCenter;
	float along = - dot( oc, uSunDir );
	float dist = length( oc + along * uSunDir );
	float shadow = along > 0.0 ? smoothstep( uPlanetRadius * 0.95, uPlanetRadius * 1.02, dist ) : 1.0;
	float nl = 0.35 + 0.65 * abs( dot( normalize( vNormalWorld ), uSunDir ) ); // thin ring: lit from both sides
	vec3 radiance = albedo * RECIPROCAL_PI * uSunRadiance * nl * mix( 0.05, 1.0, shadow ) + albedo * 0.03;
	gl_FragColor = vec4( radiance, alpha );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// --- Orbit line: thin torus, additive, with comet-like pulses running along it. UE: additive emissive material,
// pulses from a Panner on the ring's U coordinate. ---
export const ORBIT_VERTEX = /* glsl */ `
varying vec2 vRingXZ;
void main() {
	vRingXZ = position.xz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const ORBIT_FRAGMENT = /* glsl */ `
#include <common>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
uniform float uSpeed; // turns per second, sign = direction
uniform float uPulses;
uniform float uPulseLength; // fraction of the gap between pulses
uniform float uPhase;
uniform float uBase; // brightness of the line between pulses
varying vec2 vRingXZ;
void main() {
	float u = atan( vRingXZ.y, vRingXZ.x ) / PI2; // computed per pixel: no seam at +-PI
	float x = fract( ( u - uTime * uSpeed ) * uPulses + uPhase );
	if ( uSpeed < 0.0 ) x = 1.0 - x; // keep the bright head in front
	float pulse = smoothstep( 1.0 - uPulseLength, 1.0, x );
	pulse *= pulse;
	gl_FragColor = vec4( uColor * ( uIntensity * ( uBase + 3.0 * pulse ) ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;
