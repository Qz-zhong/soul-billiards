// 基础音效：Web Audio API 合成，零外部依赖（§12.1 运行期零第三方请求）。
// AudioContext 必须在用户交互后创建，所以首次调用时延迟初始化。

let ctx: AudioContext | null = null;

const ensureCtx = (): AudioContext => {
  if (!ctx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new Ctx();
  }
  return ctx;
};

/** 击打声：短促"嗒"，800Hz → 400Hz，50ms。 */
export const playShot = (): void => {
  try {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    const t = c.currentTime;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);
  } catch {
    // 音频失败不影响游戏
  }
};

/** 进球声：低沉"咚"，200Hz → 100Hz，200ms。 */
export const playPot = (): void => {
  try {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    const t = c.currentTime;
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch {
    // 音频失败不影响游戏
  }
};
