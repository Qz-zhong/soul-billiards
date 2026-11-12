import { T } from '../config/tuning';
import type { Ball } from '../core/Ball';

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

const mix = (hex: string, target: number, t: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(c + (target - c) * t);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

const lighten = (hex: string, t: number): string => mix(hex, 255, t);
const darken = (hex: string, t: number): string => mix(hex, 0, t);

/** 层 6：全部球影先画，避免压在球体上（§8.2）。 */
export const drawBallShadow = (ctx: CanvasRenderingContext2D, b: Ball): void => {
  const r = b.radius;
  ctx.save();
  ctx.translate(b.pos.x, b.pos.y + r * T.SHADOW_OFFSET_R);
  ctx.scale(1, 0.86);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${T.SHADOW_ALPHA})`;
  ctx.fill();
  ctx.restore();
};

/** 层 7：半哑光树脂。质感靠那颗锐高光点，不靠整片铺亮（§3.3.1）。 */
export const drawBall = (ctx: CanvasRenderingContext2D, b: Ball): void => {
  const r = b.radius;
  const { x, y } = b.pos;

  const grad = ctx.createRadialGradient(
    x + r * T.HIGHLIGHT_OFFSET.x,
    y + r * T.HIGHLIGHT_OFFSET.y,
    r * 0.05,
    x,
    y,
    r
  );
  grad.addColorStop(0, lighten(b.color, T.BALL_SPECULAR));
  grad.addColorStop(0.34, lighten(b.color, 0.22));
  grad.addColorStop(0.72, b.color);
  grad.addColorStop(1, darken(b.color, 0.44));

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r - 0.75, 0, Math.PI * 2);
  ctx.strokeStyle = T.RIM;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.92, Math.PI * 0.16, Math.PI * 0.84);
  ctx.strokeStyle = T.UNDER_GLOW;
  ctx.lineWidth = 2;
  ctx.stroke();

  const g = T.GLOSS;
  ctx.save();
  ctx.translate(x + r * g.ox, y + r * g.oy);
  ctx.rotate(g.rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * g.rx, r * g.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${g.a})`;
  ctx.fill();
  ctx.restore();
};
