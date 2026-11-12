import { T } from '../config/tuning';
import type { Ball } from './Ball';
import { buildCushions, buildPockets, type Pocket, type Cushion, type PotEvent } from './Pocket';
import { v } from './Vec2';

export interface World {
  balls: Ball[];
  cue: Ball;
  pockets: Pocket[];
  cushions: Cushion[];
  events: PotEvent[];
  strokes: number;
}

/** M0 摆位：母球在 §7.1.1 的 (0.5, 0.86)，三颗普通球拉开成不同角度，
 *  好让 20 杆盲测同时覆盖直线推、斜切和薄边。 */
const RACK: ReadonlyArray<readonly [number, number, string]> = [
  [0.5, 0.31, '#7FA8C9'],
  [0.29, 0.56, '#A0B48C'],
  [0.71, 0.73, '#6E9BB8'],
];

const makeBall = (
  id: number,
  kind: Ball['kind'],
  fx: number,
  fy: number,
  radius: number,
  color: string
): Ball => ({
  id,
  kind,
  word: '',
  pos: v(fx * T.TABLE_W, fy * T.TABLE_H),
  vel: v(0, 0),
  radius,
  mass: 1,
  restitution: T.REST_BALL,
  color,
  potted: false,
});

export const createWorld = (): World => {
  const cue = makeBall(0, 'CUE', 0.5, 0.86, T.CUE_R, '#FBF7F0');
  const balls = RACK.map(([fx, fy, color], i) => makeBall(i + 1, 'NORMAL', fx, fy, T.BALL_R, color));
  return {
    balls: [cue, ...balls],
    cue,
    pockets: buildPockets(),
    cushions: buildCushions(),
    events: [],
    strokes: 0,
  };
};

export const resetWorld = (world: World): void => {
  const fresh = createWorld();
  world.balls = fresh.balls;
  world.cue = fresh.cue;
  world.events = [];
  world.strokes = 0;
};

export const allStopped = (world: World): boolean =>
  world.balls.every((b) => b.potted || (b.vel.x === 0 && b.vel.y === 0));
