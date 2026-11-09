// 担当：たまおちゃん｜図鑑機能・FlowerDetailView
import type { PrototypeFlower } from './contractPreview'
import buttonImage from '../../assets/images/encyclopedia/journal-button.png'
import './flower-detail.css'

const icons = import.meta.glob('../../assets/skill/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  el.className = className
  el.textContent = text
  return el
}

/** Read-only catalog pages. Contract testing never changes the real party or battle data. */
export function mountFlowerDetail(flower: PrototypeFlower, options: {
  owned: boolean; unknownUrl: string; onClose: () => void; onHome: () => void; onContract: () => void
}): () => void {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const root = node('section', 'flower-book-screen')
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-label', '図鑑詳細')
  root.style.setProperty('--catalog-button', `url("${buttonImage}")`)
  document.body.append(root)
  let owned = options.owned
  let page: 'ability' | 'botanical' = 'ability'
  const button = (text: string, action: () => void, className = 'book-button'): HTMLButtonElement => {
    const b = node('button', className, text); b.type = 'button'; b.addEventListener('click', action); return b
  }
  const picture = (url: string, label: string): HTMLElement => {
    const frame = node('div', 'book-picture')
    const img = node('img')
    img.src = url
    img.alt = label
    frame.append(img)
    return frame
  }
  const section = (parent: HTMLElement, title: string, body: string): void => {
    const box = node('section', 'book-section'); box.append(node('h3', 'book-ribbon', title), node('p', '', body)); parent.append(box)
  }
  const render = (): void => {
    root.replaceChildren()
    const book = node('article', 'flower-book')
    const header = node('header', 'book-header')
    header.append(button('‹ 図鑑に戻る', options.onClose, 'book-button book-back'), node('span', 'book-brand', '❀ 花の図鑑'))
    const nav = node('nav', 'book-tabs'); nav.setAttribute('aria-label', '詳細ページ')
    for (const [key, label] of [['ability', '能力・スキル'], ['botanical', '花の説明']] as const) {
      const tab = button(label, () => { page = key; render() }, 'book-tab')
      tab.setAttribute('aria-pressed', String(page === key)); nav.append(tab)
    }
    header.append(nav)
    const spread = node('div', 'book-spread')
    const left = node('div', 'book-page book-left')
    const right = node('div', 'book-page book-right')
    const name = owned ? flower.name : 'まだ出会っていない花'
    left.append(node('h2', 'book-flower-name', name))
    if (owned && flower.imageVariants?.length) {
      const variants = node('div', 'book-picture-variants')
      for (const variant of flower.imageVariants) {
        const item = node('div', 'book-picture-variant')
        item.append(picture(variant.url, variant.name), node('p', '', variant.name))
        variants.append(item)
      }
      left.append(variants)
    } else {
      left.append(picture(owned ? flower.url : options.unknownUrl, owned ? flower.name : '未契約の花'))
    }
    if (!owned) {
      section(left, '契約状態', '未契約')
      section(right, 'まだ閉じられたページ', '花契すると、この花の能力・スキル・花言葉を読めるようになります。')
      right.append(button('花契する（テスト）', () => { options.onContract(); owned = true; render() }))
      right.append(node('p', 'book-note', 'テストの契約状態は再読み込みでリセットされます。'))
    } else if (page === 'ability') {
      const stats = node('section', 'book-section'); stats.append(node('h3', 'book-ribbon', '主人公への初期補正'))
      const dl = node('dl', 'book-stats')
      for (const key of ['HP', 'MP', 'ATK', 'DEF', 'CD']) {
        const item = node('div')
        const bonus = flower.statusBonus?.[key.toLowerCase()]
        const value = bonus === undefined ? undefined : String(bonus)
        item.append(node('dt', '', key), node('dd', '', value ? `+${value}` : '未登録')); dl.append(item)
      }
      stats.append(dl); left.append(stats)
      section(right, '花の情報', `季節：${flower.season}　／　属性：${flower.element ?? '未登録'}\n契約状態：契約済み`)
      const skill = flower.skill
      const skills = node('section', 'book-section'); skills.append(node('h3', 'book-ribbon', 'スキル'))
      if (skill) {
        const heading = node('div', 'book-skill-heading')
        const icon = icons[`../../assets/skill/${skill.icon}.png`]
        if (icon) { const img = node('img', 'book-skill-icon'); img.src = icon; img.alt = ''; heading.append(img) }
        else { const fallback = node('span', 'book-skill-fallback', '✧'); fallback.setAttribute('aria-hidden', 'true'); heading.append(fallback) }
        heading.append(node('h3', '', skill.name)); skills.append(heading)
        skills.append(node('p', 'book-skill-meta', `消費MP：${skill.mp ?? '未登録'}　／　CT：${skill.cooldown === null ? '未登録' : `${skill.cooldown}秒`}`))
        skills.append(node('p', 'book-skill-description', skill.descriptionLevel1 || skill.description || '詳しい効果は未登録です。'))
        skills.append(node('p', 'book-note', 'Lv.1の効果・消費MP・CT。強化で変化します。'))
      } else skills.append(node('p', '', 'スキル情報は未登録です。'))
      right.append(skills)
    } else {
      const words = flower.imageVariants?.flatMap(variant => variant.hanakotoba) ?? flower.hanakotoba
      section(left, '花言葉', words.length ? words.map(w => `「${w}」`).join('　') : '花言葉は未登録です。')
      section(right, '起源', flower.origin || 'この花の起源は、まだ登録されていません。')
      section(right, '咲いている場所', flower.habitat || 'この花の生育場所は、まだ登録されていません。')
      section(right, '特徴', flower.features || 'この花の特徴は、まだ登録されていません。')
    }
    spread.append(left, right)
    const footer = node('footer', 'book-footer')
    footer.append(node('span', 'book-folio', page === 'ability' ? 'I — 能力・スキル' : 'II — 花の説明'), button('ホームへ ›', options.onHome))
    book.append(header, spread, footer); root.append(book)
    const selected = nav.querySelector<HTMLButtonElement>('[aria-pressed="true"]'); selected?.focus({ preventScroll: true })
  }
  const keyboard = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') { event.preventDefault(); options.onClose() }
    if (event.key !== 'Tab') return
    const focusable = Array.from(root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    const first = focusable[0], last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  root.addEventListener('keydown', keyboard)
  render()
  return () => { root.removeEventListener('keydown', keyboard); root.remove(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }) }
}
