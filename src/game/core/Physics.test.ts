import { describe, expect, it } from 'vitest';
import { T } from '../config/tuning';
import { step } from './Physics';
import { buildCushions, buildPockets } from './Pocket';
import type { Ball } from './Ball';
import type { World } from './World';
import { v } from './Vec2';

const makeBall = (id: number, x: number, y: number, vx = 0, vy = 0): Ball => ({
  id,
  kind: id === 0 ? 'CUE' : 'NORMAL',
  word: '',
  pos: v(x, y),
  vel: v(vx, vy),
  radius: id === 0 ? T.CUE_R : T.BALL_R,
  mass: 1,
  restitution: T.REST_BALL,
  color: '#fff',
  potted: false,
});

const makeWorld = (balls: Ball[]): World => ({
  balls,
  cue: balls[0]!,
  pockets: buildPockets(),
  cushions: buildCushions(),
  events: [],
  strokes: 0,
});

const moving = (b: Ball): boolean => !b.potted && (b.vel.x !== 0 || b.vel.y !== 0);

const runUntilStopped = (world: World, maxSeconds = 30): void => {
  for (let i = 0; i < Math.ceil(maxSeconds / T.DT); i++) {
    if (!world.balls.some(moving)) return;
    step(world, T.DT);
  }
};

/** 步进到条件满足为止，返回是否满足。 */
const stepUntil = (world: World, pred: () => boolean, maxSeconds: number): boolean => {
  for (let i = 0; i < Math.ceil(maxSeconds / T.DT); i++) {
    step(world, T.DT);
    if (pred()) return true;
  }
  return false;
};

describe('§7.2 积分与摩擦', () => {
  it('单步最大位移小于球半径，所以不需要 CCD', () => {
    expect(T.MAX_SPEED * T.DT).toBeLessThan(T.BALL_R);
  });

  it('满力直线滑行距离约 v/k ≈ 1090 lu', () => {
    const b = makeBall(0, 500, 1250, 0, -T.MAX_SHOT_SPEED);
    const world = makeWorld([b]);
    runUntilStopped(world);
    expect(1250 - b.pos.y).toBeGreaterThan(950);
    expect(1250 - b.pos.y).toBeLessThan(1250);
  });

  it('球最终严格静止，而不是无限趋近', () => {
    const b = makeBall(0, 500, 600, 1800, 900);
    runUntilStopped(makeWorld([b]), 20);
    expect(b.vel).toEqual(v(0, 0));
  });
});

describe('§7.4 球-库边', () => {
  it('撞实心库边段后法向反向并乘 REST_CUSHION，切向被削减', () => {
    // 起点贴着左壁，撞壁前几乎不衰减，才能把反弹系数单独量出来
    const b = makeBall(0, T.CUE_R + 2, 300, -1000, 400);
    const world = makeWorld([b]);
    const bounced = stepUntil(
      world,
      () => b.vel.x > 0,
      0.5
    );
    expect(bounced).toBe(true);
    expect(b.vel.x).toBeLessThanOrEqual(1000 * T.REST_CUSHION + 1);
    expect(b.vel.x).toBeGreaterThan(1000 * T.REST_CUSHION * 0.95);
    expect(b.vel.y).toBeLessThan(400);
  });

  it('袋口缺口处不反射：正对中袋打，球进袋而不是撞上看不见的墙', () => {
    const b = makeBall(0, 300, T.TABLE_H / 2, -2000, 0);
    const world = makeWorld([b]);
    runUntilStopped(world);
    expect(b.potted).toBe(true);
  });

  it('高速斜球不穿模飞出台面', () => {
    const b = makeBall(0, 500, 666, 2300, -1900);
    const world = makeWorld([b]);
    const bound = T.POCKET_R * T.POCKET_SCALE + T.BALL_R;
    for (let i = 0; i < Math.ceil(8 / T.DT); i++) {
      step(world, T.DT);
      if (b.potted) break;
      expect(b.pos.x).toBeGreaterThan(-bound);
      expect(b.pos.x).toBeLessThan(T.TABLE_W + bound);
      expect(b.pos.y).toBeGreaterThan(-bound);
      expect(b.pos.y).toBeLessThan(T.TABLE_H + bound);
    }
  });
});

describe('§7.5 入袋判定', () => {
  it('不吞早：贴著上库边长距离滚动的球不被角袋捕获', () => {
    const b = makeBall(0, 260, T.BALL_R, 1500, 0);
    const world = makeWorld([b]);
    const travelled = stepUntil(
      world,
      () => b.pos.x > 700 || b.potted || !moving(b),
      1
    );
    expect(travelled).toBe(true);
    expect(b.potted).toBe(false);
  });

  it('沿对角线正对左上角袋打进去时必定捕获', () => {
    const b = makeBall(0, 400, 400, -1000, -1000);
    const world = makeWorld([b]);
    runUntilStopped(world);
    expect(b.potted).toBe(true);
  });
});

describe('§7.3 球-球碰撞', () => {
  it('等质量正面对撞后动量交换', () => {
    const a = makeBall(0, 400, 600, 1200, 0);
    const b = makeBall(1, 700, 600, 0, 0);
    const world = makeWorld([a, b]);
    stepUntil(
      world,
      () => b.vel.x > 0,
      1
    );
    expect(b.vel.x).toBeGreaterThan(a.vel.x);
  });

  it('反复对撞后能量不单调发散，始终不超过 MAX_SPEED', () => {
    const a = makeBall(0, 500, 600, 2000, 0);
    const b = makeBall(1, 900, 600, 0, 0);
    const world = makeWorld([a, b]);
    let peak = 0;
    for (let i = 0; i < Math.ceil(6 / T.DT); i++) {
      step(world, T.DT);
      peak = Math.max(peak, Math.abs(a.vel.x), Math.abs(b.vel.x));
    }
    expect(peak).toBeLessThanOrEqual(T.MAX_SPEED + 1);
    expect(peak).toBeLessThan(2000);
  });
});
