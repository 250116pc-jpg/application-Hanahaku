import Phaser from 'phaser'
import mapJson from './assets/test_map.json'
import grassImg from './assets/grass.png'
import player_idle_img from './assets/player/Red Cape Knight Character Asset/Red GIF/Hunter_3_idle.gif'

export class StageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  constructor() {
    super({ key: 'StageScene' })
  }
  preload() {
    this.load.image('tiles', grassImg)
    this.load.tilemapTiledJSON('map', mapJson)
    this.load.image('player', player_idle_img)
  }
  player_draw(){

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
        // タイルに当たり判定を設定
        layer.setCollisionByExclusion([-1])

        // デバッグ描画: タイルの当たり・物理ボディを可視化
        const debugGraphics = this.add.graphics().setAlpha(0.75)
        // arcade debug graphic
        try {
          this.physics.world.createDebugGraphic()
          this.physics.world.drawDebug = true
          this.physics.world.debugGraphic = debugGraphics
        } catch (e) {
          // ignore if not available in this Phaser build
        }
        // render tile collision debug
        try {
          layer.renderDebug(debugGraphics, {
            tileColor: new Phaser.Display.Color(0, 0, 0, 0),
            collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
            faceColor: new Phaser.Display.Color(0, 255, 0, 255)
          })
        } catch (e) {
          // ignore if renderDebug unavailable
        }

        // --- マップの Object layer からプレイヤースポーンを取得 ---
        const objectLayerNames = ['Objects', 'Object Layer 1', 'Object Layer', 'objects', 'Spawn']
        let spawnObject: Phaser.Types.Tilemaps.TiledObject | undefined
        for (const name of objectLayerNames) {
          const ol = map.getObjectLayer(name)
          if (ol && ol.objects && ol.objects.length > 0) {
            spawnObject = ol.objects.find(o => (o.name === 'player' || o.type === 'player')) || ol.objects[0]
            break
          }
        }

        // デフォルトのスポーン位置
        let spawnX = 400
        let spawnY = 300
        if (spawnObject) {
          spawnX = (spawnObject.x ?? spawnX)
          // Tiled の object の y はオブジェクトの下端になる場合が多いので、そのまま使う
          spawnY = (spawnObject.y ?? spawnY)
        }

        // プレイヤーを作成して当たり判定を追加（スポーン位置）
        // プレイヤーの原点を下中央にして、Tiled のオブジェクト座標と合わせる
        this.player = this.physics.add.sprite(spawnX, spawnY, 'player').setScale(0.6).setCollideWorldBounds(true).setOrigin(0.5, 1)

        // ワールドサイズをマップに合わせる
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.startFollow(this.player)
        this.physics.add.collider(this.player, layer)

        // オブジェクトにサイズが指定されていれば当たり判定を合わせる
        // デフォルトはマップのタイルサイズやスプライト表示サイズから動的に決定
        const tileW = map.tileWidth ?? 32
        const tileH = map.tileHeight ?? 32
        const spriteW = Math.round(this.player.displayWidth)
        const spriteH = Math.round(this.player.displayHeight)
        const hitboxWidthDefault = Math.min(tileW, Math.max(12, Math.round(spriteW * 0.6)))
        const hitboxHeightDefault = Math.min(tileH, Math.max(12, Math.round(spriteH * 0.8)))
        const body = this.player.body as Phaser.Physics.Arcade.Body
        const hbW = spawnObject && spawnObject.width ? spawnObject.width : hitboxWidthDefault
        const hbH = spawnObject && spawnObject.height ? spawnObject.height : hitboxHeightDefault
        // body をスプライト下部に合わせる（origin が 0.5,1 のため）
        body.setSize(hbW, hbH)
        // ヒットボックスのオフセットは分かりやすく固定ピクセルで調整
        // padding はプレイヤーと地面の間に残したい隙間（px）
        const padding = 4
        const offsetX = 80
        const offsetY = 100
        body.setOffset(offsetX, offsetY)

        // Tiled オブジェクト座標とボディを厳密に合わせる
        if (spawnObject) {
          const desiredBottom = spawnObject.y
          // オブジェクトの x が左端なら中央に合わせる
          const centerX = (spawnObject.x ?? spawnX) + ((spawnObject.width ?? 0) / 2)
          this.player.x = centerX
          // player.y を計算してボディの下端が desiredBottom になるように設定
          // body bottom = player.y - originY*displayHeight + offsetY + hbH
          // originY = 1
          this.player.y = Math.round(desiredBottom + this.player.displayHeight - offsetY - hbH)
        }

        // 入力
        this.cursors = this.input.keyboard.createCursorKeys()
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