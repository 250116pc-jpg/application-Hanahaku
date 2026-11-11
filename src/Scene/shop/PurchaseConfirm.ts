/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
import Phaser from 'phaser'
import { playUiSe } from '../../audio/BgmManager'
import buttonImage from '../../assets/images/encyclopedia/journal-button.png'
import { getShopItemImageUrl } from './assets'
import type { ShopItem } from './types'
import './purchase-confirm.css'

export class PurchaseConfirm {
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private scene: Phaser.Scene
  private root: HTMLDivElement
  private quantity = 1
  private maxQuantity: number
  private buying = false
  private closed = false
  private inputWasEnabled: boolean
  private previousFocus: Element | null
  private onClose: () => void
  private shutdown = (): void => this.destroy()

  constructor(
    scene: Phaser.Scene,
    item: ShopItem,
    coin: number,
    onPurchase: (quantity: number) => Promise<void>,
    onClose: () => void
  ) {
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 購入可能数を計算し、確認ダイアログの土台を作る
     * ================================== */
    this.scene = scene
    this.onClose = onClose
    this.inputWasEnabled = scene.input.enabled
    this.previousFocus = document.activeElement
    this.maxQuantity = Math.max(0, Math.min(99, Math.floor(coin / item.price), 2147483647 - (item.count ?? 0)))
    scene.input.enabled = false
    this.root = document.createElement('div')
    this.root.className = 'shop-purchase-confirm'
    this.root.style.setProperty('--shop-button-image', `url("${buttonImage}")`)
    const panel = document.createElement('section')
    panel.className = 'purchase-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-modal', 'true')
    panel.setAttribute('aria-label', '購入確認')
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 購入確認の見出しと商品画像を用意する
     * ================================== */
    const title = document.createElement('h2')
    title.className = 'purchase-title'
    title.textContent = '購入確認'
    const content = document.createElement('div')
    content.className = 'purchase-content'
    const product = document.createElement('div')
    product.className = 'purchase-product'
    const image = document.createElement('img')
    image.src = getShopItemImageUrl(item.id)
    image.alt = item.name
    const name = document.createElement('strong')
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 商品名・確認文・購入数を減らすボタンを作る
     * ================================== */
    name.textContent = item.name
    product.append(image, name)
    const info = document.createElement('div')
    info.className = 'purchase-info'
    const question = document.createElement('p')
    question.className = 'purchase-question'
    question.textContent = `${item.name}を購入しますか？`
    const quantityControls = document.createElement('div')
    quantityControls.className = 'purchase-quantity'
    const minus = this.button('−', () => changeQuantity(-1))
    minus.setAttribute('aria-label', '購入数を減らす')
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 購入数と合計額・残金の表示部品を作る
     * ================================== */
    const amount = document.createElement('output')
    amount.setAttribute('aria-label', '購入数')
    amount.setAttribute('aria-live', 'polite')
    const plus = this.button('＋', () => changeQuantity(1))
    plus.setAttribute('aria-label', '購入数を増やす')
    quantityControls.append(minus, amount, plus)
    const total = document.createElement('p')
    total.className = 'purchase-total'
    total.setAttribute('aria-live', 'polite')
    const balance = document.createElement('p')
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 購入・キャンセルボタンとエラー表示を作る
     * ================================== */
    balance.className = 'purchase-balance'
    const error = document.createElement('p')
    error.className = 'purchase-error'
    error.setAttribute('role', 'status')
    const actions = document.createElement('div')
    actions.className = 'purchase-actions'
    const cancel = this.button('キャンセル', () => { if (!this.buying) { playUiSe(scene, 'cancel'); this.destroy() } })
    const buy = this.button('購入する', () => { void purchase() })
    buy.className = 'purchase-submit'
    actions.append(cancel, buy)
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 数量変更・購入処理・ダイアログの終了処理を設定する
     * ================================== */
    info.append(question, quantityControls, total, balance, error)
    content.append(product, info)
    panel.append(title, content, actions)
    this.root.append(panel)

    const update = (): void => {
      amount.value = String(this.quantity)
      total.textContent = `合計 ${(item.price * this.quantity).toLocaleString()} G`
      balance.textContent = `所持コイン：${coin.toLocaleString()} G　／　購入後：${Math.max(0, coin - item.price * this.quantity).toLocaleString()} G`
      minus.disabled = this.buying || this.quantity <= 1
      plus.disabled = this.buying || this.quantity >= this.maxQuantity
      buy.disabled = this.buying || this.maxQuantity < 1
      cancel.disabled = this.buying
      buy.textContent = this.buying ? '購入中…' : '購入する'
    }
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 購入数の変更・購入実行と購入できない理由の表示を設定する
     * ================================== */
    const changeQuantity = (difference: number): void => {
      if (this.buying || this.maxQuantity < 1) return
      playUiSe(scene, 'select')
      this.quantity = Math.max(1, Math.min(this.maxQuantity, this.quantity + difference))
      update()
    }
    const purchase = async (): Promise<void> => {
      if (this.buying || this.closed || this.maxQuantity < 1) return
      this.buying = true
      error.textContent = ''
      update()
      try {
        await onPurchase(this.quantity)
        if (!this.closed) playUiSe(scene, 'purchase')
        this.destroy()
      } catch (cause) {
        if (!this.closed) playUiSe(scene, 'error')
        if (!this.closed) error.textContent = cause instanceof Error ? cause.message : '購入できませんでした。'
      } finally {
        if (!this.closed) { this.buying = false; update() }
      }
    }
    if (this.maxQuantity < 1) {
      playUiSe(scene, 'error')
      error.textContent = coin < item.price ? 'コインが足りません。' : '所持数の上限です。'
      balance.textContent = `所持コイン：${coin.toLocaleString()} G`
    }
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 購入確認を表示し、終了時の解除とEsc・Tabキー操作を設定する
     * ================================== */
    update()
    if (this.maxQuantity < 1) balance.textContent = `所持コイン：${coin.toLocaleString()} G`
    document.body.append(this.root)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown)
    this.root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !this.buying) { event.preventDefault(); playUiSe(scene, 'cancel'); this.destroy(); return }
      if (event.key !== 'Tab') return
      const enabled = Array.from(this.root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
      const first = enabled[0]
      const last = enabled[enabled.length - 1]
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    })
    cancel.focus()
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 操作可能なボタンとクリック時の処理を作る
   * ================================== */
  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', onClick)
    return button
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 画面終了時に表示とイベントを解除する
   * ================================== */
  private destroy(): void {
    if (this.closed) return
    this.closed = true
    this.root.remove()
    this.scene.input.enabled = this.inputWasEnabled
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown)
    if (this.previousFocus instanceof HTMLElement && this.previousFocus.isConnected) this.previousFocus.focus()
    this.onClose()
  }
}
