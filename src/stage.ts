import Phaser from 'phaser'
import mapJson from './assets/stage/test/test_map.json'
import grassImg from './assets/stage/test/grass.png'
import player_idle_img from './assets/player/Red Cape Knight Character Asset/Red GIF/Hunter_3_idle.gif'

export class StageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null

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