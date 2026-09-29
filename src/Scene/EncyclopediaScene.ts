import Phaser from 'phaser'

import flowerImg from '../assets/flower.png'
import { EncyclopediaListView } from './encyclopedia/EncyclopediaListView'
import testData from './test_data'
import { flowerCatalog, flowerTextures, getRegisteredIds } from './encyclopedia/flowerCatalog'
import type { CharacterData, Season } from './test_data'
import { getTextStyle, createTextButton } from '../utils/ui'
//debug機能
import { showDebugSceneName } from '../debug';

//--------------------------------------------------------------


const BORDER_COLOR = 0x536878
const PANEL_COLOR = 0xffffff

export class EncyclopediaScene extends Phaser.Scene {
  private selectedSeason: Season = '春'
  private preview = true
  private page = 0
  private readonly characters = [...testData.characters, ...flowerCatalog]

  private get registeredIds(): Set<number> {
    return getRegisteredIds(this.registry.get('registeredCharacterIds'), this.characters)
  }

  constructor() {
    super('EncyclopediaScene')
  }

  preload(): void {
    this.load.image('encyclopediaFlower', flowerImg)
    flowerTextures.forEach(({ key, url }) => this.load.image(key, url))
  }

  create(): void {
    this.showList()
    showDebugSceneName(this);

  }

  private showList(): void {
    this.resetScreen('← ホームへ', () => this.scene.start('HomeScene'))

    new EncyclopediaListView(
      this,
      this.characters,
      this.registeredIds,
      season => {
        this.page = 0
        this.selectedSeason = season
        this.showList()
      },
      character => this.showDetail(character),
      this.preview,
      page => { this.page = page; this.showList() }
    ).render(this.selectedSeason, this.page)
    createTextButton(this, 1000, 65, this.preview ? 'お試し表示：ON' : 'お試し表示：OFF', () => {
      this.preview = !this.preview
      this.showList()
    }, { fontSize: 20 })
    this.add.text(640, 660, this.preview
      ? 'お試し表示中：全画像を確認できます。正式な登録・契約は行いません。'
      : '通常表示：攻略後に契約した花が図鑑に登録されます。', getTextStyle(18)).setOrigin(0.5)
  }

  private showDetail(character: CharacterData): void {
    this.resetScreen('← 一覧へ', () => this.showList())
    this.createCharacterPanel(character)
    this.createStatusPanel(character)
    this.createBasicInfoPanel(character)
    this.createAdditionalInfoPanel(character)
  }

  private resetScreen(backLabel: string, onBack: () => void): void {
    const width = this.scale.width
    const height = this.scale.height

    this.children.each(child => {
      if (child.input) child.disableInteractive(true)
    })
    this.input.setDefaultCursor('default')
    this.children.removeAll(true)

    this.cameras.main.setScroll(0, 0)
    this.cameras.main.setBackgroundColor('#cfe3f5')
    this.add.rectangle(width / 2, height / 2, 1180, 650, 0xcfe3f5)
      .setStrokeStyle(3, BORDER_COLOR)
    this.add.text(width / 2, 55, '図鑑', getTextStyle(34)).setOrigin(0.5)
    createTextButton(this, 140, 65, backLabel, onBack, { fontSize: 24, padding: { top: 10, bottom: 10, left: 18, right: 18 } })
  }

  private createCharacterPanel(character: CharacterData): void {
    this.add.rectangle(285, 270, 360, 340, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    const image = this.add.image(285, 250, character.textureKey ?? 'encyclopediaFlower')
    image.setScale(Math.min(240 / image.width, 240 / image.height))
    this.add.text(285, 405, character.name, getTextStyle(26)).setOrigin(0.5)
  }

  private createStatusPanel(character: CharacterData): void {
    this.add.rectangle(285, 555, 360, 190, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    this.add.text(135, 475, 'ステータス', getTextStyle(24))
    if (character.textureKey) {
      this.add.text(155, 520, '能力値は未設定', getTextStyle(22))
      return
    }
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
      character.textureKey ? 'レア度：未設定' : `レア度：${'★'.repeat(character.rarity)}`,
      character.textureKey ? 'レベル：未設定' : `レベル：${character.level} / ${character.maxLevel}`,
      `属性：${character.element}`,
      `役割：${character.role}${character.textureKey ? '' : '型'}`
    ].join('\n'), { ...getTextStyle(21), lineSpacing: 5 })
    this.add.text(545, 315, this.wrapJapaneseText(character.description, 25), {
      ...getTextStyle(18),
      color: '#444444',
      lineSpacing: 4
    })
  }

  private createAdditionalInfoPanel(character: CharacterData): void {
    this.add.rectangle(810, 520, 600, 260, PANEL_COLOR).setStrokeStyle(2, BORDER_COLOR)
    if (character.textureKey) {
      this.add.text(545, 405, '登録情報', getTextStyle(24))
      this.add.text(565, 460, [
        this.registeredIds.has(character.id) ? '契約済み・登録済み' : '未契約（お試し表示）',
        '正式登録：ステージ攻略 → 契約 → 図鑑登録',
        'スキル・装備・契約条件：未設定',
        '画像：asset_' + String(character.id - 1000).padStart(3, '0') + '.png'
      ].join('\n'), { ...getTextStyle(20), lineSpacing: 14 })
      return
    }
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
