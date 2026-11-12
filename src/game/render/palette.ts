/**
 * canvas 侧取色。值一律从 global.css 的 CSS 变量读，不在这里重复定义，
 * 否则色板就有了第二个来源（§12.1）。
 */
const NAMES = [
  'wall',
  'wall-lamp',
  'cloth',
  'cloth-lit',
  'cloth-dark',
  'rail-hi',
  'rail-mid',
  'rail-lo',
  'brass',
  'pocket',
  'cue',
  'text',
] as const;

export type Palette = Record<(typeof NAMES)[number], string>;

export const readPalette = (source: HTMLElement = document.documentElement): Palette => {
  const cs = getComputedStyle(source);
  const out = {} as Record<string, string>;
  for (const name of NAMES) {
    out[name] = cs.getPropertyValue(`--${name}`).trim() || '#000';
  }
  return out as Palette;
};

/** §5.2 / §8.10：颜色在这里承担教学，不承担装饰。 */
export const dragColor = (force: number): string => {
  if (force < 0.4) return '#7FB7FF';
  if (force <= 0.75) return '#E8ECF2';
  return '#FF8A5C';
};

export const BRASS_HIGHLIGHT = 'rgba(255,230,180,.22)';
export const CUSHION_OUTER_EDGE = 'rgba(255,255,255,.07)';
export const SPOT = 'rgba(255,255,255,.09)';
export const NAP_LINE = 'rgba(0,0,0,.03)';
export const AIM_TRAJECTORY = 'rgba(255,255,255,.55)';
export const AIM_GHOST = 'rgba(255,255,255,.30)';
export const AIM_EXIT = 'rgba(255,255,255,.30)';
export const AIM_DEFLECT = 'rgba(255,255,255,.18)';
export const AIM_BOUNCE = 'rgba(232,180,92,.26)';
