import { PLANET_VIEW } from '../config/tuning';

// Planet surface: patched into the same MeshPhysicalMaterial as the stylized layer, so UE lighting, the built-in
// layers and the NPR layer all still apply. It only drives material inputs: Base Color, Roughness, Normal, Emissive.
// UE: one master material with 3D noise on the object-space direction. Production would bake the noise into
// textures (cube map or tri-planar), because the UE Noise node is expensive.

export const PLANET_VERTEX_PARS = /* glsl */ `
varying vec3 vPlanetObj;
varying vec3 vPlanetObjN;
`;

// Before <project_vertex>: object-space position and normal after the morph targets.
export const PLANET_VERTEX = /* glsl */ `
vPlanetObj = transformed;
vPlanetObjN = objectNormal;
`;

// 3D simplex noise: Ashima Arts / Stefan Gustavson, MIT licence.
export const NOISE = /* glsl */ `
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
varying vec3 vPlanetObjN;
uniform float uPlanet;
uniform float uPlanetTime;
uniform float uPlanetInvRadius;
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
uniform float uCraters;
uniform float uCraterScale;
uniform float uCraterDensity;
uniform float uBubble;
uniform float uCloudCover;
uniform float uCloudSoftness;
uniform float uCloudScale;
uniform float uCloudSpeed;
uniform vec3 uCloudColor;
uniform float uCloudShadow;
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
uniform float uNeonGrid;
uniform float uTerrace;
uniform float uSurfaceEmissive;
uniform float uBandTwist;
uniform float uCellScale;
uniform float uCellCracks;
uniform float uCellCrackWidth;
uniform float uCellDots;
uniform float uCellDotSize;
uniform float uCellShape;
uniform float uCellFacets;
uniform vec3 uCellColor;
uniform float uCellGlow;
uniform vec3 uCellGlowColor;
uniform float uAuroraIntensity;
uniform vec3 uAuroraColor;
uniform vec3 uAuroraColorB;
uniform float uParcel;
uniform float uFace;
uniform vec3 uFaceColor;
uniform float uFaceGlow;
uniform float uBlush;
uniform vec3 uBlushColor;
uniform float uWhiskers;
uniform float uHeightAO;
uniform float uBevel;
uniform float uFoam;
uniform float uCloudPuff;
uniform float uSparkle;
uniform float uBlink;
uniform float uNebula;
uniform vec3 uPlanetCamObj; // camera in the planet's object space
uniform vec3 uRingShade; // ring inner, outer (planet radii), opacity
uniform float uScanProgress;
uniform vec2 uScanRange;
uniform vec3 uScanColor;
uniform float uScanWidth;
${NOISE}

vec3 planetHash3( vec3 p ) {
	p = vec3( dot( p, vec3( 127.1, 311.7, 74.7 ) ), dot( p, vec3( 269.5, 183.3, 246.1 ) ), dot( p, vec3( 113.5, 271.9, 124.6 ) ) );
	return fract( sin( p ) * 43758.5453123 );
}

// Voronoi: F1, F2 and the hash of the nearest cell; planetCellPoint is the feature point of that cell.
// Set by planetHeight and read by the colour pass and the facet normal.
vec3 planetCell = vec3( 8.0, 8.0, 0.0 );
vec3 planetCellPoint = vec3( 0.0 );
vec3 planetCellPos = vec3( 0.0 ); // the shaded point in cell space
vec3 planetVoronoi( vec3 P ) {
	vec3 b = floor( P );
	vec3 res = vec3( 8.0, 8.0, 0.0 );
	for ( int x = - 1; x <= 1; x ++ ) for ( int y = - 1; y <= 1; y ++ ) for ( int z = - 1; z <= 1; z ++ ) {
		vec3 c = b + vec3( x, y, z );
		vec3 h = planetHash3( c );
		float d = length( c + h - P );
		if ( d < res.x ) { res = vec3( d, res.x, h.x ); planetCellPoint = c + h; }
		else if ( d < res.y ) res.y = d;
	}
	return res;
}
bool planetCellsOn() { return uCellCracks + uCellDots + uCellFacets + uCellGlow > 0.0; }
// One dot per cell; a fifth of the cells stay empty. x: dot radius, y: 1 when the cell has a dot.
vec2 planetDot() { return vec2( uCellDotSize * mix( 0.7, 1.15, fract( planetCell.z * 7.13 ) ), step( 0.2, fract( planetCell.z * 3.71 ) ) ); }

// Motif SDFs, unit size (Inigo Quilez, MIT licence). UE: a motif texture instead.
float planetStar( vec2 p ) {
	const float rf = 0.45; // inner radius / tip radius
	const vec2 k1 = vec2( 0.809016994375, - 0.587785252292 );
	const vec2 k2 = vec2( - 0.809016994375, - 0.587785252292 );
	p.x = abs( p.x );
	p -= 2.0 * max( dot( k1, p ), 0.0 ) * k1;
	p -= 2.0 * max( dot( k2, p ), 0.0 ) * k2;
	p.x = abs( p.x );
	p.y -= 1.0;
	vec2 ba = rf * vec2( - k1.y, k1.x ) - vec2( 0.0, 1.0 );
	float h = clamp( dot( p, ba ) / dot( ba, ba ), 0.0, 1.0 );
	return length( p - ba * h ) * sign( p.y * ba.x - p.x * ba.y );
}
float planetHeart( vec2 p ) {
	p = p * 0.6 + vec2( 0.0, 0.55 );
	p.x = abs( p.x );
	vec2 a = p - vec2( 0.25, 0.75 );
	vec2 b = p - vec2( 0.0, 1.0 );
	vec2 c = p - 0.5 * max( p.x + p.y, 0.0 );
	float d = p.y + p.x > 1.0 ? sqrt( dot( a, a ) ) - 0.3535534 : sqrt( min( dot( b, b ), dot( c, c ) ) ) * sign( p.x - p.y );
	return d / 0.6;
}

// Face shapes on the xy plane of the unit direction.
float planetEll( vec2 f, vec2 c, vec2 r, float aa ) { return 1.0 - smoothstep( 1.0 - aa, 1.0 + aa, length( ( f - c ) / r ) ); }
float planetArc( vec2 f, vec2 c, float r, float w ) { return ( 1.0 - smoothstep( w * 0.6, w, abs( length( f - c ) - r ) ) ) * step( f.y, c.y ); }
// Latitude / longitude lines at a unit direction, about 2 px wide and never thinner than 0.02 grid cells.
float planetGridLines( vec3 d ) {
	float la = asin( clamp( d.y, - 1.0, 1.0 ) ) / PI * 9.0;
	float lo = atan( d.z, d.x ) / PI2 * 16.0;
	float wa = max( fwidth( la ), 0.02 );
	float wb = max( min( fwidth( lo ), 0.5 ), 0.02 ); // the atan seam sits on a grid line
	return max( 1.0 - smoothstep( wa, wa * 2.2, abs( fract( la + 0.5 ) - 0.5 ) ), 1.0 - smoothstep( wb, wb * 2.2, abs( fract( lo + 0.5 ) - 0.5 ) ) );
}
// A thin strip just above a height cut at x = 0, anti-aliased by w.
float planetStrip( float x, float w ) { return smoothstep( - w, w, x ) * ( 1.0 - smoothstep( 0.03, 0.03 + 2.0 * w, x ) ); }
float planetSeg( vec2 p, vec2 a, vec2 b ) { vec2 pa = p - a, ba = b - a; return length( pa - ba * clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 ) ); }

// Surface height 0..1 at an object-space point (in planet radii). One function feeds both the colour pass and the
// normal, so colour and relief always match (UE: one height texture drives Base Color and the normal map).
// Sampling by position, not direction, keeps it seamless on the torus and the star torus.
float planetHeight( vec3 pos, vec3 n, out vec3 warp, out float terrain, out float seam, out float cellHash ) {
	float t = uPlanetTime;
	vec3 p = pos * uNoiseScale + uSeed;
	// Domain warp; flow speed animates it, so the surface swirls like a liquid.
	vec3 pw = p * 0.7;
	vec3 fl = vec3( 0.0, 0.0, t * uFlowSpeed );
	warp = vec3( planetNoise( pw + fl ), planetNoise( pw + 17.3 - fl ), planetNoise( pw - 9.1 + fl.zxy ) );
	terrain = saturate( planetFbm( p + warp * uWarp, uDetail ) * 0.8 + 0.5 );
	float h = terrain;

	// Gas-giant bands: latitude stripes, differential rotation (equator faster than poles).
	if ( uBands > 0.0 ) {
		float lat = clamp( pos.y, - 1.0, 1.0 );
		vec3 bandPos = planetRotY( pos, t * uBandSpeed * ( 0.4 + 0.6 * ( 1.0 - lat * lat ) ) );
		float turb = planetFbm( bandPos * uNoiseScale * 1.5 + uSeed + warp * uWarp, min( uDetail, 4.0 ) );
		float twist = uBandTwist != 0.0 ? uBandTwist * atan( bandPos.z, bandPos.x ) : 0.0; // candy swirl
		float stripes = 0.5 + 0.5 * sin( ( lat * uBandFrequency + turb * uBandTurbulence ) * PI + twist );
		h = mix( h, stripes, uBands );
	}

	// Marble: folds the height into stripes, like stirred paint or milk.
	h = mix( h, 0.5 + 0.5 * sin( h * uMarbleFrequency * PI ), uMarble );

	// Craters: a bowl with a raised rim per occupied cell of a 3D grid (UE: Voronoi / baked crater height).
	if ( uCraters > 0.0 ) {
		vec3 cq = pos * uCraterScale + uSeed * 0.71;
		vec3 ci = floor( cq );
		float crater = 0.0;
		for ( int x = - 1; x <= 1; x ++ ) for ( int y = - 1; y <= 1; y ++ ) for ( int z = - 1; z <= 1; z ++ ) {
			vec3 cell = ci + vec3( x, y, z );
			vec3 rnd = planetHash3( cell );
			if ( rnd.x > uCraterDensity ) continue;
			float d = length( cq - cell - planetHash3( cell + 17.0 ) ) / mix( 0.25, 0.55, rnd.y );
			float bowl = d < 1.0 ? d * d - 1.0 : 0.0;
			float rim = exp( - pow( ( d - 1.0 ) * 4.0, 2.0 ) );
			crater += bowl * 0.6 + rim * 0.3;
		}
		h += uCraters * crater * 0.3;
	}

	// Voronoi cells: border grooves, a dome per dot; facets flatten the relief (their normal is set per cell).
	if ( planetCellsOn() ) {
		planetCellPos = pos * uCellScale + uSeed * 0.53;
		planetCell = planetVoronoi( planetCellPos );
		float border = planetCell.y - planetCell.x;
		h -= uCellCracks * ( 1.0 - smoothstep( 0.0, uCellCrackWidth * 2.0, border ) ) * 0.35;
		vec2 dotR = planetDot();
		h += uCellDots * dotR.y * sqrt( saturate( 1.0 - pow( planetCell.x / dotR.x, 2.0 ) ) ) * 0.3;
		h = mix( h, 0.5, uCellFacets );
	}

	// Machine panels: a 3D lattice cut by the surface. Each cell is a raised plate, the seams are grooves.
	seam = 1.0;
	cellHash = 0.0;
	if ( uPanels > 0.0 ) {
		vec3 q = pos * uPanelScale + uSeed * 0.37;
		vec3 f = fract( q );
		// Surface distance to each lattice plane: divide by how fast that axis changes along the surface.
		vec3 rate = sqrt( max( 1.0 - n * n, 1e-3 ) ) * uPanelScale;
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

// Cloud coverage at a point; clouds drift around the spin axis relative to the ground.
float planetClouds( vec3 pos, float octaves ) {
	float t = uPlanetTime;
	vec3 cp = planetRotY( pos, t * uCloudSpeed ) * uCloudScale + uSeed + 31.7;
	float cw = planetNoise( cp * 0.5 + vec3( t * 0.05 ) );
	float c = saturate( planetFbm( cp + cw * 0.5, octaves ) * 0.8 + 0.5 );
	return smoothstep( 1.0 - uCloudCover, 1.0 - uCloudCover + uCloudSoftness + 1e-3, c );
}
`;

