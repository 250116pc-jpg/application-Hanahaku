import Phaser from 'phaser'

const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif'
const BORDER_COLOR = 0x536878
const DEFAULT_FILL = 0xffffff
const HOVER_FILL = 0xeaf4fb
const DOWN_FILL = 0xd5e8f5

export function createMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const background = scene.add.rectangle(0, 0, 150, 65, DEFAULT_FILL)
    .setStrokeStyle(2, BORDER_COLOR)
    .setInteractive({ useHandCursor: true })

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT_FAMILY,
    fontSize: '26px',
    color: '#000000',
    padding: {
      top: 6,
      bottom: 6,
      left: 6,
      right: 6
    }
  }).setOrigin(0.5)

  bindButtonEvents(background, onClick)

  return scene.add.container(x, y, [background, text])
}

export function createCircleButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  diameter: number,
  label: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const background = scene.add.circle(0, 0, diameter / 2, DEFAULT_FILL)
    .setStrokeStyle(3, BORDER_COLOR)
    .setInteractive({ useHandCursor: true })

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT_FAMILY,
    fontSize: diameter <= 100 ? '22px' : '27px',
    color: '#000000',
    align: 'center',
    padding: {
      top: 6,
      bottom: 6,
      left: 6,
      right: 6
    }
  }).setOrigin(0.5)

  bindButtonEvents(background, onClick)

  return scene.add.container(x, y, [background, text])
}

function bindButtonEvents(
  background: Phaser.GameObjects.Shape,
  onClick: () => void
) {
  background.on('pointerover', () => {
    background.setFillStyle(HOVER_FILL)
  })

  background.on('pointerout', () => {
    background.setFillStyle(DEFAULT_FILL)
  })

  background.on('pointerdown', () => {
    background.setFillStyle(DOWN_FILL)
  })

  background.on('pointerup', () => {
    background.setFillStyle(HOVER_FILL)
    onClick()
  })
}
