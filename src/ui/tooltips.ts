// Hover text for panel rows, keyed by the param key. User-facing copy is zh-HK; labels stay English.
export const TOOLTIPS: Record<string, string> = {
  // Object / presets
  shape: '測試用的基本幾何體。',
  preset: '載入一組預設材質參數（會覆蓋目前的 Material 及 NPR 設定，燈光不變）。',

  // Default Lit
  mode: 'standard：純 UE5 Default Lit。\nstylized：在 PBR 之上加入材質層的 NPR 效果（Normal Soften、Shade、Terminator、Rim 等）。',
  baseColor: '基礎顏色（UE: Base Color）。',
  metallic: '金屬度。0 = 非金屬，1 = 金屬；金屬沒有漫反射，顏色來自反射（UE: Metallic）。',
  specular: '非金屬的反射強度。0.5 = UE 預設，F0 = 0.04（UE: Specular）。',
  roughness: '粗糙度。數值越低，高光越細越亮（UE: Roughness）。',
  emissiveColor: '自發光顏色（UE: Emissive Color）。',
  emissiveIntensity: '自發光強度，與顏色相乘。',

  // Shading layers
  clearCoat: '透明塗層的強度：玩具塑膠、汽車或戰機烤漆的雙層光澤（UE: Clear Coat）。',
  clearCoatRoughness: '透明塗層的粗糙度。數值越低，塗層高光越銳利（UE: Clear Coat Roughness）。',
  fuzzAmount: '絨毛層的強度：邊緣出現柔和的絨光，並受燈光影響，適合毛公仔及布料（UE: Cloth / Substrate Fuzz）。',
  fuzzColor: '絨毛層的顏色（UE: Fuzz Color）。',
  fuzzRoughness: '絨毛層的粗糙度。數值越高，絨光越分散（UE: Fuzz Roughness）。',
  subsurfaceColor: '次表面散射的顏色：明暗分界線變軟，暗部透出這個顏色，形成軟膠感。黑色 = 關閉（UE: Subsurface Color）。',
  subsurfaceOpacity: '次表面不透明度。數值越低，光線越容易穿透，背光時越亮（UE: Opacity，Subsurface 模型）。',
  thinFilm: '薄膜干涉的強度：彩虹色反射，適合座艙罩及水晶（UE: Substrate Thin Film）。',
  thinFilmThicknessNm: '薄膜厚度（納米）。厚度決定彩虹色的色相。',
  thinFilmIor: '薄膜折射率。',
  anisotropy: '異向性高光：高光沿一個方向拉長，適合拉絲金屬（UE: Anisotropy）。',
  anisotropyRotationDeg: '異向性高光的方向（度）。',

  // NPR: form
  normalSoften: '把法線推向「由物件中心向外」的球面方向，令明暗變成大塊平滑的漸變，接近動漫的筆觸。中心不在物件內部的形狀（例如 torus、plane）效果會不自然（UE: Normal 輸出 lerp）。',
  gradientColor: '物件底部的漸變顏色（UE: ObjectLocalBounds + lerp Base Color）。',
  gradientStrength: '底部漸變的強度。0 = 關閉。',

  // NPR: shade
  shadeColor: '背光面的顏色。用 emissive 提亮暗部，令陰影帶顏色而不是變黑（UE: MPC 太陽方向 + Emissive）。',
  shadeStrength: '背光面顏色的強度。注意：材質無法讀取投影，被遮擋的位置仍然會被提亮。',
  terminatorColor: '明暗分界線上的顏色帶，例如暖紅色可以做出「透紅」的可愛感。',
  terminatorIntensity: '分界線顏色帶的強度。0 = 關閉。',
  terminatorWidth: '分界線顏色帶的寬度（以 N·L 計算）。',

  // NPR: rim
  rimColor: '邊緣光的顏色（UE: Fresnel + Emissive）。',
  rimIntensity: '邊緣光的強度。0 = 關閉。',
  rimWidth: '邊緣光的寬度。數值越高，向內延伸越多。',
  rimSoftness: '邊緣光內側邊界的柔和度。0 = 硬邊。',
  rimLightSide: '邊緣光出現的位置：-1 = 只在背光面，0 = 全部，1 = 只在受光面。',

  // Lighting
  sunColor: '太陽光（Directional Light）的顏色。',
  sunIntensity: '太陽光的強度。',
  sunAzimuthDeg: '太陽的水平方向（度）。',
  sunElevationDeg: '太陽的高度角（度）。0 = 地平線，90 = 正上方。',
  skyIntensity: '環境光（IBL / Sky Light）的強度，影響暗部亮度及反射。',

  // Post
  toneMapping: '色調映射。ACES 最接近 UE5 預設的 Filmic Tonemapper。',
  exposure: '曝光倍數。',
};
