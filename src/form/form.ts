import Phaser from 'phaser'
import rawFormationData from '../../php/flower/formation.json?raw'
import { preloadShopAssets } from '../Scene/shop/assets'
import { createShopBackground } from '../Scene/shop/background'
import type { CharacterData } from '../Scene/test_data'
import { FormUI } from './FormUI'
import { FormationManager } from './FormationManager'
import { createTextButton } from '../utils/ui'
import { showDebugSceneName } from '../debug'
import { SCENE_KEYS } from '../Scene/sceneKeys'

type FormationData = { characters: CharacterData[]; formation: Array<number | null> }
const formationData = JSON.parse(rawFormationData) as FormationData
const flowerTextures = import.meta.glob('../assets/images/pixel_flowers/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>
const imageUrlByCode = new Map(Object.entries(flowerTextures).map(([path, url]) => [
  path.split('/').pop()!.replace(/\.png$/i, ''), url,
]))

export class FormScene extends Phaser.Scene {
  private ui!: FormUI
  private formationManager!: FormationManager
  private selectedCharacterId: number | null = null
  private selectedSlotIndex = 0
  private activeFilter = 'all'
  private sortDescending = true
  private showPartyOnly = false
  private gridContainer!: Phaser.GameObjects.Container
  private topControlsContainer!: Phaser.GameObjects.Container
  private memberContainer!: Phaser.GameObjects.Container
  private totalPowerText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text

  constructor() { super(SCENE_KEYS.FORM) }

  preload(): void {
    preloadShopAssets(this)
    for (const [code, url] of imageUrlByCode) this.load.image(`form-flower-${code}`, url)
  }

  create(): void {
    showDebugSceneName(this)
    this.ui = new FormUI(this)
    this.formationManager = new FormationManager(formationData.characters, formationData.formation)
    const formation = this.formationManager.getFormation()
    this.selectedCharacterId = formation.find(id => id !== null) ?? formationData.characters[0]?.id ?? null

    createShopBackground(this, this.scale.width, this.scale.height)
    this.add.rectangle(640, 360, 1280, 720, 0x182b22, 0.64).setDepth(-1)
    this.add.rectangle(640, 53, 1280, 106, 0x20392d, 0.92).setDepth(1)
    this.add.rectangle(640, 105, 1280, 3, 0xd8b36c, 0.95).setDepth(2)
    this.add.text(640, 31, '花の編成', { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '32px', color: '#fff4d9', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3)
    this.add.text(640, 74, '花を選んで、冒険に連れていくメンバーを決めましょう', { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '15px', color: '#e7dfc8' }).setOrigin(0.5).setDepth(3)
    createTextButton(this, 105, 53, '← ホーム', () => this.scene.start(SCENE_KEYS.HOME), {
      fontSize: 18,
      bgColor: '#f7efd9',
      hoverColor: '#ffffff',
      downColor: '#dfd0ad',
      padding: { left: 16, right: 16, top: 9, bottom: 9 },
    }).setDepth(1000)

    this.add.rectangle(382, 410, 720, 526, 0x20392d, 0.55).setStrokeStyle(2, 0xe0c184, 0.9)
    this.add.rectangle(1007, 410, 500, 526, 0x20392d, 0.55).setStrokeStyle(2, 0xe0c184, 0.9)
    this.add.text(48, 145, '花一覧', { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '20px', color: '#fff4d9', fontStyle: 'bold' })
    this.add.text(770, 145, '現在のメンバー', { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '20px', color: '#fff4d9', fontStyle: 'bold' })
    this.topControlsContainer = this.add.container(0, 0).setDepth(10)
    this.gridContainer = this.add.container(0, 0).setDepth(10)
    this.memberContainer = this.add.container(0, 0).setDepth(10)
    this.totalPowerText = this.add.text(790, 555, '', { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '19px', color: '#fff4d9', fontStyle: 'bold' })
    this.statusText = this.add.text(790, 587, 'カードを選ぶと編成に追加できます', { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '14px', color: '#e7dfc8' })
    this.ui.createActionButton(860, 660, 150, '詳細', false, () => this.openCharacterDetail())
    this.ui.createActionButton(1030, 660, 170, '編成を決定', true, () => {
      formationData.formation.splice(0, formationData.formation.length, ...this.formationManager.getFormation())
      this.scene.start(SCENE_KEYS.HOME)
    })
    this.refreshTopControls()
    this.refreshCharacterGrid()
    this.refreshMembers()
  }

  private refreshTopControls(): void {
    this.topControlsContainer.removeAll(true)
    const elements = [...new Set(formationData.characters.map(character => character.element))]
    const tabs = [{ label: 'すべて', filter: 'all' }, ...elements.map(element => ({ label: element, filter: element }))]
    tabs.forEach((tab, index) => this.topControlsContainer.add(this.ui.createPill(76 + index * 84, 180, 76, tab.label, this.activeFilter === tab.filter, () => {
      this.activeFilter = tab.filter; this.showPartyOnly = false; this.refreshTopControls(); this.refreshCharacterGrid()
    })))
    this.topControlsContainer.add(this.ui.createPill(630, 180, 92, this.sortDescending ? '戦力 ↓' : '戦力 ↑', true, () => {
      this.sortDescending = !this.sortDescending; this.refreshTopControls(); this.refreshCharacterGrid()
    }))
    this.topControlsContainer.add(this.ui.createPill(817, 180, 150, this.showPartyOnly ? '全て表示' : '編成中のみ', this.showPartyOnly, () => {
      this.showPartyOnly = !this.showPartyOnly; this.refreshTopControls(); this.refreshCharacterGrid()
    }))
  }

  private refreshCharacterGrid(): void {
    this.gridContainer.removeAll(true)
    this.getVisibleCharacters().forEach((character, index) => {
      const x = 55 + (index % 5) * 140
      const y = 220 + Math.floor(index / 5) * 137
      this.gridContainer.add(this.ui.createCharacterCard(x, y, character,
        this.formationManager.getFormation().includes(character.id), this.selectedCharacterId === character.id,
        () => this.handleCharacterClick(character), 1, `form-flower-${character.code}`))
    })
  }

  private refreshMembers(): void {
    this.memberContainer.removeAll(true)
    this.formationManager.getFormation().forEach((id, index) => {
      const character = this.formationManager.findCharacter(id)
      const x = 790 + (index % 2) * 220
      const y = 225 + Math.floor(index / 2) * 140
      if (!character) {
        this.memberContainer.add(this.ui.createEmptySlot(x, y, this.selectedSlotIndex === index, () => {
          this.selectedSlotIndex = index; this.statusText.setText('花一覧からメンバーを選んでください')
        }))
        return
      }
      this.memberContainer.add(this.ui.createCharacterCard(x, y, character, true, this.selectedSlotIndex === index,
        () => { this.selectedSlotIndex = index; this.selectedCharacterId = character.id; this.refreshAll() }, 1, `form-flower-${character.code}`))
    })
    this.totalPowerText.setText(`パーティ戦力  ${this.formationManager.getTotalPower().toLocaleString()}`)
  }

  private handleCharacterClick(character: CharacterData): void {
    const formation = this.formationManager.getFormation()
    if (formation.includes(character.id)) {
      this.formationManager.removeCharacter(character.id)
      this.selectedCharacterId = null
      this.statusText.setText(`${character.name}を編成から外しました`)
      this.refreshAll()
      return
    }
    let slot = this.selectedSlotIndex
    if (formation[slot] !== null) slot = this.formationManager.getEmptySlot()
    if (slot < 0) { this.statusText.setText('編成できるのは4人までです'); return }
    this.formationManager.addCharacter(character.id, slot)
    this.selectedCharacterId = character.id
    this.selectedSlotIndex = slot
    this.statusText.setText(`${character.name}を編成に加えました`)
    this.refreshAll()
  }

  private getVisibleCharacters(): CharacterData[] {
    let characters = [...formationData.characters]
    if (this.showPartyOnly) characters = characters.filter(c => this.formationManager.getFormation().includes(c.id))
    else if (this.activeFilter !== 'all') characters = characters.filter(c => c.element === this.activeFilter)
    return characters.sort((a, b) => {
      const diff = this.formationManager.getPower(a) - this.formationManager.getPower(b)
      return this.sortDescending ? -diff : diff
    })
  }

  private openCharacterDetail(): void {
    if (this.selectedCharacterId === null) return
    this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { characterId: this.selectedCharacterId, returnScene: SCENE_KEYS.FORM, returnLabel: '編成画面へ' })
  }

  private refreshAll(): void { this.refreshCharacterGrid(); this.refreshMembers() }
}
