import Phaser from 'phaser'
import mapJson from '../assets/stage/test/test_map.json'
import grassImg from '../assets/stage/test/grass.png'
import player_idle_img from '../assets/player/Red Cape Knight Character Asset/Red GIF/Hunter_3_idle.gif'

export class StageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null
  private retreatPopup?: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'StageScene' })
  }

  preload() {
    this.load.image('tiles', grassImg)
    this.load.tilemapTiledJSON('map', mapJson)
    this.load.image('player', player_idle_img)
  }

  create() {
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('grass', 'tiles')

    if (!tileset) {
      console.error('tileset が見つかりませんでした')
      return
    }

    const layer = map.createLayer('タイルレイヤー1', tileset, 0, 0)
    if (!layer) {
      console.error('layer が作成されませんでした')
      return
    }

    layer.setCollisionByExclusion([-1])

    const debugGraphics = this.add.graphics().setAlpha(0.75)
    try {
      this.physics.world.createDebugGraphic()
      this.physics.world.drawDebug = true
      this.physics.world.debugGraphic = debugGraphics
    } catch {
      // ignore if not available in this Phaser build
    }

    try {
      layer.renderDebug(debugGraphics, {
        tileColor: new Phaser.Display.Color(0, 0, 0, 0),
        collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
        faceColor: new Phaser.Display.Color(0, 255, 0, 255)
      })
    } catch {
      // ignore if renderDebug unavailable
    }

    const objectLayerNames = ['Objects', 'Object Layer 1', 'Object Layer', 'objects', 'Spawn']
    let spawnObject: Phaser.Types.Tilemaps.TiledObject | undefined
    for (const name of objectLayerNames) {
      const ol = map.getObjectLayer(name)
      if (ol && ol.objects && ol.objects.length > 0) {
        spawnObject = ol.objects.find((o) => (o.name === 'player' || o.type === 'player')) || ol.objects[0]
        break
      }
    }

    let spawnX = 400
    let spawnY = 300
    if (spawnObject) {
      spawnX = spawnObject.x ?? spawnX
      spawnY = spawnObject.y ?? spawnY
    }

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player').setScale(0.6).setCollideWorldBounds(true).setOrigin(0.5, 1)

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.startFollow(this.player)
    this.physics.add.collider(this.player, layer)

    const tileW = map.tileWidth ?? 32
    const tileH = map.tileHeight ?? 32
    const spriteW = Math.round(this.player.displayWidth)
    const spriteH = Math.round(this.player.displayHeight)
    const hitboxWidthDefault = Math.min(tileW, Math.max(12, Math.round(spriteW * 0.6)))
    const hitboxHeightDefault = Math.min(tileH, Math.max(12, Math.round(spriteH * 0.8)))
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const hbW = spawnObject && spawnObject.width ? spawnObject.width : hitboxWidthDefault
    const hbH = spawnObject && spawnObject.height ? spawnObject.height : hitboxHeightDefault
    body.setSize(hbW, hbH)

    const offsetX = 80
    const offsetY = 100
    body.setOffset(offsetX, offsetY)

    if (spawnObject) {
      const desiredBottom = spawnObject.y ?? spawnY
      const centerX = (spawnObject.x ?? spawnX) + ((spawnObject.width ?? 0) / 2)
      this.player.x = centerX
      this.player.y = Math.round(desiredBottom + this.player.displayHeight - offsetY - hbH)
    }

    this.cursors = this.input.keyboard?.createCursorKeys() ?? null
    this.createStageHud()
  }

  private createStageHud(): void {
    const width = this.scale.width

    this.add.text(20, 16, 'HP:', this.getTextStyle(22)).setScrollFactor(0).setDepth(2000)
    this.add.rectangle(245, 32, 330, 20, 0x555555).setScrollFactor(0).setDepth(2000)
    this.add.rectangle(245, 32, 330, 20, 0x16a526).setScrollFactor(0).setDepth(2001)

    this.add.text(20, 50, 'MP:', this.getTextStyle(22)).setScrollFactor(0).setDepth(2000)
    this.add.rectangle(180, 66, 200, 20, 0x555555).setScrollFactor(0).setDepth(2000)
    this.add.rectangle(180, 66, 200, 20, 0x16a9b5).setScrollFactor(0).setDepth(2001)

    this.createHudButton(72, 118, 'バッグ', () => this.openInventory())
    this.createHudButton(width - 95, 65, '撤退', () => this.showRetreatPopup())
  }

  private createHudButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      ...this.getTextStyle(22),
      backgroundColor: '#ffffff',
      padding: { top: 12, bottom: 12, left: 18, right: 18 }
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: true })

    button.on('pointerover', () => button.setBackgroundColor('#eaf4fb'))
    button.on('pointerout', () => button.setBackgroundColor('#ffffff'))
    button.on('pointerdown', () => button.setBackgroundColor('#d5e8f5'))
    button.on('pointerup', () => {
      button.setBackgroundColor('#eaf4fb')
      onClick()
    })

    return button
  }

  private openInventory(): void {
    if (this.scene.isActive('InventoryScene')) return

    this.scene.launch('InventoryScene', { returnScene: 'StageScene' })
    this.scene.bringToTop('InventoryScene')
    this.scene.pause('StageScene')
  }

  private showRetreatPopup(): void {
    if (this.retreatPopup) return

    const width = this.scale.width
    const height = this.scale.height
    this.retreatPopup = this.add.container(0, 0).setDepth(4000).setScrollFactor(0)

    const darkBackground = this.add.rectangle(
      width / 2,
      height / 2,
      width + 300,
      height + 300,
      0x000000,
      0.55
    ).setScrollFactor(0).setInteractive()

    const popup = this.add.rectangle(width / 2, height / 2, 650, 330, 0xffffff)
      .setScrollFactor(0)
      .setStrokeStyle(3, 0x536878)
    const title = this.add.text(
      width / 2,
      height / 2 - 90,
      'ステージから撤退しますか？',
      this.getTextStyle(30)
    ).setOrigin(0.5).setScrollFactor(0)
    const warning = this.add.text(
      width / 2,
      height / 2 - 20,
      '進行状況が失われます。',
      { ...this.getTextStyle(22), color: '#444444' }
    ).setOrigin(0.5).setScrollFactor(0)
    const cancelButton = this.createPopupButton(
      width / 2 - 150,
      height / 2 + 90,
      'キャンセル',
      () => this.closeRetreatPopup()
    )
    const retreatButton = this.createPopupButton(
      width / 2 + 150,
      height / 2 + 90,
      '撤退する',
      () => this.retreatFromStage()
    )

    this.retreatPopup.add([
      darkBackground,
      popup,
      title,
      warning,
      cancelButton,
      retreatButton
    ])
  }

  private createPopupButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const background = this.add.rectangle(0, 0, 210, 70, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setInteractive({ useHandCursor: true })
    const text = this.add.text(0, 0, label, this.getTextStyle(23)).setOrigin(0.5)
    const button = this.add.container(x, y, [background, text]).setScrollFactor(0)

    background.on('pointerover', () => background.setFillStyle(0xeaf4fb))
    background.on('pointerout', () => background.setFillStyle(0xffffff))
    background.on('pointerdown', () => background.setFillStyle(0xd5e8f5))
    background.on('pointerup', onClick)
    return button
  }

  private closeRetreatPopup(): void {
    if (!this.retreatPopup) return
    this.retreatPopup.destroy(true)
    this.retreatPopup = undefined
  }

  private retreatFromStage(): void {
    this.closeRetreatPopup()
    this.scene.start('SelectStageScene')
  }

  private getTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: { top: 4, bottom: 4, left: 4, right: 4 }
    }
  }

  update() {
    if (!this.player || !this.cursors) return
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const speed = 160
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed)
      this.player.setFlipX(true)
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed)
      this.player.setFlipX(false)
    } else {
      this.player.setVelocityX(0)
    }

    if (this.cursors.up?.isDown && body.blocked.down) {
      this.player.setVelocityY(-330)
    }
  }
}
