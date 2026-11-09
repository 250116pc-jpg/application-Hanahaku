/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜ゲーム共通処理
import Phaser from 'phaser'

// テキスト表示の関数
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 指定された文字スタイルと位置でPhaserのテキストを生成する。
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
 * 処理内容 : 指定した画像を配置する共通処理を提供する。
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

export default {
    text,
    image
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 指定した表示設定で文字オブジェクトを生成する。
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
 * 処理内容 : 指定時間の待機後に続きの処理へ進めるようにする。
 * ================================== */
export function wait(
  scene: Phaser.Scene,
  duration: number
) {
  return new Promise(resolve => {
    scene.time.delayedCall(duration, resolve);
  });
}