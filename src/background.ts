// 担当：たまおちゃん｜ゲーム背景の生成と表示
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