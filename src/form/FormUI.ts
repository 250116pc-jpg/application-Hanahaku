import Phaser from 'phaser'
import type { CharacterData } from '../Scene/test_data'

const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif'

const BORDER = 0x8aa4c8
const CARD_BORDER = 0x9a65ca
const SELECTED_FILL = 0x4c4265

export class FormUI {

  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }


  // キャラクターカード
  createCharacterCard(
    
    x: number,
    y: number,
    character: CharacterData,
    inFormation: boolean,
    selected: boolean,
    onClick: () => void,
    scale = 1
  ): Phaser.GameObjects.Container {
    console.log('カード作成:', character.name)
    const width = 112 * scale
    const height = 95 * scale

    const container = this.scene.add.container(x, y)

    const fill = selected ? SELECTED_FILL : 0xffffff

    const background = this.scene.add.rectangle(
      0, 0,
      width,
      height,
      fill
    )
      .setOrigin(0, 0)
      .setStrokeStyle(3, CARD_BORDER)
      .setInteractive({ useHandCursor: true })

    const power = this.getPower(character)

    const powerText = this.scene.add.text(
      7 * scale,
      5 * scale,
      `戦力${power}`,
      this.textStyle(
        13 * scale,
        selected ? '#ffffff' : '#374151'
      )
    )

    const image = this.scene.add.image(
      width / 2,
      48 * scale,
      'formFlower'
    ).setScale(0.18 * scale)

    const nameText = this.scene.add.text(
      8 * scale,
      66 * scale,
      character.name,
      this.textStyle(
        14 * scale,
        selected ? '#ffffff' : '#111827'
      )
    )

    const stars = this.scene.add.text(
      8 * scale,
      80 * scale,
      '★'.repeat(character.rarity),
      this.textStyle(14 * scale, '#ffd230')
    )

    const element = this.scene.add.circle(
      width - 15 * scale,
      height - 15 * scale,
      11 * scale,
      this.getElementColor(character.element)
    )
      .setStrokeStyle(1, 0xffffff)

    const elementText = this.scene.add.text(
      width - 15 * scale,
      height - 15 * scale,
      character.element.slice(0, 1),
      this.textStyle(11 * scale, '#ffffff')
    ).setOrigin(0.5)

    container.add([
      background,
      powerText,
      image,
      nameText,
      stars,
      element,
      elementText
    ])

    if (inFormation) {
  const check = this.scene.add.text(
    width - 25 * scale,
    -13 * scale,
    '✓',
    this.textStyle(34 * scale, '#ffd230')
  )

  check.setStroke('#5b4216', 5 * scale)

  container.add(check)
}
container.setVisible(true)
container.setAlpha(1)
container.setDepth(100)

background.setVisible(true)
background.setAlpha(1)

background.on('pointerdown', onClick)

return container

  }


  // 空きスロット
  createEmptySlot(
    x: number,
    y: number,
    selected: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {

    const container = this.scene.add.container(x, y)

    const background = this.scene.add.rectangle(
      0, 0,
      96, 82,
      selected ? 0xe7f0ff : 0xffffff
    )
      .setOrigin(0, 0)
      .setStrokeStyle(3, CARD_BORDER)
      .setInteractive({ useHandCursor: true })

    const text = this.scene.add.text(
      48,
      41,
      '空き',
      this.textStyle(18, '#6b7280')
    ).setOrigin(0.5)

    background.on('pointerdown', onClick)

    container.add([
      background,
      text
    ])

    return container
  }


  // 小さいボタン
  createPill(
    x: number,
    y: number,
    width: number,
    label: string,
    active: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {

    const container = this.scene.add.container(0, 0)

    const background = this.scene.add.rectangle(
      x, y,
      width,
      32,
      active ? 0xe9f2ff : 0xffffff
    )
      .setStrokeStyle(2, BORDER)
      .setInteractive({ useHandCursor: true })

    const text = this.scene.add.text(
      x,
      y,
      label,
      this.textStyle(17, '#27364a')
    ).setOrigin(0.5)

    background.on('pointerdown', () => {
      background.setFillStyle(0xdbeafe)
    })

    background.on('pointerup', onClick)

    container.add([
      background,
      text
    ])

    return container
  }


  // 決定・キャンセルなどのボタン
  createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    primary: boolean,
    onClick: () => void
  ): void {

    const fill = primary ? 0x4a8df0 : 0xffffff
    const color = primary ? '#ffffff' : '#1f2937'

    const button = this.scene.add.rectangle(
      x, y,
      width, 56,
      fill
    )
      .setStrokeStyle(3, BORDER)
      .setInteractive({ useHandCursor: true })

    this.scene.add.text(
      x,
      y,
      label,
      this.textStyle(22, color)
    ).setOrigin(0.5)

    button.on('pointerdown', () => {
      button.setFillStyle(
        primary ? 0x2f6fc8 : 0xdbeafe
      )
    })

    button.on('pointerover', () => {
      button.setFillStyle(
        primary ? 0x3c7cdf : 0xeaf4fb
      )
    })

    button.on('pointerout', () => {
      button.setFillStyle(fill)
    })

    button.on('pointerup', onClick)
  }


  // テキスト設定
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


  private getPower(character: CharacterData): number {
    return (
      character.stats.hp +
      character.stats.mp +
      character.stats.atk * 8 +
      character.stats.def * 6 +
      character.stats.speed * 4
    )
  }


  private getElementColor(element: string): number {
    if (element === '火') return 0xe85d4f
    if (element === '水') return 0x3b82f6
    if (element === '風') return 0x22c55e
    if (element === '土') return 0x9a6b3f

    return 0x8b5cf6
  }
}