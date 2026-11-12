import type { Vec2 } from './Vec2';

export type BallKind = 'NORMAL' | 'CUE';

export interface Ball {
  readonly id: number;
  readonly kind: BallKind;
  /** M0 无词，一律空串；词面随 M2 内容层接入。 */
  readonly word: string;
  pos: Vec2;
  vel: Vec2;
  readonly radius: number;
  readonly mass: number;
  readonly restitution: number;
  readonly color: string;
  potted: boolean;
}

export const isMoving = (b: Ball): boolean => b.vel.x !== 0 || b.vel.y !== 0;
