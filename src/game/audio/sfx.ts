// 离线音效：预加载 MP3 文件，直接播放（§12.1 运行期零外部请求，音频文件内置）。

interface Sound {
  readonly el: HTMLAudioElement;
  readonly url: string;
}

const sounds: Record<string, Sound> = {
  shot: { el: new Audio('/audio/shot.mp3'), url: '/audio/shot.mp3' },
  collision: { el: new Audio('/audio/collision.mp3'), url: '/audio/collision.mp3' },
  pot: { el: new Audio('/audio/pot.mp3'), url: '/audio/pot.mp3' },
};

// 预加载
for (const s of Object.values(sounds)) {
  s.el.preload = 'auto';
  s.el.load();
}

/** 击打声：短促"啪"。 */
export const playShot = (): void => {
  try {
    const s = sounds.shot!;
    s.el.currentTime = 0;
    s.el.play().catch(() => {});
  } catch {
    // 音频失败不影响游戏
  }
};

/** 球碰撞声：清脆"嗒"。 */
export const playCollision = (): void => {
  try {
    const s = sounds.collision!;
    s.el.currentTime = 0;
    s.el.play().catch(() => {});
  } catch {
    // 音频失败不影响游戏
  }
};

/** 进球声：低沉"咚"。 */
export const playPot = (): void => {
  try {
    const s = sounds.pot!;
    s.el.currentTime = 0;
    s.el.play().catch(() => {});
  } catch {
    // 音频失败不影响游戏
  }
};
