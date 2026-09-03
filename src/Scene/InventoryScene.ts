import Phaser from 'phaser'

import { createMockItems } from './inventory/InventoryData'
import type { InventoryFilter, InventoryItem } from './inventory/InventoryData'
import { InventoryView } from './inventory/InventoryView'

export class InventoryScene extends Phaser.Scene {
  private returnScene = 'TestScene'
  private selectedCategory: InventoryFilter = 'all'
  private selectedItem: InventoryItem | null = null
  private items: InventoryItem[] = []
  private view!: InventoryView

  constructor() {
    super('InventoryScene')
  }

  init(data: { returnScene?: string }): void {
    this.returnScene = data?.returnScene ?? 'TestScene'
  }

  create(): void {
    this.items = createMockItems()
    this.selectedCategory = 'all'
    this.selectedItem = null

    this.view = new InventoryView(this, {
      onBack: () => this.closeInventory(),
      onCategory: category => this.selectCategory(category),
      onItem: item => this.selectItem(item),
      onUse: () => this.useSelectedItem()
    })
    this.view.create()
    this.refresh()
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

  private useSelectedItem(): void {
    const item = this.selectedItem
    if (!item) return

    if (!item.usable) {
      this.view.showMessage('このアイテムは使用できません')
      return
    }
    if (item.count <= 0) {
      this.view.showMessage('所持していません')
      return
    }

    item.count--
    this.view.showMessage(`${item.name}を使用しました`)
    this.refresh()
  }
}
