// 担当：たまおちゃん｜ショップ機能・itemList
import type { ShopItem } from './types'
import { getShopItemImageKey } from './assets'

export const SHOP_LIST_BOUNDS = { x: 52, y: 194, width: 528, height: 454 } as const
const CARD_WIDTH = 160
const CARD_HEIGHT = 168
const CARD_GAP_X = 16
const CARD_GAP_Y = 16
const ITEMS_PER_ROW = 3
const START_X = 138
const START_Y = 280

export function createShopItemList(
  scene: Phaser.Scene,
  shopContainer: Phaser.GameObjects.Container,
  shopItems: ShopItem[],
  countLabels: Map<number, Phaser.GameObjects.Text>,
  onSelect: (item: ShopItem) => void
): void {
  const cardBackgrounds = new Map<number, Phaser.GameObjects.Rectangle>()
  let selectedItemId: number | null = shopItems[0]?.id ?? null

  shopItems.forEach((item, index) => {
    const x = START_X + (index % ITEMS_PER_ROW) * (CARD_WIDTH + CARD_GAP_X)
    const y = START_Y + Math.floor(index / ITEMS_PER_ROW) * (CARD_HEIGHT + CARD_GAP_Y)
    const card = scene.add.container(x, y)
    const background = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xfff8e9, 0.95)
      .setStrokeStyle(item.id === selectedItemId ? 3 : 1, 0xc4a264)
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT),
        hitAreaCallback: (area: Phaser.Geom.Rectangle, localX: number, localY: number) => {
          // Match the geometry mask for hover, cursor and clicks, including partial cards.
          const worldX = shopContainer.x + card.x - CARD_WIDTH / 2 + localX
          const worldY = shopContainer.y + card.y - CARD_HEIGHT / 2 + localY
          const bounds = SHOP_LIST_BOUNDS
          return area.contains(localX, localY)
            && worldX >= bounds.x && worldX < bounds.x + bounds.width
            && worldY >= bounds.y && worldY < bounds.y + bounds.height
        },
      })
    const frame = scene.add.image(0, -26, 'shop-frame').setDisplaySize(88, 88)
    const image = scene.add.image(0, -26, getShopItemImageKey(item.id))
      .setDisplaySize(54, 54)
    if (item.id === 13) image.setScale(Math.min(62 / image.width, 62 / image.height))
    const name = scene.add.text(0, 22, item.name, {
      fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
      fontSize: '16px',
      color: '#263b31',
      fontStyle: 'bold',
      wordWrap: { width: CARD_WIDTH - 10 },
      align: 'center',
    })
    name.setOrigin(0.5, 0)
    const price = scene.add.text(0, 44, `${item.price.toLocaleString()} G`, {
      fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
      fontSize: '16px',
      color: '#78521e',
    })
    price.setOrigin(0.5, 0)
    const count = scene.add.text(0, 64, `所持数  ${item.count ?? 0}`, {
      fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
      fontSize: '15px',
      color: '#52685a',
    })
    count.setOrigin(0.5, 0)
    const badge = scene.add.rectangle(0, CARD_HEIGHT / 2 - 1, CARD_WIDTH - 24, 1, 0xd9c59f)

    card.add([background, frame, image, name, price, count, badge])
    countLabels.set(item.id, count)
    cardBackgrounds.set(item.id, background)
    background.on('pointerover', () => {
      background.setFillStyle(0xffffff, 1)
      background.setStrokeStyle(2, 0xaa8c57)
    })
    background.on('pointerout', () => {
      background.setFillStyle(0xfff8e9, 0.95)
      background.setStrokeStyle(item.id === selectedItemId ? 3 : 1, 0xc4a264)
    })
    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Geometry masks hide clipped cards visually, but Phaser still hit-tests them.
      // Ignore hits outside the visible list, including cards scrolled beneath the header.
      const { x: listX, y: listY, width, height } = SHOP_LIST_BOUNDS
      if (pointer.x < listX || pointer.x > listX + width || pointer.y < listY || pointer.y > listY + height) return

      selectedItemId = item.id
      for (const [id, cardBackground] of cardBackgrounds) {
        cardBackground.setStrokeStyle(id === selectedItemId ? 3 : 1, 0xc4a264)
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
