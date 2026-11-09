// 担当：たまおちゃん｜ショップ機能・background
export function createShopBackground(
  scene: Phaser.Scene,
  screenWidth: number,
  screenHeight: number
) {
  scene.add.image(screenWidth / 2, screenHeight / 2, 'shop-background')
    .setDisplaySize(screenWidth, screenHeight)
    .setDepth(-2);
  scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x142433, 0.2)
    .setDepth(-1);
  // Independent shop displays, with navy, brass and warm ivory accents.
  const panels = scene.add.graphics().setDepth(-0.5);
  panels.fillStyle(0x091923, 0.35);
  panels.fillRoundedRect(36, 118, 568, 566, 14);
  panels.fillRoundedRect(628, 118, 322, 566, 14);
  panels.fillStyle(0x193447, 0.95);
  panels.fillRoundedRect(30, 110, 568, 566, 14);
  panels.lineStyle(1.5, 0xbda16a, 0.9);
  panels.strokeRoundedRect(30, 110, 568, 566, 14);
  panels.lineStyle(1, 0xbda16a, 0.35);
  panels.strokeRoundedRect(38, 118, 552, 550, 10);
  panels.fillStyle(0xf5e9ce, 0.98);
  panels.fillRoundedRect(620, 110, 322, 566, 14);
  panels.lineStyle(2, 0xbda16a, 0.95);
  panels.strokeRoundedRect(620, 110, 322, 566, 14);
  panels.lineStyle(1, 0xbda16a, 0.5);
  panels.strokeRoundedRect(628, 118, 306, 550, 10);
}
