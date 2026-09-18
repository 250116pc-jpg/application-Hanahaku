import Phaser from 'phaser'

import flowerImg from '../assets/flower.png'
import testData from './test_data'
import type { CharacterData } from './test_data'
import { getTextStyle, createTextButton } from '../utils/ui'

const BORDER_COLOR = 0x536878

type CharacterDetailSceneData = {
  characterId?: number
  returnScene?: string
  returnLabel?: string
}

export class CharacterDetailScene extends Phaser.Scene {
  private characterId = 1
  private returnScene = 'TrainingScene'
  private returnLabel = '育成画面へ'

  constructor() {
    super('CharacterDetailScene')
  }

  init(data: CharacterDetailSceneData): void {
    this.characterId = data.characterId ?? 1
    this.returnScene = data.returnScene ?? 'TrainingScene'
    this.returnLabel = data.returnLabel ?? '育成画面へ'
  }

  preload(): void {
    this.load.image('detailFlower', flowerImg)
  }

  create(): void {
    const width = this.scale.width
    const height = this.scale.height
    const character = this.findCharacter()

    this.cameras.main.setScroll(0, 0)
    this.cameras.main.setBackgroundColor('#cfe3f5')

    this.add.rectangle(width / 2, height / 2, 1180, 650, 0xcfe3f5)
      .setStrokeStyle(3, BORDER_COLOR)

    this.add.text(width / 2, 55, 'キャラ詳細', getTextStyle(34)).setOrigin(0.5)
    this.createBackButton()
    this.createCharacterImage()
    this.createBasicInfo(character)
    this.createStatusInfo(character)
    this.createSkillInfo(character)
    this.createHomeButton(width, height)
  }

  private createBackButton(): void {
    createTextButton(this, 150, 65, `← ${this.returnLabel}`, () => {
      this.scene.start(this.returnScene)
    }, { fontSize: 24, padding: { top: 10, bottom: 10, left: 18, right: 18 } })
  }

  private createCharacterImage(): void {
    this.add.rectangle(310, 285, 360, 360, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.image(310, 285, 'detailFlower')
      .setScale(0.75)
  }

  private createBasicInfo(character: CharacterData): void {
    this.add.rectangle(780, 210, 520, 170, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(550, 145, character.name, getTextStyle(32))
    this.add.text(550, 195, [
      `種族: ${character.species}`,
      `レア度: ${'★'.repeat(character.rarity)}`,
      `Lv.${character.level} / ${character.maxLevel}`,
      `属性: ${character.element} / 役割: ${character.role}`
    ].join('\n'), {
      ...getTextStyle(21),
      lineSpacing: 6
    })
  }

  private createStatusInfo(character: CharacterData): void {
    this.add.rectangle(310, 560, 360, 160, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(160, 500, 'ステータス', getTextStyle(26))
    this.add.text(170, 540, [
      `HP    ${character.stats.hp}`,
      `MP    ${character.stats.mp}`,
      `ATK   ${character.stats.atk}`,
      `DEF   ${character.stats.def}`,
      `SPD   ${character.stats.speed}`
    ].join('\n'), {
      ...getTextStyle(21),
      lineSpacing: 5
    })
  }

  private createSkillInfo(character: CharacterData): void {
    this.add.rectangle(780, 505, 520, 310, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(550, 365, 'スキル', getTextStyle(26))
    this.add.text(550, 410, character.skills.map((skill, index) => {
      return `スキル${index + 1}: ${skill}`
    }).join('\n'), {
      ...getTextStyle(22),
      lineSpacing: 8
    })

    this.add.text(550, 500, character.description, {
      ...getTextStyle(20),
      wordWrap: { width: 430 },
      lineSpacing: 8
    })
  }

  private createHomeButton(width: number, height: number): void {
    createTextButton(this, width - 140, height - 65, 'ホームへ', () => {
      this.scene.start('HomeScene')
    }, { fontSize: 24, padding: { top: 10, bottom: 10, left: 18, right: 18 } })
  }

  private findCharacter(): CharacterData {
    return testData.characters.find((character) => character.id === this.characterId)
      ?? testData.characters[0]
  }

}
