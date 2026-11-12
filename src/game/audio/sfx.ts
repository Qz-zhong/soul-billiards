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

/** 击打声：短促"啪"，白噪声 + 带通滤波，30ms 衰减。 */
export const playShot = (): void => {
  try {
    const c = ensureCtx();
    const bufferSize = c.sampleRate * 0.03; // 30ms
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.8;
    const gain = c.createGain();
    gain.gain.value = 0.4;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start();
  } catch {
    // 音频失败不影响游戏
  }
};

/** 进球声：低沉"咚"，低频正弦 + 指数衰减，300ms，模拟袋口空腔共鸣。 */
export const playPot = (): void => {
  try {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    const t = c.currentTime;
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch {
    // 音频失败不影响游戏
  }
};
