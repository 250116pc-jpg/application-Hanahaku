import type { ItemDetailView, ShopItem } from './types'

const DETAIL_WIDTH = 500
const DETAIL_HEIGHT = 400

export function createItemDetail(scene: Phaser.Scene): ItemDetailView {
  const container = scene.add.container(0, 0)
  let currentItem: ShopItem | null = null

  const centerX = scene.scale.width / 2
  const centerY = scene.scale.height / 2

  const background = scene.add.rectangle(
    centerX,
    centerY,
    DETAIL_WIDTH,
    DETAIL_HEIGHT,
    0x000000,
    0.9
  )

  const nameText = scene.add.text(centerX, 180, '', {
    fontSize: '32px',
    color: '#ffffff'
  }).setOrigin(0.5)

  const descriptionText = scene.add.text(centerX, 240, '', {
    fontSize: '20px',
    color: '#ffffff',
    wordWrap: { width: DETAIL_WIDTH - 80 }
  }).setOrigin(0.5)

  const priceText = scene.add.text(centerX, 300, '', {
    fontSize: '24px',
    color: '#ffff00'
  }).setOrigin(0.5)

  const countText = scene.add.text(centerX, 340, '', {
    fontSize: '20px',
    color: '#ffffff'
  }).setOrigin(0.5)

  const buyButton = createTextButton(scene, centerX - 100, 430, '購入する', '#008800')
  const closeButton = createTextButton(scene, centerX + 100, 430, '閉じる', '#880000')

  buyButton.on('pointerdown', () => {
    if (!currentItem) return

    currentItem.count = (currentItem.count ?? 0) + 1
    countText.setText(formatCount(currentItem))
    console.log('購入:', currentItem.name)
  })

  closeButton.on('pointerdown', () => {
    container.setVisible(false)
  })

  container.add([
    background,
    nameText,
    descriptionText,
    priceText,
    countText,
    buyButton,
    closeButton
  ])

  container.setVisible(false)

  return {
    container,
    show(item: ShopItem) {
      currentItem = item
      nameText.setText(item.name)
      descriptionText.setText(item.description ?? '説明なし')
      priceText.setText(`価格: ${item.price}`)
      countText.setText(formatCount(item))
      container.setVisible(true)
      container.setDepth(10)
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
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor,
    padding: {
      left: 20,
      right: 20,
      top: 10,
      bottom: 10
    }
  })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
}

function formatCount(item: ShopItem) {
  return `所持数: ${item.count ?? 0}`
}
