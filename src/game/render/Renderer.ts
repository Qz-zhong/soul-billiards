import type { Aim } from '../input/PointerAim';
import type { Prediction } from '../input/PointerAim';
import { drawBall, drawBallShadow } from './ballSprite';
import { drawAimGuide } from './aimGuide';
import { DRAW_H, DRAW_W, PAD, drawTable } from './table';
import { readPalette, type Palette } from './palette';
import { T } from '../config/tuning';
import type { World } from '../core/World';
import { add, type Vec2 } from '../core/Vec2';

export interface Frame {
  world: World;
  aim: Aim;
  dragging: boolean;
  prediction: Prediction | null;
  /** 出杆顶球动画的瞬时位移（逻辑单位）。 */
  lunge: Vec2;
}

const TOP_BAND = 44;
const BOTTOM_BAND = 56;
const TABLE_WIDTH_RATIO = 0.92;
const MAX_TABLE_PX = 520;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly palette: Palette;
  private table: HTMLCanvasElement | null = null;
  private scale = 0;
  private ox = 0;
  private oy = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    this.ctx = ctx;
    this.palette = readPalette();
  }

  /** 视口映射：台面占屏宽 92%、最大 520px，超出居中留白（§8.4）。 */
  resize(cssWidth: number, cssHeight: number): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    const availW = Math.min(cssWidth * TABLE_WIDTH_RATIO, MAX_TABLE_PX);
    const availH = cssHeight - TOP_BAND - BOTTOM_BAND - 24;
    const scale = Math.min(availW / DRAW_W, availH / DRAW_H);

    if (Math.abs(scale - this.scale) > 0.001) {
      this.scale = scale;
      this.table = null;
    }
    this.ox = (cssWidth - DRAW_W * scale) / 2 + PAD * scale;
    this.oy = TOP_BAND + (availH - DRAW_H * scale) / 2 + PAD * scale;
  }

  private ensureTableCache(): HTMLCanvasElement | null {
    if (this.table || this.scale <= 0) return this.table;
    const w = Math.round(DRAW_W * this.scale * this.dpr);
    const h = Math.round(DRAW_H * this.scale * this.dpr);
    if (w < 2 || h < 2) return null;

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    if (!octx) return null;

    const k = this.scale * this.dpr;
    octx.setTransform(k, 0, 0, k, PAD * k, PAD * k);
    drawTable(octx, this.palette);
    this.table = off;
    return off;
  }

  render(frame: Frame): void {
    const { ctx } = this;
    const k = this.scale * this.dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const cache = this.ensureTableCache();
    if (cache) {
      ctx.drawImage(cache, (this.ox - PAD * this.scale) * this.dpr, (this.oy - PAD * this.scale) * this.dpr);
    }

    ctx.setTransform(k, 0, 0, k, this.ox * this.dpr, this.oy * this.dpr);

    const { world } = frame;
    const live = world.balls.filter((b) => !b.potted);

    for (const b of live) drawBallShadow(ctx, b);
    for (const b of live) {
      if (b.kind === 'CUE' && frame.lunge.x + frame.lunge.y !== 0) {
        drawBall(ctx, { ...b, pos: add(b.pos, frame.lunge) });
      } else {
        drawBall(ctx, b);
      }
    }

    if (frame.prediction) {
      drawAimGuide(ctx, {
        cue: world.cue,
        prediction: frame.prediction,
        dragCss: { x: frame.aim.to.x - frame.aim.from.x, y: frame.aim.to.y - frame.aim.from.y },
        force: frame.aim.force,
        px: 1 / this.scale,
        dragging: frame.dragging,
      });
    }
  }

  /** 世界坐标 ← CSS 像素。 */
  toWorld(cssX: number, cssY: number): Vec2 {
    return {
      x: (cssX - this.ox) / this.scale,
      y: (cssY - this.oy) / this.scale,
    };
  }

  get tableScale(): number {
    return this.scale;
  }

  /** 母球顶球位移：0.18R 沿击球方向。 */
  lungeFor(dir: Vec2, progress: number): Vec2 {
    const amount = T.CUE_LUNGE_R * T.CUE_R * progress;
    return { x: dir.x * amount, y: dir.y * amount };
  }
}
