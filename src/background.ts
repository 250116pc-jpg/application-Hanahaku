/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜ゲーム背景の生成と表示
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 指定画像を背景として配置し、画面寸法に合わせて表示する。
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