import { getShopItemImageKey } from '../shop/assets'
import Phaser from 'phaser'

import { getCategoryName } from './InventoryData'
import type { InventoryFilter, InventoryItem } from './InventoryData'
import { getTextStyle, createTextButton } from '../../utils/ui'

const BORDER_COLOR = 0x536878

interface InventoryCallbacks {
  onBack: () => void
  onCategory: (category: InventoryFilter) => void
  onItem: (item: InventoryItem) => void
  onUse: () => void
}

export class InventoryView {
  private scene: Phaser.Scene
  private callbacks: InventoryCallbacks
  private itemArea!: Phaser.GameObjects.Container
  private selectedNameText!: Phaser.GameObjects.Text
  private selectedCategoryText!: Phaser.GameObjects.Text
  private selectedEffectText!: Phaser.GameObjects.Text
  private selectedCountText!: Phaser.GameObjects.Text
  private useButton!: Phaser.GameObjects.Container
  private useButtonBackground!: Phaser.GameObjects.Rectangle
  private useButtonText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, callbacks: InventoryCallbacks) {
    this.scene = scene
    this.callbacks = callbacks
  }

  create(): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height

    this.scene.cameras.main.setBackgroundColor('rgba(0,0,0,0)')
    this.scene.add.rectangle(width / 2, height / 2, width + 200, height + 200, 0x000000, 0.55)
      .setScrollFactor(0)
      .setInteractive()
    this.scene.add.rectangle(width / 2, height / 2, 920, 610, 0xcfe3f5)
      .setStrokeStyle(3, BORDER_COLOR)
    this.scene.add.text(width / 2 + 330, 105, 'インベントリ', getTextStyle(30)).setOrigin(0.5)

    this.createBackButton(width / 2 - 370, 105)
    this.createCategoryButton(width / 2 - 270, 190, 'すべて', 'all')
    this.createCategoryButton(width / 2 - 90, 190, '回復', 'heal')
    this.createCategoryButton(width / 2 + 120, 190, '強化素材', 'material')
    this.createCategoryButton(width / 2 + 320, 190, '重要', 'important')

    this.itemArea = this.scene.add.container(0, 0)
    this.createDetailPanel(width)
    this.createUseButton(width / 2 + 300, 550)
    this.messageText = this.scene.add.text(width / 2 + 300, 620, '', {
      ...getTextStyle(18),
      align: 'center'
    }).setOrigin(0.5)
  }

  renderItems(items: InventoryItem[], selectedItemId: number | null): void {
    this.itemArea.removeAll(true)
    const startX = this.scene.scale.width / 2 - 300

    items.forEach((item, index) => {
      this.itemArea.add(this.createItemCard(
        startX + index * 200,
        335,
        item,
        item.id === selectedItemId
      ))
    })

    if (items.length === 0) {
      const text = this.scene.add.text(
        this.scene.scale.width / 2,
        330,
        'このカテゴリーのアイテムはありません',
        getTextStyle(22)
      ).setOrigin(0.5)
      this.itemArea.add(text)
    }
  }

  renderDetail(item: InventoryItem | null): void {
    if (!item) {
      this.selectedNameText.setText('アイテムを選択してください')
      this.selectedCategoryText.setText('')
      this.selectedEffectText.setText('')
      this.selectedCountText.setText('')
      this.setUseEnabled(false)
      return
    }

    this.selectedNameText.setText(item.name)
    this.selectedCategoryText.setText(`種類：${getCategoryName(item.category)}`)
    this.selectedEffectText.setText(`効果：${item.effect}`)
    this.selectedCountText.setText(`所持数：${item.count}`)
    this.setUseEnabled(item.usable && item.count > 0)
  }

  showMessage(message: string): void {
    this.messageText.setText(message)
    this.scene.time.delayedCall(1800, () => this.messageText.setText(''))
  }

  private createDetailPanel(width: number): void {
    this.scene.add.rectangle(width / 2 - 170, 535, 500, 200, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)
    this.scene.add.text(width / 2 - 390, 450, '選択中', getTextStyle(20))
    this.selectedNameText = this.scene.add.text(
      width / 2 - 385, 485, 'アイテムを選択してください', getTextStyle(22)
    )
    this.selectedCategoryText = this.scene.add.text(width / 2 - 385, 520, '', getTextStyle(18))
    this.selectedEffectText = this.scene.add.text(width / 2 - 385, 555, '', {
      ...getTextStyle(18),
      wordWrap: { width: 430 }
    })
    this.selectedCountText = this.scene.add.text(width / 2 - 385, 590, '', getTextStyle(18))
  }

  private createBackButton(x: number, y: number): void {
    createTextButton(this.scene, x, y, '← 戻る', this.callbacks.onBack, {
      fontSize: 23,
      hoverColor: '#eeeeee',
      downColor: '#eeeeee',
      padding: { top: 10, bottom: 10, left: 18, right: 18 }
    })
  }

  private createCategoryButton(
    x: number,
    y: number,
    label: string,
    category: InventoryFilter
  ): void {
    createTextButton(this.scene, x, y, `[ ${label} ]`, () => this.callbacks.onCategory(category), {
      fontSize: 20,
      padding: { top: 9, bottom: 9, left: 14, right: 14 }
    })
  }

  private createItemCard(
    x: number,
    y: number,
    item: InventoryItem,
    selected: boolean
  ): Phaser.GameObjects.Container {
    const background = this.scene.add.rectangle(0, 0, 155, 175, selected ? 0xd5e8f5 : 0xffffff)
      .setStrokeStyle(selected ? 3 : 2, selected ? 0x2f6f9f : BORDER_COLOR)
      .setInteractive({ useHandCursor: true })
    const imageArea = this.scene.add.rectangle(0, -30, 90, 80, 0xeaf4fb)
      .setStrokeStyle(1, BORDER_COLOR)
    const imageText = this.scene.add.image(0, -30, getShopItemImageKey(item.id)).setDisplaySize(64,64)
    const nameText = this.scene.add.text(0, 40, item.name, {
      ...getTextStyle(17),
      align: 'center'
    }).setOrigin(0.5)
    const countText = this.scene.add.text(0, 68, `×${item.count}`, getTextStyle(16)).setOrigin(0.5)

    background.on('pointerover', () => background.setFillStyle(0xeaf4fb))
    background.on('pointerout', () => {
      if (!selected) background.setFillStyle(0xffffff)
    })
    background.on('pointerup', () => this.callbacks.onItem(item))

    return this.scene.add.container(x, y, [background, imageArea, imageText, nameText, countText])
  }

  private createUseButton(x: number, y: number): void {
    this.useButtonBackground = this.scene.add.rectangle(0, 0, 210, 65, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setInteractive({ useHandCursor: true })
    this.useButtonText = this.scene.add.text(0, 0, '使用する', getTextStyle(22)).setOrigin(0.5)
    this.useButton = this.scene.add.container(x, y, [this.useButtonBackground, this.useButtonText])
    this.useButtonBackground.on('pointerup', this.callbacks.onUse)
  }

  private setUseEnabled(enabled: boolean): void {
    this.useButtonBackground.setFillStyle(enabled ? 0xffffff : 0xdddddd)
    this.useButtonText.setColor(enabled ? '#000000' : '#777777')
    this.useButton.setAlpha(enabled ? 1 : 0.7)
  }
}