// After <color_fragment>, before the stylized albedo gradient. Writes Base Color and the values later blocks use.
export const PLANET_ALBEDO = /* glsl */ `
float planetReliefH = 0.0; // height for the normal (liquids flat)
float planetRelief = 0.0; // relief strength mask: 0 under clouds
float planetRough = 1.0;
float planetMetal = 0.0; // panel metallic mask
float planetCity = 0.0;
float planetFilm = 0.5; // thin-film thickness 0..1, follows the height
float planetAO = 1.0; // from the height: cavities are occluded
vec3 planetGlow = vec3( 0.0 );
if ( uPlanet > 0.5 ) {
	vec3 pos = vPlanetObj * uPlanetInvRadius;
	vec3 n = normalize( vPlanetObjN );
	float t = uPlanetTime;
	vec3 p = pos * uNoiseScale + uSeed;

	// View ray through the planet, object space in planet radii: the chord to the far side of the unit sphere.
	// Used by the looks that show their inside (hologram back lines, nebula).
	vec3 viewRay = normalize( pos - uPlanetCamObj * uPlanetInvRadius );
	float rayB = dot( pos, viewRay );
	float rayDisc = rayB * rayB - dot( pos, pos ) + 1.0;
	float raySpan = rayDisc > 0.0 ? - rayB + sqrt( rayDisc ) : 0.0;
	vec3 sunObj = normalize( transpose( uPlanetObjToView ) * uSunDirView ); // UE: MPC sun direction

	// Hologram scan: everything above the front is cut away (UE: Masked, OpacityMask from object height).
	float scanBand = 0.0;
	if ( uScanProgress < 1.0 ) {
		float yN = ( vPlanetObj.y - uScanRange.x ) / max( uScanRange.y - uScanRange.x, 1e-4 );
		float front = uScanProgress * 1.1 - 0.05 + planetNoise( pos * 6.0 + t ) * 0.015;
		if ( yN > front ) discard;
		scanBand = 1.0 - smoothstep( 0.0, uScanWidth, front - yN );
	}

	vec3 warp;
	float terrain, seam, cellHash;
	float h = planetHeight( pos, n, warp, terrain, seam, cellHash );
	planetFilm = saturate( h );

	planetReliefH = planetReliefHeight( h );
	planetRelief = 1.0;

	// Ocean and land height ramps.
	float edge = fwidth( h ) + 1e-3;
	float land = smoothstep( uSeaLevel - edge, uSeaLevel + edge, h );
	float landH = saturate( ( h - uSeaLevel ) / max( 1.0 - uSeaLevel, 1e-3 ) );
	// Terrace: the same ramp cut into three flat tones (anti-aliased), with soft steps in the relief.
	float terraceW = fwidth( landH ) + 1e-3;
	vec3 landCol = mix( uLowColor, uMidColor, mix( smoothstep( 0.0, 0.5, landH ), smoothstep( 0.42 - terraceW, 0.42 + terraceW, landH ), uTerrace ) );
	landCol = mix( landCol, uHighColor, mix( smoothstep( 0.5, 1.0, landH ), smoothstep( 0.6 - terraceW, 0.6 + terraceW, landH ), uTerrace ) );
	planetReliefH = mix( planetReliefH, ( smoothstep( 0.38, 0.46, landH ) + smoothstep( 0.56, 0.64, landH ) ) * 0.2 + h * 0.3, uTerrace );
	vec3 seaCol = mix( uDeepColor, uShallowColor, smoothstep( uSeaLevel - 0.12, uSeaLevel, h ) );
	vec3 col = mix( seaCol, landCol, land );
	planetRough = mix( uOceanRoughness, uLandRoughness, land );

	// Bevel (toy look): land sits on a flat sea as a raised moulded piece, and every tone cut gets a light strip on
	// its upper edge, like the chamfer highlight of a plastic part. UE: the same height texture through offset steps.
	if ( uBevel > 0.0 ) {
		float coast = step( 1e-3, uSeaLevel );
		if ( coast > 0.0 ) planetReliefH = mix( mix( uSeaLevel, uSeaLevel * 0.3, uTerrace ), planetReliefH + uBevel * 0.2, smoothstep( uSeaLevel, uSeaLevel + 0.03, h ) );
		float strips = coast * planetStrip( landH, terraceW ) + uTerrace * ( planetStrip( landH - 0.42, terraceW ) + planetStrip( landH - 0.6, terraceW ) );
		col = mix( col, vec3( 1.0 ), uBevel * 0.35 * saturate( strips ) * land );
	}
	// Shore foam: a white band on the waterline and a thinner ring further out, both breathing slowly.
	if ( uFoam > 0.0 && uSeaLevel > 0.0 ) {
		float depth = uSeaLevel - h + 0.006 * sin( t * 1.5 + terrain * 30.0 );
		float foam = 1.0 - smoothstep( 0.012, 0.016 + edge, depth );
		foam = max( foam, 0.6 * ( 1.0 - smoothstep( 0.004, 0.008 + edge, abs( depth - 0.045 - 0.01 * sin( t * 1.1 ) ) ) ) );
		foam *= ( 1.0 - land ) * uFoam;
		col = mix( col, vec3( 1.0 ), foam );
		planetRough = mix( planetRough, 0.6, foam );
	}

	// Panels: per-plate tone and roughness variation, darker grooves (cavity baked into Base Color), metallic plates.
	if ( uPanels > 0.0 ) {
		float groove = 1.0 - smoothstep( 0.0, uPanelSeam, seam );
		col *= 1.0 - uPanels * ( 0.15 * cellHash + 0.75 * groove );
		planetRough = saturate( planetRough + uPanels * ( ( cellHash - 0.5 ) * 0.3 + 0.3 * groove ) );
		planetMetal = uPanels * land;
	}

	// Polar ice caps with a noisy edge.
	float ice = uPolarCap > 0.0 ? smoothstep( 1.0 - uPolarCap, 1.04 - uPolarCap, abs( clamp( pos.y, - 1.0, 1.0 ) ) + ( terrain - 0.5 ) * 0.3 ) : 0.0;
	col = mix( col, uIceColor, ice );
	planetRough = mix( planetRough, 0.35, ice );
	planetRelief *= 1.0 - 0.7 * ice;
	planetMetal *= 1.0 - ice;

	// Cells: facet tone per cell, dots, tinted cracks, and glowing borders (lava, gem edges).
	if ( planetCellsOn() ) {
		float border = planetCell.y - planetCell.x;
		float cw = max( uCellCrackWidth, fwidth( border ) );
		float crack = 1.0 - smoothstep( cw * 0.5, cw, border );
		vec3 facetCol = mix( mix( uLowColor, uMidColor, planetCell.z ), uHighColor, step( 0.8, planetCell.z ) );
		col = mix( col, facetCol, uCellFacets );
		vec2 dotR = planetDot();
		float dotSd = planetCell.x - dotR.x; // signed distance to the dot edge, in cells
		if ( uCellShape > 0.5 ) {
			// Star or heart, drawn in the tangent plane at the cell centre with its top towards the north pole.
			vec3 cdir = normalize( planetCellPoint - uSeed * 0.53 );
			vec3 north = normalize( vec3( 0.0, 1.0, 0.0 ) - cdir * cdir.y + 1e-5 );
			vec3 off = planetCellPos - planetCellPoint;
			vec2 m = vec2( dot( off, cross( north, cdir ) ), dot( off, north ) ) / dotR.x;
			dotSd = ( uCellShape < 1.5 ? planetStar( m ) : planetHeart( m ) ) * dotR.x;
			// A cell whose centre is far above or below the surface would show a clipped motif: leave it empty.
			dotR.y *= 1.0 - smoothstep( 0.22, 0.28, abs( dot( off, cdir ) ) );
		}
		float dotW = fwidth( dotSd ) + 1e-3;
		float dotMask = ( 1.0 - smoothstep( - dotW, dotW, dotSd ) ) * dotR.y * uCellDots;
		col = mix( col, uCellColor, dotMask );
		planetRough = mix( planetRough, min( planetRough + 0.3, 1.0 ), dotMask );
		col = mix( col, uCellColor, crack * uCellCracks * ( 1.0 - 0.7 * ice ) );
		if ( uCellGlow > 0.0 ) {
			float core = 1.0 - smoothstep( cw * 0.2, cw * 0.5, border );
			float pulse = 0.8 + 0.2 * sin( t * 1.5 + planetCell.z * PI2 );
			planetGlow += uCellGlowColor * ( uCellGlow * crack * pulse * ( 1.0 + 2.0 * core ) * ( 1.0 - ice ) );
			col *= 1.0 - crack * saturate( uCellGlow );
			// A few facets flash (gem sparkle).
			planetGlow += vec3( uCellFacets * step( 0.95, planetCell.z ) * pow( max( 0.0, sin( t * 2.4 + planetCell.z * 40.0 ) ), 8.0 ) * 2.0 );
		}
	}

	// Magma: low areas and ridged cracks glow, with a slow pulse.
	if ( uGlowIntensity > 0.0 ) {
		float low = 1.0 - smoothstep( uGlowLevel - 0.04, uGlowLevel + 0.04, h );
		float crack = pow( 1.0 - abs( planetNoise( p * 2.5 + warp * 1.5 + vec3( t * 0.02 ) ) ), 12.0 ) * uGlowCracks;
		float glow = saturate( low + crack ) * ( 1.0 - ice );
		float pulse = 0.75 + 0.25 * sin( t * 2.0 + planetNoise( p * 2.0 ) * 6.0 );
		planetGlow += uGlowColor * ( uGlowIntensity * glow * mix( 1.0, pulse, uGlowPulse ) );
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
		float wave = 0.5 + 0.5 * sin( dot( pos, vec3( 9.0, 7.0, 5.0 ) ) - t * uNeonSpeed );
		float sweep = pow( wave, 6.0 ); // seams light up only in narrow bands sweeping over the surface
		vec3 neonCol = mix( uNeonColor, uNeonColorB, smoothstep( 0.2, 0.8, h ) );
		float neon = seamLine * sweep + contour * ( 0.55 + 0.45 * wave );
		planetGlow += neonCol * ( uNeonIntensity * saturate( neon ) * ( 1.0 - ice ) );
	}

	// Hologram globe: grid lines on the front, dimmer ones on the far side, screen-space scan lines.
	if ( uNeonGrid > 0.0 ) {
		float lines = planetGridLines( normalize( pos ) ) + 0.3 * planetGridLines( normalize( pos + viewRay * raySpan ) );
		float scan = 0.75 + 0.25 * sin( gl_FragCoord.y * 1.2 - t * 8.0 );
		planetGlow += uNeonColor * ( uNeonGrid * lines * scan );
	}

	// Sparkle: glitter flakes that flash with the view angle, on the lit side only (UE: a tiling flake mask in Emissive).
	if ( uSparkle > 0.0 ) {
		vec3 sp = pos * 40.0;
		vec3 sh = planetHash3( floor( sp ) );
		float flake = 1.0 - smoothstep( 0.15, 0.4, length( fract( sp ) - 0.5 ) );
		float flash = pow( max( 0.0, sin( dot( viewRay, sh * 2.0 - 1.0 ) * 20.0 + t * 1.5 + sh.x * PI2 ) ), 12.0 );
		planetGlow += vec3( uSparkle * 3.0 * step( 0.8, sh.y ) * flake * flash * saturate( dot( n, sunObj ) * 2.0 + 0.3 ) );
	}

	// Nebula in glass: a spiral galaxy marched through the inside of the sphere, in the planet's equator plane.
	// UE: Custom node with the same 12-step loop; the shell stays an opaque glossy surface, so nothing sorts.
	if ( uNebula > 0.0 ) {
		vec3 acc = vec3( 0.0 );
		float through = 1.0;
		for ( int i = 0; i < 12; i ++ ) {
			vec3 pl = pos + viewRay * ( raySpan * ( float( i ) + 0.5 ) / 12.0 );
			float r = length( pl.xz );
			float arm = 0.5 + 0.5 * sin( atan( pl.z, pl.x ) * 2.0 - r * 7.0 );
			float fl = planetNoise( pl * 3.0 + vec3( 0.0, t * 0.08, 0.0 ) ) * 0.5 + 0.5;
			float density = pow( arm, 3.0 ) * smoothstep( 1.0, 0.15, r ) * exp( - abs( pl.y ) * ( 4.5 - r * 2.0 ) ) * ( 0.35 + fl );
			float core = exp( - length( pl ) * 6.0 ) * 2.5;
			vec3 tint = mix( uNeonColor, uNeonColorB, smoothstep( 0.35, 0.75, fl + r * 0.3 ) );
			acc += ( tint * ( density * 4.0 ) + vec3( 1.0, 0.85, 1.0 ) * ( core * 0.5 ) ) * ( raySpan / 12.0 * through );
			through *= 0.96;
		}
		planetGlow += acc * uNebula;
	}

	// Aurora: two curtains turning in opposite directions inside a belt around each pole.
	if ( uAuroraIntensity > 0.0 ) {
		float al = abs( normalize( pos ).y );
		float belt = smoothstep( 0.6, 0.7, al ) * ( 1.0 - smoothstep( 0.85, 0.95, al ) );
		vec3 pa = planetRotY( pos, t * 0.3 );
		vec3 pb = planetRotY( pos, - t * 0.2 );
		float c1 = sin( atan( pa.z, pa.x ) * 6.0 + planetNoise( pa * 2.0 ) * 3.0 );
		float c2 = sin( atan( pb.z, pb.x ) * 5.0 + planetNoise( pb * 2.0 + 5.0 ) * 3.0 );
		float curtain = max( smoothstep( 0.2, 0.4, c1 ), smoothstep( 0.4, 0.6, c2 ) * 0.7 ) * belt;
		planetGlow += mix( uAuroraColor, uAuroraColorB, saturate( ( al - 0.7 ) / 0.2 ) ) * ( uAuroraIntensity * curtain );
	}

	// City lights: clustered speckles on land; shown on the night side after the normal is known.
	if ( uCityIntensity > 0.0 ) {
		float region = smoothstep( 1.0 - uCityDensity, 1.3 - uCityDensity, planetNoise( p * 2.0 + 40.0 ) * 0.5 + 0.5 );
		// Round lights on a 3D grid, a random half of them lit: tidy toy lights, not noise glitter (UE: a tiling dot mask).
		vec3 cg = pos * 22.0;
		float speck = ( 1.0 - smoothstep( 0.18, 0.3, length( fract( cg ) - 0.5 ) ) ) * step( 0.5, planetHash3( floor( cg ) ).x );
		planetCity = region * speck * land * ( 1.0 - ice );
	}

	if ( uCloudCover > 0.0 ) {
		float cloud = planetClouds( pos, min( uDetail, 4.0 ) );
		// Cloud shadow: the cloud between this point and the sun (UE: second cloud sample offset by the MPC sun direction).
		if ( uCloudShadow > 0.0 ) {
			float shade = planetClouds( pos + sunObj * 0.06, 2.0 ) * smoothstep( - 0.1, 0.2, dot( n, sunObj ) ); // soft: 2 octaves are enough
			col *= 1.0 - uCloudShadow * 0.75 * shade * ( 1.0 - cloud );
		}
		// Puff (toy look): a second tone on the side away from the sun, and the cloud is a raised piece with its own
		// relief instead of a flat decal. UE: the same offset cloud sample that the shadow uses, mirrored.
		float puff = saturate( uCloudPuff );
		float cloudShade = puff > 0.0 ? 1.0 - planetClouds( pos - sunObj * 0.04, 2.0 ) : 0.0;
		col = mix( col, uCloudColor * mix( vec3( 1.0 ), vec3( 0.68, 0.72, 0.95 ), cloudShade * puff ), cloud );
		planetRough = mix( planetRough, 1.0, cloud );
		planetReliefH = mix( planetReliefH, 1.0, cloud * puff );
		planetRelief *= 1.0 - cloud * ( 1.0 - puff );
		planetMetal *= 1.0 - cloud;
		planetCity *= 1.0 - cloud;
		planetGlow *= 1.0 - 0.8 * cloud;
	}

	// Parcel: tape around two axes, a label and a blinking lamp on the +Z face. Object space, in planet radii.
	if ( uParcel > 0.0 ) {
		float tape = max( 1.0 - smoothstep( 0.14, 0.155, abs( pos.x ) ), 1.0 - smoothstep( 0.14, 0.155, abs( pos.y ) ) );
		float front = step( 0.55, pos.z );
		float label = ( 1.0 - smoothstep( 0.03, 0.045, length( max( abs( pos.xy - vec2( - 0.4, - 0.4 ) ) - vec2( 0.13, 0.11 ), 0.0 ) ) ) ) * front;
		float lamp = ( 1.0 - smoothstep( 0.025, 0.04, length( pos.xy - vec2( - 0.3, - 0.33 ) ) ) ) * front;
		col = mix( col, uLowColor, uParcel );
		col = mix( col, uMidColor, tape * uParcel );
		col = mix( col, uHighColor, label * uParcel );
		planetRough = mix( planetRough, mix( 0.5, 0.7, label ), max( tape, label ) * uParcel );
		planetReliefH = mix( planetReliefH, 0.5 + 0.15 * tape, uParcel );
		planetGlow += uNeonColor * ( uParcel * lamp * 2.0 * step( 0.0, sin( t * 3.0 ) ) );
	}

	// Face on the +Z side. The unit direction ignores the object scale, so the face follows an ellipsoid.
	if ( uFace > 0.5 ) {
		vec3 d = normalize( pos );
		float faceMask = smoothstep( 0.55, 0.8, d.z ) * ( 1.0 - smoothstep( 0.15, 0.5, d.y ) );
		col = mix( col, uLowColor, faceMask ); // patterns stay off the face
		planetRelief *= 1.0 - faceMask;
		if ( d.z > 0.0 ) {
			vec2 f = d.xy;
			float eyes = 0.0, shine = 0.0, blush = 0.0, wh = 0.0;
			// Blink: the open eyes squash shut for about 0.25 s every 3.3 s (UE: a scalar from Time).
			float eyeOpen = 1.0 - uBlink * ( 1.0 - smoothstep( 0.0, 0.04, abs( fract( t * 0.3 ) - 0.5 ) ) );
			for ( int k = 0; k < 2; k ++ ) {
				float sg = k == 0 ? 1.0 : - 1.0;
				vec2 e = vec2( sg * 0.3, 0.06 );
				if ( uFace < 1.5 ) {
					eyes += planetEll( f, e, vec2( 0.075, 0.1 * mix( 0.1, 1.0, eyeOpen ) ), 0.15 );
					shine += planetEll( f, e + vec2( 0.025, 0.035 ), vec2( 0.025 ), 0.3 ) * step( 0.9, eyeOpen );
				} else if ( uFace < 2.5 ) eyes += planetArc( f, e + vec2( 0.0, 0.05 ), 0.08, 0.022 );
				blush += planetEll( f, vec2( sg * 0.47, - 0.13 ), vec2( 0.12, 0.065 ), 0.4 );
				for ( int j = 0; j < 3; j ++ ) {
					float y0 = - 0.08 - 0.05 * float( j );
					wh = max( wh, 1.0 - smoothstep( 0.006, 0.012, planetSeg( f, vec2( sg * 0.52, y0 ), vec2( sg * 0.8, y0 + 0.05 * ( 1.0 - float( j ) ) - 0.03 ) ) ) );
				}
			}
			float drawn = uFace < 2.5 ? 1.0 : 0.0;
			float mouth = max( planetArc( f, vec2( 0.04, - 0.12 ), 0.04, 0.018 ), planetArc( f, vec2( - 0.04, - 0.12 ), 0.04, 0.018 ) ) * drawn;
			float nose = planetEll( f, vec2( 0.0, - 0.075 ), vec2( 0.035, 0.022 ), 0.3 ) * drawn;
			float lines = saturate( eyes + mouth + wh * uWhiskers );
			float lit = step( uFaceGlow, 0.0 ); // 1 = ink face, 0 = emissive face
			col = mix( col, uBlushColor, blush * 0.75 * uBlush );
			col = mix( col, uBlushColor * 0.8, nose );
			col = mix( col, uFaceColor * lit, lines );
			col = mix( col, vec3( 1.0 ), shine * lit );
			planetGlow += uFaceColor * ( uFaceGlow * lines ) + vec3( shine * mix( 1.0, 0.4, lit ) );
			planetRough = mix( planetRough, 0.12, saturate( eyes ) );
		}
	}

	// Ring shadow on the planet: the ring lies in the equator plane, so the shadow is a ray-plane test towards the sun.
	// UE: the ring mesh (Masked) casts a real shadow; this term is not needed there.
	if ( uRingShade.z > 0.0 ) {
		float ts = - pos.y / ( abs( sunObj.y ) > 1e-3 ? sunObj.y : 1e-3 );
		float rq = length( pos + sunObj * ts );
		float band = smoothstep( uRingShade.x, uRingShade.x + 0.04, rq ) * ( 1.0 - smoothstep( uRingShade.y - 0.04, uRingShade.y, rq ) ) * step( 0.0, ts );
		col *= 1.0 - 0.7 * uRingShade.z * band;
	}

	// Unlit surface (star): the colour is emitted and the lit Base Color goes black.
	if ( uSurfaceEmissive > 0.0 ) {
		planetGlow += col * uSurfaceEmissive;
		col = vec3( 0.0 );
		planetRough = 1.0;
	}

	// Scan front: hologram tint, a bright edge and a grid inside the band.
	if ( scanBand > 0.0 ) {
		vec3 g = abs( fract( pos * 12.0 ) - 0.5 );
		float grid = 1.0 - smoothstep( 0.0, 0.05, min( g.x, min( g.y, g.z ) ) );
		col = mix( col, uScanColor * 0.15, scanBand );
		planetGlow += uScanColor * ( scanBand * ( 1.0 + 3.0 * grid ) + 4.0 * pow( scanBand, 8.0 ) );
	}
	// Ambient occlusion from the relief height (UE: Ambient Occlusion input from the same height map).
	planetAO = mix( 1.0, saturate( 0.3 + planetReliefH * 1.3 ), uHeightAO * planetRelief );
	styleAO = planetAO;
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

// After <aomap_fragment>: the same occlusion three applies for an AO map.
export const PLANET_AO = /* glsl */ `
if ( uPlanet > 0.5 ) {
	reflectedLight.indirectDiffuse *= planetAO;
	reflectedLight.indirectSpecular *= planetAO;
}
`;

// After <normal_fragment_maps>, before the stylized normal soften. Tilts the normal against the height gradient;
// uBump = 1 means a relief of 5% of the radius, so the silhouette stays round and only the shading changes.
// Surface gradient from screen-space derivatives (Mikkelsen) with unnormalised position derivatives, so the
// strength does not change with zoom; it costs no extra height samples. UE: bake the height to a normal map.
export const PLANET_NORMAL = /* glsl */ `
if ( uPlanet > 0.5 && uBump > 0.0 ) {
	vec3 dpdx = dFdx( - vViewPosition );
	vec3 dpdy = dFdy( - vViewPosition );
	vec3 r1 = cross( dpdy, normal );
	vec3 r2 = cross( normal, dpdx );
	float det = dot( dpdx, r1 );
	vec3 surfGrad = ( dFdx( planetReliefH ) * r1 + dFdy( planetReliefH ) * r2 ) * ( sign( det ) / max( abs( det ), 1e-12 ) );
	// Height is in planet radii, the gradient is per view unit: scale by the radius.
	vec3 tilt = surfGrad * ( uBump * 0.05 * planetRelief / uPlanetInvRadius );
	float tiltLen = length( tilt );
	if ( tiltLen > 1.5 ) tilt *= 1.5 / tiltLen; // steep pixels (crater rims, seams) must not turn the normal away
	normal = normalize( normal - tilt );
}
// Facets: one flat normal per Voronoi cell, towards the cell centre plus a random lean (UE: baked facet normal map).
if ( uPlanet > 0.5 && uCellFacets > 0.0 ) {
	vec3 facetN = normalize( ( planetCellPoint - uSeed * 0.53 ) / uCellScale ) + ( planetHash3( planetCell.zzz * vec3( 91.0, 7.0, 13.0 ) ) - 0.5 ) * 0.5;
	normal = normalize( mix( normal, normalize( uPlanetObjToView * facetN ), uCellFacets ) );
}
`;

// After <emissivemap_fragment>. City lights use the sun direction from the stylized layer (UE: MPC).
// Bubble: Fresnel opacity (UE: Translucent, Opacity = Fresnel).
export const PLANET_EMISSIVE = /* glsl */ `
if ( uPlanet > 0.5 ) {
	float night = smoothstep( 0.15, - 0.25, dot( normal, uSunDirView ) );
	totalEmissiveRadiance += planetGlow + uCityColor * ( uCityIntensity * planetCity * night );
	if ( uBubble > 0.0 ) {
		float fres = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
		diffuseColor.a = mix( 1.0, 0.04 + 0.96 * fres, uBubble );
		// Film sheen: space has almost no sky to reflect, so the interference colours are added as emissive.
		// Cheap rainbow from the film thickness and the view angle, not a physical thin-film evaluation.
		float filmPhase = planetFilm * 2.5 + fres * 1.5 + uPlanetTime * 0.05;
		vec3 rainbow = 0.5 + 0.5 * cos( PI2 * ( filmPhase + vec3( 0.0, 0.33, 0.67 ) ) );
		// The hologram globe is a clear shell: no film colours.
		// Film colours show on the rim and fade to almost nothing face-on, so the middle of a bubble stays clear.
		totalEmissiveRadiance += rainbow * ( uBubble * ( 1.0 - saturate( uNeonGrid ) ) * ( 0.05 + 0.95 * fres ) * 0.7 );
	}
}
`;

// After <lights_physical_fragment>: thin-film thickness follows the surface pattern, so the colours swirl with it.
// UE: Substrate Slab thin film thickness from the same height.
export const PLANET_FILM = /* glsl */ `
#ifdef USE_IRIDESCENCE
if ( uPlanet > 0.5 ) material.iridescenceThickness = mix( iridescenceThicknessMinimum, iridescenceThicknessMaximum, planetFilm );
#endif
`;

// After <opaque_fragment>: a bubble keeps its specular highlights opaque, like a real soap film.
export const PLANET_ALPHA = /* glsl */ `
if ( uPlanet > 0.5 && uBubble > 0.0 ) {
	vec3 bubbleLit = reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	gl_FragColor.a = max( gl_FragColor.a, saturate( max( bubbleLit.r, max( bubbleLit.g, bubbleLit.b ) ) ) );
}
`;

// --- Shape SDFs: the same surfaces as src/geometry/planetShapes.ts, for raymarching the atmosphere. ---
const k = (x: number) => x.toFixed(6);
const R = PLANET_VIEW.radius;
const SHAPE_SDF = /* glsl */ `
uniform vec3 uDodecaN[ 12 ];
uniform vec3 uIcosaN[ 20 ];
uniform float uPolyInradius;
uniform float uRoundness;
uniform int uShapeA;
uniform int uShapeB;
uniform float uMorph; // 0 = shape A, 1 = shape B
const float SDF_R = ${k(R)};
const float SDF_EY = ${k(PLANET_VIEW.ellipsoidY)};
const float SDF_TORUS_MAJOR = ${k(PLANET_VIEW.torusMajor * R)};
const float SDF_TORUS_TUBE = ${k(PLANET_VIEW.torusTube * R)};
const float SDF_STAR_OUTER = ${k(PLANET_VIEW.starOuter * R)};
const float SDF_STAR_INNER = ${k(PLANET_VIEW.starOuter * PLANET_VIEW.starInner * R)};
const float SDF_STAR_TUBE = ${k(PLANET_VIEW.starTube * R)};
const float SDF_CUBE = ${k((PLANET_VIEW.roundCubeSize - PLANET_VIEW.roundCubeBevel) * R)}; // half size before the bevel
const float SDF_CUBE_R = ${k(PLANET_VIEW.roundCubeBevel * R)};

