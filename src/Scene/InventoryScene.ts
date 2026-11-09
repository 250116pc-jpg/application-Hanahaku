/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜所持品画面
import Phaser from 'phaser'
import { playUiSe } from '../audio/BgmManager'
import type { StageScene } from './stage/StageScene'

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
  private usingItem = false

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
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 呼び出し元シーンの終了に連動して所持品画面を停止し、非同期読込後の無効な画面更新を防ぐ。
     * ================================== */
    const owner = this.scene.manager.keys[this.returnScene]
    const stopWithOwner = (): void => { this.scene.stop() }
    owner?.events.once(Phaser.Scenes.Events.SHUTDOWN, stopWithOwner)
    let active = true
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      active = false
      owner?.events.off(Phaser.Scenes.Events.SHUTDOWN, stopWithOwner)
    })
    this.usingItem = false
    this.items = []
    this.selectedCategory = 'all'
    this.selectedItem = null

    this.view = new InventoryView(this, {
      onBack: () => this.closeInventory(),
      onUse: () => { void this.useRecoveryPotion() },
      onCategory: category => this.selectCategory(category),
      onItem: item => this.selectItem(item)
    })
    this.view.create()
    playUiSe(this, 'open')
    this.refresh()
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : サーバーの所持数を商品一覧と結合し、未知の商品IDも表示用データへ変換してID順に並べる。
     * ================================== */
    void requestShop().then(state=>{
      if(!active || !this.sys.isActive())return
      const catalogItems: InventoryItem[] = shopCatalog.map(product => ({
        id: product.id, name: product.name, category: product.category,
        effect: product.inventoryDescription ?? product.description ?? '詳細未登録', count: state.items[String(product.id)] ?? 0, usable: false
      }))
      const knownIds = new Set(catalogItems.map(item => item.id))
      const otherItems: InventoryItem[] = Object.entries(state.items)
        .filter(([id, count]) => count > 0 && !knownIds.has(Number(id)))
        .map(([id, count]) => ({ id: Number(id), name: `アイテム ${id}`, category: 'important', effect: '詳細未登録', count, usable: false }))
      this.items = [...catalogItems, ...otherItems].sort((a, b) => a.id - b.id)
      this.refresh()
    }).catch(error=>{if(active && this.sys.isActive())this.view.showMessage(error instanceof Error?error.message:'読み込みに失敗しました')})
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 使用可否を確認し、消費API成功後に所持数と戦闘アイテム効果を更新する。処理中の連打と失敗時の表示も管理する（宝石対応は共同編集）。
   * ================================== */
  private async useRecoveryPotion(): Promise<void> {
    if (this.usingItem || !this.selectedItem || ![13,14,15].includes(this.selectedItem.id) || this.returnScene !== SCENE_KEYS.STAGE) return
    const stage = this.scene.manager.keys[this.returnScene] as StageScene
    const player = stage.getRecoveryPlayer()
    const itemId = this.selectedItem.id
    const unavailable = player.itemUnavailable(itemId)
    if (unavailable) { playUiSe(this, 'error'); this.view.showMessage(unavailable); return }
    this.usingItem = true
    this.refresh()
    try {
      const state = await requestShop('consume', itemId)
      if (!this.sys.isActive() || !player.active) return
      const item = this.items.find(entry => entry.id === itemId)
      if (item) item.count = state.items[String(itemId)] ?? 0
      player.startBattleItem(itemId)
      playUiSe(this, 'recover')
      this.view.showMessage(itemId === 13 ? '10秒かけて最大HPの15%を回復します。' : '宝石を使用しました。戦闘に戻ると30秒間効果が続きます。')
    } catch (error) {
      if (this.sys.isActive()) { playUiSe(this, 'error'); this.view.showMessage(error instanceof Error ? error.message : '使用できませんでした。') }
    } finally {
      this.usingItem = false
      if (this.sys.isActive()) this.refresh()
    }
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 使用通信中の終了を防ぎ、閉じる演出の後に元のシーンを再開して所持品画面を停止する。
   * ================================== */
  private closeInventory(): void {
    if (this.usingItem) return
    playUiSe(this, 'cancel')
    this.view.close(() => {
      if (!this.sys.isActive()) return
      if (this.scene.manager.keys[this.returnScene]) {
        this.scene.resume(this.returnScene)
      }
      this.scene.stop()
    })
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 選択カテゴリを変更し、アイテム選択を解除して一覧を再描画する。
   * ================================== */
  private selectCategory(category: InventoryFilter): void {
    playUiSe(this, 'select')
    this.selectedCategory = category
    this.selectedItem = null
    this.refresh()
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 選択したアイテムを保持し、選択音と詳細表示を更新する。
   * ================================== */
  private selectItem(item: InventoryItem): void {
    playUiSe(this, 'select')
    this.selectedItem = item
    this.refresh()
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : カテゴリで一覧を絞り込み、所持数・戦闘状態に合わせて使用可否と詳細を更新する。
   * ================================== */
  private refresh(): void {
    const visibleItems = this.selectedCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.selectedCategory)

    this.view.renderItems(visibleItems, this.selectedItem?.id ?? null)
    this.view.renderDetail(this.selectedItem)
    if (this.selectedItem && [13,14,15].includes(this.selectedItem.id) && this.returnScene === SCENE_KEYS.STAGE) {
      const stage = this.scene.manager.keys[this.returnScene] as StageScene
      const reason = stage.getRecoveryPlayer().itemUnavailable(this.selectedItem.id)
      this.view.showRecoveryUse(this.usingItem || this.selectedItem.count < 1 || !!reason)
      if (reason) this.view.showMessage(reason)
    }
  }

}
