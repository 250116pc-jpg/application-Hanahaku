/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 画質・FPS設定の保存を定義する
 * ================================== */
export interface DisplaySettings {
  maxFps: 30 | 60 | 120;
  quality: 'crisp' | 'smooth';
}
const KEY = 'flowerLinkDisplaySettings';
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 保存済みの画質と最大FPSを読み込み、値を検証する
 * ================================== */
export function loadDisplaySettings(): DisplaySettings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      maxFps: [30, 60, 120].includes(value?.maxFps) ? value.maxFps : 60,
      quality: value?.quality === 'smooth' ? 'smooth' : 'crisp',
    };
  } catch { return { maxFps: 60, quality: 'crisp' }; }
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 画質と最大FPSをブラウザに保存する
 * ================================== */
export function saveDisplaySettings(settings: DisplaySettings): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); return true; }
  catch { return false; }
}
