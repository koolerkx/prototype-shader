// Stylized PBR v2.1: the 15 surface recipes of the design canvas v2.0, ported one to one. Each recipe writes the
// whole PBR channel set from the unit direction p: Albedo, Height (-> Normal and AO), Roughness, Metallic, Emissive
// and a Fuzz mask. Clear Coat, Subsurface and the Fuzz amount are constant per planet, so they stay Material params.
// uRecipe = canvas type + 1; 0 = off (the parametric planet surface runs instead).
// A = uLowColor, B = uMidColor, C = uHighColor, rim = the NPR rim colour.
// UE: one Material Function per recipe behind a static switch, or the channels baked to textures at load.

// Value noise, Voronoi and the anti-aliased step of the canvas, so the same seed gives the same pattern.
export const RECIPE_FUNCTIONS = /* glsl */ `
uniform float uRecipe;
uniform float uChannelView;
float rcH1( vec3 p ) { p = fract( p * 0.3183099 + 0.1 ); p *= 17.0; return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) ); }
float rcVn( vec3 x ) {
	vec3 i = floor( x ); vec3 f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( rcH1( i ), rcH1( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ), mix( rcH1( i + vec3( 0.0, 1.0, 0.0 ) ), rcH1( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ), f.y ),
		mix( mix( rcH1( i + vec3( 0.0, 0.0, 1.0 ) ), rcH1( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ), mix( rcH1( i + vec3( 0.0, 1.0, 1.0 ) ), rcH1( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ), f.y ), f.z );
}
float rcFbm( vec3 p ) { return 0.65 * rcVn( p ) + 0.35 * rcVn( p * 2.03 + 7.1 ); }
vec3 rcHash3( vec3 c ) { return fract( sin( vec3( dot( c, vec3( 127.1, 311.7, 74.7 ) ), dot( c, vec3( 269.5, 183.3, 246.1 ) ), dot( c, vec3( 113.5, 271.9, 124.6 ) ) ) ) * 43758.5453 ); }
// x: F1, y: F2, z: hash of the nearest cell; cc: its feature point.
vec3 rcVoro( vec3 P, out vec3 cc ) {
	vec3 b = floor( P ); float f1 = 8.0, f2 = 8.0, id = 0.0; cc = vec3( 0.0 );
	for ( int z = - 1; z <= 1; z ++ ) for ( int y = - 1; y <= 1; y ++ ) for ( int x = - 1; x <= 1; x ++ ) {
		vec3 c = b + vec3( x, y, z ); vec3 h = rcHash3( c ); vec3 fp = c + h; float d = length( fp - P );
		if ( d < f1 ) { f2 = f1; f1 = d; id = h.x; cc = fp; } else if ( d < f2 ) f2 = d;
	}
	return vec3( f1, f2, id );
}
float rcAas( float e, float x ) { float w = max( fwidth( x ), 1e-4 ); return smoothstep( e - w, e + w, x ); }
float rcSstep( float e, float s, float x ) { float w = max( fwidth( x ), s ); return smoothstep( e - w, e + w, x ); }
vec3 rcLin( vec3 c ) { return pow( c, vec3( 2.2 ) ); }
vec3 rcBand( float id, vec3 a, vec3 b, vec3 c ) { float h = fract( sin( id * 12.9898 + uSeed ) * 43758.5453 ); return h < 0.4 ? a : ( h < 0.75 ? b : c ); }
`;

// Emissive of the canvas is relative to its own light (1.45, no exposure). This rig is brighter after exposure,
// so emissive is scaled to keep the same balance against the lit surface.
const EMISSIVE_SCALE = '0.65';

