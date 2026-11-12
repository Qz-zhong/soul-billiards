import { T } from '../config/tuning';
import type { Ball } from '../core/Ball';
import type { World } from '../core/World';
import { add, dot, len, mul, norm, sub, v, type Vec2 } from '../core/Vec2';

export interface Aim {
  dragging: boolean;
  /** pointerdown 与当前指针的 CSS 像素坐标，用于算拖拽距离。 */
  from: Vec2;
  to: Vec2;
  /** 击球方向（拖拽向量取反）。 */
  dir: Vec2;
  /** 力度系数 f。 */
  force: number;
}

export const idleAim = (): Aim => ({
  dragging: false,
  from: v(0, 0),
  to: v(0, 0),
  dir: v(0, 0),
  force: 0,
});

/** 160 是逻辑像素，小屏按 min(1, vw/390) 缩放，保证拉满同样省力（§5.1）。 */
export const dragFullPx = (viewportWidth: number): number =>
  T.DRAG_FULL_PX * Math.min(1, viewportWidth / T.DRAG_REF_VW);

export const beginAim = (aim: Aim, at: Vec2): Aim => ({
  ...aim,
  dragging: true,
  from: at,
  to: at,
});

export const updateAim = (aim: Aim, at: Vec2, viewportWidth: number): Aim => {
  const drag = sub(at, aim.from);
  const d = len(drag);
  const force = Math.min(Math.max(d / dragFullPx(viewportWidth), T.FORCE_MIN), 1);
  return {
    ...aim,
    to: at,
    dir: d < T.DRAG_DEAD_PX ? aim.dir : norm(mul(drag, -1)),
    force: d < T.DRAG_DEAD_PX ? 0 : force,
  };
};

export const isDeadZone = (aim: Aim): boolean => len(sub(aim.to, aim.from)) < T.DRAG_DEAD_PX;

export const shotSpeed = (aim: Aim): number => T.MAX_SHOT_SPEED * aim.force;

export interface Prediction {
  /** 母球沿 dir 走到第一次接触时球心的位置。 */
  contact: Vec2;
  /** 命中的目标球；撞库时为空。 */
  target: Ball | null;
  /** 目标球出射方向。 */
  exitDir: Vec2 | null;
  /** 母球切向偏转方向。 */
  deflectDir: Vec2 | null;
  /** 章一档额外绘制的一次撞库延长线。 */
  bounce: { from: Vec2; to: Vec2 } | null;
}

interface WallHit {
  t: number;
  /** 命中的是竖壁（反射 x 分量）还是横壁（反射 y 分量）。 */
  axis: 'x' | 'y';
}

const rayToWall = (p: Vec2, dir: Vec2, r: number): WallHit => {
  const candidates: ReadonlyArray<readonly [number, number, 'x' | 'y'] | null> = [
    dir.x > 0 ? [dir.x, T.TABLE_W - r - p.x, 'x'] : dir.x < 0 ? [dir.x, r - p.x, 'x'] : null,
    dir.y > 0 ? [dir.y, T.TABLE_H - r - p.y, 'y'] : dir.y < 0 ? [dir.y, r - p.y, 'y'] : null,
  ];

  let best: WallHit = { t: Infinity, axis: 'x' };
  for (const entry of candidates) {
    if (!entry) continue;
    const [component, delta, axis] = entry;
    const t = delta / component;
    if (t > 0 && t < best.t) best = { t, axis };
  }
  return best;
};

const rayCircle = (origin: Vec2, dir: Vec2, center: Vec2, radius: number): number => {
  const oc = sub(center, origin);
  const proj = dot(oc, dir);
  if (proj <= 0) return Infinity;
  const d2 = dot(oc, oc) - proj * proj;
  const r2 = radius * radius;
  if (d2 > r2) return Infinity;
  return proj - Math.sqrt(r2 - d2);
};

/** 从母球心沿方向射线，求与「其他球的 Minkowski 扩张圆」和「库边内缘」的最近交点（§5.3）。 */
export const predict = (world: World, cue: Ball, dir: Vec2): Prediction => {
  if (len(dir) === 0) return { contact: cue.pos, target: null, exitDir: null, deflectDir: null, bounce: null };

  let bestT = Infinity;
  let target: Ball | null = null;

  for (const b of world.balls) {
    if (b.potted || b.id === cue.id) continue;
    const t = rayCircle(cue.pos, dir, b.pos, cue.radius + b.radius);
    if (t < bestT) {
      bestT = t;
      target = b;
    }
  }

  const wall = rayToWall(cue.pos, dir, cue.radius);
  if (!target || wall.t < bestT) {
    const contact = add(cue.pos, mul(dir, wall.t));
    const reflected = wall.axis === 'x' ? v(-dir.x, dir.y) : v(dir.x, -dir.y);
    const second = rayToWall(contact, reflected, cue.radius);
    return {
      contact,
      target: null,
      exitDir: null,
      deflectDir: null,
      bounce: { from: contact, to: add(contact, mul(reflected, second.t)) },
    };
  }

  const contact = add(cue.pos, mul(dir, bestT));
  const exitDir = norm(sub(target.pos, contact));
  const tangent = sub(dir, mul(exitDir, dot(dir, exitDir)));

  return {
    contact,
    target,
    exitDir,
    deflectDir: len(tangent) < 1e-4 ? null : norm(tangent),
    bounce: null,
  };
};
