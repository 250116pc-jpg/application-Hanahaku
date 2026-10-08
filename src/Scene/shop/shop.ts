import panelImg from '../../assets/elegant_ui/panel/panel.png'
import testData from '../test_data'
import { createShopBackground } from './background'
import { createItemDetail } from './itemDetail'
import { createShopItemList, getMaxShopScroll } from './itemList'
import { enableShopScroll } from './scroll'
import type { ShopItem } from './types'
//debug機能
import { showDebugSceneName } from '../../debug';
import { SCENE_KEYS } from '../sceneKeys';

//--------------------------------------------------------------

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.SHOP })
  }

  preload() {
    this.load.spritesheet('panel', panelImg, {
      frameWidth: 48,
      frameHeight: 48
    })
  }

  create() {
    showDebugSceneName(this);
    
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
    const backButton = this.add.text(30, 30, 'ホームへ', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#536878',
      padding: {
        left: 14,
        right: 14,
        top: 8,
        bottom: 8
      }
    })
      .setInteractive({ useHandCursor: true })
      .setOrigin(0, 0.5)

    backButton.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.HOME)
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
