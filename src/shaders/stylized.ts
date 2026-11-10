// GLSL snippets patched into MeshPhysicalMaterial. Every term maps to something a UE 5.7 material
// instance can drive without post-process or a custom shading model; the UE equivalent is noted per snippet.
// uSunDirView / uCenterView stand in for a Material Parameter Collection fed by Blueprint.

export const STYLIZED_VERTEX_PARS = /* glsl */ `
varying float vStyleObjY;
`;

// After <begin_vertex>: object-space height for the albedo gradient.
export const STYLIZED_VERTEX = /* glsl */ `
vStyleObjY = transformed.y;
`;

export const STYLIZED_UNIFORMS = /* glsl */ `
varying float vStyleObjY;
uniform float uStylize;
uniform vec3 uSunDirView;
uniform vec3 uCenterView;
uniform vec2 uHeightRange;
uniform float uNormalSoften;
uniform vec3 uGradientColor;
uniform float uGradientStrength;
uniform vec3 uShadeColor;
uniform float uShadeStrength;
uniform vec3 uTerminatorColor;
uniform float uTerminatorIntensity;
uniform float uTerminatorWidth;
uniform vec3 uRimColor;
uniform float uRimIntensity;
uniform float uRimWidth;
uniform float uRimSoftness;
uniform float uRimLightSide;
uniform vec3 uSubsurfaceColor;
uniform float uSubsurfaceOpacity;
`;

// After <color_fragment>. UE: lerp(BaseColor, GradientColor, (1 - LocalY / BoundsY) * k) with ObjectLocalBounds.
export const STYLIZED_ALBEDO = /* glsl */ `
float styleH = saturate( ( vStyleObjY - uHeightRange.x ) / max( uHeightRange.y - uHeightRange.x, 1e-4 ) );
diffuseColor.rgb = mix( diffuseColor.rgb, uGradientColor, ( 1.0 - styleH ) * uGradientStrength * uStylize );
`;

// After <normal_fragment_maps>, before lighting, so direct light and IBL both use it.
// UE: world-space Normal output = lerp(PixelNormalWS, normalize(WorldPosition - ObjectPosition), k).
// styleN is the same soften applied to the vertex normal, without height detail: the emissive NPR terms below
// read the big form only (UE: Fresnel / dot with VertexNormalWS), so relief does not light up every groove.
export const STYLIZED_NORMAL = /* glsl */ `
vec3 styleSphereN = normalize( - vViewPosition - uCenterView );
normal = normalize( mix( normal, styleSphereN, uNormalSoften * uStylize ) );
vec3 styleN = normalize( mix( nonPerturbedNormal, styleSphereN, uNormalSoften * uStylize ) );
`;

// Appended in RE_Direct_Physical after the diffuse term. Port of UE legacy SubsurfaceBxDF (Subsurface Color + Opacity).
// Not gated by uStylize: it is a built-in UE shading model; black colour = off.
export const SUBSURFACE_DIRECT = /* glsl */ `
float ssInScatter = pow( saturate( dot( directLight.direction, - geometryViewDir ) ), 12.0 ) * mix( 3.0, 0.1, uSubsurfaceOpacity );
float ssNormal = saturate( dot( geometryNormal, halfDir ) * uSubsurfaceOpacity + 1.0 - uSubsurfaceOpacity );
float ssBackScatter = ssNormal / ( 2.0 * PI );
reflectedLight.directDiffuse += directLight.color * mix( ssBackScatter, 1.0, ssInScatter ) * uSubsurfaceColor;
`;

// After <lights_fragment_end>. UE: Emissive input, sun direction from an MPC; ignores cast shadows.
export const STYLIZED_POST_LIGHTS = /* glsl */ `
float styleNL = dot( styleN, uSunDirView );
totalEmissiveRadiance += diffuseColor.rgb * uShadeColor * ( uShadeStrength * ( 1.0 - saturate( styleNL ) ) * uStylize );
float styleBand = 1.0 - smoothstep( 0.0, uTerminatorWidth, abs( styleNL ) );
totalEmissiveRadiance += uTerminatorColor * ( uTerminatorIntensity * styleBand * uStylize );
float rimNV = 1.0 - saturate( dot( styleN, geometryViewDir ) );
float rim = smoothstep( 1.0 - uRimWidth, 1.0 - uRimWidth + uRimSoftness + 1e-3, rimNV );
float rimSide = uRimLightSide >= 0.0 ? saturate( styleNL * 0.5 + 0.5 ) : saturate( 0.5 - styleNL * 0.5 );
rim *= mix( 1.0, rimSide, abs( uRimLightSide ) );
totalEmissiveRadiance += uRimColor * ( uRimIntensity * rim * uStylize );
`;
