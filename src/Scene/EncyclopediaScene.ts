import Phaser from 'phaser'

import flowerImg from '../assets/flower.png'
import { EncyclopediaListView } from './encyclopedia/EncyclopediaListView'
import testData from './test_data'
import type { CharacterData, Season } from './test_data'
import { createStandardSceneFrame, getTextStyle } from '../utils/ui'
//debug機能
import { showDebugSceneName } from '../debug';
import { SCENE_KEYS } from './sceneKeys';

//--------------------------------------------------------------


const BORDER_COLOR = 0x536878
const PANEL_COLOR = 0xffffff

export class EncyclopediaScene extends Phaser.Scene {
  private selectedSeason: Season = '春'
  private readonly registeredIds = new Set(
    testData.formation.filter((id): id is number => id !== null)
  )

  constructor() {
    super(SCENE_KEYS.ENCYCLOPEDIA)
  }

  preload(): void {
    this.load.image('encyclopediaFlower', flowerImg)
  }

  create(): void {
    this.showList()
    showDebugSceneName(this);

  }

  private showList(): void {
    this.resetScreen('← ホームへ', () => this.scene.start(SCENE_KEYS.HOME))

    new EncyclopediaListView(
      this,
      testData.characters,
      this.registeredIds,
      season => {
        this.selectedSeason = season
        this.showList()
      },
      character => this.showDetail(character)
    ).render(this.selectedSeason)
  }

  private showDetail(character: CharacterData): void {
    this.resetScreen('← 一覧へ', () => this.showList())
    this.createCharacterPanel(character)
    this.createStatusPanel(character)
    this.createBasicInfoPanel(character)
    this.createAdditionalInfoPanel(character)
  }

  private resetScreen(backLabel: string, onBack: () => void): void {
    this.children.each(child => {
      if (child.input) child.disableInteractive(true)
    })
    this.input.setDefaultCursor('default')
    this.children.removeAll(true)

    createStandardSceneFrame(this, '図鑑', backLabel, onBack)
  }

  private createCharacterPanel(character: CharacterData): void {
    this.add.rectangle(285, 270, 360, 340, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    this.add.image(285, 250, 'encyclopediaFlower').setScale(0.75)
    this.add.text(285, 405, character.name, getTextStyle(26)).setOrigin(0.5)
  }

  private createStatusPanel(character: CharacterData): void {
    this.add.rectangle(285, 555, 360, 190, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    this.add.text(135, 475, 'ステータス', getTextStyle(24))
    this.add.text(155, 515, [
      `HP    ${character.stats.hp}`,
      `MP    ${character.stats.mp}`,
      `ATK   ${character.stats.atk}`,
      `DEF   ${character.stats.def}`,
      `SPD   ${character.stats.speed}`
    ].join('\n'), { ...getTextStyle(20), lineSpacing: 2 })
  }

  private createBasicInfoPanel(character: CharacterData): void {
    this.add.rectangle(810, 235, 600, 270, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    this.add.text(545, 120, character.name, getTextStyle(32))
    this.add.text(545, 170, [
      `種族：${character.species}`,
      `レア度：${'★'.repeat(character.rarity)}`,
      `レベル：${character.level} / ${character.maxLevel}`,
      `属性：${character.element}`,
      `役割：${character.role}型`
    ].join('\n'), { ...getTextStyle(21), lineSpacing: 5 })
    this.add.text(545, 315, this.wrapJapaneseText(character.description, 25), {
      ...getTextStyle(18),
      color: '#444444',
      lineSpacing: 4
    })
  }

  private createAdditionalInfoPanel(character: CharacterData): void {
    this.add.rectangle(810, 520, 600, 260, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    this.add.text(545, 405, '装備・親愛情報', getTextStyle(24))
    this.add.text(565, 450, ['装備：初期装備', '親愛状態：仲良し'].join('\n'), {
      ...getTextStyle(20),
      lineSpacing: 6
    })
    this.add.text(545, 535, 'スキル一覧', getTextStyle(24))
    this.add.text(565, 580, character.skills.map((skill, index) => {
      return `スキル${index + 1}：${skill}`
    }).join('\n'), { ...getTextStyle(20), lineSpacing: 6 })
    this.add.text(1080, 610, `登録番号 ${String(character.id).padStart(3, '0')}`, {
      ...getTextStyle(17),
      color: '#555555'
    }).setOrigin(1, 0)
  }

  private wrapJapaneseText(text: string, charactersPerLine: number): string {
    return text.match(new RegExp(`.{1,${charactersPerLine}}`, 'g'))?.join('\n') ?? text
  }
}
