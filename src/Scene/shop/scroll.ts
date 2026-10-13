import { SHOP_LIST_BOUNDS } from './itemList'

export function enableShopScroll(
scene: Phaser.Scene,
shopContainer: Phaser.GameObjects.Container,
maxScroll: number
): () => void {
  const handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    const { x, y, width, height } = SHOP_LIST_BOUNDS
    if (pointer.x < x || pointer.x > x + width || pointer.y < y || pointer.y > y + height) return
    shopContainer.y = Phaser.Math.Clamp(shopContainer.y - deltaY, -maxScroll, 0)
  }

  scene.input.on('wheel', handleWheel)
  return () => scene.input.off('wheel', handleWheel)
}
