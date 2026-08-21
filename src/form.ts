import Phaser from 'phaser'

import flowerImg from './assets/flower.png'
import testData from './test_data'
import type { CharacterData } from './test_data'

const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif'
const BORDER_COLOR = 0x536878

export class FormScene extends Phaser.Scene {
  private characters: CharacterData[] = []
  private formation: Array<number | null> = []
  private selectedCharacterId: number | null = null
  private selectedSlotIndex: number | null = null
  private selectedText!: Phaser.GameObjects.Text
  private formationContainer!: Phaser.GameObjects.Container

  constructor() {
    super('FormScene')
  }

  preload(): void {
    this.load.image('formFlower', flowerImg)
  }

  create(): void {
    this.characters = testData.characters
    this.formation = [...testData.formation]
    this.selectedCharacterId = this.formation.find((id) => id !== null) ?? this.characters[0]?.id ?? null

    const width = this.scale.width
    const height = this.scale.height

    this.cameras.main.setBackgroundColor('#cfe3f5')
    this.add.rectangle(width / 2, height / 2, 1180, 650, 0xcfe3f5)
      .setStrokeStyle(3, BORDER_COLOR)

    this.add.text(width / 2, 45, '編成画面', this.getTextStyle(34)).setOrigin(0.5)
    this.createBackButton()
    this.createCharacterList()
    this.createFormationArea()
    this.createActionArea()
    this.refreshFormationArea()
    this.updateSelectedText()
  }

  private createBackButton(): void {
    const button = this.createTextButton(110, 55, '戻る', 24, () => {
      this.scene.start('HomeScene')
    })

    button.setBackgroundColor('#ffffff')
  }

  private createCharacterList(): void {
    this.add.rectangle(285, 365, 430, 520, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(120, 125, 'キャラ一覧', this.getTextStyle(26))

    this.characters.forEach((character, index) => {
      const y = 180 + index * 78
      const row = this.add.rectangle(285, y, 360, 62, 0xf8fbff)
        .setStrokeStyle(2, BORDER_COLOR)
        .setInteractive({ useHandCursor: true })

      this.add.image(130, y, 'formFlower').setScale(0.13)
      this.add.text(170, y - 20, `${character.name}  Lv.${character.level}`, this.getTextStyle(21))
      this.add.text(170, y + 8, `${character.element} / ${character.role} / ${'★'.repeat(character.rarity)}`, this.getTextStyle(16))

      row.on('pointerdown', () => {
        this.selectCharacter(character.id, null)
      })
    })
  }

  private createFormationArea(): void {
    this.add.rectangle(840, 285, 520, 360, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(620, 125, '現在の編成', this.getTextStyle(26))
    this.add.text(620, 160, '枠を押すと、その枠のキャラを選択できます。', this.getTextStyle(17))

    this.formationContainer = this.add.container(0, 0)
  }

  private refreshFormationArea(): void {
    this.formationContainer.removeAll(true)

    this.formation.forEach((characterId, index) => {
      const x = 690 + (index % 2) * 260
      const y = 245 + Math.floor(index / 2) * 125
      const character = this.findCharacter(characterId)
      const isSelected = this.selectedSlotIndex === index
      const fill = isSelected ? 0xeaf4fb : 0xf8fbff

      const slot = this.add.rectangle(x, y, 220, 90, fill)
        .setStrokeStyle(2, BORDER_COLOR)
        .setInteractive({ useHandCursor: true })

      const title = character
        ? `${index + 1}. ${character.name}`
        : `${index + 1}. 空き`

      const detail = character
        ? `Lv.${character.level} / ${character.element} / ${character.role}`
        : 'キャラを選んで編成に入れる'

      const titleText = this.add.text(x - 92, y - 28, title, this.getTextStyle(21))
      const detailText = this.add.text(x - 92, y + 5, detail, this.getTextStyle(16))

      slot.on('pointerdown', () => {
        if (characterId !== null) {
          this.selectCharacter(characterId, index)
          return
        }

        this.selectedSlotIndex = index
        this.refreshFormationArea()
      })

      this.formationContainer.add([slot, titleText, detailText])
    })
  }

  private createActionArea(): void {
    this.add.rectangle(840, 565, 520, 150, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.selectedText = this.add.text(620, 505, '', this.getTextStyle(22))

    this.createTextButton(690, 590, '編成に入れる', 22, () => {
      this.addSelectedCharacterToFormation()
    })

    this.createTextButton(850, 590, '外す', 22, () => {
      this.removeSelectedSlot()
    })

    this.createTextButton(1010, 590, '詳細を見る', 22, () => {
      this.openCharacterDetail()
    })
  }

  private selectCharacter(characterId: number, slotIndex: number | null): void {
    this.selectedCharacterId = characterId
    this.selectedSlotIndex = slotIndex
    this.refreshFormationArea()
    this.updateSelectedText()
  }

  private addSelectedCharacterToFormation(): void {
    if (this.selectedCharacterId === null) return

    const currentIndex = this.formation.indexOf(this.selectedCharacterId)
    if (currentIndex >= 0) {
      this.selectedSlotIndex = currentIndex
      this.refreshFormationArea()
      this.updateSelectedText()
      return
    }

    const targetIndex = this.selectedSlotIndex ?? this.formation.findIndex((id) => id === null)
    if (targetIndex < 0) {
      this.updateSelectedText('空き枠がありません。外してから入れてください。')
      return
    }

    this.formation[targetIndex] = this.selectedCharacterId
    this.selectedSlotIndex = targetIndex
    this.refreshFormationArea()
    this.updateSelectedText()
  }

  private removeSelectedSlot(): void {
    if (this.selectedSlotIndex === null) {
      this.updateSelectedText('外す編成枠を選んでください。')
      return
    }

    this.formation[this.selectedSlotIndex] = null
    this.selectedSlotIndex = null
    this.refreshFormationArea()
    this.updateSelectedText()
  }

  private openCharacterDetail(): void {
    if (this.selectedCharacterId === null) return

    this.scene.start('CharacterDetailScene', {
      characterId: this.selectedCharacterId,
      returnScene: 'FormScene',
      returnLabel: '編成画面へ'
    })
  }

  private updateSelectedText(message?: string): void {
    const character = this.findCharacter(this.selectedCharacterId)
    const selected = character
      ? `選択中: ${character.name} Lv.${character.level}`
      : '選択中: なし'

    this.selectedText.setText(message ? `${selected}\n${message}` : selected)
  }

  private findCharacter(characterId: number | null): CharacterData | undefined {
    if (characterId === null) return undefined

    return this.characters.find((character) => character.id === characterId)
  }

  private createTextButton(
    x: number,
    y: number,
    label: string,
    fontSize: number,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      ...this.getTextStyle(fontSize),
      backgroundColor: '#ffffff',
      padding: {
        top: 10,
        bottom: 10,
        left: 16,
        right: 16
      }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    button.on('pointerover', () => {
      button.setBackgroundColor('#eaf4fb')
    })

    button.on('pointerout', () => {
      button.setBackgroundColor('#ffffff')
    })

    button.on('pointerdown', () => {
      button.setBackgroundColor('#d5e8f5')
    })

    button.on('pointerup', () => {
      button.setBackgroundColor('#eaf4fb')
      onClick()
    })

    return button
  }

  private getTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: {
        top: 4,
        bottom: 4,
        left: 4,
        right: 4
      }
    }
  }
}
