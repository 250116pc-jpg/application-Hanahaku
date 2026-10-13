import testData from '../test_data'
import { createShopBackground } from './background'
import { createItemDetail } from './itemDetail'
import { createShopItemList, getMaxShopScroll, SHOP_LIST_BOUNDS } from './itemList'
import { enableShopScroll } from './scroll'
import { preloadShopAssets } from './assets'
import type { ShopItem } from './types'
import { SCENE_KEYS } from '../sceneKeys';
import { createTextButton } from '../../utils/ui'

//--------------------------------------------------------------

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.SHOP })
  }

  preload(): void {
    preloadShopAssets(this)
  }

  create(): void {
    const shopItems = testData.shopItems as ShopItem[]
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height

    createShopBackground(this, screenWidth, screenHeight)
    this.createHeader(screenWidth)
    this.createBackButton()

    this.createListPanel()
    const shopContainer = this.add.container(0, 0)
    const countLabels = new Map<number, Phaser.GameObjects.Text>()
    const itemDetail = createItemDetail(this, item => {
      countLabels.get(item.id)?.setText(`所持数  ${item.count ?? 0}`)
    })
    createShopItemList(
      this,
      shopContainer,
      shopItems,
      countLabels,
      item => itemDetail.show(item)
    )
    this.applyItemListMask(shopContainer)
    const disposeScroll = enableShopScroll(this, shopContainer, getMaxShopScroll(shopItems.length))
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeScroll)

    const firstItem = shopItems[0]
    if (firstItem) itemDetail.show(firstItem)
  }

  private createHeader(screenWidth: number): void {
    this.add.rectangle(screenWidth / 2, 54, screenWidth, 108, 0x20392d, 0.88)
    this.add.rectangle(screenWidth / 2, 106, screenWidth, 3, 0xd8b36c, 0.95)
    this.add.text(screenWidth / 2, 37, '花屋の道具店', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '34px',
      color: '#fff4d9',
      fontStyle: 'bold',
      stroke: '#263b31',
      strokeThickness: 3,
    }).setOrigin(0.5)
    this.add.text(screenWidth / 2, 78, '育成に役立つ品を取りそろえています', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '16px',
      color: '#e7dfc8',
    }).setOrigin(0.5)
  }

  private createBackButton(): void {
    createTextButton(this, 112, 54, '← ホーム', () => {
      this.scene.start(SCENE_KEYS.HOME)
    }, {
      fontSize: 19,
      bgColor: '#f7efd9',
      hoverColor: '#ffffff',
      downColor: '#dfd0ad',
      padding: { left: 17, right: 17, top: 10, bottom: 10 },
    })
  }

  private createListPanel(): void {
    const { x, y, width, height } = SHOP_LIST_BOUNDS
    this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x20392d, 0.5)
      .setStrokeStyle(2, 0xe0c184, 0.9)
    this.add.text(x + 18, y - 13, '商品一覧', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '18px',
      color: '#fff4d9',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)
    this.add.text(x + width - 12, y - 13, 'ホイールでスクロール', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '14px',
      color: '#fff4d9',
    }).setOrigin(1, 0.5)
  }

  private applyItemListMask(shopContainer: Phaser.GameObjects.Container): void {
    const { x, y, width, height } = SHOP_LIST_BOUNDS
    const maskGraphics = this.make.graphics({})
    maskGraphics.fillRect(x, y, width, height)
    shopContainer.setMask(maskGraphics.createGeometryMask())
  }
}
