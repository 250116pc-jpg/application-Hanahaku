import type { ItemDetailView, ShopItem } from './types'

const ITEM_SIZE = 110
const ITEM_GAP = 40
const ITEMS_PER_ROW = 5
const START_X = 100
const START_Y = 100

export function createShopItemList(
  scene: Phaser.Scene,
  shopContainer: Phaser.GameObjects.Container,
  shopItems: ShopItem[],
  itemDetail: ItemDetailView
) {
  shopItems.forEach((item, index) => {
    const x = START_X + (index % ITEMS_PER_ROW) * (ITEM_SIZE + ITEM_GAP)
    const y = START_Y + Math.floor(index / ITEMS_PER_ROW) * (ITEM_SIZE + ITEM_GAP)

    const button = scene.add.image(x, y, 'panel', item.frame)
      .setOrigin(0, 0)
      .setDisplaySize(ITEM_SIZE, ITEM_SIZE)
      .setInteractive({ useHandCursor: true })

    button.on('pointerdown', () => {
      itemDetail.show(item)
    })

    shopContainer.add(button)
  })
}

export function getMaxShopScroll(itemCount: number, screenHeight: number) {
  const rowCount = Math.ceil(itemCount / ITEMS_PER_ROW)
  const contentHeight = START_Y + rowCount * ITEM_SIZE + Math.max(0, rowCount - 1) * ITEM_GAP
  const visibleHeight = screenHeight - 120

  return Math.max(0, contentHeight - visibleHeight)
}
