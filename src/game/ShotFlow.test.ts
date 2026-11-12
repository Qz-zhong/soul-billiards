import { describe, expect, it } from 'vitest';
import { T } from './config/tuning';
import { step } from './core/Physics';
import { allStopped, createWorld, type World } from './core/World';
import { mul, norm, sub, v } from './core/Vec2';
import { beginAim, dragFullPx, idleAim, predict, shotSpeed, updateAim } from './input/PointerAim';

/** 把球台跑到全部静止，返回消耗的模拟秒数。 */
const settle = (world: World): number => {
  let steps = 0;
  while (!allStopped(world) && steps < 120 * 20) {
    step(world, T.DT);
    steps++;
  }
  expect(allStopped(world), '球台未在 20 秒内停稳').toBe(true);
  return steps / 120;
};

describe('一杆完整流程：拖拽 → 预测 → 出杆 → 停稳', () => {
  const world = createWorld();
  const [cue, b1, b2, b3] = world.balls;

  it('摆位可进袋：3 号球位于右中袋袋口上方', () => {
    expect(cue!.id).toBe(0);
    expect(b3!.pos.x).toBeCloseTo(0.71 * T.TABLE_W, 6);
    expect(b3!.pos.y).toBeGreaterThan(T.TABLE_H / 2);
    expect(b1!.potted).toBe(false);
    expect(b2!.potted).toBe(false);
  });

  it('瞄准 3 号球球心拖 120px 出杆，3 号球进右中袋', () => {
    const dir = norm(sub(b3!.pos, cue!.pos));
    expect(predict(world, cue!, dir).target?.id).toBe(b3!.id);

    // 632 宽的视口不做缩放，120 CSS px 对应 f = 0.75（拉满 160px）。
    expect(dragFullPx(632)).toBe(T.DRAG_FULL_PX);
    const from = v(300, 400);
    const aim = updateAim(beginAim(idleAim(), from), sub(from, mul(dir, 120)), 632);
    expect(aim.force).toBeCloseTo(0.75, 6);

    cue!.vel = mul(aim.dir, shotSpeed(aim));
    expect(settle(world)).toBeLessThan(6);

    expect(b3!.potted).toBe(true);
    expect(world.events.some((e) => e.type === 'POT' && e.ball.id === b3!.id)).toBe(true);
    expect(cue!.potted).toBe(false);
  });

  it('停稳后活球仍在台面内且互不重叠', () => {
    const live = world.balls.filter((b) => !b.potted);
    for (const b of live) {
      expect(b.pos.x).toBeGreaterThanOrEqual(b.radius - T.SLOP);
      expect(b.pos.x).toBeLessThanOrEqual(T.TABLE_W - b.radius + T.SLOP);
      expect(b.pos.y).toBeGreaterThanOrEqual(b.radius - T.SLOP);
      expect(b.pos.y).toBeLessThanOrEqual(T.TABLE_H - b.radius + T.SLOP);
    }
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i]!;
        const c = live[j]!;
        expect(Math.hypot(c.pos.x - a.pos.x, c.pos.y - a.pos.y)).toBeGreaterThan(
          a.radius + c.radius - 2 * T.SLOP
        );
      }
    }
  });
});
