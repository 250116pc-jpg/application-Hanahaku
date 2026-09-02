export function enableShopScroll(
  scene: Phaser.Scene,
  shopContainer: Phaser.GameObjects.Container,
  maxScroll: number
) {
  scene.input.on('wheel', (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ) => {
    shopContainer.y = Phaser.Math.Clamp(shopContainer.y - deltaY, -maxScroll, 0)
  })
}
