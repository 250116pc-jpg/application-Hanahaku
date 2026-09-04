import Phaser from 'phaser'
import mapJson from '../assets/stage/test/test_map.json'
import grassImg from '../assets/stage/test/grass.png'
import {
  loadCharacterAnimation,
  createCharacterAnimation,
  changeCharacterAnimation
} from '../animation/animation'
import { characterAnimations } from '../animation/animationData'

export class StageScene extends Phaser.Scene {
  // =========================
  // プロパティ
  // =========================
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null
  private retreatPopup?: Phaser.GameObjects.Container

  // =========================
  // 定数
  // =========================
  private readonly PLAYER_SPEED = 160
  private readonly JUMP_POWER = 330
  private readonly HUD_DEPTH = 2000
  private readonly POPUP_DEPTH = 4000

  constructor() {
    super({ key: 'StageScene' })
  }

  // ==================================================
  // preload
  // ==================================================
  preload(): void {
    // マップ
    this.load.image('tiles', grassImg)
    this.load.tilemapTiledJSON('map', mapJson)

    // プレイヤー
    const playerData = characterAnimations.player
    loadCharacterAnimation(this, 'player_run', playerData.run)
    loadCharacterAnimation(this, 'player_idle', playerData.idle)
  }

  // ==================================================
  // create
  // ==================================================
  create(): void {
    // マップ生成
    const map = this.createMap()
    if (!map) return

    // プレイヤーアニメーション
    this.createPlayerAnimations()

    // プレイヤー生成
    const spawnObject = this.findPlayerSpawn(map)
    const spawnPosition = this.getSpawnPosition(spawnObject)
    this.createPlayer(spawnPosition.x, spawnPosition.y, spawnObject)

    // カメラ・物理範囲
    this.setupWorld(map)

    // キー入力
    this.cursors = this.input.keyboard?.createCursorKeys() ?? null

    // HUD
    this.createStageHud()
  }

  // ==================================================
  // マップ作成
  // ==================================================
  private createMap(): Phaser.Tilemaps.Tilemap | null {
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('grass', 'tiles')

    if (!tileset) {
      console.error('tileset が見つかりませんでした')
      return null
    }

    const layer = map.createLayer('タイルレイヤー1', tileset, 0, 0)
    if (!layer) {
      console.error('layer が作成されませんでした')
      return null
    }

    layer.setCollisionByExclusion([-1])
    this.createMapDebug(layer)

    return map
  }

  private createMapDebug(layer: Phaser.Tilemaps.TilemapLayer): void {
    const debugGraphics = this.add.graphics().setAlpha(0.75)

    try {
      this.physics.world.createDebugGraphic()
      this.physics.world.drawDebug = true
      this.physics.world.debugGraphic = debugGraphics
    } catch {
      // 使用できない場合は無視
    }

    try {
      layer.renderDebug(debugGraphics, {
        tileColor: new Phaser.Display.Color(0, 0, 0, 0),
        collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
        faceColor: new Phaser.Display.Color(0, 255, 0, 255)
      })
    } catch {
      // 使用できない場合は無視
    }
  }

  // ==================================================
  // プレイヤー関連
  // ==================================================
  private createPlayerAnimations(): void {
    const playerData = characterAnimations.player
    createCharacterAnimation(this, 'player-run', 'player_run', playerData.run.frameCount, playerData.run.frameRate)
    createCharacterAnimation(this, 'player-idle', 'player_idle', playerData.idle.frameCount, playerData.idle.frameRate)
  }

  private findPlayerSpawn(map: Phaser.Tilemaps.Tilemap): Phaser.Types.Tilemaps.TiledObject | undefined {
    const objectLayerNames = ['Objects', 'Object Layer 1', 'Object Layer', 'objects', 'Spawn']

    for (const name of objectLayerNames) {
      const objectLayer = map.getObjectLayer(name)
      if (!objectLayer || !objectLayer.objects || objectLayer.objects.length === 0) continue

      const playerObject = objectLayer.objects.find(
        object => object.name === 'player' || object.type === 'player'
      )
      return playerObject ?? objectLayer.objects[0]
    }
    return undefined
  }

  private getSpawnPosition(spawnObject?: Phaser.Types.Tilemaps.TiledObject): { x: number; y: number } {
    const defaultX = 400
    const defaultY = 200

    if (!spawnObject) return { x: defaultX, y: defaultY }
    return { x: spawnObject.x ?? defaultX, y: spawnObject.y ?? defaultY }
  }

  private createPlayer(spawnX: number, spawnY: number, spawnObject?: Phaser.Types.Tilemaps.TiledObject): void {
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle')
    this.player.setScale(1).setCollideWorldBounds(true).setOrigin(0.5, 1)
    this.player.play('player-idle')
    
    this.setupPlayerHitbox(spawnObject)
    if (spawnObject) this.adjustPlayerPosition(spawnObject)
  }

