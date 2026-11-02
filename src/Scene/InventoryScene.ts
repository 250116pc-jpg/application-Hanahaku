import Phaser from 'phaser'

import { shopCatalog, requestShop } from './shop/ShopApi'
import { preloadShopAssets } from './shop/assets'
import type { InventoryFilter, InventoryItem } from './inventory/InventoryData'
import { InventoryView } from './inventory/InventoryView'

//debug機能
import { showDebugSceneName } from '../debug';
import { SCENE_KEYS } from './sceneKeys';

//--------------------------------------------------------------

export class InventoryScene extends Phaser.Scene {
  private returnScene: string = SCENE_KEYS.TEST
  private selectedCategory: InventoryFilter = 'all'
  private selectedItem: InventoryItem | null = null
  private items: InventoryItem[] = []
  private view!: InventoryView

  constructor() {
    super(SCENE_KEYS.INVENTORY)
  }

  init(data: { returnScene?: string }): void {
    this.returnScene = data?.returnScene ?? SCENE_KEYS.TEST
  }

  preload(): void { preloadShopAssets(this) }

  create(): void {
    showDebugSceneName(this);
    // An overlay must not outlive the scene that opened it (retreat, results, etc.).
    const owner = this.scene.manager.keys[this.returnScene]
    const stopWithOwner = (): void => { this.scene.stop() }
    owner?.events.once(Phaser.Scenes.Events.SHUTDOWN, stopWithOwner)
    let active = true
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      active = false
      owner?.events.off(Phaser.Scenes.Events.SHUTDOWN, stopWithOwner)
    })
    this.items = []
    this.selectedCategory = 'all'
    this.selectedItem = null

    this.view = new InventoryView(this, {
      onBack: () => this.closeInventory(),
      onCategory: category => this.selectCategory(category),
      onItem: item => this.selectItem(item)
    })
    this.view.create()
    this.refresh()
    void requestShop().then(state=>{
      if(!active || !this.sys.isActive())return
      this.items=Object.entries(state.items).filter(([,count])=>count>0).map(([id,count])=>{
        const product=shopCatalog.find(item=>item.id===Number(id))
        return {id:Number(id),name:product?.name ?? `アイテム ${id}`,category:product?.category ?? 'important',effect:product?.description ?? '詳細未登録',count,usable:false}
      })
      this.refresh()
      if(!this.items.length)this.view.showMessage('所持アイテムはありません')
    }).catch(error=>{if(active && this.sys.isActive())this.view.showMessage(error instanceof Error?error.message:'読み込みに失敗しました')})
  }

  private closeInventory(): void {
    if (this.scene.manager.keys[this.returnScene]) {
      this.scene.resume(this.returnScene)
    }
    this.scene.stop()
  }

  private selectCategory(category: InventoryFilter): void {
    this.selectedCategory = category
    this.selectedItem = null
    this.refresh()
  }

  private selectItem(item: InventoryItem): void {
    this.selectedItem = item
    this.refresh()
  }

  private refresh(): void {
    const visibleItems = this.selectedCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.selectedCategory)

    this.view.renderItems(visibleItems, this.selectedItem?.id ?? null)
    this.view.renderDetail(this.selectedItem)
  }

}