float sdfStarRadius( float u ) {
	const float seg = PI / 5.0;
	float i = floor( u / seg );
	bool tipFirst = mod( i, 2.0 ) < 0.5;
	float a0 = i * seg;
	float r0 = tipFirst ? SDF_STAR_OUTER : SDF_STAR_INNER;
	float r1 = tipFirst ? SDF_STAR_INNER : SDF_STAR_OUTER;
	vec2 p0 = r0 * vec2( cos( a0 ), sin( a0 ) );
	vec2 dd = r1 * vec2( cos( a0 + seg ), sin( a0 + seg ) ) - p0;
	float sharp = ( p0.x * dd.y - p0.y * dd.x ) / ( cos( u ) * dd.y - sin( u ) * dd.x );
	float rounded = SDF_STAR_INNER + ( SDF_STAR_OUTER - SDF_STAR_INNER ) * ( 0.5 + 0.5 * cos( 5.0 * u ) );
	return mix( sharp, rounded, uRoundness );
}

float sdfShape( int id, vec3 p ) {
	if ( id == 1 ) return ( length( p / vec3( 1.0, SDF_EY, 1.0 ) ) - SDF_R ) * SDF_EY; // ellipsoid, approximate
	if ( id == 2 ) {
		float d = - 1e9;
		for ( int i = 0; i < 12; i ++ ) d = max( d, dot( p, uDodecaN[ i ] ) );
		return d - uPolyInradius;
	}
	if ( id == 3 ) {
		float d = - 1e9;
		for ( int i = 0; i < 20; i ++ ) d = max( d, dot( p, uIcosaN[ i ] ) );
		return d - uPolyInradius;
	}
	if ( id == 4 ) return length( vec2( length( p.xz ) - SDF_TORUS_MAJOR, p.y ) ) - SDF_TORUS_TUBE;
	if ( id == 5 ) {
		float u = atan( p.z, p.x );
		if ( u < 0.0 ) u += PI2;
		return length( vec2( length( p.xz ) - sdfStarRadius( u ), p.y ) ) - SDF_STAR_TUBE; // approximate near the tips
	}
	if ( id == 6 ) { // rounded cube
		vec3 q = abs( p ) - SDF_CUBE;
		return length( max( q, 0.0 ) ) + min( max( q.x, max( q.y, q.z ) ), 0.0 ) - SDF_CUBE_R;
	}
	return length( p ) - SDF_R;
}

