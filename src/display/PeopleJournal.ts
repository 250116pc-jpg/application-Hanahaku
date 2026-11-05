import shopkeeper from '../assets/characters/1003/1003_3.png'
import './PeopleJournal.css'

function visitKey(): string {
  const user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null')
  return 'hanahaku:people:shop:' + (user?.id ?? user?.email ?? 'guest')
}

export function recordShopVisit(): void {
  try { localStorage.setItem(visitKey(), '1') } catch { /* Storage can be unavailable. */ }
}

export function openPeopleJournal(parent: HTMLElement): void {
  let metShopkeeper = false
  try { metShopkeeper = localStorage.getItem(visitKey()) === '1' } catch { /* Guest preview. */ }
  const dialog = document.createElement('dialog')
  dialog.className = 'people-journal'
  dialog.setAttribute('aria-label', '人物図鑑')
  dialog.innerHTML = '<section><h2>人物図鑑</h2><nav aria-label="人物一覧"></nav></section><article aria-live="polite"></article><footer><button type="button">花の図鑑へ</button></footer>'
  const sheet = document.createElement('div')
  sheet.className = 'people-journal-sheet'
  sheet.append(...Array.from(dialog.children))
  dialog.append(sheet)
  const list = dialog.querySelector('nav')!
  const detail = dialog.querySelector('article')!
  const people = [
    { name: '主人公', role: '戦士', note: '花と契約して戦う、この物語の主人公。', known: true },
    { name: 'リューン', role: '花屋の店主', note: 'ショップで旅に使う道具を扱っている。', known: metShopkeeper },
    { known: false }, { known: false }
  ]
  for (const person of people) {
    const entry = document.createElement('button')
    entry.type = 'button'
    entry.disabled = !person.known
    entry.textContent = person.known ? person.name! : '？　未記録'
    list.append(entry)
    entry.onclick = () => {
      for (const other of list.children) other.setAttribute('aria-pressed', String(other === entry))
      const name = document.createElement('h3')
      name.textContent = person.name!
      const role = document.createElement('strong')
      role.textContent = person.role!
      const note = document.createElement('p')
      note.textContent = person.note!
      detail.replaceChildren(name, role, note)
      if (person.name === 'リューン') {
        const portrait = new Image()
        portrait.src = shopkeeper
        portrait.alt = 'リューン'
        detail.append(portrait)
      }
    }
  }
  // Sample the same hinge positions in reverse when the journal closes.
  const angles = [0, 24, 47, 69, 88, 110, 134, 158, 180]
  let timer: ReturnType<typeof setTimeout> | undefined
  let frame = 0
  let closing = false
  function fold(direction: 1 | -1): void {
    clearTimeout(timer)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      delete dialog.dataset.folding
      if (direction < 0) dialog.close()
      return
    }
    const angle = angles[frame]!
    const projection = Math.cos(angle * Math.PI / 180)
    const edge = 50 + 50 * projection
    dialog.dataset.folding = ''
    dialog.style.setProperty('--fold-clip', Math.min(50, edge) + '%')
    dialog.style.setProperty('--ink-clip', edge + '%')
    dialog.style.setProperty('--leaf-edge', Math.min(50, edge) + '%')
    dialog.style.setProperty('--leaf-height', Math.abs(50 * projection) + '%')
    dialog.style.setProperty('--leaf-shade', String(.22 * Math.sin(angle * Math.PI / 180)))
    dialog.style.setProperty('--back-projection', String(Math.max(0, projection)))
    dialog.style.setProperty('--back-light', String(1 - .12 * Math.sin(angle * Math.PI / 180)))
    dialog.dataset.cover = String(angle < 90)
    if (direction > 0 && frame === angles.length - 1) {
      delete dialog.dataset.folding
      return
    }
    timer = setTimeout(() => {
      if (!dialog.isConnected) return
      if (direction < 0 && frame === 0) { dialog.close(); return }
      frame += direction
      fold(direction)
    }, 43)
  }
  function closeJournal(): void {
    if (closing) return
    closing = true
    fold(-1)
  }
  dialog.querySelector('footer button')!.addEventListener('click', closeJournal)
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeJournal() })
  dialog.addEventListener('keydown', event => event.stopPropagation())
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  parent.append(dialog)
  list.querySelector('button')!.click()
  fold(1)
  dialog.showModal()
}
