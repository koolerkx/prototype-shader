import type { MATERIAL_DEFAULTS, PLANET_DEFAULTS, STYLIZED_DEFAULTS } from './tuning';

// UE5 feasibility of a look, derived from the features it uses. The target is a Material Instance on the engine's
// own lighting, with no custom shading model and no engine change.
//   MI    - one Material Instance on a legacy shading model (Default Lit / Clear Coat / Subsurface / Cloth).
//   SUB   - needs Substrate: legacy materials have one shading model each and no thin film.
//           (Substrate is production-ready and on by default from UE 5.7; older projects must enable it.)
//   EXTRA - needs more than the material: a custom mesh, extra components, Blueprint, a Custom (HLSL) node,
//           or lit translucency. Limits that stay inside one material (toon term without cast shadows) are notes only.
// Notes are user-facing copy (zh-HK).

export type UeRating = { substrate: boolean; extra: boolean; notes: string[] };

export function ueRating(
  material: typeof MATERIAL_DEFAULTS, stylized: typeof STYLIZED_DEFAULTS,
  planet?: typeof PLANET_DEFAULTS, planetShape?: string, // planet mode only
): UeRating {
  const sub: string[] = [];
  const extra: string[] = [];
  const info: string[] = [];
  const npr = stylized.mode === 'stylized';

  const layers = [
    material.clearCoat > 0 && 'Clear Coat',
    material.subsurfaceColor !== '#000000' && 'Subsurface',
    material.fuzzAmount > 0 && 'Fuzz (Cloth)',
  ].filter((x): x is string => !!x);
  if (layers.length > 1) sub.push(`${layers.join(' + ')} 同時使用：legacy 每個材質只有一個 Shading Model，需要 Substrate。`);
  if (material.thinFilm > 0) sub.push('Thin Film 只有 Substrate 提供。');
  if (material.anisotropy > 0 && (material.fuzzAmount > 0 || material.subsurfaceColor !== '#000000')) {
    sub.push('Anisotropy 在 legacy 只支援 Default Lit 及 Clear Coat。');
  }

  if (npr && stylized.toonness > 0) {
    info.push('限制：Toon 分階以 Emissive 輸出，不受投影及其他光源影響，需要固定曝光。要受真實陰影影響，需要 Post Process 或自訂 Shading Model（材質無法做到）。');
  }
  if (npr && stylized.outlineWidth > 0) extra.push('Inverted Hull 描邊：需要 Overlay Material 或第二個 mesh，不是單一材質。');

  if (planet) {
    if (planetShape && planetShape !== 'sphere' && planetShape !== 'ellipsoid') extra.push(`形狀 ${planetShape}：需要自訂 Static Mesh（非引擎基本形狀）。`);
    if (planet.cellCracks > 0 || planet.cellGlow > 0 || planet.cellFacets > 0) {
      extra.push('Voronoi 邊線（F2−F1）及切面法線：Noise 節點不提供，需要 Custom (HLSL) 節點或烘焙貼圖；成本高。');
    } else if (planet.cellDots > 0) info.push('Voronoi 圓點成本較高，建議烘焙。');
    if (planet.cellDots > 0 && planet.cellShape > 0) info.push('星形／心形圖案：UE5 以圖案貼圖取代程序化 SDF。');
    if (planet.bubble > 0 && (material.clearCoat > 0 || (planet.neonGrid <= 0 && planet.surfaceEmissive <= 0))) {
      extra.push('Lit Translucent：光照解像度低、沒有 Clear Coat 高光、有排序問題；需要 Surface ForwardShading 或改用 Masked + Dither。');
    } else if (planet.bubble > 0) info.push('Unlit Translucent：注意 Overdraw 及排序。');
    if (planet.nebula > 0) extra.push('星雲假體積：Custom (HLSL) 節點內的 12 步迴圈；外殼保持 Opaque，沒有排序問題，但不是真正透明。');
    if (planet.attach === 'catEars') extra.push('貓耳：額外 Cone 組件，需要 Blueprint 按橢球表面定位（不可繼承非均等縮放）。');
    if (planet.attach === 'islands') extra.push('浮島：Instanced Static Mesh + Blueprint 公轉。');
    if (planet.attach === 'vortex') extra.push('漩渦：額外 Plane + Unlit 材質。');
    if (planet.attach === 'whaleTrail') extra.push('絲帶：需要 Spline Mesh 或 WPO 彎曲，Translucent Additive。');
    if (planet.attach === 'catEars' && planet.zzz > 0) extra.push('Zzz：需要 Niagara Sprite 或額外 Plane。');
    if (planet.attach === 'catEars' && planet.collar > 0) info.push('項圈與吊牌：Torus 及圓角 Cube 需要 Modeling Mode 產生。');
    if (planet.swayDeg > 0 || planet.breath > 0) info.push('擺動／呼吸：Blueprint 或 WPO。');
    if (planet.ringOpacity > 0) info.push('行星環：額外 Plane；星球投影以解析方式計算（MPC）。');
    if (planet.cloudCover > 0 || planet.cityIntensity > 0 || (npr && stylized.toonness > 0)) info.push('需要以 MPC 提供恆星方向。');
    if (planet.bevel > 0 || planet.foam > 0) info.push('倒角／泡沫：來自同一張 height 貼圖，Material Instance 內完成。');
    if (planet.cloudPuff > 0) info.push('雲層立體感：多一次雲層取樣，需要以 MPC 提供恆星方向。');
    if (planet.sparkle > 0) info.push('閃粉：Emissive 輸出，不受投影影響；建議使用平鋪閃片貼圖。');
    if (planet.atmoIntensity > 0) info.push('大氣：額外 Sphere + Additive 材質。');
    if (planet.orbitCount > 0 || planet.shieldIntensity > 0) info.push('軌道線／護盾：額外 mesh + Additive 材質。');
    if (planet.surfaceEmissive > 0 || planet.recipe === 6) info.push('Unlit Shading Model。');
    if (planet.recipe > 0) info.push('v2.1 配方：整套 PBR 通道由程序化 Height 及遮罩產生；UE5 建議每款一個 Material Function，或在載入時烘焙成貼圖。');
    if ([4, 5, 8, 9, 12, 13].includes(planet.recipe)) {
      extra.push('配方使用 Voronoi（F1、F2−F1、格子中心）：Noise 節點不提供，需要 Custom (HLSL) 節點或烘焙貼圖。');
    }
    if ((planet.recipe === 2 || planet.recipe === 8) && material.fuzzAmount > 0) info.push('Fuzz 只在遮罩範圍（雲、圓點）生效：Fuzz 數量 × 遮罩。');
  }
  return { substrate: sub.length > 0, extra: extra.length > 0, notes: [...extra, ...sub, ...info] };
}

/** Short badge text and the tooltip of a rating. */
export function ueBadge(r: UeRating): { text: string; level: 'mi' | 'sub' | 'extra'; title: string } {
  const text = [r.extra && 'EXTRA', r.substrate && 'SUB'].filter(Boolean).join(' + ') || 'MI';
  const head = r.extra ? '需要材質以外的工作或有限制' : r.substrate ? '需要 Substrate（legacy Shading Model 無法做到）' : '單一 Material Instance 可完成';
  return { text, level: r.extra ? 'extra' : r.substrate ? 'sub' : 'mi', title: [`UE5：${head}`, ...r.notes.map((n) => `• ${n}`)].join('\n') };
}
