export interface DisplaySettings {
  maxFps: 30 | 60 | 120;
  quality: 'crisp' | 'smooth';
}
const KEY = 'flowerLinkDisplaySettings';
export function loadDisplaySettings(): DisplaySettings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      maxFps: [30, 60, 120].includes(value?.maxFps) ? value.maxFps : 60,
      quality: value?.quality === 'smooth' ? 'smooth' : 'crisp',
    };
  } catch { return { maxFps: 60, quality: 'crisp' }; }
}
export function saveDisplaySettings(settings: DisplaySettings): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); return true; }
  catch { return false; }
}
