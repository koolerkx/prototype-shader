// Hover text for panel rows, keyed by the param key. User-facing copy is zh-HK; labels stay English.
export const TOOLTIPS: Record<string, string> = {
  // Object / presets
  shape: '測試用的基本幾何體。',

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

  // App mode
  appMode: 'material：單一物件的材質測試（原有功能）。\nplanet：程序化星球表面。兩個模式各自保存 Material、NPR 及 Lighting 參數（planet 模式預設的 Sky Intensity 較低），切換時不會互相覆蓋。',

  // Planet: shape and motion
  planetShape: '星球的形狀。所有形狀都是同一個 UV 網格的 morph target，所以切換時會平滑變形（UE: 把每個形狀 bake 進 mesh，用 World Position Offset lerp）。torus = 甜甜圈，starTorus = 沿五角星路徑的環。',
  planetPreset: '載入星球預設（會覆蓋 Planet、Material 及 NPR 參數；只有自訂預設會一併載入燈光）。★ = 儲存在此瀏覽器的自訂預設。',
  preset: '載入材質預設（會覆蓋 Material 及 NPR 參數）。★ = 儲存在此瀏覽器的自訂預設。',
  tiltDeg: '自轉軸的傾斜角度（度）。光環跟隨傾斜。',
  spinDegPerSec: '自轉速度（度／秒）（UE: Rotating Movement）。',
  timeScale: '所有動畫的時間倍數：自轉、雲層、氣體帶流動、岩漿脈動。0 = 暫停。',

  // Planet: terrain
  seed: '隨機種子。改變數值會得到另一個地形分佈。',
  noiseScale: '地形 noise 的頻率。數值越高，大陸越細碎。',
  warp: 'Domain warp 的強度：扭曲 noise 的座標，令海岸線及雲帶出現漩渦形狀。',
  detail: 'fbm 的層數（octaves）。數值越高，細節越多，運算量亦越高。',
  bump: '高度起伏的強度，用於計算法線。1 = 起伏為半徑的 5%，所以外形仍然是圓的，只有明暗改變。法線與顏色使用同一個高度函數，所以兩者一致。海洋及岩漿是平面；雲層下沒有起伏（UE: Height → NormalFromHeightmap 或 bake 成 Normal Map）。',
  flowSpeed: 'Domain warp 的動畫速度。數值越高，表面越像液體一樣流動。',

  // Planet: ocean and land
  seaLevel: '海平面高度。低於此高度為海洋。0 = 沒有海洋。',
  deepColor: '深海顏色。',
  shallowColor: '淺海（近岸）顏色。',
  lowColor: '低地顏色（陸地高度漸變的起點）。',
  midColor: '中高度顏色。',
  highColor: '高山顏色（陸地高度漸變的終點）。',
  oceanRoughness: '海面粗糙度。數值越低，太陽的反光越集中。',
  landRoughness: '陸地粗糙度。',
  polarCap: '極地冰帽的範圍。0 = 沒有冰帽，1 = 整個星球。',
  iceColor: '冰帽顏色。',

  // Planet: bands
  bands: '氣體巨行星的條紋比例：以緯度條紋取代地形高度。0 = 純地形，1 = 純條紋。條紋使用陸地的三個顏色。',
  bandFrequency: '條紋的數量。',
  bandTurbulence: '條紋的擾動強度。數值越高，條紋越彎曲。',
  bandSpeedDegPerSec: '條紋流動速度（度／秒）。赤道較快、兩極較慢，所以條紋會隨時間被拉長。',

  marble: '大理石紋的比例：把高度摺成條紋，像攪拌中的顏料或牛奶。0 = 關閉。',
  marbleFrequency: '大理石紋的條紋數量。',

  // Planet: machine panels
  panels: '機械面板的比例：表面切成一塊塊凸起的金屬板，接縫是凹槽。0 = 關閉。',
  panelScale: '面板的密度（每個半徑的格數）。數值越高，面板越細。',
  panelSeam: '接縫凹槽的闊度（以星球半徑計算）。凹槽的 Base Color 較暗，Roughness 較高。',
  panelMetallic: '面板的 Metallic 值。其他地區使用 Material 的 Metallic。注意：planet 模式的環境光很弱，金屬面主要只反射太陽。',

  // Planet: neon
  neonColor: '霓虹光在低處的顏色。',
  neonColorB: '霓虹光在高處的顏色（按高度在兩色之間漸變）。',
  neonIntensity: '霓虹光的強度（Emissive）。0 = 關閉。',
  neonSeams: '面板接縫發光的比例（需要 Panels > 0）。接縫只在掃過表面的窄光帶內發光。',
  neonContours: '等高線的數量；等高線會發光並隨時間移動。0 = 關閉。',
  neonSpeed: '霓虹光波動及等高線移動的速度。負數 = 反方向。',

  // Planet: clouds
  cloudCover: '雲層覆蓋率。0 = 沒有雲。',
  cloudSoftness: '雲層邊緣的柔和度。',
  cloudScale: '雲層 noise 的頻率。',
  cloudSpeedDegPerSec: '雲層相對地表的移動速度（度／秒）。',
  cloudColor: '雲層顏色。雲層會遮蓋城市燈光，並減弱岩漿的光。',

  // Planet: glow and lights
  glowColor: '岩漿／發光區域的顏色（Emissive）。',
  glowIntensity: '發光強度。0 = 關閉。',
  glowLevel: '低於此高度的地區會發光（岩漿海或發光海）。0 = 關閉。',
  glowCracks: '地殼裂縫發光的強度（ridged noise）。',
  glowPulse: '發光的脈動幅度。0 = 固定亮度。',
  cityColor: '城市燈光的顏色。',
  cityIntensity: '城市燈光強度。只在背光面的陸地出現（UE: MPC 太陽方向 + Emissive）。',
  cityDensity: '城市的分佈密度。',

  // Planet: atmosphere
  atmoColor: '大氣層白天的顏色。大氣層沿視線 raymarch 星球的 SDF，所以會貼合任何形狀，包括正多面體及星形（UE: Translucent Additive Unlit + Custom node）。',
  atmoIntensity: '大氣層的亮度。受光面較亮。0 = 關閉。',
  atmoThickness: '大氣層外殼的厚度（以星球半徑計算）。',

  // Planet: ring
  ringOpacity: '光環的不透明度。0 = 隱藏光環。光環會接收星球的投影（以球體測試計算）。',
  ringInner: '光環的內半徑（以星球半徑計算）。',
  ringOuter: '光環的外半徑（以星球半徑計算）。',
  ringColorA: '光環的內側顏色。',
  ringColorB: '光環的外側顏色。',

  // Planet: orbit lines
  orbitCount: '軌道線的數量（0–3）。每條軌道的傾角及方向不同。',
  orbitRadius: '第一條軌道的半徑（以星球半徑計算）。',
  orbitSpacing: '軌道之間的距離（以星球半徑計算）。',
  orbitInclinationDeg: '軌道的傾斜角度（度）。三條軌道使用不同比例的傾角，所以會互相交叉。',
  orbitColor: '第一及第三條軌道的顏色。',
  orbitColorB: '第二條軌道的顏色。',
  orbitIntensity: '軌道線的亮度（加法混合的 Emissive）。0 = 隱藏。',
  orbitSpeedDegPerSec: '光脈衝沿軌道移動的速度（度／秒）。相鄰軌道方向相反，外圈較慢（UE: Panner）。',
  orbitPulses: '每條軌道上光脈衝的數量。',
  orbitPulseLength: '光脈衝尾巴的長度（以脈衝之間的距離計算）。',

  // Presets and view
  presetTools: 'Save：把目前全部設定（包括燈光）存為自訂預設，存放在此瀏覽器（localStorage）。\nDelete：刪除選中的自訂預設。\nImport / Export：以 JSON 檔匯入或匯出自訂預設。舊版檔案可以載入：缺少的參數使用預設值，不認識的參數會被忽略。',
  presetView: 'Gallery：以縮圖預覽所有預設，點選即進入編輯。\nCopy name：複製目前預設的名稱。',

  // Planet: morph and scan
  starRoundness: '星形環的角：0 = 尖角，1 = 圓角。',
  morphSeconds: '切換形狀時的變形時間（秒）。0 = 即時切換。',
  morphCycleSeconds: '大於 0 時，每隔這個秒數自動變形到下一個形狀，用作預覽。0 = 關閉。',
  scanPlay: '播放全息掃描：星球由下至上生成，大氣層、光環、軌道及護盾同時淡入。從 Gallery 選取預設時會自動播放。',
  scanProgress: '掃描進度：0 = 完全隱藏，1 = 完成。高於掃描線的部分會被切走（UE: Masked 材質，OpacityMask 由物件高度計算）。',
  scanColor: '掃描線及全息網格的顏色。',
  scanWidth: '掃描線下方發光帶的闊度（以物件高度計算）。',
  scanSeconds: '掃描動畫的時間（秒）。',

  // Planet: craters and bubble
  craters: '隕石坑的強度：碗形凹陷加上凸起的坑邊。0 = 關閉。',
  craterScale: '隕石坑網格的密度（每個半徑的格數）。數值越高，坑越小越多。',
  craterDensity: '有隕石坑的格子比例。',
  bubble: '泡泡效果：中央透明、邊緣不透明（Fresnel），高光保持可見。顏色來自 Material 分頁的 Thin Film；薄膜厚度跟隨表面圖案流動（UE: Translucent，Opacity = Fresnel，Substrate thin film）。',
  cloudShadow: '雲層投影：在太陽方向偏移再取樣一次雲層，令下方地面變暗（UE: 第二次雲層取樣，MPC 太陽方向）。',

  // Planet: toy look
  bevel: '玩具倒角：陸地成為平坦海面上凸起的一件，每個色階切口的上緣加一條淺色細帶（UE: 同一張 height 貼圖，偏移後再做一次 step）。',
  foam: '海岸泡沫：水線上的白色色帶，外側再有一圈較幼的線，緩慢進退。需要 Sea Level > 0。',
  cloudPuff: '雲層立體感：背向太陽的一側加一個陰影色階，雲層有自己的凸起（UE: 與 Cloud Shadow 相同的偏移取樣，方向相反）。',
  sparkle: '閃粉：隨視角閃動的細點，只在受光面出現（UE: 平鋪的閃片遮罩輸出到 Emissive）。',
  blink: '眨眼：張開的眼睛每隔約 3.3 秒閉上一次（UE: 由 Time 節點驅動的 scalar）。',

  // Planet: atmosphere scattering and shield
  atmoSunsetColor: '散射顏色：出現在明暗分界附近，以及背光時大氣層邊緣的光暈。',
  atmoSunset: '散射顏色的強度。0 = 只有白天顏色。',
  shieldIntensity: '六角形能量護盾的亮度。0 = 關閉（UE: Translucent Additive 球體）。',
  shieldColor: '護盾顏色。',
  shieldRadius: '護盾半徑（以星球最大半徑計算）。',
  shieldHexCount: '赤道一圈的六角形數量（整數，令網格無接縫）。',
  shieldHitRate: '每秒受擊次數：受擊點會擴散出一圈發光的六角形。0 = 關閉。',

  // NPR: outline
  outlineWidth: 'Inverted hull 描邊的闊度（螢幕像素）。0 = 關閉。描邊跟隨形狀變形（UE: 第二個 mesh 或材質槽，WPO 沿法線推出，反轉 culling）。',
  outlineColor: '描邊顏色。',

  // Performance
  renderScale: '每個 CSS 像素渲染多少個像素（pixel ratio）。預設上限 1.5；Retina 螢幕用 2 會令 GPU 時間增加約 1.8 倍。只影響預覽，不會存入預設。',

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
