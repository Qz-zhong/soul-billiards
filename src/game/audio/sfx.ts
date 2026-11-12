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

/** 击打声：清脆"啪"，短促噪声 burst + 高频谐振，15ms。 */
export const playShot = (): void => {
  try {
    const c = ensureCtx();
    const t = c.currentTime;
    const duration = 0.015; // 15ms
    const sampleRate = c.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    // 快速起音 + 指数衰减的噪声
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.15));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    // 带通滤波：中心 3500Hz，Q=1.2，保留高频清脆感
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 1.2;
    // 高通滤波：切除 1500Hz 以下，让声音更"亮"
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    const gain = c.createGain();
    gain.gain.value = 0.5;
    noise.connect(filter);
    filter.connect(hp);
    hp.connect(gain);
    gain.connect(c.destination);
    noise.start(t);
  } catch {
    // 音频失败不影响游戏
  }
};

/** 进球声：低沉"咚"带"咔"起音，球撞袋口边缘 + 空腔共鸣。 */
export const playPot = (): void => {
  try {
    const c = ensureCtx();
    const t = c.currentTime;
    // 第一阶段：短促高频"咔"（球撞袋口边缘），5ms
    const clickDuration = 0.005;
    const clickSize = Math.floor(c.sampleRate * clickDuration);
    const clickBuffer = c.createBuffer(1, clickSize, c.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickSize; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickSize * 0.1));
    }
    const click = c.createBufferSource();
    click.buffer = clickBuffer;
    const clickFilter = c.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 2000;
    const clickGain = c.createGain();
    clickGain.gain.value = 0.3;
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(c.destination);
    click.start(t);
    // 第二阶段：低频共鸣（袋口空腔），250ms
    const osc = c.createOscillator();
    const oscGain = c.createGain();
    osc.connect(oscGain);
    oscGain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t + 0.005);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.25);
    oscGain.gain.setValueAtTime(0.4, t + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t + 0.005);
    osc.stop(t + 0.25);
  } catch {
    // 音频失败不影响游戏
  }
};

/** 球碰撞声：清脆"嗒"，比击打声更短更亮，8ms，4500Hz 带通。 */
export const playCollision = (impactSpeed: number): void => {
  try {
    const c = ensureCtx();
    const t = c.currentTime;
    const duration = 0.008; // 8ms
    const sampleRate = c.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    // 快速起音 + 指数衰减
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.12));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    // 带通滤波：中心 4500Hz，Q=1.5，比击打声更亮
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4500;
    filter.Q.value = 1.5;
    // 音量随撞击速度变化（0.2-0.6）
    const volume = Math.min(0.2 + impactSpeed / 2000, 0.6);
    const gain = c.createGain();
    gain.gain.value = volume;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start(t);
  } catch {
    // 音频失败不影响游戏
  }
};
