import type { ItemDetailView, ShopItem } from './types'
import { getShopItemImageKey } from './assets'

const PANEL_X = 840
const PANEL_Y = 405
const PANEL_WIDTH = 220
const PANEL_HEIGHT = 532

export function createItemDetail(
  scene: Phaser.Scene,
  onPurchase: (item: ShopItem) => void
): ItemDetailView {
  let currentItem: ShopItem | null = null

  scene.add.rectangle(
    PANEL_X,
    PANEL_Y,
    PANEL_WIDTH,
    PANEL_HEIGHT,
    0xfff8e9,
    0.98
  ).setStrokeStyle(3, 0xc89d5a)
  scene.add.text(PANEL_X, 163, '商品詳細', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '17px',
    color: '#7b694a',
    fontStyle: 'bold',
  }).setOrigin(0.5)
  scene.add.rectangle(PANEL_X, 274, 142, 142, 0xffffff)
    .setStrokeStyle(2, 0xe1cfad)
  const itemImage = scene.add.image(PANEL_X, 274, 'shop-flower').setDisplaySize(96, 96)
  const nameText = scene.add.text(PANEL_X, 375, '商品を選択してください', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '23px',
    color: '#263b31',
    fontStyle: 'bold',
    align: 'center',
    wordWrap: { width: PANEL_WIDTH - 48 },
  }).setOrigin(0.5)
  scene.add.rectangle(PANEL_X, 415, PANEL_WIDTH - 44, 2, 0xd9c59f)
  const descriptionText = scene.add.text(PANEL_X - PANEL_WIDTH / 2 + 28, 440, '', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '17px',
    color: '#47584a',
    wordWrap: { width: PANEL_WIDTH - 56 },
    lineSpacing: 7,
  })
  const priceText = scene.add.text(PANEL_X - PANEL_WIDTH / 2 + 28, 526, '', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '20px',
    color: '#78521e',
    fontStyle: 'bold',
  })
  const countText = scene.add.text(PANEL_X - PANEL_WIDTH / 2 + 28, 565, '', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '17px',
    color: '#52685a',
  })
  const buyButton = createTextButton(scene, PANEL_X, 630, '購入する', '#486a4f')

  buyButton.on('pointerdown', () => {
    if (!currentItem) return

    currentItem.count = (currentItem.count ?? 0) + 1
    countText.setText(formatCount(currentItem))
    onPurchase(currentItem)
  })

  return {
    show(item: ShopItem) {
      currentItem = item
      itemImage.setTexture(getShopItemImageKey(item.id))
      nameText.setText(item.name)
      descriptionText.setText(item.description ?? '説明なし')
      priceText.setText(`価格  ${item.price.toLocaleString()} G`)
      countText.setText(formatCount(item))
    }
  }
}

function createTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  backgroundColor: string
) {
  return scene.add.text(x, y, label, {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '20px',
    color: '#ffffff',
    backgroundColor,
    fontStyle: 'bold',
    padding: {
      left: 42,
      right: 42,
      top: 12,
      bottom: 12
    }
  })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
}

function formatCount(item: ShopItem) {
  return `所持数: ${item.count ?? 0}`
}
