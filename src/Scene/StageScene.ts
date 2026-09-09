import Phaser from 'phaser'; // ← 直しました
import mapJson from '../assets/stage/test/test_map.json';
import grassImg from '../assets/stage/test/grass.png';
import {
  loadCharacterAnimation,
  createCharacterAnimation,
  changeCharacterAnimation
} from '../animation/animation';
import { characterAnimations } from '../animation/animationData';

// ★ ここで ui.ts の関数をインポートします（パスは実際の構成に合わせて調整してください）
import { getTextStyle, createTextButton, showRetreatDialog } from '../utils/ui';

export class StageScene extends Phaser.Scene {
  // ... 以下省略 ...
  // =========================
  // プロパティ
  // =========================
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null
  // ※ retreatPopup プロパティは ui.ts 側で管理されるため削除

  // =========================
  // 定数
  // =========================
  private readonly PLAYER_SPEED = 160
  private readonly JUMP_POWER = 330
  private readonly HUD_DEPTH = 2000
  // ※ POPUP_DEPTH も ui.ts 内で指定しているため削除

  constructor() {
    super({ key: 'StageScene' })
  }

  // ==================================================
  // preload, create, マップ作成, プレイヤー関連, ワールド設定
  // (※変更なしのため省略せずそのまま記述します)
  // ==================================================
  preload(): void {
    this.load.image('tiles', grassImg)
    this.load.tilemapTiledJSON('map', mapJson)

    const playerData = characterAnimations.player
    loadCharacterAnimation(this, 'player_run', playerData.run)
    loadCharacterAnimation(this, 'player_idle', playerData.idle)
  }

  create(): void {
    const map = this.createMap()
    if (!map) return

    this.createPlayerAnimations()

    const spawnObject = this.findPlayerSpawn(map)
    const spawnPosition = this.getSpawnPosition(spawnObject)
    this.createPlayer(spawnPosition.x, spawnPosition.y, spawnObject)

    this.setupWorld(map)
    this.cursors = this.input.keyboard?.createCursorKeys() ?? null
    this.createStageHud()
  }

  private createMap(): Phaser.Tilemaps.Tilemap | null {
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('grass', 'tiles')
    if (!tileset) return null

    const layer = map.createLayer('タイルレイヤー1', tileset, 0, 0)
    if (!layer) return null

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
      layer.renderDebug(debugGraphics, {
        tileColor: new Phaser.Display.Color(0, 0, 0, 0),
        collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
        faceColor: new Phaser.Display.Color(0, 255, 0, 255)
      })
    } catch {}
  }

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
      const playerObject = objectLayer.objects.find(object => object.name === 'player' || object.type === 'player')
      return playerObject ?? objectLayer.objects[0]
    }
    return undefined
  }

  private getSpawnPosition(spawnObject?: Phaser.Types.Tilemaps.TiledObject): { x: number; y: number } {
    return { x: spawnObject?.x ?? 400, y: spawnObject?.y ?? 200 }
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
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const hitboxWidth = spawnObject?.width || Math.min(map.tileWidth ?? 16, Math.max(12, Math.round(this.player.displayWidth * 0.6)))
    const hitboxHeight = spawnObject?.height || Math.min(map.tileHeight ?? 16, Math.max(12, Math.round(this.player.displayHeight * 0.8)))

    body.setSize(hitboxWidth, hitboxHeight)
    body.setOffset(80, 100)
  }

  private adjustPlayerPosition(spawnObject: Phaser.Types.Tilemaps.TiledObject): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    this.player.x = (spawnObject.x ?? this.player.x) + ((spawnObject.width ?? 0) / 2)
    this.player.y = Math.round((spawnObject.y ?? this.player.y) + this.player.displayHeight - body.offset.y - body.height)
  }

  private setupWorld(map: Phaser.Tilemaps.Tilemap): void {
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.startFollow(this.player)

    const layer = this.children.list.find(object => object instanceof Phaser.Tilemaps.TilemapLayer) as Phaser.Tilemaps.TilemapLayer
    if (layer) this.physics.add.collider(this.player, layer)
  }

  // ==================================================
  // ★HUD関連 (ui.tsを使用して大幅にスッキリさせました)
  // ==================================================
  private createStageHud(): void {
    const width = this.scale.width

    // HP
    this.add.text(20, 16, 'HP:', getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(245, 32, 330, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(245, 32, 330, 20, 0x16a526).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1)

    // MP
    this.add.text(20, 50, 'MP:', getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(180, 66, 200, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH)
    this.add.rectangle(180, 66, 200, 20, 0x16a9b5).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1)

    // ボタン (createTextButtonで生成後、Depthだけ上書き設定)
    createTextButton(this, 72, 118, 'バッグ', () => this.openInventory(), { fontSize: 22 })
      .setDepth(this.HUD_DEPTH)

    createTextButton(this, width - 95, 65, '撤退', () => {
      // 撤退時のアクションをコールバックで渡すだけ
      showRetreatDialog(this, () => this.scene.start('SelectStageScene'))
    }, { fontSize: 22 })
      .setDepth(this.HUD_DEPTH)
  }

  private openInventory(): void {
    if (this.scene.isActive('InventoryScene')) return
    this.scene.launch('InventoryScene', { returnScene: 'StageScene' })
    this.scene.bringToTop('InventoryScene')
    this.scene.pause('StageScene')
  }

  // ※ ここにあった createHudButton, showRetreatPopup, createPopupButton, closeRetreatPopup, retreatFromStage, getTextStyle はすべて削除！

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