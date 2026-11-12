import { T } from '../config/tuning';
import type { Ball } from './Ball';
import { coversPoint, findPocketAt, nearestPocket, type Pocket, type Wall } from './Pocket';
import type { World } from './World';
import { add, dot, mul, sub, v } from './Vec2';

const clampSpeed = (b: Ball): void => {
  const speed = Math.hypot(b.vel.x, b.vel.y);
  if (speed > T.MAX_SPEED) b.vel = mul(b.vel, T.MAX_SPEED / speed);
};

const zoneCovered = (cushions: World['cushions'], wall: Wall, along: number): boolean =>
  cushions.some((c) => c.wall === wall && coversPoint(c, along));

const pot = (world: World, b: Ball, pocket: Pocket): void => {
  b.potted = true;
  b.vel = v(0, 0);
  world.events.push({ type: 'POT', ball: b, pocket });
};

const integrate = (world: World, dt: number): void => {
  const decay = Math.exp(-T.FRICTION_K * dt);
  for (const b of world.balls) {
    if (b.potted) continue;
    b.pos = add(b.pos, mul(b.vel, dt));
    b.vel = mul(b.vel, decay);
    if (Math.hypot(b.vel.x, b.vel.y) < T.STOP_EPS) b.vel = v(0, 0);
  }
};

const solveBallPair = (a: Ball, b: Ball): void => {
  const delta = sub(b.pos, a.pos);
  const d = Math.hypot(delta.x, delta.y);
  const minDist = a.radius + b.radius;
  if (d === 0 || d >= minDist) return;

  const n = mul(delta, 1 / d);
  const invA = 1 / a.mass;
  const invB = 1 / b.mass;
  const invSum = invA + invB;

  const corr = Math.max(minDist - d - T.SLOP, 0) * T.POSITION_CORRECT;
  a.pos = sub(a.pos, mul(n, (corr * invA) / invSum));
  b.pos = add(b.pos, mul(n, (corr * invB) / invSum));

  const vRel = dot(sub(b.vel, a.vel), n);
  if (vRel > 0) return;

  const e = Math.min(a.restitution, b.restitution);
  const j = (-(1 + e) * vRel) / invSum;
  a.vel = sub(a.vel, mul(n, j * invA));
  b.vel = add(b.vel, mul(n, j * invB));
  clampSpeed(a);
  clampSpeed(b);
};

const solveBalls = (world: World): void => {
  const live = world.balls.filter((b) => !b.potted);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      solveBallPair(live[i]!, live[j]!);
    }
  }
};

const solveCushions = (world: World): void => {
  for (const b of world.balls) {
    if (b.potted) continue;
    const r = b.radius;

    if (b.pos.x - r < 0 && zoneCovered(world.cushions, 'left', b.pos.y)) {
      b.pos = v(r, b.pos.y);
      b.vel = v(-b.vel.x * T.REST_CUSHION, b.vel.y * T.CUSHION_TANGENT);
    } else if (b.pos.x + r > T.TABLE_W && zoneCovered(world.cushions, 'right', b.pos.y)) {
      b.pos = v(T.TABLE_W - r, b.pos.y);
      b.vel = v(-b.vel.x * T.REST_CUSHION, b.vel.y * T.CUSHION_TANGENT);
    }

    if (b.pos.y - r < 0 && zoneCovered(world.cushions, 'top', b.pos.x)) {
      b.pos = v(b.pos.x, r);
      b.vel = v(b.vel.x * T.CUSHION_TANGENT, -b.vel.y * T.REST_CUSHION);
    } else if (b.pos.y + r > T.TABLE_H && zoneCovered(world.cushions, 'bottom', b.pos.x)) {
      b.pos = v(b.pos.x, T.TABLE_H - r);
      b.vel = v(b.vel.x * T.CUSHION_TANGENT, -b.vel.y * T.REST_CUSHION);
    }
  }
};

const capture = (world: World): void => {
  const { pockets } = world;
  // 越出内缘一个捕获半径还没被吞掉，说明它正处在袋口缺口的中间态；
  // 兜底塞进最近的袋，否则球会一路穿出台面。
  const escapeMargin = pockets[0]!.radius;

  for (const b of world.balls) {
    if (b.potted) continue;
    const hit = findPocketAt(b.pos, pockets);
    if (hit) {
      pot(world, b, hit);
      continue;
    }
    const escaped =
      b.pos.x < -b.radius - escapeMargin ||
      b.pos.x > T.TABLE_W + b.radius + escapeMargin ||
      b.pos.y < -b.radius - escapeMargin ||
      b.pos.y > T.TABLE_H + b.radius + escapeMargin;
    if (escaped) pot(world, b, nearestPocket(b.pos, pockets));
  }
};

export const step = (world: World, dt: number): void => {
  integrate(world, dt);
  for (let i = 0; i < T.SOLVER_ITERS; i++) {
    solveBalls(world);
    solveCushions(world);
  }
  capture(world);
};
