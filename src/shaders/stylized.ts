// GLSL snippets patched into MeshPhysicalMaterial. UE5 equivalent: a custom shading model
// that remaps the direct diffuse N·L, plus skylight tint and an emissive rim in the material graph.

export const STYLIZED_UNIFORMS = /* glsl */ `
uniform float uStylize;
uniform float uToonBlend;
uniform float uRampThreshold;
uniform float uRampSoftness;
uniform vec3 uShadowTint;
uniform vec3 uRimColor;
uniform float uRimIntensity;
uniform float uRimWidth;
`;

// Replaces `vec3 irradiance = dotNL * directLight.color;` in RE_Direct_Physical.
// directLight.color already holds the shadow-map term, so cast shadows stay PBR-correct.
export const STYLIZED_DIRECT = /* glsl */ `
float toonNL = smoothstep( uRampThreshold - uRampSoftness, uRampThreshold + uRampSoftness, dot( geometryNormal, directLight.direction ) );
vec3 irradiance = mix( dotNL, toonNL, uToonBlend * uStylize ) * directLight.color;
`;

// Runs after <lights_fragment_end>; geometryNormal / geometryViewDir are in scope there.
export const STYLIZED_POST_LIGHTS = /* glsl */ `
reflectedLight.indirectDiffuse *= mix( vec3( 1.0 ), uShadowTint, uStylize );
float rimNV = 1.0 - saturate( dot( geometryNormal, geometryViewDir ) );
float rim = smoothstep( 1.0 - uRimWidth, 1.0 - uRimWidth + uRampSoftness + 1e-3, rimNV );
totalEmissiveRadiance += uRimColor * ( uRimIntensity * rim * uStylize );
`;
