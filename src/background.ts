/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 画像を画面サイズに合わせて背景として配置する
 * ================================== */
export function createBackground(
  scene: Phaser.Scene,
  imageKey: string
): void {
  const width = scene.scale.width
  const height = scene.scale.height

  scene.add.image(0, 0, imageKey)
  .setOrigin(0, 0)
  .setDisplaySize(width, height)
  .setScrollFactor(0);
}