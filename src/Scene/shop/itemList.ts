import type { ShopItem } from './types'
import { getShopItemImageKey } from './assets'

export const SHOP_LIST_BOUNDS = { x: 32, y: 128, width: 790, height: 552 } as const
const CARD_WIDTH = 246
const CARD_HEIGHT = 160
const CARD_GAP_X = 14
const CARD_GAP_Y = 14
const ITEMS_PER_ROW = 3
const START_X = 160
const START_Y = 208

export function createShopItemList(
  scene: Phaser.Scene,
  shopContainer: Phaser.GameObjects.Container,
  shopItems: ShopItem[],
  countLabels: Map<number, Phaser.GameObjects.Text>,
  onSelect: (item: ShopItem) => void
): void {
  const cardBackgrounds = new Map<number, Phaser.GameObjects.Rectangle>()
  let selectedItemId: number | null = null

  shopItems.forEach((item, index) => {
    const x = START_X + (index % ITEMS_PER_ROW) * (CARD_WIDTH + CARD_GAP_X)
    const y = START_Y + Math.floor(index / ITEMS_PER_ROW) * (CARD_HEIGHT + CARD_GAP_Y)
    const card = scene.add.container(x, y)
    const background = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xfff8e9, 0.97)
      .setStrokeStyle(2, 0xb68b4d)
      .setInteractive({ useHandCursor: true })
    const image = scene.add.image(-CARD_WIDTH / 2 + 48, -12, getShopItemImageKey(item.id))
      .setDisplaySize(64, 64)
    const name = scene.add.text(-CARD_WIDTH / 2 + 90, -CARD_HEIGHT / 2 + 20, item.name, {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '18px',
      color: '#263b31',
      fontStyle: 'bold',
      wordWrap: { width: CARD_WIDTH - 104 },
    })
    const price = scene.add.text(-CARD_WIDTH / 2 + 90, -2, `価格  ${item.price.toLocaleString()} G`, {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '16px',
      color: '#78521e',
    })
    const count = scene.add.text(-CARD_WIDTH / 2 + 90, 27, `所持数  ${item.count ?? 0}`, {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '15px',
      color: '#52685a',
    })
    const badge = scene.add.rectangle(0, CARD_HEIGHT / 2 - 22, CARD_WIDTH - 24, 1, 0xd9c59f)

    card.add([background, image, name, price, count, badge])
    countLabels.set(item.id, count)
    cardBackgrounds.set(item.id, background)
    background.on('pointerover', () => {
      background.setFillStyle(0xffffff, 1)
      background.setStrokeStyle(3, 0x95703b)
    })
    background.on('pointerout', () => {
      background.setFillStyle(0xfff8e9, 0.97)
      background.setStrokeStyle(item.id === selectedItemId ? 4 : 2, item.id === selectedItemId ? 0x557649 : 0xb68b4d)
    })
    background.on('pointerdown', () => {
      selectedItemId = item.id
      for (const [id, cardBackground] of cardBackgrounds) {
        cardBackground.setStrokeStyle(id === selectedItemId ? 4 : 2, id === selectedItemId ? 0x557649 : 0xb68b4d)
      }
      onSelect(item)
    })
    shopContainer.add(card)
  })

}

export function getMaxShopScroll(itemCount: number) {
  const rowCount = Math.ceil(itemCount / ITEMS_PER_ROW)
  const contentBottom = START_Y + CARD_HEIGHT / 2 + Math.max(0, rowCount - 1) * (CARD_HEIGHT + CARD_GAP_Y)
  const visibleBottom = SHOP_LIST_BOUNDS.y + SHOP_LIST_BOUNDS.height

  return Math.max(0, contentBottom - visibleBottom)
}