// Inside main(), before the parametric planet surface. Colours mix in display space as in the canvas, then go linear.
export const RECIPE_ALBEDO = /* glsl */ `
if ( uPlanet > 0.5 && uRecipe > 0.5 ) {
	int kind = int( uRecipe + 0.5 ) - 1;
	vec3 p = normalize( vPlanetObj );
	float lat = p.y;
	float t = uPlanetTime;
	vec3 sd = vec3( uSeed );
	vec3 cA = pow( uLowColor, vec3( 1.0 / 2.2 ) );
	vec3 cB = pow( uMidColor, vec3( 1.0 / 2.2 ) );
	vec3 cC = pow( uHighColor, vec3( 1.0 / 2.2 ) );
	vec3 alb = cA;
	float h = 0.5, rough = 0.6, metal = 0.0, relief = 1.0;
	vec3 emis = vec3( 0.0 );

	if ( kind == 0 ) { // Terraced: two thresholds make stepped plateaus
		float nn = rcFbm( p * 1.5 + sd ); float t1 = rcAas( 0.45, nn ), t2 = rcAas( 0.62, nn );
		alb = mix( mix( cA, cB, t1 ), cC, t2 );
		float cap = rcAas( 0.85, abs( lat ) + ( nn - 0.5 ) * 0.1 );
		alb = mix( alb, vec3( 0.957, 0.973, 1.0 ), cap );
		h = ( t1 + t2 ) * 0.35 + nn * 0.3 + cap * 0.15; rough = mix( mix( 0.75, 0.55, t2 ), 0.35, cap );
	} else if ( kind == 1 ) { // Earthlike: smooth sea, rough land, fuzzy raised clouds
		float nl = rcFbm( p * 1.8 + sd );
		float land = rcAas( 0.52, nl ); float shore = clamp( rcAas( 0.49, nl ) - land, 0.0, 1.0 ); float deep = rcAas( 0.42, nl );
		alb = mix( mix( cA * 0.72, cA, deep ), cB, land ); alb = mix( alb, vec3( 0.96, 0.88, 0.66 ), shore );
		float cap = rcAas( 0.88, abs( lat ) + ( nl - 0.5 ) * 0.08 ); alb = mix( alb, cC, cap );
		vec3 pc = planetRotY( p, t * 0.25 );
		float cn = rcFbm( pc * 2.5 + 31.0 ); float cl = rcSstep( 0.6, 0.03, cn );
		alb = mix( alb, cC, cl * 0.95 );
		h = 0.3 + land * ( 0.25 + clamp( nl - 0.52, 0.0, 1.0 ) * 2.0 ) + cap * 0.1; h = mix( h, 0.75 + ( cn - 0.6 ) * 1.5, cl );
		rough = mix( mix( 0.12, 0.8, land ), 0.95, max( cl, cap * 0.5 ) ); planetFuzz = cl;
	} else if ( kind == 2 ) { // Gas giant: bands with a rounded sine relief, one storm
		float wp = ( rcFbm( p * 2.0 + sd ) - 0.5 ) * 0.8;
		float b = lat * 6.0 + wp; float id = floor( b ); float fb = fract( b ); float w = fwidth( b );
		alb = mix( rcBand( id, cA, cB, cC ), rcBand( id + 1.0, cA, cB, cC ), smoothstep( 1.0 - w, 1.0, fb ) );
		float lon = atan( p.z, p.x ) / PI2 + 0.5;
		float dl = lon - 0.3; dl -= floor( dl + 0.5 );
		float e = pow( dl / 0.07, 2.0 ) + pow( ( lat + 0.25 ) / 0.06, 2.0 );
		float we = min( fwidth( e ), 0.5 ); float sp = 1.0 - smoothstep( 1.0 - we, 1.0 + we, e );
		alb = mix( alb, vec3( 0.93, 0.56, 0.55 ), sp );
		alb = mix( alb, cA, rcAas( 0.9, abs( lat ) ) );
		h = 0.5 + 0.15 * sin( b * PI2 ) + sp * 0.2; rough = 0.45;
	} else if ( kind == 3 ) { // Ice: raised cells, low cracks, raised polar caps
		float nn = rcFbm( p * 1.5 + sd ); alb = mix( cA, cB, rcAas( 0.5, nn ) );
		float cap = rcAas( 0.6, abs( lat ) + ( rcFbm( p * 4.0 ) - 0.5 ) * 0.16 );
		vec3 c3; vec3 v = rcVoro( p * 4.0 + sd, c3 ); float ed = v.y - v.x;
		float crack = 1.0 - rcSstep( 0.05, 0.0, ed );
		alb = mix( alb, vec3( 0.96, 0.98, 1.0 ), cap );
		alb = mix( alb, cC, crack * ( 1.0 - cap * 0.7 ) );
		h = 0.35 + smoothstep( 0.0, 0.12, ed ) * 0.45 + cap * 0.2; rough = mix( 0.18, 0.45, cap );
	} else if ( kind == 4 ) { // Lava: high rock plates, low glowing cracks
		float nn = rcFbm( p * 2.0 + sd ); alb = mix( cA, cB, rcAas( 0.55, nn ) );
		vec3 c3; vec3 v = rcVoro( p * 3.0 + sd, c3 ); float ed = v.y - v.x; float fw = fwidth( ed );
		float outer = 1.0 - rcAas( max( 0.08, fw ), ed ); float core = 1.0 - rcAas( max( 0.032, fw * 0.5 ), ed );
		float pulse = 0.8 + 0.2 * sin( t * 1.5 + v.z * PI2 );
		vec3 lc = mix( vec3( 1.0, 0.227, 0.063 ), vec3( 1.0, 0.75, 0.25 ), core );
		alb *= 1.0 - outer; emis = rcLin( lc ) * outer * pulse * 4.0;
		h = smoothstep( 0.0, 0.16, ed ) * ( 0.6 + nn * 0.4 ); rough = 0.85;
	} else if ( kind == 5 ) { // Neon star: unlit flowing noise, rim colour on the edge
		vec3 pf = p * 3.0 + vec3( 0.0, 0.0, t * 0.15 );
		float w = rcFbm( pf * 0.5 ); float s = rcFbm( pf + ( w - 0.5 ) * 1.2 );
		vec3 sc = mix( mix( cA, cB, rcAas( 0.45, s ) ), cC, rcAas( 0.6, s ) );
		float edge = 1.0 - saturate( dot( normalize( vNormal ), normalize( vViewPosition ) ) );
		alb = mix( sc, pow( uRimColor, vec3( 1.0 / 2.2 ) ), rcAas( 1.0 - uRimWidth, edge ) * 0.85 );
		h = s; rough = 1.0; relief = 0.0;
	} else if ( kind == 6 ) { // Candy stripe: spiral stripes with a rounded sine relief
		float ang = atan( p.z, p.x );
		float sv = sin( lat * 4.0 * PI2 + 3.0 * ang );
		alb = mix( cA, cB, rcAas( 0.0, sv ) );
		float th = rcAas( 0.92, abs( sin( lat * 4.0 * PI + 1.5 * ang ) ) );
		alb = mix( alb, cC, th * 0.9 );
		float pole = rcAas( 0.9, abs( lat ) );
		alb = mix( alb, cA, pole );
		h = mix( 0.5 + 0.12 * sv, 0.5, pole ); rough = 0.35;
	} else if ( kind == 7 ) { // Mushroom dots: one dome per cell, 1 - (F1 / r)^2
		vec3 c3; vec3 v = rcVoro( p * 3.0 + sd, c3 );
		float rad = mix( 0.22, 0.36, fract( v.z * 7.13 ) ); float keep = step( 0.2, fract( v.z * 3.71 ) );
		float dm = ( 1.0 - rcAas( rad, v.x ) ) * keep; float rg = clamp( ( 1.0 - rcAas( rad + 0.05, v.x ) ) * keep - dm, 0.0, 1.0 );
		alb = mix( cA, cA * 0.72, rg ); alb = mix( alb, cB, dm );
		float dome = keep * clamp( 1.0 - pow( v.x / rad, 2.0 ), 0.0, 1.0 );
		h = 0.4 + sqrt( dome ) * 0.45; rough = mix( 0.5, 0.85, dm ); planetFuzz = dm;
	} else if ( kind == 8 ) { // Crystal: one faux facet normal per cell, grooved glowing edges
		vec3 c3; vec3 v = rcVoro( p * 3.5 + sd, c3 ); float hv = v.z;
		alb = mix( cA, cB, hv ); alb = mix( alb, cC, step( 0.8, hv ) );
		planetFacetN = normalize( normalize( ( c3 - sd ) / 3.5 ) + ( fract( vec3( hv, hv * 7.1, hv * 13.7 ) ) - 0.5 ) * 0.8 );
		float ed = v.y - v.x; float edge = 1.0 - rcAas( max( 0.03, fwidth( ed ) ), ed );
		emis = rcLin( vec3( 0.5, 0.94, 1.0 ) ) * edge * 1.2 + vec3( 1.0 ) * step( 0.95, hv ) * pow( max( 0.0, sin( t * 2.4 + hv * 40.0 ) ), 8.0 ) * 2.0;
		h = 1.0 - edge * 0.6; rough = 0.08; relief = 0.0;
	} else if ( kind == 9 ) { // Desert: sine dunes and one bowl crater with a raised rim
		float nn = rcFbm( p * 1.2 + sd ); alb = mix( cA, cB, rcAas( 0.5, nn ) );
		vec3 ax = normalize( vec3( 0.3, 1.0, 0.2 ) );
		float d = dot( p, ax ) * 18.0 + ( rcFbm( p * 3.0 ) - 0.5 ) * 4.0;
		float det = 1.0 - clamp( ( fwidth( d ) - 0.25 ) / 0.25, 0.0, 1.0 );
		alb = mix( alb, cC, rcAas( 0.6, sin( d * PI2 ) ) * 0.5 * det );
		float ang = acos( clamp( dot( p, normalize( vec3( 1.0, 0.3, 0.2 ) ) ), - 1.0, 1.0 ) ) / 0.35;
		float bowl = ang < 1.0 ? ( ang * ang - 1.0 ) * 0.5 : 0.0;
		float rimB = exp( - pow( ( ang - 1.1 ) / 0.12, 2.0 ) ) * 0.25;
		alb = mix( alb, cC * 0.92, 1.0 - rcAas( 1.0, ang ) );
		h = 0.5 + 0.12 * sin( d * PI2 ) * det + bowl + rimB; rough = 0.9;
	} else if ( kind == 10 ) { // Aurora: dark glossy base, two counter-rotating emissive curtains
		float nn = rcVn( p * 1.5 + sd ); alb = mix( cA, cB, rcAas( 0.5, nn ) );
		float al = abs( lat );
		float bm = rcAas( 0.7, al ) * ( 1.0 - rcAas( 0.9, al ) );
		vec3 pa = planetRotY( p, t * 0.3 ); vec3 pb = planetRotY( p, - t * 0.2 );
		float c1 = sin( atan( pa.z, pa.x ) * 6.0 + rcFbm( pa * 2.0 ) * 3.0 );
		float c2 = sin( atan( pb.z, pb.x ) * 5.0 + rcFbm( pb * 2.0 + 5.0 ) * 3.0 );
		float am = max( rcAas( 0.3, c1 ), rcAas( 0.5, c2 ) * 0.7 ) * bm;
		emis = rcLin( mix( vec3( 0.25, 1.0, 0.56 ), vec3( 1.0, 0.31, 0.75 ), clamp( ( al - 0.7 ) / 0.2, 0.0, 1.0 ) ) ) * am * 2.0;
		h = 0.5 + nn * 0.2; rough = 0.5;
	} else if ( kind == 11 ) { // Moon rock: bowl craters with raised rims; the face is three shallow pits on +Z
		float nn = rcFbm( p * 1.5 + sd ); alb = mix( cA, cB, rcAas( 0.5, nn ) );
		vec3 c3; vec3 v = rcVoro( p * 3.0 + sd, c3 );
		float rad = mix( 0.15, 0.38, fract( v.z * 5.3 ) ); float keep = step( 0.35, fract( v.z * 2.9 ) );
		keep *= 1.0 - rcAas( cos( 0.6 ), p.z );
		float rr = v.x / rad;
		float bowl = keep * ( rr < 1.0 ? ( rr * rr - 1.0 ) * 0.45 : 0.0 ) + keep * exp( - pow( ( rr - 1.08 ) / 0.12, 2.0 ) ) * 0.22;
		alb = mix( alb, cC, ( 1.0 - rcAas( 1.0, rr ) ) * keep * 0.6 );
		float d1 = acos( clamp( dot( p, normalize( vec3( 0.28, 0.25, 1.0 ) ) ), - 1.0, 1.0 ) ) / 0.11;
		float d2 = acos( clamp( dot( p, normalize( vec3( - 0.28, 0.25, 1.0 ) ) ), - 1.0, 1.0 ) ) / 0.11;
		float dm = acos( clamp( dot( p, normalize( vec3( 0.0, - 0.15, 1.0 ) ) ), - 1.0, 1.0 ) );
		float mouth = ( 1.0 - rcAas( 0.3, dm ) ) * rcAas( 0.0, - ( p.y + 0.05 ) );
		float face = ( d1 < 1.0 ? ( d1 * d1 - 1.0 ) * 0.4 : 0.0 ) + ( d2 < 1.0 ? ( d2 * d2 - 1.0 ) * 0.4 : 0.0 ) - mouth * 0.25;
		alb = mix( alb, cC * 0.8, clamp( ( 1.0 - rcAas( 1.0, d1 ) ) + ( 1.0 - rcAas( 1.0, d2 ) ) + mouth, 0.0, 1.0 ) );
		h = 0.5 + bowl + face + nn * 0.12; rough = 0.95;
	} else if ( kind == 12 ) { // Jelly: slow flowing low-frequency noise, bubbles inside
		float nn = rcFbm( ( p + vec3( 0.0, t * 0.05, 0.0 ) ) * 2.0 + sd );
		vec3 c3; vec3 v = rcVoro( p * 4.0 + sd, c3 );
		float bub = ( 1.0 - rcAas( 0.16, v.x ) ) * step( 0.5, fract( v.z * 3.3 ) );
		alb = mix( cA, cB, rcAas( 0.55, nn ) * 0.5 ); alb = mix( alb, cC, bub * 0.7 );
		h = 0.5 + ( nn - 0.5 ) * 0.5 + bub * 0.2; rough = 0.25;
	} else if ( kind == 13 ) { // Machine: cube-projected panels, grooved seams, corner rivets, blinking lamps
		vec3 ap = abs( p ); vec2 uv; float ax2;
		if ( ap.x > ap.y && ap.x > ap.z ) { uv = p.yz / ap.x; ax2 = sign( p.x ); }
		else if ( ap.y > ap.z ) { uv = p.xz / ap.y; ax2 = 2.0 * sign( p.y ); }
		else { uv = p.xy / ap.z; ax2 = 3.0 * sign( p.z ); }
		vec2 g = uv * 1.5; vec2 cell = floor( g ); vec2 fr = fract( g ) - 0.5;
		float border = 0.5 - max( abs( fr.x ), abs( fr.y ) );
		float seam = 1.0 - rcSstep( 0.035, 0.0, border );
		float id = fract( sin( dot( cell, vec2( 12.99, 78.23 ) ) + ax2 * 4.1 ) * 43758.5 );
		float painted = step( 0.5, id );
		float rv = 1.0 - rcAas( 0.045, length( abs( fr ) - 0.37 ) );
		alb = mix( cA, cB, painted ); alb = mix( alb, alb * 0.5, seam );
		metal = ( 1.0 - painted ) * ( 1.0 - seam ); rough = mix( 0.28, 0.45, painted );
		float lamp = ( 1.0 - rcAas( 0.12, length( fr ) ) ) * step( 0.82, id );
		emis = rcLin( cC ) * lamp * step( 0.0, sin( t * 3.0 + id * 20.0 ) ) * 3.0;
		alb = mix( alb, cC, lamp );
		h = 0.35 + smoothstep( 0.0, 0.06, border ) * 0.45 + rv * 0.15 + lamp * 0.1;
	} else { // Cotton cloud: smoothstep puffs
		float n1 = rcFbm( planetRotY( p, t * 0.1 ) * 2.2 + sd );
		alb = mix( cB, cA, rcSstep( 0.5, 0.04, n1 ) );
		h = pow( smoothstep( 0.38, 0.7, n1 ), 0.6 ); rough = 1.0;
	}

	vec3 albL = rcLin( alb );
	planetAlbedoOut = albL;
	albL *= 1.0 - planetRingShadow( vPlanetObj * uPlanetInvRadius, normalize( transpose( uPlanetObjToView ) * uSunDirView ) );
	if ( kind == 5 ) { emis = albL * 2.2; albL = vec3( 0.0 ); } // Unlit
	planetReliefH = h;
	planetRelief = relief;
	planetRough = clamp( rough, 0.03, 1.0 );
	planetMetal = metal;
	planetGlow = emis * ${EMISSIVE_SCALE};
	planetAO = mix( 1.0, saturate( 0.3 + h * 1.3 ), uHeightAO );
	styleAO = planetAO;
	diffuseColor.rgb = albL;
}
`;

