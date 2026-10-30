import Phaser from 'phaser'
import { getShopItemImageUrl } from '../shop/assets'
import { getCategoryName } from './InventoryData'
import type { InventoryFilter, InventoryItem } from './InventoryData'

interface InventoryCallbacks {
  onBack: () => void
  onCategory: (category: InventoryFilter) => void
  onItem: (item: InventoryItem) => void
}

export class InventoryView {
  private root!: HTMLDivElement
  private grid!: HTMLDivElement
  private pager!: HTMLElement
  private detail!: HTMLElement
  private message!: HTMLParagraphElement
  private categoryButtons = new Map<InventoryFilter, HTMLButtonElement>()
  private itemPage = 0
  private itemFilterKey = ''
  private scene: Phaser.Scene
  private callbacks: InventoryCallbacks

  constructor(scene: Phaser.Scene, callbacks: InventoryCallbacks) {
    this.scene = scene
    this.callbacks = callbacks
  }

  create(): void {
    this.root = document.createElement('div')
    this.root.className = 'hanahaku-inventory'
    const style = document.createElement('style')
    style.textContent = `
      .hanahaku-inventory { position:fixed; inset:0; z-index:1000; box-sizing:border-box;
        display:flex; align-items:center; justify-content:center;
        padding:max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
        background:#0009; color:#233b4c; font:16px/1.5 sans-serif; }
      .hanahaku-inventory * { box-sizing:border-box; }
      .hanahaku-inventory .inventory-panel { width:min(100%, 1120px); height:min(100%, 640px);
        min-height:0; display:flex; flex-direction:column; padding:20px;
        border:2px solid #536878; border-radius:16px; background:#cfe3f5; }
      .hanahaku-inventory header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-shrink:0; }
      .hanahaku-inventory h1 { font-size:clamp(20px, 3vw, 28px); margin:0; }
      .hanahaku-inventory button { font:inherit; color:inherit; cursor:pointer; min-height:44px;
        border:1px solid #698394; border-radius:8px; padding:8px 12px; background:#fff; touch-action:manipulation; }
      .hanahaku-inventory button:focus-visible { outline:3px solid #23669b; outline-offset:2px; }
      .hanahaku-inventory button:disabled { opacity:.45; cursor:default; }
      .hanahaku-inventory button[aria-pressed=true] { background:#255e84; color:#fff; border-color:#255e84; }
      .hanahaku-inventory .inventory-note { margin:10px 0 0; flex-shrink:0; }
      .hanahaku-inventory nav { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; margin:12px 0; flex-shrink:0; }
      .hanahaku-inventory .inventory-content { display:grid; grid-template-columns:minmax(0, 1.6fr) minmax(0, 1fr);
        flex:1; min-height:0; gap:16px; }
      .hanahaku-inventory .inventory-list { display:flex; flex-direction:column; min-width:0; min-height:0; }
      .hanahaku-inventory .inventory-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr));
        align-content:start; gap:12px; flex:1; min-height:0; padding:3px; overflow:auto; overscroll-behavior:contain; }
      .hanahaku-inventory .inventory-card { display:grid; grid-template-columns:64px minmax(0, 1fr);
        grid-template-rows:auto auto; align-items:center; column-gap:10px; row-gap:2px;
        min-width:0; min-height:108px; padding:12px; text-align:left; overflow-wrap:anywhere; }
      .hanahaku-inventory .inventory-card[aria-pressed=true] { background:#e9f5ff; color:#233b4c; outline:2px solid #255e84; }
      .hanahaku-inventory .inventory-card img { width:64px; height:64px; object-fit:contain; image-rendering:pixelated; grid-row:1 / 3; }
      .hanahaku-inventory .inventory-card span { grid-column:2; }
      .hanahaku-inventory .inventory-count { font-weight:bold; }
      .hanahaku-inventory .inventory-pager { display:flex; justify-content:center; align-items:center; gap:16px; padding-top:8px; flex-shrink:0; }
      .hanahaku-inventory .inventory-pager:empty { display:none; }
      .hanahaku-inventory .inventory-detail { min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain;
        background:#fff; border:1px solid #698394; border-radius:10px; padding:16px; overflow-wrap:anywhere; }
      .hanahaku-inventory h2 { font-size:20px; margin:0 0 12px; }
      .hanahaku-inventory .inventory-detail p { margin:10px 0; white-space:pre-wrap; }
      .hanahaku-inventory .inventory-message { margin:8px 0 0; color:#8c2828; white-space:pre-wrap; flex-shrink:0; }
      .hanahaku-inventory .inventory-message:empty { display:none; }
      .hanahaku-inventory .inventory-empty { grid-column:1/-1; text-align:center; }
      @media(max-height:480px) {
        .hanahaku-inventory .inventory-panel { padding:10px; }
        .hanahaku-inventory .inventory-note { display:none; }
        .hanahaku-inventory nav { margin:8px 0; }
        .hanahaku-inventory .inventory-content { gap:10px; }
        .hanahaku-inventory .inventory-grid { gap:8px; }
        .hanahaku-inventory .inventory-card { grid-template-columns:48px minmax(0, 1fr); min-height:80px; padding:8px; column-gap:8px; font-size:14px; }
        .hanahaku-inventory .inventory-card img { width:48px; height:48px; }
        .hanahaku-inventory .inventory-detail { padding:12px; }
        .hanahaku-inventory h2 { font-size:18px; }
      }
      @media(max-width:560px) {
        .hanahaku-inventory .inventory-grid { grid-template-columns:1fr; }
        .hanahaku-inventory button { padding:8px; }
      }
    `
    const panel = document.createElement('section')
    panel.className = 'inventory-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-modal', 'true')
    panel.setAttribute('aria-label', 'インベントリ')
    const previousFocus = document.activeElement
    const header = document.createElement('header')
    const back = this.button('← 戻る', this.callbacks.onBack)
    const title = document.createElement('h1')
    title.textContent = 'インベントリ'
    header.append(back, title)
    const note = document.createElement('p')
    note.className = 'inventory-note'
    note.textContent = '所持品と個数を確認できます。アイテムを選ぶと用途を表示します。'
    const categories = document.createElement('nav')
    categories.setAttribute('aria-label', 'アイテムの分類')
    const filters: Array<[InventoryFilter, string]> = [['all', 'すべて'], ['heal', '回復'], ['material', '強化素材'], ['important', '重要']]
    filters.forEach(([key, label]) => {
      const button = this.button(label, () => {
        this.categoryButtons.forEach((entry, category) => entry.setAttribute('aria-pressed', String(category === key)))
        this.callbacks.onCategory(key)
      })
      button.setAttribute('aria-pressed', String(key === 'all'))
      this.categoryButtons.set(key, button)
      categories.append(button)
    })
    this.grid = document.createElement('div')
    this.grid.className = 'inventory-grid'
    this.pager = document.createElement('div')
    this.pager.className = 'inventory-pager'
    this.pager.setAttribute('aria-label', '所持品のページ送り')
    this.detail = document.createElement('section')
    this.detail.className = 'inventory-detail'
    this.detail.setAttribute('aria-live', 'polite')
    this.message = document.createElement('p')
    this.message.className = 'inventory-message'
    this.message.setAttribute('role', 'status')
    const list = document.createElement('div')
    list.className = 'inventory-list'
    list.append(this.grid, this.pager)
    const content = document.createElement('div')
    content.className = 'inventory-content'
    content.append(list, this.detail)
    panel.append(header, note, categories, content, this.message)
    this.root.append(style, panel)
    document.body.append(this.root)
    // Keep keyboard focus inside the overlay while the underlying game is paused.
    this.root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); this.callbacks.onBack(); return }
      if (event.key !== 'Tab') return
      const buttons = Array.from(this.root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    })
    back.focus()
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.root.remove()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    })
  }

  renderItems(items: InventoryItem[], selectedItemId: number | null): void {
    this.grid.replaceChildren()
    this.pager.replaceChildren()
    const filterKey = items.map(item => item.id).join(',')
    if (filterKey !== this.itemFilterKey) { this.itemPage = 0; this.itemFilterKey = filterKey }
    const pageCount = Math.max(1, Math.ceil(items.length / 4))
    this.itemPage = Math.min(this.itemPage, pageCount - 1)
    items.slice(this.itemPage * 4, this.itemPage * 4 + 4).forEach(item => {
      const card = this.button('', () => this.callbacks.onItem(item))
      card.className = 'inventory-card'
      card.setAttribute('aria-pressed', String(item.id === selectedItemId))
      const image = document.createElement('img')
      image.src = getShopItemImageUrl(item.id)
      image.alt = ''
      card.append(image)
      const name = document.createElement('span')
      name.textContent = item.name
      const count = document.createElement('span')
      count.className = 'inventory-count'
      count.textContent = `所持数：${item.count}`
      card.append(name, count)
      this.grid.append(card)
    })
    if (!items.length) {
      const empty = document.createElement('p')
      empty.className = 'inventory-empty'
      empty.textContent = 'このカテゴリーのアイテムはありません'
      this.grid.append(empty)
    }
    if (pageCount > 1) {
      const previous = this.button('← 前', () => { this.itemPage--; this.renderItems(items, selectedItemId) })
      previous.disabled = this.itemPage === 0
      const label = document.createElement('span')
      label.textContent = `${this.itemPage + 1} / ${pageCount}`
      const next = this.button('次 →', () => { this.itemPage++; this.renderItems(items, selectedItemId) })
      next.disabled = this.itemPage === pageCount - 1
      this.pager.append(previous, label, next)
    }
  }

  renderDetail(item: InventoryItem | null): void {
    this.detail.replaceChildren()
    const heading = document.createElement('h2')
    heading.textContent = item?.name ?? 'アイテムを選択してください'
    this.detail.append(heading)
    if (!item) return
    const lines = [`種類：${getCategoryName(item.category)}`, `所持数：${item.count}`, `用途：${item.effect}`]
    lines.forEach(text => {
      const paragraph = document.createElement('p')
      paragraph.textContent = text
      this.detail.append(paragraph)
    })
  }

  showMessage(message: string): void {
    this.message.textContent = message
    // Keep load failures visible until the inventory is closed.
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', onClick)
    return button
  }
}
