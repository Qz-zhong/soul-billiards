import { T } from '../config/tuning';
import type { Ball } from './Ball';
import { dist, v, type Vec2 } from './Vec2';

export type PocketKind = 'corner' | 'side';

export interface Pocket {
  readonly center: Vec2;
  readonly kind: PocketKind;
  readonly radius: number;
}

export type Wall = 'top' | 'bottom' | 'left' | 'right';

/** 库边被袋口切成 8 段；段与段之间的缺口由袋口捕获接管（§7.4）。 */
export interface Cushion {
  readonly wall: Wall;
  readonly lo: number;
  readonly hi: number;
}

const { TABLE_W: W, TABLE_H: H } = T;

const cornerOutward = (sx: number, sy: number): Vec2 => {
  const k = T.CORNER_OUTWARD / Math.SQRT2;
  return v(sx * k, sy * k);
};

export const buildPockets = (): Pocket[] => {
  const r = T.POCKET_R * T.POCKET_SCALE;
  const raw: ReadonlyArray<readonly [number, number, PocketKind, Vec2]> = [
    [0, 0, 'corner', cornerOutward(-1, -1)],
    [W, 0, 'corner', cornerOutward(1, -1)],
    [0, H / 2, 'side', v(-T.SIDE_OUTWARD, 0)],
    [W, H / 2, 'side', v(T.SIDE_OUTWARD, 0)],
    [0, H, 'corner', cornerOutward(-1, 1)],
    [W, H, 'corner', cornerOutward(1, 1)],
  ];
  return raw.map(([x, y, kind, off]) => ({ center: v(x + off.x, y + off.y), kind, radius: r }));
};

export const buildCushions = (): Cushion[] => {
  const c = T.CORNER_MOUTH;
  const s = T.SIDE_MOUTH;
  return [
    { wall: 'top', lo: c, hi: W - c },
    { wall: 'bottom', lo: c, hi: W - c },
    { wall: 'left', lo: c, hi: H / 2 - s },
    { wall: 'left', lo: H / 2 + s, hi: H - c },
    { wall: 'right', lo: c, hi: H / 2 - s },
    { wall: 'right', lo: H / 2 + s, hi: H - c },
  ];
};

export const coversPoint = (c: Cushion, along: number): boolean => along >= c.lo && along <= c.hi;

export const findPocketAt = (pos: Vec2, pockets: Pocket[]): Pocket | null => {
  for (const p of pockets) {
    if (dist(pos, p.center) < p.radius) return p;
  }
  return null;
};

/**
 * 逃逸兜底：球心越出内缘超过一个捕获半径时，认定它已经掉进最近的袋。
 * 没有这一条，贴袋口的球会在缺口感应到反射却也没被吞掉的中间态里穿出台面。
 */
export const nearestPocket = (pos: Vec2, pockets: Pocket[]): Pocket => {
  let best = pockets[0]!;
  let bestD = Infinity;
  for (const p of pockets) {
    const d = dist(pos, p.center);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
};

export type PotEvent = { readonly type: 'POT'; readonly ball: Ball; readonly pocket: Pocket };
