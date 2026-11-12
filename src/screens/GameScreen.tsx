import { useEffect, useRef } from 'react';
import { COPY } from '../game/config/copy';
import { T } from '../game/config/tuning';
import { step } from '../game/core/Physics';
import { allStopped, createWorld, resetWorld, type World } from '../game/core/World';
import { dist, len, mul, v, type Vec2 } from '../game/core/Vec2';
import {
  beginAim,
  idleAim,
  isDeadZone,
  predict,
  shotSpeed,
  updateAim,
  type Aim,
} from '../game/input/PointerAim';
import { startLoop } from '../game/core/Loop';
import { Renderer } from '../game/render/Renderer';
import { playPot, playShot } from '../game/audio/sfx';

type Phase = 'aim' | 'lunge' | 'roll';

const CUE_START: Vec2 = v(0.5 * T.TABLE_W, 0.86 * T.TABLE_H);

const overlapsAnyBall = (world: World, pos: Vec2): boolean =>
  world.balls.some(
    (b) => !b.potted && b.id !== world.cue.id && dist(pos, b.pos) < world.cue.radius + b.radius + 4
  );

/** 母球落袋后复位，不扣杆数（§4.3 无失败态）。 */
const respawnCue = (world: World): void => {
  const cue = world.cue;
  cue.potted = false;
  cue.vel = v(0, 0);
  let pos = CUE_START;
  for (let i = 0; i < 10 && overlapsAnyBall(world, pos); i++) {
    pos = v(pos.x, Math.max(cue.radius, pos.y - (cue.radius + T.BALL_R)));
  }
  cue.pos = pos;
};

export default function GameScreen({ onExit }: { onExit: () => void }): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World>(createWorld());

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const world = worldRef.current;
    const renderer = new Renderer(canvas);

    let aim: Aim = idleAim();
    let dragging = false;
    let phase: Phase = 'aim';
    let lungeStart = 0;
    let shotDir: Vec2 = v(0, 0);
    let shotV0 = 0;

    const resize = (): void => {
      const r = host.getBoundingClientRect();
      renderer.resize(r.width, r.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);

    const local = (e: PointerEvent): Vec2 => {
      const r = canvas.getBoundingClientRect();
      return v(e.clientX - r.left, e.clientY - r.top);
    };

    const onDown = (e: PointerEvent): void => {
      if (phase !== 'aim') return;
      e.preventDefault();
      aim = beginAim(aim, local(e));
      dragging = true;
    };

    const onMove = (e: PointerEvent): void => {
      if (!dragging) return;
      e.preventDefault();
      aim = updateAim(aim, local(e), window.innerWidth);
    };

    const onUp = (): void => {
      if (!dragging) return;
      dragging = false;
      if (isDeadZone(aim) || len(aim.dir) === 0) {
        aim = idleAim();
        return;
      }
      shotDir = aim.dir;
      shotV0 = shotSpeed(aim);
      aim = idleAim();
      lungeStart = performance.now();
      phase = 'lunge';
    };

    // 触摸本身带隐式指针捕获；拖拽中移到画布外仍要继续收事件，所以监听挂在 window 上（§5.1）。
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    const loop = startLoop(
      (dt) => {
        if (phase === 'roll') {
          step(world, dt);
          // 进球音效：本帧有 POT 事件就播一次
          if (world.events.some((e) => e.type === 'POT')) playPot();
          world.events.length = 0;
          if (allStopped(world)) {
            if (world.cue.potted) respawnCue(world);
            phase = 'aim';
          }
        } else if (phase === 'lunge') {
          const t = performance.now() - lungeStart;
          if (t >= T.LUNGE_FWD_MS + T.LUNGE_BACK_MS) {
            world.cue.vel = mul(shotDir, shotV0);
            playShot();
            world.strokes++;
            phase = 'roll';
          }
        }
      },
      () => {
        const t = performance.now() - lungeStart;
        let lunge = v(0, 0);
        if (phase === 'lunge') {
          const p =
            t < T.LUNGE_FWD_MS
              ? t / T.LUNGE_FWD_MS
              : Math.max(0, 1 - (t - T.LUNGE_FWD_MS) / T.LUNGE_BACK_MS);
          lunge = renderer.lungeFor(shotDir, p);
        }

        const showGuide = phase === 'aim' && dragging && len(aim.dir) > 0;
        renderer.render({
          world,
          aim,
          dragging: showGuide,
          prediction: showGuide ? predict(world, world.cue, aim.dir) : null,
          lunge,
        });
      }
    );

    return () => {
      loop.stop();
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className="game" ref={hostRef}>
      <canvas ref={canvasRef} className="game__canvas" />
      <div className="game__hud">
        <button className="hud-btn" type="button" onClick={() => resetWorld(worldRef.current)}>
          {COPY.reset}
        </button>
        <button className="hud-btn" type="button" onClick={onExit}>
          {COPY.back}
        </button>
      </div>
    </div>
  );
}
