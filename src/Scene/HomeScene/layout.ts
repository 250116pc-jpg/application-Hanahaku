/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜ホーム画面・layout
import Phaser from 'phaser'
import { getTextStyle } from '../../utils/ui'

const BORDER_COLOR = 0x536878

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ホーム画面の枠を指定位置・大きさで生成する。
 * ================================== */
export function createHomeFrame(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container,
  width: number,
  height: number
) {
  const outerFrame = scene.add.rectangle(width / 2, height / 2, 1180, 650, 0xcfe3f5)
    .setStrokeStyle(3, BORDER_COLOR)

  ui.add(outerFrame)
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ホーム画面のタイトル文字を生成する。
 * ================================== */
export function createHomeTitle(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container,
  x: number,
  label: string
) {
  const titleBackground = scene.add.rectangle(x, 55, 230, 60, 0xffe5cf)
    .setStrokeStyle(2, 0x806b5a)

  const titleText = scene.add.text(x, 55, label, getTextStyle(30, {
    padding: { top: 6, bottom: 6, left: 6, right: 6 }
  })).setOrigin(0.5)

  ui.add([titleBackground, titleText])
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 花を表示するパネルと画像を配置する。
 * ================================== */
export function createFlowerPanel(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container
) {
  const flowerFrame = scene.add.rectangle(455, 330, 570, 360, 0xffffff)
    .setStrokeStyle(3, BORDER_COLOR)

  const flower = scene.add.image(455, 330, 'homeFlower')
    .setScale(0.7)

  ui.add([flowerFrame, flower])
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ホーム画面の案内メッセージ用テキストを生成する。
 * ================================== */
export function createMessageText(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container,
  x: number,
  y: number
) {
  const messageText = scene.add.text(x, y, '', getTextStyle(22, {
    color: '#333333',
    padding: { top: 6, bottom: 6, left: 6, right: 6 }
  })).setOrigin(0.5)

  ui.add(messageText)

  return messageText
}
