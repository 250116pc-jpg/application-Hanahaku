// 担当：たまおちゃん｜ショップ機能・itemDetail
import type { ItemDetailView, ShopItem } from './types'
import { getShopItemImageKey } from './assets'

const PANEL_X = 781
const PANEL_WIDTH = 300

export function createItemDetail(
  scene: Phaser.Scene,
  onPurchase: (item: ShopItem) => Promise<void>
): ItemDetailView {
  let currentItem: ShopItem | null = null

  // A separate product card beside the display shelves.
  scene.add.text(PANEL_X, 148, '商品詳細', {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
    fontSize: '17px',
    color: '#7b694a',
    fontStyle: 'bold',
  }).setOrigin(0.5)
  scene.add.image(PANEL_X, 274, 'shop-frame').setDisplaySize(158, 158)
  const itemImage = scene.add.image(PANEL_X, 274, 'shop-flower').setDisplaySize(96, 96)
  const nameText = scene.add.text(PANEL_X, 375, '商品を選択してください', {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
    fontSize: '23px',
    color: '#263b31',
    fontStyle: 'bold',
    align: 'center',
    wordWrap: { width: PANEL_WIDTH - 48 },
  }).setOrigin(0.5)
  scene.add.rectangle(PANEL_X, 415, PANEL_WIDTH - 44, 2, 0xd9c59f)
  const descriptionText = scene.add.text(PANEL_X - PANEL_WIDTH / 2 + 28, 440, '', {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
    fontSize: '17px',
    color: '#47584a',
    wordWrap: { width: PANEL_WIDTH - 56 },
    lineSpacing: 7,
  })
  // 説明が長い場合は、区切ったページをボタンで最後まで読めるようにする。
  let descriptionPages: string[] = []
  let descriptionPage = 0
  const pageButton = scene.add.text(PANEL_X, 510, '', {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif', fontSize: '13px', color: '#486a4f'
  }).setOrigin(0.5).setInteractive({ useHandCursor: true })
  pageButton.on('pointerup', () => {
    if (descriptionPages.length < 2) return
    descriptionPage = (descriptionPage + 1) % descriptionPages.length
    showDescriptionPage()
  })
  function showDescriptionPage(): void {
    descriptionText.setText(descriptionPages[descriptionPage] ?? '')
    pageButton.setText(descriptionPages.length > 1 ? `説明 ${descriptionPage + 1}/${descriptionPages.length}　次へ ›` : '')
  }
  function setDescription(value: string): void {
    // Phaserの実際の折り返し行を使うため、幅や日本語の文字数が変わっても対応できる。
    const lines: string[] = []
    let line = ''
    // 日本語は空白で区切られないため、文字の実幅を測って折り返す。
    for (const char of Array.from(value)) {
      if (char === '\n') { lines.push(line); line = ''; continue }
      if (line && descriptionText.context.measureText(line + char).width > PANEL_WIDTH - 56) {
        lines.push(line)
        line = char
      } else line += char
    }
    if (line || !lines.length) lines.push(line)
    descriptionPages = []
    for (let i = 0; i < lines.length; i += 2) descriptionPages.push(lines.slice(i, i + 2).join('\n'))
    descriptionPage = 0
    showDescriptionPage()
  }
  const priceText = scene.add.text(PANEL_X - PANEL_WIDTH / 2 + 28, 526, '', {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
    fontSize: '20px',
    color: '#78521e',
    fontStyle: 'bold',
  })
  const countText = scene.add.text(PANEL_X - PANEL_WIDTH / 2 + 28, 565, '', {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
    fontSize: '17px',
    color: '#52685a',
  })
  const buyButton = createTextButton(scene, PANEL_X, 630, '購入する')

  let buying=false
  buyButton.on('pointerdown', async () => {
    if (!currentItem || buying) return
    buying=true
    buyButton.setText('購入中…')
    try {
      await onPurchase(currentItem)
      if(scene.sys.isActive() && currentItem) countText.setText(formatCount(currentItem))
    } finally {
      buying=false
      if(scene.sys.isActive()) buyButton.setText('購入する')
    }
  })

  return {
    show(item: ShopItem) {
      currentItem = item
      itemImage.setTexture(getShopItemImageKey(item.id))
      const size = item.id === 13 ? 136 : 96
      itemImage.setScale(Math.min(size / itemImage.width, size / itemImage.height))
      nameText.setText(item.name)
      setDescription(item.description ?? '説明なし')
      priceText.setText(`価格  ${item.price.toLocaleString()} G`)
      countText.setText(formatCount(item))
    }
  }
}

function createTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string
) {
  const art = scene.add.image(x, y, 'shop-button').setDisplaySize(222, 66)
  const text = scene.add.text(x, y, label, {
    fontFamily: '"UD Digi Kyokasho NP-R", "Yu Gothic", "Meiryo", sans-serif',
    fontSize: '20px',
    color: '#ffffff',
    // Button artwork is shared with the encyclopedia.
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
  text.on('pointerover', () => art.setTint(0xffe6ac))
  text.on('pointerout', () => art.clearTint())
  return text
}

function formatCount(item: ShopItem) {
  return `所持数: ${item.count ?? 0}`
}
