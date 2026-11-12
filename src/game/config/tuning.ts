// §13 调参总表。M0 只收录当前真正被读到的常量；特化球、收杆、杆数预算、
// 特效与音频那几组随 M1–M3 实现时再补，不在这里养死配置。
// 带 ★ 的是 M0 真机手感阶段要手调的三项：FRICTION_K / REST_CUSHION / DRAG_FULL_PX。

export const T = {
  // 世界
  TABLE_W: 1000,
  TABLE_H: 1333,
  RAIL_T: 44,
  WOOD_T: 26,
  BALL_R: 62,
  CUE_R: 59.5,
  POCKET_R: 96,
  POCKET_SCALE: 1.2, // 章一
  CORNER_MOUTH: 150, // 库边在角袋处的缺口
  SIDE_MOUTH: 118, // 库边在中袋处的缺口
  CORNER_OUTWARD: 34, // 角袋捕获圆心沿 45° 外移，§7.4
  SIDE_OUTWARD: 24, // 中袋捕获圆心沿水平外移，§7.4

  // ★ 运动
  DT: 1 / 120,
  MAX_SUBSTEPS: 4,
  FRICTION_K: 1.4, // 越大越"涩"，越小越"滑"
  STOP_EPS: 12,
  MAX_SPEED: 2600,

  // ★ 碰撞
  REST_BALL: 0.95,
  REST_CUSHION: 0.82,
  CUSHION_TANGENT: 0.98,
  POSITION_CORRECT: 0.8,
  SLOP: 0.5,
  SOLVER_ITERS: 3,

  // ★ 出杆
  DRAG_FULL_PX: 160, // 逻辑像素，按 min(1, vw/390) 缩放
  DRAG_REF_VW: 390,
  DRAG_DEAD_PX: 12,
  FORCE_MIN: 0.08,
  MAX_SHOT_SPEED: 2400,
  GENTLE_MAX: 0.4,
  HEAVY_MIN: 0.75,
  CUE_LUNGE_R: 0.18,
  LUNGE_FWD_MS: 80,
  LUNGE_BACK_MS: 60,

  // 预测线（§5.3 章一档：全量绘制）
  EXIT_LEN: 0.28, // × 台面宽
  DEFLECT_LEN: 0.16, // × 台面宽

  // 球体渲染（§3.3.1）
  BALL_SPECULAR: 0.38,
  HIGHLIGHT_OFFSET: { x: -0.3, y: -0.34 },
  GLOSS: { rx: 0.135, ry: 0.095, ox: -0.34, oy: -0.4, rot: -0.5, a: 0.62 },
  RIM: 'rgba(0,0,0,.34)',
  UNDER_GLOW: 'rgba(255,255,255,.07)',
  SHADOW_OFFSET_R: 0.16,
  SHADOW_ALPHA: 0.34,

  // 灯光（§8.3 章一档：亮堂，球厅白天开业）
  LAMP: { r: 1.15, a: 0.2, wall: 0.16 },
} as const;
