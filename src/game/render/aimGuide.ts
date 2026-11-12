import { T } from '../config/tuning';
import type { Ball } from '../core/Ball';
import type { Prediction } from '../input/PointerAim';
import { add, len, mul, sub, type Vec2 } from '../core/Vec2';
import {
  AIM_BOUNCE,
  AIM_DEFLECT,
  AIM_EXIT,
  AIM_GHOST,
  AIM_TRAJECTORY,
  dragColor,
} from './palette';

export interface AimView {
  cue: Ball;
  prediction: Prediction;
  /** 拖拽向量，CSS 像素。 */
  dragCss: Vec2;
  force: number;
  /** 1 CSS 像素等于多少逻辑单位。 */
  px: number;
  dragging: boolean;
}

const dashed = (
  ctx: CanvasRenderingContext2D,
  from: Vec2,
  dir: Vec2,
  length: number,
  color: string,
  width: number,
  pattern: number[]
): void => {
  ctx.save();
  ctx.setLineDash(pattern);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(from.x + dir.x * length, from.y + dir.y * length);
  ctx.stroke();
  ctx.restore();
};

const stroke = (
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  color: string,
  width: number
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};

/** 层 8：预测线 / Ghost Ball / 拉线（§5.3 + §8.10，章一为全量绘制）。 */
export const drawAimGuide = (ctx: CanvasRenderingContext2D, view: AimView): void => {
  const { cue, prediction: p, dragCss, force, px, dragging } = view;
  if (!dragging) return;

  const trajectoryWidth = (1.4 + 2.6 * force) * px;
  ctx.save();
  ctx.lineCap = 'round';

  stroke(ctx, cue.pos, p.contact, AIM_TRAJECTORY, trajectoryWidth);

  if (p.target) {
    ctx.beginPath();
    ctx.arc(p.contact.x, p.contact.y, cue.radius, 0, Math.PI * 2);
    ctx.strokeStyle = AIM_GHOST;
    ctx.lineWidth = 1.5 * px;
    ctx.stroke();

    if (p.exitDir) {
      dashed(ctx, p.target.pos, p.exitDir, T.TABLE_W * T.EXIT_LEN, AIM_EXIT, 1.6 * px, [
        5 * px,
        5 * px,
      ]);
    }
    if (p.deflectDir) {
      dashed(ctx, p.contact, p.deflectDir, T.TABLE_W * T.DEFLECT_LEN, AIM_DEFLECT, 1.4 * px, [
        5 * px,
        5 * px,
      ]);
    }
  } else if (p.bounce) {
    const span = sub(p.bounce.to, p.bounce.from);
    dashed(ctx, p.bounce.from, span, len(span), AIM_BOUNCE, trajectoryWidth, [2 * px, 6 * px]);
  }

  const dragLu = Math.min(len(dragCss), T.DRAG_FULL_PX) * px;
  if (dragLu > 1) {
    const dir = mul(dragCss, 1 / Math.max(len(dragCss), 1e-6));
    const end = add(cue.pos, mul(dir, dragLu));
    stroke(ctx, cue.pos, end, dragColor(force), (2 + 2 * force) * px);
    ctx.beginPath();
    ctx.arc(end.x, end.y, (3.4 + 3 * force) * px, 0, Math.PI * 2);
    ctx.fillStyle = dragColor(force);
    ctx.fill();
  }

  ctx.restore();
};
