/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
import Phaser from 'phaser'

// テキスト表示の関数
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 位置と文字サイズを指定して白い文字を生成する
 * ================================== */
function text(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    text: string
) {
    return scene.add.text(x, y, text, {
        fontSize: `${size}px`,
        color: '#ffffff'
    }).setOrigin(0.5)
}

// ボタン表示の関数
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 画像の大きさを調整してクリック可能にする
 * ================================== */
function image(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    image: string
) {
    return scene.add.image(x, y, image).setScale(size).setInteractive()
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 表示・待機を定義する
 * ================================== */
export default {
    text,
    image
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 縁取り付きの文字を指定した位置へ表示する
 * ================================== */
export function specialText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  strokeThickness: number,
  text: string,
  color1: string,
  strokeColor: string

): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontSize: `${size}px`,
    color: color1,
    stroke: strokeColor,
    strokeThickness: strokeThickness
  }).setOrigin(0.5);
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : Phaserのタイマーで指定時間待つ
 * ================================== */
export function wait(
  scene: Phaser.Scene,
  duration: number
) {
  return new Promise(resolve => {
    scene.time.delayedCall(duration, resolve);
  });
}