/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
import { loadDisplaySettings } from './DisplaySettings';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : メニューの小さい操作ボタンを拡大し、隣接する操作のために指定した高さの上限を守る
 * ================================== */
export function getMenuButtonDimensions(width: number, height: number, maxHeight = 60): { width: number; height: number; fontScale: number } {
  if (loadDisplaySettings().menuButtonSize !== 'large') return { width, height, fontScale: 1 };
  return {
    width: width <= 54 ? Math.max(width, 44) : width,
    height: Math.max(height, Math.min(maxHeight, Math.max(44, height * 1.25))),
    fontScale: 1.12,
  };
}
