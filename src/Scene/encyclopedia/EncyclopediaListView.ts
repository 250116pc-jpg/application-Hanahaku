import Phaser from 'phaser'

import type { CharacterData, Season } from '../test_data'
import { getTextStyle } from '../../utils/ui'

const SEASONS: Season[] = ['春', '夏', '秋', '冬']

export class EncyclopediaListView {
  private scene: Phaser.Scene
  private characters: CharacterData[]
  private registeredIds: Set<number>
  private onSeasonChange: (season: Season) => void
  private onSelect: (character: CharacterData) => void

  constructor(
    scene: Phaser.Scene,
    characters: CharacterData[],
    registeredIds: Set<number>,
    onSeasonChange: (season: Season) => void,
    onSelect: (character: CharacterData) => void
  ) {
    this.scene = scene
    this.characters = characters
    this.registeredIds = registeredIds
    this.onSeasonChange = onSeasonChange
    this.onSelect = onSelect
  }

  render(selectedSeason: Season): void {
    this.createSeasonTabs(selectedSeason)
    const completion = Math.round(this.registeredIds.size / this.characters.length * 100)
    this.scene.add.text(520, 137, `コンプリート率 ${completion}%`, this.textStyle(19))
    this.scene.add.rectangle(640, 410, 1040, 465, 0xffffff).setStrokeStyle(2, 0x536878)

    const seasonCharacters = this.characters.filter(
      character => character.season === selectedSeason
    )
    const entries: Array<CharacterData | null> = [
      ...seasonCharacters,
      ...Array(Math.max(0, 8 - seasonCharacters.length)).fill(null)
    ]

    entries.slice(0, 8).forEach((character, index) => {
      this.createCard(
        255 + index % 4 * 255,
        290 + Math.floor(index / 4) * 205,
        character
      )
    })
    this.createScrollBar()
  }

  private createSeasonTabs(selectedSeason: Season): void {
    SEASONS.forEach((season, index) => {
      const active = season === selectedSeason
      const button = this.scene.add.rectangle(
        190 + index * 90,
        140,
        70,
        42,
        active ? 0xf1c6d2 : 0xffffff
      ).setStrokeStyle(2, 0x536878).setInteractive({ useHandCursor: true })
      this.scene.add.text(190 + index * 90, 140, season, this.textStyle(20)).setOrigin(0.5)
      button.on('pointerup', () => this.onSeasonChange(season))
    })
  }

  private createCard(x: number, y: number, character: CharacterData | null): void {
    const registered = character !== null && this.registeredIds.has(character.id)
    const card = this.scene.add.rectangle(x, y, 185, 175, 0xffffff).setStrokeStyle(2, 0x536878)
    this.scene.add.rectangle(x, y - 20, 130, 105, 0xeaf4fb).setStrokeStyle(1, 0x536878)

    if (registered) {
      this.scene.add.image(x, y - 20, 'encyclopediaFlower').setScale(0.75)
      this.scene.add.text(x, y + 67, character.name, this.textStyle(18)).setOrigin(0.5)
      card.setInteractive({ useHandCursor: true })
      card.on('pointerover', () => card.setFillStyle(0xeaf4fb))
      card.on('pointerout', () => card.setFillStyle(0xffffff))
      card.on('pointerup', () => this.onSelect(character))
      return
    }

    this.scene.add.text(x, y - 20, '画像\n未登録', {
      ...this.textStyle(17),
      align: 'center'
    }).setOrigin(0.5)
    this.scene.add.text(x, y + 67, '？？？', this.textStyle(18)).setOrigin(0.5)
  }

  private createScrollBar(): void {
    this.scene.add.rectangle(1170, 410, 8, 390, 0xe2e8f0).setStrokeStyle(1, 0x536878)
    this.scene.add.rectangle(1170, 285, 8, 120, 0x94a3b8)
  }

  private textStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return getTextStyle(fontSize, { padding: { top: 0, bottom: 0, left: 0, right: 0 } })
  }
}
