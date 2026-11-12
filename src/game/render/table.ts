import { T } from '../config/tuning';
import { buildCushions, type Cushion } from '../core/Pocket';
import {
  BRASS_HIGHLIGHT,
  CUSHION_OUTER_EDGE,
  NAP_LINE,
  SPOT,
  type Palette,
} from './palette';

const { TABLE_W: W, TABLE_H: H, RAIL_T, WOOD_T } = T;

/** 整张桌子的绘制包围盒（含库边与木框），世界坐标下的负起点。 */
export const PAD = RAIL_T + WOOD_T;
export const DRAW_W = W + PAD * 2;
export const DRAW_H = H + PAD * 2;

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
};

interface RailRect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 渐变起点在内缘、终点在外缘。 */
  gx0: number;
  gy0: number;
  gx1: number;
  gy1: number;
  /** 外缘高光那条边的两个端点。 */
  ex0: number;
  ey0: number;
  ex1: number;
  ey1: number;
}

const railRect = (c: Cushion): RailRect => {
  switch (c.wall) {
    case 'top':
      return {
        x: c.lo, y: -RAIL_T, w: c.hi - c.lo, h: RAIL_T,
        gx0: c.lo, gy0: 0, gx1: c.lo, gy1: -RAIL_T,
        ex0: c.lo, ey0: -RAIL_T, ex1: c.hi, ey1: -RAIL_T,
      };
    case 'bottom':
      return {
        x: c.lo, y: H, w: c.hi - c.lo, h: RAIL_T,
        gx0: c.lo, gy0: H, gx1: c.lo, gy1: H + RAIL_T,
        ex0: c.lo, ey0: H + RAIL_T, ex1: c.hi, ey1: H + RAIL_T,
      };
    case 'left':
      return {
        x: -RAIL_T, y: c.lo, w: RAIL_T, h: c.hi - c.lo,
        gx0: 0, gy0: c.lo, gx1: -RAIL_T, gy1: c.lo,
        ex0: -RAIL_T, ey0: c.lo, ex1: -RAIL_T, ey1: c.hi,
      };
    case 'right':
      return {
        x: W, y: c.lo, w: RAIL_T, h: c.hi - c.lo,
        gx0: W, gy0: c.lo, gx1: W + RAIL_T, gy1: c.lo,
        ex0: W + RAIL_T, ey0: c.lo, ex1: W + RAIL_T, ey1: c.hi,
      };
  }
};

const noisePattern = (ctx: CanvasRenderingContext2D): CanvasPattern | null => {
  const size = 64;
  const cell = document.createElement('canvas');
  cell.width = size;
  cell.height = size;
  const c2 = cell.getContext('2d');
  if (!c2) return null;
  const img = c2.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 0;
    img.data[i + 1] = 0;
    img.data[i + 2] = 0;
    img.data[i + 3] = Math.floor(Math.random() * 18);
  }
  c2.putImageData(img, 0, 0);
  return ctx.createPattern(cell, 'repeat');
};

/** 1 木外框 → 2 台呢 → 3 库边 → 4 袋口 → 5 开伦点（§8.2，静态，只画一次）。 */
export const drawTable = (ctx: CanvasRenderingContext2D, pal: Palette): void => {
  // 1 木外框
  const wood = ctx.createLinearGradient(-PAD, -PAD, DRAW_W - PAD, DRAW_H - PAD);
  wood.addColorStop(0, pal['rail-hi']);
  wood.addColorStop(0.55, pal['rail-mid']);
  wood.addColorStop(1, pal['rail-lo']);
  ctx.fillStyle = wood;
  roundRect(ctx, -PAD, -PAD, DRAW_W, DRAW_H, 13);
  ctx.fill();

  // 2 台呢（含库边下方）
  ctx.fillStyle = pal.cloth;
  roundRect(ctx, -RAIL_T, -RAIL_T, W + RAIL_T * 2, H + RAIL_T * 2, 8);
  ctx.fill();

  ctx.strokeStyle = NAP_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 3) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  ctx.stroke();

  const lamp = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * T.LAMP.r);
  lamp.addColorStop(0, `rgba(255,236,196,${T.LAMP.a})`);
  lamp.addColorStop(1, 'rgba(255,236,196,0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, W, H);

  const noise = noisePattern(ctx);
  if (noise) {
    ctx.fillStyle = noise;
    ctx.fillRect(0, 0, W, H);
  }

  // 3 库边：8 段斜面，袋口处断开
  for (const c of buildCushions()) {
    const r = railRect(c);
    const g = ctx.createLinearGradient(r.gx0, r.gy0, r.gx1, r.gy1);
    g.addColorStop(0, pal['cloth-dark']);
    g.addColorStop(1, pal['cloth-lit']);
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = CUSHION_OUTER_EDGE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r.ex0, r.ey0);
    ctx.lineTo(r.ex1, r.ey1);
    ctx.stroke();
  }

  // 4 袋口：角袋落在角点、中袋落在长边正中，画出来自然就是斜切与半月
  const mouth = T.POCKET_R * T.POCKET_SCALE;
  const bases: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [W, 0],
    [0, H / 2],
    [W, H / 2],
    [0, H],
    [W, H],
  ];
  for (const [bx, by] of bases) {
    ctx.beginPath();
    ctx.arc(bx, by, mouth * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = pal.pocket;
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = pal.brass;
    ctx.beginPath();
    ctx.arc(bx, by, mouth * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = BRASS_HIGHLIGHT;
    ctx.beginPath();
    ctx.arc(bx, by, mouth * 0.72, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }

  // 5 开伦点
  ctx.fillStyle = SPOT;
  for (const fy of [0.25, 0.75]) {
    ctx.beginPath();
    ctx.arc(W / 2, H * fy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
};
