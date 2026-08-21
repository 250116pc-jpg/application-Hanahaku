import panelImg from './assets/elegant_ui/panel/panel.png'
import testData from './test_data'
import { createShopBackground } from './shop/background'
import { createItemDetail } from './shop/itemDetail'
import { createShopItemList, getMaxShopScroll } from './shop/itemList'
import { enableShopScroll } from './shop/scroll'
import type { ShopItem } from './shop/types'

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' })
  }

  preload() {
    this.load.spritesheet('panel', panelImg, {
      frameWidth: 48,
      frameHeight: 48
    })
  }

  create() {
    const shopItems = testData.shopItems as ShopItem[]
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height

    createShopBackground(this, screenWidth, screenHeight)

    this.add.text(screenWidth / 2, 30, 'ショップ画面', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.createBackButton()

    const shopContainer = this.add.container(0, 0)
    const itemDetail = createItemDetail(this)

    createShopItemList(this, shopContainer, shopItems, itemDetail)
    this.applyItemListMask(shopContainer, screenWidth, screenHeight)
    enableShopScroll(this, shopContainer, getMaxShopScroll(shopItems.length, screenHeight))
  }

  private createBackButton() {
    const backButton = this.add.image(0, 40, 'button')
      .setScale(0.2)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0, 0)

    backButton.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    this.add.text(0, 20, 'ゲーム画面へ', {
      fontSize: '16px',
      color: '#ffffff'
    })
  }

  private applyItemListMask(
    shopContainer: Phaser.GameObjects.Container,
    screenWidth: number,
    screenHeight: number
  ) {
    const maskGraphics = this.make.graphics({})
    maskGraphics.fillRect(0, 70, screenWidth, screenHeight - 120)
    shopContainer.setMask(maskGraphics.createGeometryMask())
  }
}
