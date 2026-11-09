import { SHOP_LIST_BOUNDS } from './itemList'

export function enableShopScroll(
  scene: Phaser.Scene,
  shopContainer: Phaser.GameObjects.Container,
  maxScroll: number
): () => void {
  const { x, y, width, height } = SHOP_LIST_BOUNDS
  const barX = x + width + 3
  const thumbHeight = Math.min(height, Math.max(36, height * height / (height + maxScroll)))
  const travel = height - thumbHeight
  const track = scene.add.rectangle(barX, y, 10, height, 0x0c2332)
    .setOrigin(0.5, 0).setStrokeStyle(1, 0xbda16a, 0.45)
  const thumb = scene.add.rectangle(barX, y, 10, thumbHeight, 0xc4a264)
    .setOrigin(0.5, 0).setStrokeStyle(1, 0xead8af)

  const setScroll = (offset: number): void => {
    const next = Phaser.Math.Clamp(offset, 0, maxScroll)
    shopContainer.y = -next
    thumb.y = y + (maxScroll > 0 ? next / maxScroll * travel : 0)
  }

  if (maxScroll > 0) {
    track.setInteractive({ useHandCursor: true })
    thumb.setInteractive({ useHandCursor: true })
    scene.input.setDraggable(thumb)
    track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      setScroll((pointer.y - y - thumbHeight / 2) / travel * maxScroll)
    })
    thumb.on('drag', (_pointer: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
      setScroll((dragY - y) / travel * maxScroll)
    })
    thumb.on('pointerover', () => thumb.setFillStyle(0xead8af))
    thumb.on('pointerout', () => thumb.setFillStyle(0xc4a264))
  } else {
    track.setVisible(false)
    thumb.setVisible(false)
  }

  // Re-check hover when the content moves beneath a stationary pointer.
  const previousPollRate = scene.input.pollRate
  scene.input.setPollAlways()
  const handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    if (pointer.x < x || pointer.x > barX + 5 || pointer.y < y || pointer.y >= y + height) return
    setScroll(-shopContainer.y + deltaY)
  }
  scene.input.on('wheel', handleWheel)
  return () => {
    scene.input.off('wheel', handleWheel)
    scene.input.setPollRate(previousPollRate)
    track.destroy()
    thumb.destroy()
  }
}
