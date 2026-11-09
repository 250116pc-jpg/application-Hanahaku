// 担当：たまおちゃん｜所持品機能・InventoryView
import './InventoryFantasy.css'
import Phaser from 'phaser'
import inventorySlot from '../../assets/images/inventory/slot.png'
import lockedSlot from '../../assets/images/inventory/slot_lock.png'
import { getShopItemImageUrl } from '../shop/assets'
import { getCategoryName } from './InventoryData'
import type { InventoryFilter, InventoryItem } from './InventoryData'

interface InventoryCallbacks {
  onBack: () => void
  onUse?: () => void
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
  private closing = false
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
    if (new URLSearchParams(window.location.search).get('inventory-style') !== 'classic') this.root.classList.add('inventory-fantasy-preview')
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
      .hanahaku-inventory .inventory-card img { width:64px; height:64px; padding:12px; object-fit:contain; image-rendering:pixelated; grid-row:1 / 3; background:url(${inventorySlot}) center / contain no-repeat; }
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
        .hanahaku-inventory .inventory-card img { width:48px; height:48px; padding:9px; }
        .hanahaku-inventory .inventory-detail { padding:12px; }
        .hanahaku-inventory h2 { font-size:18px; }
      }
      @media(max-width:560px) {
        .hanahaku-inventory .inventory-grid { grid-template-columns:1fr; }
        .hanahaku-inventory button { padding:8px; }
      }
      .hanahaku-inventory { color:#f3e7ca; }
      .hanahaku-inventory .inventory-panel { border:2px solid #b59861; border-radius:8px; background:linear-gradient(145deg,#1c3143,#0b1726); box-shadow:inset 0 0 0 3px #334656,0 14px 35px #0009; }
      .hanahaku-inventory header { border-bottom:1px solid #ab8e59; padding-bottom:8px; }
      .hanahaku-inventory h1 { color:#f6e4b9; letter-spacing:.1em; }
      .hanahaku-inventory button { background:#132638; border-color:#a78d5f; color:#f3e7ca; }
      .hanahaku-inventory button[aria-pressed=true] { background:#435775; border-color:#ebc873; color:#fff8db; }
      .hanahaku-inventory .inventory-grid { grid-template-columns:repeat(5,minmax(44px,1fr)); align-content:start; gap:3px; background:#091420; border:1px solid #a78d5f; padding:6px; }
      .hanahaku-inventory .inventory-card { position:relative; display:flex; align-items:center; justify-content:center; width:100%; aspect-ratio:1; min-height:44px; padding:15%; border:0; border-radius:0; background:transparent url(${inventorySlot}) center / contain no-repeat; }
      .hanahaku-inventory .inventory-locked-slot { aspect-ratio:1; min-width:0; background:transparent url(${lockedSlot}) center / contain no-repeat; opacity:.48; filter:saturate(.45); }
      .hanahaku-inventory .inventory-card[aria-pressed=true] { background:transparent url(${inventorySlot}) center / contain no-repeat; color:#fff; outline:2px solid #f2d383; outline-offset:-4px; filter:brightness(1.2); }
      .hanahaku-inventory .inventory-card img { width:100%; height:100%; padding:0; background:none; object-fit:contain; }
      .hanahaku-inventory .inventory-card span:not(.inventory-count) { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
      .hanahaku-inventory .inventory-count { position:absolute; right:15%; bottom:12%; color:#fff; font-size:clamp(10px,1.5vw,15px); white-space:nowrap; text-shadow:0 1px 3px #000,0 0 4px #000; }
      .hanahaku-inventory .inventory-detail { background:#101f30; border:1px solid #a78d5f; border-radius:2px; color:#f3e7ca; }
      .hanahaku-inventory .inventory-detail h2 { color:#f8ddb0; border-bottom:1px solid #806f50; padding-bottom:10px; }
      .hanahaku-inventory .inventory-detail-image { display:block; width:min(112px, 45%); aspect-ratio:1; object-fit:contain; image-rendering:pixelated; margin:12px auto; }
      .hanahaku-inventory .inventory-grid, .hanahaku-inventory .inventory-detail { scrollbar-width:thin; scrollbar-color:#b99a65 #0a1826; }
      .hanahaku-inventory .inventory-grid::-webkit-scrollbar, .hanahaku-inventory .inventory-detail::-webkit-scrollbar { width:10px; height:10px; }
      .hanahaku-inventory .inventory-grid::-webkit-scrollbar-track, .hanahaku-inventory .inventory-detail::-webkit-scrollbar-track { background:#0a1826; border-radius:6px; }
      .hanahaku-inventory .inventory-grid::-webkit-scrollbar-thumb, .hanahaku-inventory .inventory-detail::-webkit-scrollbar-thumb { background:#b99a65; border:2px solid #0a1826; border-radius:6px; }
      .hanahaku-inventory .inventory-grid::-webkit-scrollbar-thumb:hover, .hanahaku-inventory .inventory-detail::-webkit-scrollbar-thumb:hover { background:#e0c28b; }
      .hanahaku-inventory .inventory-card[aria-pressed=true] { animation:inventory-select 100ms ease-out; }
      @keyframes inventory-select { from { filter:brightness(1); } to { filter:brightness(1.2); } }
      @media (prefers-reduced-motion: reduce) { .hanahaku-inventory .inventory-card[aria-pressed=true] { animation:none; } }
      .hanahaku-inventory .inventory-message { color:#ffc5bd; }
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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof this.root.animate === 'function') {
      this.root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' })
      panel.animate([{ transform: 'translateY(-28px)' }, { transform: 'translateY(0)' }], { duration: 150, easing: 'ease-out' })
    }
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

  close(onClosed: () => void): void {
    if (this.closing) return
    this.closing = true
    this.root.style.pointerEvents = 'none'
    let finished = false
    const finish = (): void => {
      if (finished) return
      finished = true
      if (this.root.isConnected) onClosed()
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof this.root.animate !== 'function') {
      finish()
      return
    }
    this.root.querySelector<HTMLElement>('.inventory-panel')?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)' }], { duration: 150, easing: 'ease-in', fill: 'forwards' })
    const animation = this.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in', fill: 'forwards' })
    animation.finished.then(finish, finish)
    window.setTimeout(finish, 250)
  }
  renderItems(items: InventoryItem[], selectedItemId: number | null): void {
    this.grid.replaceChildren()
    this.pager.replaceChildren()
    const filterKey = items.map(item => item.id).join(',')
    if (filterKey !== this.itemFilterKey) { this.itemPage = 0; this.itemFilterKey = filterKey }
    const pageCount = Math.max(1, Math.ceil(items.length / 15))
    this.itemPage = Math.min(this.itemPage, pageCount - 1)
    items.slice(this.itemPage * 15, this.itemPage * 15 + 15).forEach(item => {
      if (item.count <= 0) {
        const locked = document.createElement('div')
        locked.className = 'inventory-locked-slot'
        locked.setAttribute('role', 'img')
        locked.setAttribute('aria-label', '未所持のアイテム')
        this.grid.append(locked)
        return
      }
      const card = this.button('', () => this.callbacks.onItem(item))
      card.className = 'inventory-card'
      card.setAttribute('aria-pressed', String(item.id === selectedItemId))
      const image = document.createElement('img')
      image.src = getShopItemImageUrl(item.id)
      if (item.id === 13) image.style.transform = 'scale(1.35)'
      image.alt = ''
      card.append(image)
      const name = document.createElement('span')
      name.textContent = item.name
      const count = document.createElement('span')
      count.className = 'inventory-count'
      count.textContent = `×${item.count}`
      card.append(name, count)
      this.grid.append(card)
    })
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
    const preview = document.createElement('img')
    preview.className = 'inventory-detail-image'
    preview.src = getShopItemImageUrl(item.id)
    if (item.id === 13) preview.style.transform = 'scale(1.35)'
    preview.alt = ''
    this.detail.append(preview)
    const lines = [`種類：${getCategoryName(item.category)}`, `所持数：${item.count}`, `用途：${item.effect}`]
    lines.forEach(text => {
      const paragraph = document.createElement('p')
      paragraph.textContent = text
      this.detail.append(paragraph)
    })
  }

  showRecoveryUse(disabled: boolean): void {
    const use = this.button('使用する', () => this.callbacks.onUse?.())
    use.disabled = disabled
    this.detail.append(use)
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