// After <colorspace_fragment>: shows one channel in display space, as the channel viewer of the canvas does.
// 1 Albedo, 2 Height, 3 Normal (view space), 4 Roughness, 5 Metallic, 6 AO, 7 Emissive, 8 Clear Coat / Subsurface / Fuzz.
export const PLANET_CHANNEL = /* glsl */ `
if ( uPlanet > 0.5 && uChannelView > 0.5 ) {
	vec3 ch = pow( planetAlbedoOut, vec3( 1.0 / 2.2 ) );
	if ( uChannelView > 7.5 ) {
		ch = vec3( 0.0, max3( uSubsurfaceColor ), 0.0 );
		#ifdef USE_CLEARCOAT
		ch.r = material.clearcoat;
		#endif
		#ifdef USE_SHEEN
		ch.b = max3( material.sheenColor );
		#endif
	}
	else if ( uChannelView > 6.5 ) ch = pow( planetGlow / ( 1.0 + planetGlow ), vec3( 1.0 / 2.2 ) );
	else if ( uChannelView > 5.5 ) ch = vec3( planetAO );
	else if ( uChannelView > 4.5 ) ch = vec3( metalnessFactor );
	else if ( uChannelView > 3.5 ) ch = vec3( roughnessFactor );
	else if ( uChannelView > 2.5 ) ch = normal * 0.5 + 0.5;
	else if ( uChannelView > 1.5 ) ch = vec3( saturate( planetReliefH ) );
	gl_FragColor = vec4( ch, 1.0 );
}
`;
