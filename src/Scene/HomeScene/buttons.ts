import Phaser from 'phaser'

const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif'

// カラー設定
const BORDER_COLOR = 0x536878  // 枠線の色[cite: 5]
const NORMAL_FILL  = 0x7fa2c4  // 通常時のボタン色
const HOVER_FILL   = 0xadd2f5  // ホバー時の色（薄く明るい水色）
const DOWN_FILL    = 0x5d80a2  // 押したときの色（少し濃い色）
const TEXT_COLOR   = '#ffffff'  // 文字色

export function createMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const width = 150
  const height = 65
  const radius = 12

  const bg = scene.add.graphics()

  const draw = (color: number) => {
    bg.clear()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius)
    bg.lineStyle(2, BORDER_COLOR, 1)
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius)
  }

  draw(NORMAL_FILL)

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT_FAMILY,
    fontSize: '24px',
    color: TEXT_COLOR,
    fontStyle: 'bold'
  }).setOrigin(0.5)

  const container = scene.add.container(x, y, [bg, text])
  container.setSize(width, height)
  container.setInteractive({ useHandCursor: true })

  bindButtonEvents(container, draw, onClick)

  return container
}

export function createCircleButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  diameter: number,
  label: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const radius = diameter / 2
  const bg = scene.add.graphics()

  const draw = (color: number) => {
    bg.clear()
    bg.fillStyle(color, 1)
    bg.fillCircle(0, 0, radius)
    bg.lineStyle(3, BORDER_COLOR, 1)
    bg.strokeCircle(0, 0, radius)
  }

  draw(NORMAL_FILL)

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT_FAMILY,
    fontSize: diameter <= 100 ? '22px' : '26px',
    color: TEXT_COLOR,
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5)

  const container = scene.add.container(x, y, [bg, text])
  container.setSize(diameter, diameter)
  container.setInteractive({ useHandCursor: true })

  bindButtonEvents(container, draw, onClick)

  return container
}

function bindButtonEvents(
  container: Phaser.GameObjects.Container,
  draw: (color: number) => void,
  onClick: () => void
) {
  container.on('pointerover', () => draw(HOVER_FILL))
  container.on('pointerout', () => draw(NORMAL_FILL))
  container.on('pointerdown', () => draw(DOWN_FILL))
  container.on('pointerup', () => {
    draw(HOVER_FILL)
    onClick()
  })

}
export function createTextImageButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  onClick: () => void,
  image?: string | {
    key: string
    width?: number
    height?: number
  }
): Phaser.GameObjects.Container {

  const height = 65

  const imageConfig = typeof image === 'string'
    ? {
        key: image,
        width: width,
        height: height
      }
    : image ?? null

  // ボタン背景
  const bg = imageConfig
    ? scene.add.image(0, 0, imageConfig.key)
        .setDisplaySize(
          imageConfig.width ?? width,
          imageConfig.height ?? height
        )
    : scene.add.rectangle(
        0,
        0,
        width,
        height,
        NORMAL_FILL
      )

  // テキストは中央
  const text = scene.add.text(
    0,
    0,
    label,
    {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: TEXT_COLOR,
      fontStyle: 'bold',
      align: 'center'
    }
  ).setOrigin(0.5)

  const container = scene.add.container(x, y, [
    bg,
    text
  ])

  container.setSize(width, height)

  container.setInteractive({
    useHandCursor: true
  })

  container.on('pointerover', () => {
    bg.setAlpha(0.8)
  })

  container.on('pointerout', () => {
    bg.setAlpha(1)
  })

  container.on('pointerdown', () => {
    onClick()
  })

  return container
}

export const createButton = createTextImageButton
