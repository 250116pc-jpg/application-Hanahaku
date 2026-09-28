export function createShopBackground(
  scene: Phaser.Scene,
  screenWidth: number,
  screenHeight: number
) {
  scene.add.image(0, 50, 'panel', 9)
    .setOrigin(0, 0)
    .setDisplaySize(screenWidth + 560, screenHeight + 320)
    .setPosition(-260, -160)
}
