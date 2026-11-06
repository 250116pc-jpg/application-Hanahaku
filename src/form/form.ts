import Phaser from 'phaser'
import rawFormationData from '../../php/flower/formation.json?raw'
import { preloadShopAssets } from '../Scene/shop/assets'
import { createShopBackground } from '../Scene/shop/background'
import type { CharacterData } from '../Scene/test_data'
import { FormUI } from './FormUI'
import { FormationManager } from './FormationManager'
import { SCENE_KEYS } from '../Scene/sceneKeys'
import { loadFormation, saveFormation } from './formationStorage'

const data = JSON.parse(rawFormationData) as { characters: CharacterData[] }
const textures = import.meta.glob('../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const FONT = '"Yu Mincho", "Meiryo", serif'

export class FormScene extends Phaser.Scene {
  private ui!: FormUI
  private manager!: FormationManager
  private selectedId: number | null = null
  private slot = 0
  private filter = 'すべて'
  private sort: '戦力' | 'レベル' | '名前' = '戦力'
  private descending = true
  private partyOnly = false
  private page = 0
  private saved: Array<number | null> = []
  private content!: Phaser.GameObjects.Container
  private status!: Phaser.GameObjects.Text
  private returnToStage = false
  private preserveDraft = false
  private modal?: Phaser.GameObjects.Container

  constructor() { super(SCENE_KEYS.FORM) }
  preload(): void {
    preloadShopAssets(this)
    for (const [path, url] of Object.entries(textures)) this.load.image(`form-${path.split('/').pop()!.replace(/\.png$/i, '')}`, url)
  }

  init(data: { resumeFormation?: boolean; returnToStage?: boolean } = {}): void {
    if (!data.resumeFormation) this.returnToStage = data.returnToStage === true
    this.preserveDraft = this.preserveDraft && data.resumeFormation === true
    // Phaser reuses scene data when a later start() omits its data argument.
    // Consume this entry data so a fresh visit from home resets the destination.
    this.sys.settings.data = {}
  }

  create(): void {
    if (!this.preserveDraft) {
      this.saved = loadFormation()
      this.manager = new FormationManager(data.characters, this.saved)
      this.selectedId = this.saved.find(id => id !== null) ?? data.characters[0]?.id ?? null
      this.slot = 0; this.page = 0; this.filter = 'すべて'; this.partyOnly = false
    }
    this.preserveDraft = false
    this.modal = undefined
    this.ui = new FormUI(this)
    createShopBackground(this, 1280, 720)
    this.add.rectangle(640, 360, 1280, 720, 0xf4edda, 0.94)
    this.add.rectangle(640, 43, 1280, 86, 0x354b40)
    this.add.rectangle(640, 87, 1280, 3, 0xb68b4d)
    this.label(640, 42, '花 の 編 成', 30, '#fff4dc').setOrigin(0.5)
    this.ui.createPill(100, 43, 148, this.returnToStage ? '‹ ステージ選択' : '‹ ホーム', false, () => this.leave())
    this.label(1230, 42, '花と旅する、四人の仲間', 16, '#efe1bf').setOrigin(1, 0.5)
    this.panel(24, 108, 292, 518)
    this.panel(334, 108, 922, 212)
    this.panel(334, 332, 922, 294)
    this.add.rectangle(640, 672, 1280, 96, 0x354b40)
    this.status = this.label(32, 651, '① 花を選択　② 枠を選択　③「この枠に配置」', 16, '#fff4dc')
    this.label(32, 682, '「編成を保存」で冒険に連れていくメンバーを確定します', 13, '#d8d7bd')
    this.ui.createActionButton(776, 673, 160, '変更を戻す', false, () => {
      if (this.dirty()) this.confirm('保存前の編成に戻しますか？', () => {
        this.manager = new FormationManager(data.characters, this.saved); this.refresh(); this.status.setText('保存済みの編成に戻しました')
      })
    })
    this.ui.createActionButton(1028, 673, 280, '編成を保存', true, () => this.save())
    this.content = this.add.container(0, 0)
    this.refresh()
  }

  private label(x: number, y: number, text: string, size = 16, color = '#354b40'): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, padding: { top: 3, bottom: 3 } })
  }
  private panel(x: number, y: number, w: number, h: number): void {
    this.add.rectangle(x + w / 2 + 3, y + h / 2 + 4, w, h, 0x675136, 0.12)
    this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xfffbef).setStrokeStyle(1, 0xbca477)
    this.add.rectangle(x + w / 2, y + 3, w - 12, 2, 0xd7c49d)
  }
  private dirty(): boolean { return JSON.stringify(this.saved) !== JSON.stringify(this.manager.getFormation()) }
  private refresh(): void {
    this.content.removeAll(true)
    const add = (object: Phaser.GameObjects.GameObject) => this.content.add(object)
    const formation = this.manager.getFormation()
    const selected = this.manager.findCharacter(this.selectedId)
    add(this.label(44, 122, '選択中の花', 16))
    if (selected) {
      add(this.add.circle(170, 234, 76, 0xeee7cf))
      const image = this.add.image(170, 232, `form-${selected.code}`)
      const source = image.texture.getSourceImage()
      image.setScale(126 / Math.max(source.width, source.height))
      add(image)
      add(this.label(170, 321, selected.name, 27).setOrigin(0.5))
      add(this.label(170, 356, `Lv.${selected.level}　${selected.element}属性 / ${selected.role}`, 16).setOrigin(0.5))
      add(this.label(170, 392, `戦力  ${this.manager.getPower(selected).toLocaleString()}`, 22).setOrigin(0.5))
      add(this.label(48, 428, `HP  ${selected.stats.hp}     MP  ${selected.stats.mp}\n攻撃 ${selected.stats.atk}   防御 ${selected.stats.def}\n速さ ${selected.stats.speed}`, 17).setLineSpacing(8))
      add(this.ui.createPill(170, 535, 236, '能力・スキルの詳細 ›', false, () => {
        this.preserveDraft = true
        this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { characterId: selected.id, returnScene: SCENE_KEYS.FORM, returnLabel: '編成画面へ', returnData: { resumeFormation: true } })
      }))
      const currentSlot = formation.indexOf(selected.id)
      const action = currentSlot === this.slot ? 'この枠に配置済み' : currentSlot >= 0 ? `枠 ${this.slot + 1} と入れ替え` : `枠 ${this.slot + 1} に配置`
      add(this.ui.createPill(170, 587, 236, action, true, () => {
        if (this.manager.addCharacter(selected.id, this.slot)) {
          this.status.setText(`${selected.name}を枠 ${this.slot + 1} に配置しました（未保存）`); this.refresh()
        }
      }))
    }
    add(this.label(354, 119, '出撃メンバー', 21))
    add(this.label(1234, 122, `${formation.filter(id => id !== null).length}/4人　総戦力 ${this.manager.getTotalPower().toLocaleString()}　${this.dirty() ? '● 未保存' : '保存済み'}`, 16).setOrigin(1, 0))
    formation.forEach((id, index) => {
      const x = 370 + index * 216
      add(this.label(x, 151, `枠 ${index + 1}${index === this.slot ? '　選択中' : ''}`, 14, index === this.slot ? '#a34c40' : '#706550'))
      const member = this.manager.findCharacter(id)
      const selectSlot = () => { this.slot = index; this.refresh(); this.status.setText(`枠 ${index + 1} を選択中。左の配置ボタンで変更できます`) }
      add(member ? this.ui.createCharacterCard(x, 179, member, false, this.slot === index, selectSlot, 1, `form-${member.code}`)
        : this.ui.createEmptySlot(x, 179, this.slot === index, selectSlot))
      if (member) add(this.ui.createPill(x + 166, 267, 62, '外す', false, () => {
        this.manager.removeCharacter(member.id); this.slot = index; this.refresh(); this.status.setText(`${member.name}を外しました（未保存）`)
      }))
    })
    const elements = ['すべて', ...new Set(data.characters.map(c => c.element))]
    elements.forEach((element, i) => add(this.ui.createPill(378 + i * 65, 355, 58, element, this.filter === element, () => {
      this.filter = element; this.page = 0; this.refresh()
    })))
    add(this.ui.createPill(880, 355, 120, this.partyOnly ? '編成中のみ' : '花一覧', this.partyOnly, () => { this.partyOnly = !this.partyOnly; this.page = 0; this.refresh() }))
    add(this.ui.createPill(1014, 355, 126, `${this.sort}順`, false, () => { this.sort = this.sort === '戦力' ? 'レベル' : this.sort === 'レベル' ? '名前' : '戦力'; this.page = 0; this.refresh() }))
    add(this.ui.createPill(1120, 355, 66, this.descending ? '降順' : '昇順', false, () => { this.descending = !this.descending; this.refresh() }))
    const visible = data.characters.filter(c => (this.filter === 'すべて' || c.element === this.filter) && (!this.partyOnly || formation.includes(c.id))).sort((a, b) => {
      const diff = this.sort === '名前' ? a.name.localeCompare(b.name, 'ja') : this.sort === 'レベル' ? a.level - b.level : this.manager.getPower(a) - this.manager.getPower(b)
      return (this.descending ? -diff : diff) || a.id - b.id
    })
    const pages = Math.max(1, Math.ceil(visible.length / 12))
    this.page = Math.min(this.page, pages - 1)
    visible.slice(this.page * 12, this.page * 12 + 12).forEach((character, index) => {
      add(this.ui.createCharacterCard(354 + index % 6 * 148, 387 + Math.floor(index / 6) * 117, character, formation.includes(character.id), character.id === this.selectedId, () => {
        this.selectedId = character.id; this.refresh(); this.status.setText(`${character.name}を選択。配置先の枠を選んでください`)
      }, 0.94, `form-${character.code}`))
    })
    if (!visible.length) add(this.label(795, 480, '条件に合う花がありません。属性や「編成中のみ」を変更してください。', 17).setOrigin(0.5))
    add(this.ui.createPill(1180, 355, 32, '‹', false, () => { if (this.page > 0) { this.page--; this.refresh() } }))
    add(this.ui.createPill(1220, 355, 32, '›', false, () => { if (this.page < pages - 1) { this.page++; this.refresh() } }))
    add(this.label(1238, 609, `${visible.length}件　${this.page + 1}/${pages}`, 11).setOrigin(1, 0))
  }

  private save(): void {
    const formation = this.manager.getFormation()
    if (formation.every(id => id === null)) { this.status.setText('出撃する花を1人以上配置してください'); return }
    if (!saveFormation(formation)) { this.status.setText('保存できませんでした。ブラウザーの保存設定を確認して再試行してください'); return }
    this.saved = [...formation]; this.refresh(); this.status.setText('編成を保存しました。このメンバーで冒険に出発できます')
  }
  private leave(): void {
    const exit = () => {
      this.preserveDraft = false
      if (this.returnToStage && this.scene.isSleeping(SCENE_KEYS.SELECT_STAGE)) {
        this.scene.wake(SCENE_KEYS.SELECT_STAGE)
        this.scene.stop()
      } else this.scene.start(SCENE_KEYS.HOME)
    }
    if (this.dirty()) this.confirm('未保存の変更を破棄してホームに戻りますか？', exit)
    else exit()
  }
  private confirm(message: string, action: () => void): void {
    if (this.modal?.active) return
    const modal = this.add.container(0, 0).setDepth(5000)
    this.modal = modal
    modal.add(this.add.rectangle(640, 360, 1280, 720, 0x18251d, 0.65).setInteractive())
    modal.add(this.add.rectangle(640, 360, 650, 220, 0xfffbef).setStrokeStyle(3, 0xb68b4d))
    modal.add(this.label(640, 310, message, 21).setOrigin(0.5))
    modal.add(this.ui.createPill(490, 405, 200, '編集を続ける', false, () => modal.destroy()))
    modal.add(this.ui.createPill(790, 405, 200, '変更を破棄', true, () => { modal.destroy(); action() }))
  }
}
