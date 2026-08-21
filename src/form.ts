import Phaser from 'phaser'

import flowerImg from './assets/flower.png'
import testData from './test_data'
import type { CharacterData } from './test_data'

const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif'
const BLUE = 0x356cbf
const BORDER = 0x8aa4c8
const CARD_BORDER = 0x9a65ca
const SELECTED_FILL = 0x4c4265

export class FormScene extends Phaser.Scene {
  private characters: CharacterData[] = []
  private formation: Array<number | null> = []
  private selectedCharacterId: number | null = null
  private selectedSlotIndex = 0
  private gridContainer!: Phaser.GameObjects.Container
  private memberContainer!: Phaser.GameObjects.Container
  private totalPowerText!: Phaser.GameObjects.Text

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

    this.cameras.main.setBackgroundColor('#101828')
    this.createWindow()
    this.createTopControls()

    this.gridContainer = this.add.container(0, 0)
    this.memberContainer = this.add.container(0, 0)

    this.refreshCharacterGrid()
    this.createBottomArea()
    this.refreshMembers()
  }

  private createWindow(): void {
    this.add.rectangle(640, 360, 1210, 660, 0xf8fbff)
      .setStrokeStyle(4, 0xd8aa45)

    this.add.rectangle(640, 42, 1210, 38, BLUE)
      .setStrokeStyle(2, 0xd8aa45)

    this.add.text(640, 42, 'パーティ編成', this.textStyle(24, '#ffffff'))
      .setOrigin(0.5)
  }

  private createTopControls(): void {
    const tabs = ['全て', '前衛', '中衛', '後衛']
    tabs.forEach((label, index) => {
      this.createSmallPill(80 + index * 118, 88, 98, label, index === 0)
    })

    this.createSmallPill(860, 88, 160, '戦力', false)
    this.createSmallPill(1035, 88, 130, '降順', false)
    this.createSmallPill(1160, 88, 125, 'マイパーティ', false)
  }

  private refreshCharacterGrid(): void {
    this.gridContainer.removeAll(true)

    this.characters.forEach((character, index) => {
      const x = 78 + (index % 8) * 148
      const y = 130 + Math.floor(index / 8) * 112
      const inFormationIndex = this.formation.indexOf(character.id)
      const isSelected = this.selectedCharacterId === character.id

      this.gridContainer.add(this.createCharacterCard(
        x,
        y,
        character,
        inFormationIndex,
        isSelected,
        () => this.handleCharacterCardClick(character)
      ))
    })

    this.gridContainer.add([
      this.add.rectangle(1225, 260, 8, 310, 0xd8e4f5),
      this.add.rectangle(1225, 170, 8, 115, BLUE)
    ])
  }

  private createBottomArea(): void {
    this.add.text(45, 456, '現在のメンバー', this.textStyle(20, '#1f2937'))
    this.add.rectangle(640, 535, 1180, 150, 0xf8fbff)
      .setStrokeStyle(2, BORDER)

    this.totalPowerText = this.add.text(625, 456, '', this.textStyle(20, '#1f2937'))

    this.createActionButton(840, 610, 145, 'キャンセル', () => {
      this.scene.start('HomeScene')
    }, false)

    this.createActionButton(995, 610, 135, '詳細', () => {
      this.openCharacterDetail()
    }, false)

    this.createActionButton(1135, 610, 145, '決定', () => {
      this.scene.start('HomeScene')
    }, true)
  }

  private refreshMembers(): void {
    this.memberContainer.removeAll(true)
    this.formation.forEach((characterId, index) => {
      const character = this.findCharacter(characterId)
      const x = 58 + index * 126
      const y = 494

      if (!character) {
        this.memberContainer.add(this.createEmptyMemberSlot(x, y, index))
        return
      }

      const inFormationIndex = this.formation.indexOf(character.id)
      const isSelected = this.selectedSlotIndex === index
      this.memberContainer.add(this.createCharacterCard(
        x,
        y,
        character,
        inFormationIndex,
        isSelected,
        () => {
          this.selectedSlotIndex = index
          this.selectedCharacterId = character.id
          this.refreshAllCards()
        },
        0.86
      ))
    })

    this.totalPowerText.setText(`総戦力 ${this.getTotalPower()}`)
  }

  private handleCharacterCardClick(character: CharacterData): void {
    this.selectedCharacterId = character.id

    const currentSlot = this.formation.indexOf(character.id)
    if (currentSlot >= 0) {
      this.selectedSlotIndex = currentSlot
      this.refreshAllCards()
      return
    }

    const targetSlot = this.getTargetSlot()
    if (targetSlot < 0) return

    this.formation[targetSlot] = character.id
    this.selectedSlotIndex = targetSlot
    this.refreshAllCards()
  }

  private getTargetSlot(): number {
    if (this.formation[this.selectedSlotIndex] === null) {
      return this.selectedSlotIndex
    }

    const emptySlot = this.formation.findIndex((characterId) => characterId === null)
    return emptySlot >= 0 ? emptySlot : this.selectedSlotIndex
  }

  private refreshAllCards(): void {
    this.refreshCharacterGrid()
    this.refreshMembers()
  }

  private createCharacterCard(
    x: number,
    y: number,
    character: CharacterData,
    inFormationIndex: number,
    isSelected: boolean,
    onClick: () => void,
    scale = 1
  ): Phaser.GameObjects.Container {
    const width = 112 * scale
    const height = 95 * scale
    const container = this.add.container(x, y)
    const fill = isSelected ? SELECTED_FILL : 0xffffff

    const background = this.add.rectangle(0, 0, width, height, fill)
      .setOrigin(0, 0)
      .setStrokeStyle(3, CARD_BORDER)
      .setInteractive({ useHandCursor: true })

    const power = this.getPower(character)
    const powerText = this.add.text(7 * scale, 5 * scale, `戦力${power}`, this.textStyle(13 * scale, isSelected ? '#ffffff' : '#374151'))
    const image = this.add.image(width / 2, 48 * scale, 'formFlower').setScale(0.18 * scale)
    const nameText = this.add.text(8 * scale, 66 * scale, character.name, this.textStyle(14 * scale, isSelected ? '#ffffff' : '#111827'))
    const stars = this.add.text(8 * scale, 80 * scale, '★'.repeat(character.rarity), this.textStyle(14 * scale, '#ffd230'))
    const element = this.add.circle(width - 15 * scale, height - 15 * scale, 11 * scale, this.getElementColor(character.element))
      .setStrokeStyle(1, 0xffffff)
    const elementText = this.add.text(width - 15 * scale, height - 15 * scale, character.element.slice(0, 1), this.textStyle(11 * scale, '#ffffff'))
      .setOrigin(0.5)

    container.add([background, powerText, image, nameText, stars, element, elementText])

    if (inFormationIndex >= 0) {
      const check = this.add.text(width - 25 * scale, -13 * scale, '✓', this.textStyle(34 * scale, '#ffd230'))
      check.setStroke('#5b4216', 5 * scale)
      container.add(check)
    }

    background.on('pointerdown', onClick)

    return container
  }

  private createEmptyMemberSlot(x: number, y: number, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isSelected = this.selectedSlotIndex === index
    const background = this.add.rectangle(0, 0, 96, 82, isSelected ? 0xe7f0ff : 0xffffff)
      .setOrigin(0, 0)
      .setStrokeStyle(3, CARD_BORDER)
      .setInteractive({ useHandCursor: true })

    const text = this.add.text(48, 41, '空き', this.textStyle(18, '#6b7280'))
      .setOrigin(0.5)

    background.on('pointerdown', () => {
      this.selectedSlotIndex = index
      if (this.selectedCharacterId !== null) {
        this.formation[index] = this.selectedCharacterId
      }
      this.refreshAllCards()
    })

    container.add([background, text])
    return container
  }

  private createSmallPill(
    x: number,
    y: number,
    width: number,
    label: string,
    active: boolean
  ): void {
    const fill = active ? 0xe9f2ff : 0xffffff
    this.add.rectangle(x, y, width, 32, fill)
      .setStrokeStyle(2, BORDER)
      .setInteractive({ useHandCursor: true })

    this.add.text(x, y, label, this.textStyle(17, '#27364a'))
      .setOrigin(0.5)
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    primary: boolean
  ): void {
    const fill = primary ? 0x4a8df0 : 0xffffff
    const color = primary ? '#ffffff' : '#1f2937'
    const button = this.add.rectangle(x, y, width, 56, fill)
      .setStrokeStyle(3, BORDER)
      .setInteractive({ useHandCursor: true })

    this.add.text(x, y, label, this.textStyle(22, color)).setOrigin(0.5)

    button.on('pointerover', () => {
      button.setFillStyle(primary ? 0x3c7cdf : 0xeaf4fb)
    })

    button.on('pointerout', () => {
      button.setFillStyle(fill)
    })

    button.on('pointerup', onClick)
  }

  private openCharacterDetail(): void {
    if (this.selectedCharacterId === null) return

    this.scene.start('CharacterDetailScene', {
      characterId: this.selectedCharacterId,
      returnScene: 'FormScene',
      returnLabel: '編成画面へ'
    })
  }

  private findCharacter(characterId: number | null): CharacterData | undefined {
    if (characterId === null) return undefined
    return this.characters.find((character) => character.id === characterId)
  }

  private getPower(character: CharacterData): number {
    return character.stats.hp + character.stats.mp + character.stats.atk * 8 + character.stats.def * 6 + character.stats.speed * 4
  }

  private getTotalPower(): number {
    let total = 0

    this.formation.forEach((characterId) => {
      const character = this.findCharacter(characterId)
      total += character ? this.getPower(character) : 0
    })

    return total
  }

  private getElementColor(element: string): number {
    if (element === '火') return 0xe85d4f
    if (element === '水') return 0x3b82f6
    if (element === '風') return 0x22c55e
    if (element === '土') return 0x9a6b3f
    return 0x8b5cf6
  }

  private textStyle(
    fontSize: number,
    color: string
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color
    }
  }
}
