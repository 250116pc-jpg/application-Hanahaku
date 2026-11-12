/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250116
 * 氏名：武田優人、中村伊安
 * ================================== */
import Phaser from 'phaser'
import { transitionWithLoading } from '../../utils/ui/scene-loading'

/* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
 * 処理内容 : ホームへ戻って町マップを開く
 * ================================== */
export function navigateToTownMap(scene: Phaser.Scene): void {
  scene.registry.set('home-open-town-map', true)
  transitionWithLoading(scene, 'HomeScene')
}
