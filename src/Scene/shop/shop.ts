import { recordShopVisit } from '../../display/PeopleJournal'
import { shopCatalog, requestShop } from './ShopApi'
import { createShopBackground } from './background'
import { createItemDetail } from './itemDetail'
import { createShopItemList, getMaxShopScroll, SHOP_LIST_BOUNDS } from './itemList'
import { enableShopScroll } from './scroll'
import { preloadShopAssets } from './assets'
import type { ShopItem } from './types'
import { PurchaseConfirm } from './PurchaseConfirm'
import { SCENE_KEYS } from '../sceneKeys';
import { BACK_BUTTON_POSITION, createTextButton } from '../../utils/ui'

//--------------------------------------------------------------

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.SHOP })
  }

  preload(): void {
    preloadShopAssets(this)
  }

  create(): void {
    const shopItems: ShopItem[] = shopCatalog.map(item=>({...item,count:0}))
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height

    createShopBackground(this, screenWidth, screenHeight)
    this.createShopkeeper()
    recordShopVisit()
    this.createHeader(screenWidth)
    this.createBackButton()

    this.createListPanel()
    const shopContainer = this.add.container(0, 0)
    const countLabels = new Map<number, Phaser.GameObjects.Text>()
    const status=this.add.text(960,30,'所持品を確認中…',{fontSize:'18px',color:'#ffffff',wordWrap:{width:300}}).setDepth(100)
    let coin = 0
    let confirmation: PurchaseConfirm | null = null
    let ready=false
    let selected: ShopItem | undefined
    const applyState=(state: Awaited<ReturnType<typeof requestShop>>) => {
      coin = state.coin
      for(const item of shopItems){item.count=state.items[String(item.id)] ?? 0;countLabels.get(item.id)?.setText(`所持数  ${item.count}`)}
      status.setText(`所持コイン：${state.coin.toLocaleString()} G`)
      if(selected) itemDetail.show(selected)
    }
    const itemDetail = createItemDetail(this, async item => {
      if (!ready) { status.setText('ログイン・所持品の読み込みを確認してください'); return }
      if (confirmation) return
      confirmation = new PurchaseConfirm(this, item, coin, async quantity => {
        const state = await requestShop('buy', item.id, quantity)
        if (this.sys.isActive()) applyState(state)
      }, () => { confirmation = null })
    })
    void requestShop().then(state=>{if(this.sys.isActive()){ready=true;applyState(state)}}).catch(error=>{if(this.sys.isActive())status.setText(error instanceof Error?error.message:'読み込みに失敗しました')})
    createShopItemList(
      this,
      shopContainer,
      shopItems,
      countLabels,
      item => { selected=item; itemDetail.show(item) }
    )
    this.applyItemListMask(shopContainer)
    const disposeScroll = enableShopScroll(this, shopContainer, getMaxShopScroll(shopItems.length))
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeScroll)

    const firstItem = shopItems[0]
    if (firstItem) { selected=firstItem; itemDetail.show(firstItem) }
  }

  private createShopkeeper(): void {
    const x = 1120
    const y = 393
    const lines = [
      'いらっしゃいませ！\n花の育成にぴったりの品をそろえています。',
      '気になる道具があれば、商品を選んでみてくださいね。',
      '今日もいい花が咲きますように。おすすめはこちらです！',
      '必要なものがあったら、いつでも声をかけてください。',
      '育て方に迷ったら、道具選びから始めてみましょう！',
    ]
    let lineIndex = Phaser.Math.Between(0, lines.length - 1)

    this.add.rectangle(x, y, 308, 566, 0x17251f, 0.28)
      .setStrokeStyle(2, 0xd8b36c, 0.75)
    this.add.image(x, y, 'shopkeeper')
      .setDisplaySize(308, 566)
      .setDepth(2)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        lineIndex = (lineIndex + 1) % lines.length
        lineText.setText(lines[lineIndex])
      })
    const lineText = this.add.text(x, 530, lines[lineIndex], {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '18px',
      fixedWidth: 270,
      fixedHeight: 100,
      maxLines: 4,
      color: '#fff8e8',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 258 },
      stroke: '#30251f',
      strokeThickness: 5,
      shadow: { color: '#201a17', blur: 4, offsetX: 1, offsetY: 2, fill: true },
    }).setOrigin(0.5).setDepth(3)
    this.add.rectangle(x, 694, 220, 34, 0x20392d, 0.9)
      .setStrokeStyle(1, 0xd8b36c, 0.9)
    this.add.text(x, 694, '花屋の店主', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '17px',
      color: '#fff4d9',
      fontStyle: 'bold',
    }).setOrigin(0.5)
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
    createTextButton(this, BACK_BUTTON_POSITION.x, BACK_BUTTON_POSITION.y, '← ホーム', () => {
      this.scene.start(SCENE_KEYS.HOME)
    }, {
      fontSize: 19,
      bgColor: '#f7efd9',
      hoverColor: '#ffffff',
      downColor: '#dfd0ad',
      padding: { left: 17, right: 17, top: 10, bottom: 10 },
    }).setDepth(1000)
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
