import Phaser from 'phaser'
import type { CharacterData } from '../Scene/test_data'
import { getTextStyle } from '../utils/ui'

const BORDER = 0xb68b4d
const CARD_BORDER = 0xb68b4d
const SELECTED_FILL = 0xe5eddb

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
    scale = 1,
    textureKey = 'formFlower'
  ): Phaser.GameObjects.Container {
    const width = 128 * scale
    const height = 112 * scale

    const container = this.scene.add.container(x, y)

    const fill = selected ? SELECTED_FILL : 0xfff8e9

    const background = this.scene.add.rectangle(
      0, 0,
      width,
      height,
      fill
    )
      .setOrigin(0, 0)
      .setStrokeStyle(selected ? 4 : 2, selected ? 0x557649 : CARD_BORDER)
      .setInteractive({ useHandCursor: true })

    const power = this.getPower(character)

    const powerText = this.scene.add.text(
      8 * scale,
      5 * scale,
      `戦力 ${power.toLocaleString()}`,
      this.textStyle(
        13 * scale,
        '#52685a'
      )
    )

    const image = this.scene.add.image(width / 2, 44 * scale, textureKey)
      .setScale((44 * scale) / Math.max(this.scene.textures.get(textureKey).getSourceImage().width, this.scene.textures.get(textureKey).getSourceImage().height))

    const nameText = this.scene.add.text(
      8 * scale,
      70 * scale,
      character.name,
      this.textStyle(
        14 * scale,
        '#263b31'
      )
    )

    const stars = this.scene.add.text(
      8 * scale,
      91 * scale,
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
      128, 112,
      selected ? 0xe5eddb : 0xfff8e9
    )
      .setOrigin(0, 0)
      .setStrokeStyle(selected ? 3 : 2, selected ? 0x557649 : CARD_BORDER)
      .setInteractive({ useHandCursor: true })

    const text = this.scene.add.text(
      64,
      56,
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
      active ? 0x557649 : 0xfff8e9
    )
      .setStrokeStyle(2, BORDER)
      .setInteractive({ useHandCursor: true })

    const text = this.scene.add.text(
      x,
      y,
      label,
      this.textStyle(16, active ? '#fff8e9' : '#263b31')
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

  const fill = primary ? 0x557649 : 0xfff8e9
  const color = primary ? '#ffffff' : '#263b31'

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

  // ボタン上で押し始めたか
  let pressed = false

  button.on('pointerdown', () => {
    pressed = true

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
    // ボタンの外に出たらクリック扱いにしない
    pressed = false
    button.setFillStyle(fill)
  })

  button.on('pointerup', () => {
    if (!pressed) return

    pressed = false
    button.setFillStyle(fill)

    onClick()
  })
}

  // テキスト設定
  private textStyle(
    fontSize: number,
    color: string
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return getTextStyle(fontSize, {
      color,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    })
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
