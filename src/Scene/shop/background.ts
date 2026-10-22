export function createShopBackground(
  scene: Phaser.Scene,
  screenWidth: number,
  screenHeight: number
) {
  scene.add.image(screenWidth / 2, screenHeight / 2, 'shop-background')
    .setDisplaySize(screenWidth, screenHeight)
    .setDepth(-2);
  scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x182b22, 0.48)
    .setDepth(-1);
}