  private setupPlayerHitbox(spawnObject?: Phaser.Types.Tilemaps.TiledObject): void {
    const map = this.make.tilemap({ key: 'map' })
    const tileW = map.tileWidth ?? 16
    const tileH = map.tileHeight ?? 16
    const spriteW = Math.round(this.player.displayWidth)
    const spriteH = Math.round(this.player.displayHeight)

    const hitboxWidthDefault = Math.min(tileW, Math.max(12, Math.round(spriteW * 0.6)))
    const hitboxHeightDefault = Math.min(tileH, Math.max(12, Math.round(spriteH * 0.8)))

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const hitboxWidth = spawnObject?.width || hitboxWidthDefault
    const hitboxHeight = spawnObject?.height || hitboxHeightDefault

    body.setSize(hitboxWidth, hitboxHeight)
    body.setOffset(80, 100)
  }

  private adjustPlayerPosition(spawnObject: Phaser.Types.Tilemaps.TiledObject): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const desiredBottom = spawnObject.y ?? this.player.y
    const centerX = (spawnObject.x ?? this.player.x) + ((spawnObject.width ?? 0) / 2)

    this.player.x = centerX
    this.player.y = Math.round(desiredBottom + this.player.displayHeight - body.offset.y - body.height)
  }

  // ==================================================
  // ワールド設定
  // ==================================================
  private setupWorld(map: Phaser.Tilemaps.Tilemap): void {
    const width = map.widthInPixels
    const height = map.heightInPixels

    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height)
    this.cameras.main.startFollow(this.player)

    const layer = this.children.list.find(
      object => object instanceof Phaser.Tilemaps.TilemapLayer
    ) as Phaser.Tilemaps.TilemapLayer

    if (layer) {
      this.physics.add.collider(this.player, layer)
    }
  }

  // ==================================================
  // HUD関連
  // ==================================================
  private createStageHud(): void {
    const width = this.scale.width

    // HP
    this.add.text(20, 16, 'HP:', this.getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(245, 32, 330, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(245, 32, 330, 20, 0x16a526).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1)

    // MP
    this.add.text(20, 50, 'MP:', this.getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(180, 66, 200, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(180, 66, 200, 20, 0x16a9b5).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1)

    // ボタン
    this.createHudButton(72, 118, 'バッグ', () => this.openInventory())
    this.createHudButton(width - 95, 65, '撤退', () => this.showRetreatPopup())
  }

  private createHudButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      ...this.getTextStyle(22),
      backgroundColor: '#ffffff',
      padding: { top: 12, bottom: 12, left: 18, right: 18 }
    })

    button
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH)
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

  // ==================================================
  // 撤退確認ポップアップ
  // ==================================================
  private showRetreatPopup(): void {
    if (this.retreatPopup) return

    const width = this.scale.width
    const height = this.scale.height

    this.retreatPopup = this.add.container(0, 0).setDepth(this.POPUP_DEPTH).setScrollFactor(0)

    const darkBackground = this.add.rectangle(width / 2, height / 2, width + 300, height + 300, 0x000000, 0.55)
    darkBackground.setScrollFactor(0).setInteractive()

    const popup = this.add.rectangle(width / 2, height / 2, 650, 330, 0xffffff)
    popup.setScrollFactor(0).setStrokeStyle(3, 0x536878)

    const title = this.add.text(width / 2, height / 2 - 90, 'ステージから撤退しますか？', this.getTextStyle(30))
    title.setOrigin(0.5).setScrollFactor(0)

    const warning = this.add.text(width / 2, height / 2 - 20, '進行状況が失われます。', {
      ...this.getTextStyle(22),
      color: '#444444'
    })
    warning.setOrigin(0.5).setScrollFactor(0)

    const cancelButton = this.createPopupButton(width / 2 - 150, height / 2 + 90, 'キャンセル', () => this.closeRetreatPopup())
    const retreatButton = this.createPopupButton(width / 2 + 150, height / 2 + 90, '撤退する', () => this.retreatFromStage())

    this.retreatPopup.add([darkBackground, popup, title, warning, cancelButton, retreatButton])
  }

  private createPopupButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const background = this.add.rectangle(0, 0, 210, 70, 0xffffff)
    background.setStrokeStyle(2, 0x333333).setInteractive({ useHandCursor: true })

    const text = this.add.text(0, 0, label, this.getTextStyle(23)).setOrigin(0.5)
    const button = this.add.container(x, y, [background, text]).setScrollFactor(0)

    background.on('pointerover', () => background.setFillStyle(0xeaf4fb))
    background.on('pointerout', () => background.setFillStyle(0xffffff))
    background.on('pointerdown', () => background.setFillStyle(0xd5e8f5))
    background.on('pointerup', () => onClick())

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

  // ==================================================
  // ユーティリティ
  // ==================================================
  private getTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: { top: 4, bottom: 4, left: 4, right: 4 }
    }
  }

  // ==================================================
  // update
  // ==================================================
  update(): void {
    if (!this.player || !this.cursors) return

    const body = this.player.body as Phaser.Physics.Arcade.Body

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-this.PLAYER_SPEED)
      this.player.setFlipX(true)
      changeCharacterAnimation(this.player, 'run')
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(this.PLAYER_SPEED)
      this.player.setFlipX(false)
      changeCharacterAnimation(this.player, 'run')
    } else {
      this.player.setVelocityX(0)
      changeCharacterAnimation(this.player, 'idle')
    }

    if (this.cursors.up?.isDown && body.blocked.down) {
      this.player.setVelocityY(-this.JUMP_POWER)
    }
  }
}