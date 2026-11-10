/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜編成機能・form
import Phaser from 'phaser'
import testData, { type CharacterData } from '../Scene/test_data'
import { FormationManager } from './FormationManager'
import { loadFormation, saveFormation } from './formationStorage'
import { parseOwnedProgress, visibleFormationFlowers, type OwnedFormationFlower, type FormationSort } from './FormationData'
import { SCENE_KEYS } from '../Scene/sceneKeys'
import { getPhpBaseUrl } from '../auth/PhpBaseUrl'
import { flowerStats, MAX_FLOWER_LEVEL } from '../Scene/training/trainingRules'
import { applySmoothDisplay, smoothText, BACK_BUTTON_POSITION } from '../utils/ui'
import background from '../assets/ui/training_background.png'
import parchment from '../assets/ui/settings_panel.png'
import flowerCardArtwork from '../assets/ui/formation_flower_card.png'
import wood from '../assets/ui/training_button_wood.png'
import amber from '../assets/ui/training_tab_wood_selected.png'
import square from '../assets/ui/training_button_wood_square.png'
import ornament from '../assets/ui/training_title_ornament.png'

const textures = import.meta.glob('../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const FONT = '"Yu Mincho", "Meiryo", serif'
const INK = '#17243d'
const ROSTER_TOOLBAR_OFFSET_Y = 8
const ELEMENT_COLORS: Record<string, number> = { 熱: 0xd9513e, 無: 0x8660bb, 水: 0x368fca, 風: 0x499b62, 光: 0xb38c25, 土: 0x986637 }

export class FormScene extends Phaser.Scene {
  private manager = new FormationManager([], [])
  private flowers: OwnedFormationFlower[] = []
  private selectedId: number | null = null
  private slot = 0
  private filter = 'すべて'
  private sort: FormationSort = '戦力'
  private descending = true
  private partyOnly = false
  private rosterScroll = 0
  private rosterBody?: Phaser.GameObjects.Container
  private rosterMask?: Phaser.Display.Masks.GeometryMask
  private rosterClip?: Phaser.GameObjects.Graphics
  private scrollThumb?: Phaser.GameObjects.Rectangle
  private maxRosterScroll = 0
  private dragStart?: { y: number; scroll: number }
  private dragDistance = 0
  private saved: Array<number | null> = [null, null, null, null]
  private layout!: Phaser.GameObjects.Container
  private content!: Phaser.GameObjects.Container
  private overlay?: Phaser.GameObjects.Container
  private returnToStage = false
  private preserveDraft = false
  private menu: 'filter' | 'sort' | null = null
  private confirmation?: { message: string; action: () => void }
  private status = ''
  private loading = true
  private loadError = ''
  private request = 0

  constructor() { super(SCENE_KEYS.FORM) }
  preload(): void {
    this.load.image('form-garden', background)
    this.load.image('form-card-artwork', parchment)
    this.load.image('form-flower-card-artwork', flowerCardArtwork)
    this.load.image('form-wood', wood)
    this.load.image('form-amber', amber)
    this.load.image('form-square', square)
    this.load.image('form-ornament', ornament)
    for (const [p, url] of Object.entries(textures)) this.load.image(`form-${p.split('/').pop()!.replace(/\.png$/i, '')}`, url)
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 入場経路と詳細からの編成復帰を保持し、古い入場データを消す。
   * ================================== */
  init(data: { resumeFormation?: boolean; returnToStage?: boolean } = {}): void {
    if (!data.resumeFormation) this.returnToStage = data.returnToStage === true
    this.preserveDraft = this.preserveDraft && data.resumeFormation === true
    this.sys.settings.data = {}
  }
  create(): void {
    const frames: Array<[string, number, number, number, number]> = [
      ['form-wood', 25, 122, 2122, 459], ['form-amber', 9, 102, 2154, 492],
      ['form-square', 74, 81, 1106, 1098], ['form-ornament', 0, 260, 2172, 200],
    ]
    frames.forEach(([key, x, y, w, h]) => { const texture = this.textures.get(key); if (!texture.has('ui')) texture.add('ui', 0, x, y, w, h) })
    if (!this.textures.exists('form-settings-panel-ui')) {
      const texture = this.textures.createCanvas('form-settings-panel-ui', 384, 256)
      if (texture) {
        texture.context.drawImage(this.textures.get('form-card-artwork').getSourceImage() as HTMLImageElement, 17, 51, 1739, 785, 0, 0, 384, 256)
        texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
      }
    }
    // 花1体ずつのカードは、大きな設定パネルとは別の素材を使用する。
    if (!this.textures.exists('form-flower-card-ui')) {
      const texture = this.textures.createCanvas('form-flower-card-ui', 384, 256)
      if (texture) {
        texture.context.drawImage(this.textures.get('form-flower-card-artwork').getSourceImage() as HTMLImageElement, 0, 0, 384, 256)
        texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
      }
    }
    const draft = this.preserveDraft ? this.manager.getFormation() : undefined
    if (!this.preserveDraft) { this.slot = 0; this.rosterScroll = 0; this.filter = 'すべて'; this.partyOnly = false; this.selectedId = null }
    this.preserveDraft = false; this.menu = null; this.confirmation = undefined
    this.manager = new FormationManager([], [])
    this.loading = true; this.loadError = ''; this.flowers = []; this.status = '契約済みの花を読み込んでいます…'
    this.cameras.main.setScroll(0, 0).setRoundPixels(false)
    const scale = Math.min(this.scale.width / 1280, this.scale.height / 720)
    this.layout = this.add.container((this.scale.width - 1280 * scale) / 2, (this.scale.height - 720 * scale) / 2).setScale(scale)
    this.layout.add(this.add.image(640, 360, 'form-garden').setDisplaySize(1280, 720))
    this.layout.add(this.add.rectangle(640, 360, 1280, 720, 0x20120a, .14))
    this.content = this.add.container(0, 0); this.layout.add(this.content)
    this.overlay = undefined
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.request++; this.overlay?.destroy(); this.overlay = undefined })
    const wheel = (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (this.rosterContains(pointer)) this.scrollRoster(this.rosterScroll + dy * .5)
    }
    const down = (pointer: Phaser.Input.Pointer) => {
      this.dragDistance = 0
      if (this.rosterContains(pointer)) this.dragStart = { y: pointer.y, scroll: this.rosterScroll }
    }
    const move = (pointer: Phaser.Input.Pointer) => {
      if (!this.dragStart || !pointer.isDown) return
      const delta = (pointer.y - this.dragStart.y) / this.layout.scaleY
      this.dragDistance = Math.max(this.dragDistance, Math.abs(delta))
      if (this.dragDistance > 6) this.scrollRoster(this.dragStart.scroll - delta)
    }
    const up = () => { this.dragStart = undefined }
    this.input.on('wheel', wheel).on('pointerdown', down).on('pointermove', move).on('pointerup', up).on('pointerupoutside', up)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('wheel', wheel).off('pointerdown', down).off('pointermove', move).off('pointerup', up).off('pointerupoutside', up)
      this.dragStart = undefined; this.rosterMask?.destroy(); this.rosterClip?.destroy()
      this.rosterMask = undefined; this.rosterClip = undefined
    })
    this.refresh(); void this.loadOwned(draft)
    applySmoothDisplay(this, ['form-garden', 'form-card-artwork', 'form-flower-card-artwork', 'form-wood', 'form-amber', 'form-square', 'form-ornament'])
  }
  private async loadOwned(draft?: Array<number | null>): Promise<void> {
    const request = ++this.request
    this.loading = true; this.loadError = ''; this.menu = null; this.refresh()
    const controller = new AbortController()
    const abort = () => controller.abort()
    const timer = window.setTimeout(abort, 8000)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, abort)
    try {
      const response = await fetch(`${getPhpBaseUrl()}/flower/owned.php`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store', signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok || result?.ok !== true) throw new Error(result?.error ?? '契約済みの花を読み込めません。')
      const progress = parseOwnedProgress(result.flowers)
      if (request !== this.request || !this.sys.isActive()) return
      this.flowers = progress.flatMap(saved => {
        const base = testData.characters.find(f => f.id === saved.flowerId)
        if (!base) return []
        const stats = flowerStats(base.id, saved.level)
        return [{ ...base, level: saved.level, maxLevel: MAX_FLOWER_LEVEL, acquiredAt: saved.acquiredAt, skillLevel: saved.skillLevel,
          stats: { ...base.stats, hp: stats?.hp ?? 0, mp: stats?.mp ?? 0, atk: stats?.atk ?? 0, def: stats?.def ?? 0 } }]
      })
      const owned = new Set(this.flowers.map(f => f.id))
      const normalize = (slots: Array<number | null>) => slots.map(id => id !== null && owned.has(id) ? id : null)
      this.saved = normalize(loadFormation())
      this.manager = new FormationManager(this.flowers, normalize(draft ?? this.saved))
      if (!owned.has(this.selectedId ?? -1)) this.selectedId = this.manager.getFormation().find(id => id !== null) ?? this.flowers[0]?.id ?? null
      this.status = progress.length > this.flowers.length ? '一部の所持花は編成用の基本データが未登録です。' : this.flowers.length ? '' : '契約済みの花がありません。図鑑・花契の案内を確認してください。'
    } catch (error) {
      if (request !== this.request || !this.sys.isActive()) return
      this.flowers = []; this.manager = new FormationManager([], []); this.saved = [null, null, null, null]
      this.loadError = error instanceof Error ? error.message : '所持花を読み込めません。'
      this.status = '接続・ログイン状態を確認して再読み込みしてください。'
    } finally {
      clearTimeout(timer); this.events.off(Phaser.Scenes.Events.SHUTDOWN, abort)
      if (request === this.request && this.sys.isActive()) { this.loading = false; this.refresh() }
    }
  }

  private label(x: number, y: number, text: string, size = 17, color = INK): Phaser.GameObjects.Text {
    const object = this.add.text(x, y, text, { fontFamily: FONT, fontSize: size, color, resolution: 2, padding: { top: 2, bottom: 2 } })
    smoothText(object)
    this.content.add(object); return object
  }
  private panel(x: number, y: number, w: number, h: number): void {
    const corner = Math.min(12, h / 3)
    this.content.add(this.add.nineslice(x + w / 2, y + h / 2, 'form-settings-panel-ui', undefined, w, h, corner, corner, corner, corner))
  }
  private button(x: number, y: number, w: number, h: number, label: string, action: () => void, selected = false, enabled = true): void {
    const image = this.add.image(x, y, w <= 46 ? 'form-square' : selected ? 'form-amber' : 'form-wood', 'ui').setDisplaySize(w, h)
    this.content.add(image); this.label(x, y, label, w <= 46 ? 22 : 17, enabled ? '#fff5df' : '#66523b').setOrigin(.5)
    if (!enabled) { image.setAlpha(.45); return }
    const hit = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }); this.content.add(hit)
    hit.on('pointerover', () => image.setAlpha(.82)).on('pointerout', () => image.setAlpha(1)).on('pointerup', action)
  }
  private picture(flower: CharacterData, x: number, y: number, size: number): void {
    const key = `form-${flower.code}`
    if (!this.textures.exists(key)) { this.label(x, y, '画像準備中', 13).setOrigin(.5); return }
    const image = this.add.image(x, y, key); image.setScale(size / Math.max(image.width, image.height)); this.content.add(image)
  }
  private element(flower: CharacterData, x: number, y: number): void {
    this.content.add(this.add.circle(x, y, 13, ELEMENT_COLORS[flower.element] ?? 0x79694f).setStrokeStyle(1, 0xfff4df))
    this.label(x, y, flower.element, 14, '#ffffff').setOrigin(.5)
  }
  private card(flower: OwnedFormationFlower | undefined, x: number, y: number, w: number, h: number, selected: boolean, action: () => void, inParty = false): void {
    const frame = this.add.nineslice(x + w / 2, y + h / 2, 'form-flower-card-ui', undefined, w, h, 12, 12, 12, 12)
    if (selected) frame.setTint(0xffefce)
    this.content.add(frame)
    if (selected) this.content.add(this.add.graphics().lineStyle(2, 0xd79a25).strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 5))
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true }); this.content.add(hit); hit.on('pointerup', action)
    if (!flower) { this.label(x + w / 2, y + h / 2, '＋\n空き枠', 20, '#8a795a').setOrigin(.5).setAlign('center'); return }
    const large = h > 130
    this.label(x + 9, y + 4, `戦力 ${this.manager.getPower(flower).toLocaleString()}`, 12)
    this.picture(flower, x + w / 2, y + (large ? 60 : 42), large ? 68 : 42)
    this.label(x + w / 2, y + (large ? 107 : 74), flower.name, large ? 20 : 14).setOrigin(.5)
    this.label(x + 10, y + h - 23, '★'.repeat(flower.rarity), 16, '#aa771d')
    this.element(flower, x + w - 18, y + h - 18)
    if (inParty) {
      this.content.add(this.add.rectangle(x + w - 29, y + 33, 48, 18, 0x537548))
      this.label(x + w - 29, y + 33, '編成中', 11, '#fff9e9').setOrigin(.5)
    }
    if (large) this.label(x + w / 2, y + 128, `Lv.${flower.level}`, 11, '#79694f').setOrigin(.5)
    else this.label(x + w - 8, y + 6, `Lv.${flower.level}`, 10, '#79694f').setOrigin(1, 0)
  }
  private dirty(): boolean { return JSON.stringify(this.saved) !== JSON.stringify(this.manager.getFormation()) }
  private refresh(): void {
    this.rosterMask?.destroy(); this.rosterClip?.destroy()
    this.rosterMask = undefined; this.rosterClip = undefined; this.rosterBody = undefined; this.scrollThumb = undefined
    this.overlay?.destroy(); this.overlay = undefined; this.content.removeAll(true)
    this.button(BACK_BUTTON_POSITION.x, BACK_BUTTON_POSITION.y + 10, 158, 43, this.returnToStage ? '‹ ステージ選択' : '‹ ホームへ', () => this.leave())
    this.label(640, 39, '編成', 38, '#fff4dc').setOrigin(.5)
    this.content.add(this.add.image(640, 73, 'form-ornament', 'ui').setScale(290 / 2172))
    this.panel(28, 100, 278, 522); this.panel(322, 100, 930, 220); this.panel(322, 333, 930, 300)
    this.selectedPanel(); this.partyPanel(); this.roster()
    this.label(32, 674, this.status, 13, '#fff4dc').setWordWrapWidth(610)
    this.button(787, 670, 210, 50, '変更を戻す', () => {
      if (this.dirty()) this.confirm('保存前の編成に戻しますか？', () => { this.manager = new FormationManager(this.flowers, this.saved); this.status = '保存済みの編成に戻しました'; this.refresh() })
    }, false, !this.loading && !this.loadError && this.dirty())
    this.button(1090, 670, 282, 52, '編成を保存', () => this.save(), true, !this.loading && !this.loadError && this.flowers.length > 0)
    if (this.menu) this.drawMenu()
    if (this.confirmation) this.drawConfirmation()
  }
  private selectedPanel(): void {
    this.label(48, 117, '選択中の花', 20)
    const selected = this.flowers.find(f => f.id === this.selectedId)
    if (!selected) { this.label(167, 315, this.loading ? '読み込み中…' : '花を選択してください', 18, '#79694f').setOrigin(.5); return }
    const halo = this.add.graphics().lineStyle(1, 0xc8a86c, .5).strokeCircle(167, 251, 99).strokeCircle(167, 251, 107)
    this.content.add(halo); this.picture(selected, 167, 248, 170)
    this.label(167, 367, selected.name, 28).setOrigin(.5)
    this.label(167, 402, `Lv.${selected.level}　${selected.element}属性 / ${selected.role}`, 15).setOrigin(.5)
    this.label(167, 439, `戦力 ${this.manager.getPower(selected).toLocaleString()}`, 24).setOrigin(.5)
    this.label(51, 469, `HP ${selected.stats.hp}　 MP ${selected.stats.mp}\n攻撃 ${selected.stats.atk}　防御 ${selected.stats.def}\n速さ ${selected.stats.speed}`, 16).setLineSpacing(5)
    this.button(167, 558, 230, 37, '花の詳細  ›', () => {
      this.preserveDraft = true
      this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { characterId: selected.id, ownedCharacter: selected, returnScene: SCENE_KEYS.FORM, returnLabel: '編成画面へ', returnData: { resumeFormation: true } })
    })
    const index = this.manager.getFormation().indexOf(selected.id)
    this.button(167, 593, 244, 34, index === this.slot ? 'この枠に配置済み' : index >= 0 ? `枠 ${this.slot + 1} と入れ替え` : `枠 ${this.slot + 1} に配置`, () => {
      if (this.manager.addCharacter(selected.id, this.slot)) { this.status = `${selected.name}を枠 ${this.slot + 1} に配置しました（未保存）`; this.refresh() }
    }, true, index !== this.slot)
  }
  private partyPanel(): void {
    const formation = this.manager.getFormation()
    this.label(345, 114, '出撃メンバー', 23)
    this.label(1229, 117, `${formation.filter(id => id !== null).length}/4　総戦力 ${this.manager.getTotalPower().toLocaleString()}${this.dirty() ? ' ●未保存' : ''}`, 16).setOrigin(1, 0)
    formation.forEach((id, index) => {
      const x = 346 + index * 224
      const flower = this.flowers.find(f => f.id === id)
      this.label(x + 6, 143, `枠 ${index + 1}`, 13)
      this.card(flower, x, 165, 208, 143, this.slot === index, () => { this.slot = index; if (flower) this.selectedId = flower.id; this.refresh() })
      if (flower) this.button(x + 188, 182, 25, 25, '×', () => { this.manager.removeCharacter(flower.id); this.slot = index; this.status = `${flower.name}を編成から外しました（未保存）`; this.refresh() })
    })
  }
  private roster(): void {
    const formation = this.manager.getFormation()
    this.button(415, 360 + ROSTER_TOOLBAR_OFFSET_Y, 146, 35, '絞り込み  ▾', () => { this.menu = this.menu === 'filter' ? null : 'filter'; this.refresh() }, this.menu === 'filter', !this.loading && !this.loadError)
    const filterLabel = `${this.filter}${this.partyOnly ? ' / 編成中' : ''}`
    this.label(502, 360 + ROSTER_TOOLBAR_OFFSET_Y, filterLabel, 15, '#79694f').setOrigin(0, .5)
    this.button(1053, 360 + ROSTER_TOOLBAR_OFFSET_Y, 134, 35, `${this.sort}順  ▾`, () => { this.menu = this.menu === 'sort' ? null : 'sort'; this.refresh() }, this.menu === 'sort', !this.loading && !this.loadError)
    this.button(1187, 360 + ROSTER_TOOLBAR_OFFSET_Y, 95, 35, this.descending ? '↓ 降順' : '↑ 昇順', () => { this.descending = !this.descending; this.rosterScroll = 0; this.refresh() }, false, !this.loading && !this.loadError)
    const visible = visibleFormationFlowers(this.flowers, formation, this.filter, this.partyOnly, this.sort, this.descending, f => this.manager.getPower(f))
    const viewportHeight = 205
    this.maxRosterScroll = Math.max(0, Math.ceil(visible.length / 5) * 106 - 7 - viewportHeight)
    this.rosterScroll = Phaser.Math.Clamp(this.rosterScroll, 0, this.maxRosterScroll)
    const content = this.content
    const body = this.add.container(0, 397 - this.rosterScroll); content.add(body); this.rosterBody = body
    this.content = body
    visible.forEach((flower, index) => this.card(flower, 345 + index % 5 * 178, Math.floor(index / 5) * 106, 164, 99, flower.id === this.selectedId, () => {
      // ドラッグ終了時や、枠の外に隠れたカードは選択しない。
      if (this.dragDistance > 6 || !this.rosterContains(this.input.activePointer)) return
      this.selectedId = flower.id; this.refresh()
    }, formation.includes(flower.id)))
    this.content = content
    // Phaserの描画マスクは入力判定を切らないため、一覧の外側ではヒットさせない。
    body.list.forEach(object => {
      if (object.input) object.input.hitAreaCallback = (area: Phaser.Geom.Rectangle, x: number, y: number) =>
        Phaser.Geom.Rectangle.Contains(area, x, y) && this.rosterContains(this.input.activePointer)
    })
    const topLeft = this.layout.getWorldTransformMatrix().transformPoint(341, 397)
    this.rosterClip = this.add.graphics().setVisible(false).fillStyle(0xffffff).fillRect(topLeft.x, topLeft.y, 895 * this.layout.scaleX, viewportHeight * this.layout.scaleY)
    this.rosterMask = this.rosterClip.createGeometryMask(); body.setMask(this.rosterMask)
    if (this.maxRosterScroll > 0) {
      this.content.add(this.add.rectangle(1240, 397, 4, viewportHeight, 0xd7c6a1).setOrigin(.5, 0))
      const height = Math.max(24, viewportHeight * viewportHeight / (viewportHeight + this.maxRosterScroll))
      this.scrollThumb = this.add.rectangle(1240, 397, 4, height, 0x9d7945).setOrigin(.5, 0); this.content.add(this.scrollThumb)
      this.scrollRoster(this.rosterScroll)
    }
    if (!visible.length) {
      const message = this.loading ? '契約済みの花を読み込んでいます…' : this.loadError || (this.flowers.length ? '条件に合う花がありません。絞り込みを変更してください。' : '契約済みの花がありません。')
      this.label(785, 472, message, 17, '#79694f').setOrigin(.5).setWordWrapWidth(800).setAlign('center')
      if (this.loadError) this.button(785, 530, 190, 38, '再読み込み', () => void this.loadOwned())
    }
    this.label(352, 605, `所持 ${this.flowers.length}体 / 表示 ${visible.length}体`, 12, '#79694f')
  }
  private rosterContains(pointer: Phaser.Input.Pointer): boolean {
    if (this.menu || this.confirmation || this.loading || this.loadError) return false
    const local = this.layout.getWorldTransformMatrix().applyInverse(pointer.x, pointer.y)
    return local.x >= 341 && local.x <= 1236 && local.y >= 397 && local.y <= 602
  }
  private scrollRoster(value: number): void {
    this.rosterScroll = Phaser.Math.Clamp(value, 0, this.maxRosterScroll)
    this.rosterBody?.setY(397 - this.rosterScroll)
    if (this.scrollThumb) this.scrollThumb.y = 397 + (205 - this.scrollThumb.height) * this.rosterScroll / this.maxRosterScroll
  }
  private beginOverlay(): Phaser.GameObjects.Container {
    const overlay = this.add.container(0, 0); this.layout.add(overlay); this.overlay = overlay
    const blocker = this.add.zone(640, 360, 1280, 720).setInteractive(); overlay.add(blocker)
    blocker.on('pointerup', () => { this.menu = null; if (!this.confirmation) this.refresh() })
    return overlay
  }
  private drawMenu(): void {
    const content = this.content; this.content = this.beginOverlay()
    if (this.menu === 'filter') {
      // ボタンの下ではなく、同じ行の右側の空きスペースへ展開する。
      this.panel(491, 335 + ROSTER_TOOLBAR_OFFSET_Y, 479, 51)
      const elements = ['すべて', ...new Set(testData.characters.map(f => f.element))]
      const step = 394 / elements.length
      elements.forEach((element, index) => this.button(500 + step * (index + .5), 360 + ROSTER_TOOLBAR_OFFSET_Y, step - 4, 32, element, () => { this.filter = element; this.rosterScroll = 0; this.refresh() }, this.filter === element))
      this.button(928, 360 + ROSTER_TOOLBAR_OFFSET_Y, 68, 32, '編成中', () => { this.partyOnly = !this.partyOnly; this.rosterScroll = 0; this.refresh() }, this.partyOnly)
    } else {
      this.panel(977, 383 + ROSTER_TOOLBAR_OFFSET_Y, 152, 151)
      ;(['戦力', '入手', 'レベル'] as FormationSort[]).forEach((sort, index) => this.button(1053, 411 + ROSTER_TOOLBAR_OFFSET_Y + index * 47, 130, 36, `${sort}順`, () => { this.sort = sort; this.menu = null; this.rosterScroll = 0; this.refresh() }, this.sort === sort))
    }
    this.content = content
  }
  private save(): void {
    if (this.loading || this.loadError) return
    const formation = this.manager.getFormation()
    if (formation.every(id => id === null)) { this.status = '出撃する花を1体以上配置してください'; this.refresh(); return }
    if (!saveFormation(formation)) { this.status = '保存できませんでした。ブラウザーの保存設定を確認してください'; this.refresh(); return }
    this.saved = [...formation]; this.status = '編成を保存しました。このメンバーで冒険に出発できます'; this.refresh()
  }
  private leave(): void {
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * ステージ選択から来た場合は停止中の選択画面を再開し、それ以外はホームへ戻る。
     * ================================== */
    const exit = () => {
      this.preserveDraft = false
      if (this.returnToStage && this.scene.isSleeping(SCENE_KEYS.SELECT_STAGE)) { this.scene.wake(SCENE_KEYS.SELECT_STAGE); this.scene.stop() }
      else this.scene.start(SCENE_KEYS.HOME)
    }
    if (this.dirty() && !this.loading && !this.loadError) this.confirm('未保存の変更を破棄して戻りますか？', exit)
    else exit()
  }
  private confirm(message: string, action: () => void): void { this.menu = null; this.confirmation = { message, action }; this.refresh() }
  private drawConfirmation(): void {
    const content = this.content; this.content = this.beginOverlay()
    this.content.add(this.add.rectangle(640, 360, 1280, 720, 0x24160c, .65))
    this.panel(330, 255, 620, 210)
    this.label(640, 306, this.confirmation!.message, 20).setOrigin(.5)
    this.button(488, 404, 220, 43, '編集を続ける', () => { this.confirmation = undefined; this.refresh() })
    this.button(792, 404, 220, 43, '変更を破棄', () => { const action = this.confirmation!.action; this.confirmation = undefined; action() }, true)
    this.content = content
  }
}
