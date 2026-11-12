import { describe, expect, it } from 'vitest';
import { T } from '../config/tuning';
import { buildCushions, buildPockets } from '../core/Pocket';
import type { Ball } from '../core/Ball';
import type { World } from '../core/World';
import { dist, len, norm, v } from '../core/Vec2';
import { beginAim, dragFullPx, predict, shotSpeed, updateAim, idleAim } from './PointerAim';

const ball = (id: number, x: number, y: number, radius: number = T.BALL_R): Ball => ({
  id,
  kind: id === 0 ? 'CUE' : 'NORMAL',
  word: '',
  pos: v(x, y),
  vel: v(0, 0),
  radius,
  mass: 1,
  restitution: T.REST_BALL,
  color: '#fff',
  potted: false,
});

const world = (cue: Ball, ...targets: Ball[]): World => ({
  balls: [cue, ...targets],
  cue,
  pockets: buildPockets(),
  cushions: buildCushions(),
  events: [],
  strokes: 0,
});

describe('§5.1 力度映射', () => {
  it('拉满 160 逻辑像素得 f=1，一半得 0.5', () => {
    let aim = beginAim(idleAim(), v(200, 400));
    aim = updateAim(aim, v(200, 560), 390);
    expect(aim.force).toBeCloseTo(1, 5);
    expect(shotSpeed(aim)).toBeCloseTo(T.MAX_SHOT_SPEED, 5);

    aim = updateAim(beginAim(idleAim(), v(200, 400)), v(200, 480), 390);
    expect(aim.force).toBeCloseTo(0.5, 5);
  });

  it('超出拉满距离不叠加力度，只封在 1.0', () => {
    const aim = updateAim(beginAim(idleAim(), v(200, 400)), v(200, 900), 390);
    expect(aim.force).toBe(1);
  });

  it('小屏按 min(1, vw/390) 缩短拉满距离，拉满同样省力', () => {
    expect(dragFullPx(390)).toBe(160);
    expect(dragFullPx(320)).toBeCloseTo(160 * (320 / 390), 3);
    expect(dragFullPx(520)).toBe(160);
  });

  it('死区内不出杆', () => {
    const started = beginAim(idleAim(), v(200, 400));
    const tiny = updateAim(started, v(200, 408), 390);
    expect(len(tiny.dir)).toBe(0);
    expect(tiny.force).toBe(0);
  });

  it('方向是拖拽向量取反（往后拉 = 往前打）', () => {
    const aim = updateAim(beginAim(idleAim(), v(200, 400)), v(200, 560), 390);
    expect(aim.dir.x).toBeCloseTo(0, 12);
    expect(aim.dir.y).toBeCloseTo(-1, 12);
  });
});

describe('§5.3 预测线几何', () => {
  it('直线命中：Ghost Ball 心到目标球心的距离恰好等于两半径之和', () => {
    const cue = ball(0, 500, 1000, T.CUE_R);
    const target = ball(1, 500, 500);
    const p = predict(world(cue, target), cue, v(0, -1));

    expect(p.target?.id).toBe(1);
    expect(dist(p.contact, target.pos)).toBeCloseTo(cue.radius + target.radius, 6);
    expect(p.contact.y).toBeGreaterThan(target.pos.y);
  });

  it('薄边球：出射方向就是 Ghost 心指向目标球心的方向', () => {
    const cue = ball(0, 300, 1000, T.CUE_R);
    const target = ball(1, 600, 500);
    const p = predict(world(cue, target), cue, norm(v(0.42, -1)));

    expect(p.target).not.toBeNull();
    expect(p.exitDir).not.toBeNull();
    const fromGhost = norm(v(target.pos.x - p.contact.x, target.pos.y - p.contact.y));
    expect(p.exitDir!.x).toBeCloseTo(fromGhost.x, 10);
    expect(p.exitDir!.y).toBeCloseTo(fromGhost.y, 10);
    expect(dist(p.contact, target.pos)).toBeCloseTo(cue.radius + target.radius, 6);
  });

  it('空枪打到上库边时给出反弹延长线而不是目标球', () => {
    const cue = ball(0, 500, 1000, T.CUE_R);
    const p = predict(world(cue), cue, norm(v(0.3, -1)));
    expect(p.target).toBeNull();
    expect(p.bounce).not.toBeNull();
    expect(p.contact.y).toBeCloseTo(cue.radius, 6);
    expect(p.contact.x).toBeGreaterThan(500);
    // 命中横壁，反射的是 y 分量
    expect(p.bounce!.to.y).toBeGreaterThan(p.contact.y);
  });

  it('反弹轴按真实距离判定，不按方向分量大小猜', () => {
    // 贴著左壁几乎竖直向上打：|dir.y| 远大于 |dir.x|，但先撞上的是左壁
    const cue = ball(0, 80, 700, T.CUE_R);
    const p = predict(world(cue), cue, norm(v(-0.2, -1)));
    expect(p.bounce).not.toBeNull();
    expect(p.contact.x).toBeCloseTo(cue.radius, 3);
    expect(p.bounce!.to.x).toBeGreaterThan(p.contact.x);
  });

  it('母球切向偏转与出射方向垂直（能量只分两路）', () => {
    const cue = ball(0, 300, 1000, T.CUE_R);
    const target = ball(1, 600, 500);
    const p = predict(world(cue, target), cue, norm(v(0.42, -1)));
    expect(p.deflectDir).not.toBeNull();
    const dotProduct = p.exitDir!.x * p.deflectDir!.x + p.exitDir!.y * p.deflectDir!.y;
    expect(dotProduct).toBeCloseTo(0, 6);
  });

  it('已进袋的球不参与预测', () => {
    const cue = ball(0, 500, 1000, T.CUE_R);
    const potted = ball(1, 500, 500);
    potted.potted = true;
    const p = predict(world(cue, potted), cue, v(0, -1));
    expect(p.target).toBeNull();
  });
});
