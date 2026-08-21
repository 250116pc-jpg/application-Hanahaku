import Phaser from 'phaser'

const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif'
const BORDER_COLOR = 0x536878

export function createHomeFrame(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container,
  width: number,
  height: number
) {
  const outerFrame = scene.add.rectangle(width / 2, height / 2, 1180, 650, 0xcfe3f5)
    .setStrokeStyle(3, BORDER_COLOR)

  ui.add(outerFrame)
}

export function createHomeTitle(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container,
  x: number,
  label: string
) {
  const titleBackground = scene.add.rectangle(x, 55, 230, 60, 0xffe5cf)
    .setStrokeStyle(2, 0x806b5a)

  const titleText = scene.add.text(x, 55, label, {
    fontFamily: FONT_FAMILY,
    fontSize: '30px',
    color: '#000000',
    padding: {
      top: 6,
      bottom: 6,
      left: 6,
      right: 6
    }
  }).setOrigin(0.5)

  ui.add([titleBackground, titleText])
}

export function createFlowerPanel(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container
) {
  const flowerFrame = scene.add.rectangle(455, 330, 570, 360, 0xffffff)
    .setStrokeStyle(3, BORDER_COLOR)

  const flower = scene.add.image(455, 330, 'homeFlower')
    .setScale(0.7)

  ui.add([flowerFrame, flower])
}

export function createMessageText(
  scene: Phaser.Scene,
  ui: Phaser.GameObjects.Container,
  x: number,
  y: number
) {
  const messageText = scene.add.text(x, y, '', {
    fontFamily: FONT_FAMILY,
    fontSize: '22px',
    color: '#333333',
    padding: {
      top: 6,
      bottom: 6,
      left: 6,
      right: 6
    }
  }).setOrigin(0.5)

  ui.add(messageText)

  return messageText
}
