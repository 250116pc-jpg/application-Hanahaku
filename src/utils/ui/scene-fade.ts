/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
import Phaser from 'phaser';
import { transitionWithLoading } from './scene-loading';

// 既存の呼び出し口を維持し、黒いフェードを共通ロード表示へ置き換える。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 従来の遷移呼び出しを共通ロード付き遷移へ接続する
 * ================================== */
export function createSceneFade(scene: Phaser.Scene): (destination: string) => void {
  return destination => transitionWithLoading(scene, destination);
}
