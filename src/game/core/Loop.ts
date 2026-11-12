import { T } from '../config/tuning';

export interface Loop {
  stop: () => void;
  droppedFrames: number;
}

/**
 * 固定步长累加器。dt 取 1/120 的唯一理由是单步最大位移 2600/120 ≈ 21.7 lu
 * 小于球半径，于是不需要连续碰撞检测（§7.2）。
 */
export const startLoop = (
  onStep: (dt: number) => void,
  onRender: () => void
): Loop => {
  const loop: Loop = { stop: () => {}, droppedFrames: 0 };
  let raf = 0;
  let acc = 0;
  let last = performance.now();
  let stopped = false;

  const frame = (now: number): void => {
    if (stopped) return;
    const elapsed = Math.min((now - last) / 1000, 0.25);
    last = now;
    acc += elapsed;

    let n = 0;
    while (acc >= T.DT && n < T.MAX_SUBSTEPS) {
      onStep(T.DT);
      acc -= T.DT;
      n++;
    }
    if (acc >= T.DT) {
      loop.droppedFrames++;
      acc = 0;
    }

    onRender();
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  loop.stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
  return loop;
};
