/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜画面表示・設定・DisplaySettings
export interface DisplaySettings {
  maxFps: 30 | 60 | 120;
  quality: 'crisp' | 'smooth';
}
const KEY = 'flowerLinkDisplaySettings';
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 保存された最大FPS・描画品質を検査し、不正値や読込失敗時は既定値を使う。
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
 * 処理内容 : 画面設定をブラウザへ保存し、保存できたかを呼び出し元へ返す。
 * ================================== */
export function saveDisplaySettings(settings: DisplaySettings): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); return true; }
  catch { return false; }
}