float sdfPlanet( vec3 p ) {
	float a = sdfShape( uShapeA, p );
	return uMorph > 0.0 ? mix( a, sdfShape( uShapeB, p ), uMorph ) : a;
}
`;

// --- Atmosphere: raymarched through the planet SDF, so it hugs any shape, also polyhedra and the star.
// Brightness follows the optical depth: thin haze face-on, bright limb. UE: Translucent Additive Unlit material
// with a Custom node for the march; shape id / morph / sun from an MPC. ---
export const ATMOSPHERE_VERTEX = /* glsl */ `
uniform float uBound;
varying vec3 vObjPos;
void main() {
	vObjPos = position * uBound;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( vObjPos, 1.0 );
}
`;

export const ATMOSPHERE_FRAGMENT = /* glsl */ `
#include <common>
${SHAPE_SDF}
uniform vec3 uColor;
uniform vec3 uSunsetColor;
uniform float uSunset;
uniform float uIntensity;
uniform float uThickness; // object units
uniform float uBound;
uniform vec3 uCamObj; // camera and sun in the planet's object space
uniform vec3 uSunObj;
uniform float uFade;
varying vec3 vObjPos;
void main() {
	vec3 ro = uCamObj;
	vec3 rd = normalize( vObjPos - ro );
	float b = dot( ro, rd );
	float disc = b * b - dot( ro, ro ) + uBound * uBound;
	if ( disc <= 0.0 ) discard;
	float s = sqrt( disc );
	float H = uThickness * 0.35; // scale height
	float tEnd = - b + s;
	// Per-pixel jitter of the start turns the remaining step banding into fine noise.
	float t = max( - b - s, 0.0 ) + fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) ) * H * 0.3;
	float depth = 0.0;
	vec3 tint = vec3( 0.0 );
	// Adaptive steps: half the distance to the surface, never below 0.4 scale heights. Fixed steps band badly.
	for ( int i = 0; i < 64; i ++ ) {
		if ( t >= tEnd ) break;
		vec3 p = ro + rd * t;
		float d = sdfPlanet( p );
		if ( d < 0.0 ) break;
		float dt = min( max( d * 0.5, H * 0.4 ), tEnd - t );
		t += dt;
		float dens = exp( - d / H ) * dt / H;
		float mu = dot( normalize( p ), uSunObj );
		float day = smoothstep( - 0.25, 0.15, mu );
		// Scattering colour: blue by day, sunset colour along the terminator (Rayleigh-like look, not physical).
		float twilight = exp( - pow( ( mu - 0.05 ) / 0.2, 2.0 ) );
		tint += mix( uColor, uSunsetColor, saturate( uSunset * twilight ) ) * ( dens * day );
		depth += dens;
	}
	// Forward scattering: looking towards the sun through the rim gives a back-lit halo.
	tint += uSunsetColor * ( depth * pow( saturate( dot( rd, uSunObj ) ), 6.0 ) * uSunset * 0.5 );
	vec3 col = tint / max( depth, 1e-4 ) * ( 1.0 - exp( - depth * 0.06 ) ) * ( uIntensity * uFade );
	gl_FragColor = vec4( col, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// --- Hexagon energy shield: additive sphere, hex grid on its lat-long UV, Fresnel edge, impact rings.
// UE: Translucent Additive Unlit on a sphere mesh; the same maths on its UVs. ---
export const SHIELD_VERTEX = /* glsl */ `
uniform float uRadius;
varying vec3 vDir;
varying vec3 vNormalView;
varying vec3 vViewPos;
void main() {
	vDir = normalize( position );
	vec4 mv = modelViewMatrix * vec4( position * uRadius, 1.0 );
	vNormalView = normalize( normalMatrix * normal );
	vViewPos = mv.xyz;
	gl_Position = projectionMatrix * mv;
}
`;

export const SHIELD_FRAGMENT = /* glsl */ `
#include <common>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uHexCount;
uniform float uTime;
uniform float uHitRate;
uniform float uFade;
varying vec3 vDir;
varying vec3 vNormalView;
varying vec3 vViewPos;
vec4 shieldHex( vec2 uv ) { // xy: offset from the cell centre, zw: cell centre
	const vec2 r = vec2( 1.0, 1.7320508 );
	vec2 h = r * 0.5;
	vec2 a = mod( uv, r ) - h;
	vec2 b = mod( uv - h, r ) - h;
	vec2 g = dot( a, a ) < dot( b, b ) ? a : b;
	return vec4( g, uv - g );
}
void main() {
	vec3 d = normalize( vDir );
	vec2 uv = vec2( ( atan( d.z, d.x ) / PI2 + 0.5 ) * uHexCount, ( asin( clamp( d.y, - 1.0, 1.0 ) ) / PI + 0.5 ) * uHexCount * 0.5 );
	vec4 hex = shieldHex( uv );
	vec2 g = abs( hex.xy );
	float edge = 0.5 - max( dot( g, normalize( vec2( 1.0, 1.7320508 ) ) ), g.x );
	float line = 1.0 - smoothstep( 0.0, 0.05, edge );
	float polar = 1.0 - smoothstep( 0.8, 0.97, abs( d.y ) ); // lat-long hexes squeeze at the poles, so fade them
	vec3 N = normalize( vNormalView ) * ( gl_FrontFacing ? 1.0 : - 1.0 );
	float fres = pow( 1.0 - abs( dot( N, normalize( - vViewPos ) ) ), 2.5 );

	// Impact: a ring of lit cells grows from a random point, one impact per 1 / hit rate seconds.
	float lon = ( hex.z / uHexCount - 0.5 ) * PI2;
	float lat = ( hex.w / ( uHexCount * 0.5 ) - 0.5 ) * PI;
	vec3 cellDir = vec3( cos( lat ) * cos( lon ), sin( lat ), cos( lat ) * sin( lon ) );
	float hitT = uTime * uHitRate;
	float local = fract( hitT );
	vec3 hitDir = normalize( fract( sin( vec3( 1.0, 2.0, 3.0 ) + floor( hitT ) * vec3( 12.9898, 78.233, 37.719 ) ) * 43758.5453 ) * 2.0 - 1.0 );
	float ang = acos( clamp( dot( cellDir, hitDir ), - 1.0, 1.0 ) );
	float flash = uHitRate > 0.0 ? ( 1.0 - smoothstep( 0.0, 0.15, abs( ang - local * 1.4 ) ) ) * ( 1.0 - local ) : 0.0;
	float shimmer = 0.5 + 0.5 * sin( uTime * 1.5 + fract( sin( dot( hex.zw, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) * PI2 );

	float glow = fres * 0.5 + line * polar * ( 0.12 + 0.6 * fres ) * ( 0.6 + 0.4 * shimmer ) + flash * ( 0.4 + 1.2 * line );
	gl_FragColor = vec4( uColor * ( uIntensity * glow * uFade ), 1.0 );
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
uniform float uFade;
varying vec3 vWorldPos;
varying vec3 vNormalWorld;
varying float vRadius;
void main() {
	float r = ( vRadius - uInner ) / max( uOuter - uInner, 1e-4 );
	if ( r < 0.0 || r > 1.0 ) discard;
	float density = 0.72 + 0.2 * sin( r * 26.0 + uSeed ) + 0.08 * sin( r * 61.0 + uSeed * 2.3 ); // a few soft bands, no fine grooves
	float gap = smoothstep( 0.0, 0.025, abs( r - 0.62 ) ); // one Cassini-like gap
	float alpha = saturate( density ) * gap * smoothstep( 0.0, 0.04, r ) * smoothstep( 1.0, 0.92, r ) * uOpacity;
	vec3 albedo = mix( uColorA, uColorB, smoothstep( 0.15, 0.95, r ) );

	// Planet shadow: closest approach of the ray towards the sun.
	vec3 oc = vWorldPos - uPlanetCenter;
	float along = - dot( oc, uSunDir );
	float dist = length( oc + along * uSunDir );
	float shadow = along > 0.0 ? smoothstep( uPlanetRadius * 0.95, uPlanetRadius * 1.02, dist ) : 1.0;
	float nl = 0.6 + 0.4 * abs( dot( normalize( vNormalWorld ), uSunDir ) ); // thin ring: lit from both sides, low contrast
	vec3 radiance = albedo * RECIPROCAL_PI * uSunRadiance * nl * mix( 0.3, 1.0, shadow ) + albedo * 0.08;
	gl_FragColor = vec4( radiance, alpha * uFade );
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
uniform float uFade;
varying vec2 vRingXZ;
void main() {
	float u = atan( vRingXZ.y, vRingXZ.x ) / PI2; // computed per pixel: no seam at +-PI
	float x = fract( ( u - uTime * uSpeed ) * uPulses + uPhase );
	if ( uSpeed < 0.0 ) x = 1.0 - x; // keep the bright head in front
	float pulse = smoothstep( 1.0 - uPulseLength, 1.0, x );
	pulse *= pulse;
	gl_FragColor = vec4( uColor * ( uIntensity * ( uBase + 3.0 * pulse ) * uFade ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;
