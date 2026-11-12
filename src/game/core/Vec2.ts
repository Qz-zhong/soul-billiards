export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const v = (x: number, y: number): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const mul = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const len = (a: Vec2): number => Math.hypot(a.x, a.y);

export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

export const norm = (a: Vec2): Vec2 => {
  const l = len(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};

export const perp = (a: Vec2): Vec2 => ({ x: -a.y, y: a.x });
