import Phaser from 'phaser';
import mapJson from '../assets/stage/test/test_map.json';
import grassImg from '../assets/stage/test/grass.png';

import {
  loadCharacterAnimation,
  createCharacterAnimation,
  changeCharacterAnimation
} from '../animation/animation';

import { characterAnimations } from '../animation/animationData';
import { getTextStyle, createTextButton, showRetreatDialog } from '../utils/ui/index.ts';
import testData from './test_data';

export class StageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null;

  private readonly PLAYER_SPEED = 160;
  private readonly JUMP_POWER = 330;
  private readonly HUD_DEPTH = 2000;

  constructor() {
    super({ key: 'StageScene' });
  }

  preload(): void {
    this.load.image('tiles', grassImg);
    this.load.tilemapTiledJSON('map', mapJson);

    const playerData = characterAnimations.player;
    loadCharacterAnimation(this, 'player_run', playerData.run);
    loadCharacterAnimation(this, 'player_idle', playerData.idle);
  }

  create(): void {
    const map = this.createMap();
    if (!map) return;

    this.createPlayerAnimations();

    const spawnObject = this.findPlayerSpawn(map);
    const spawnPosition = this.getSpawnPosition(spawnObject);
    
    this.createPlayer(spawnPosition.x, spawnPosition.y, spawnObject);
    this.setupWorld(map);

    this.cursors = this.input.keyboard?.createCursorKeys() ?? null;

    this.createStageHud();
    this.createPartyHud();
  }

  // =========================
  // マップ作成
  // =========================
  private createMap(): Phaser.Tilemaps.Tilemap | null {
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('grass', 'tiles');

    if (!tileset) return null;

    const layer = map.createLayer('タイルレイヤー1', tileset, 0, 0);
    if (!layer) return null;

    layer.setCollisionByExclusion([-1]);
    this.createMapDebug(layer);

    return map;
  }

  private createMapDebug(layer: Phaser.Tilemaps.TilemapLayer): void {
    const debugGraphics = this.add.graphics().setAlpha(0.75);

    try {
      this.physics.world.createDebugGraphic();
      this.physics.world.drawDebug = true;
      this.physics.world.debugGraphic = debugGraphics;

      layer.renderDebug(debugGraphics, {
        tileColor: new Phaser.Display.Color(0, 0, 0, 0),
        collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
        faceColor: new Phaser.Display.Color(0, 255, 0, 255)
      });
    } catch {}
  }

  // =========================
  // プレイヤーアニメーション
  // =========================
  private createPlayerAnimations(): void {
    const playerData = characterAnimations.player;

    createCharacterAnimation(
      this,
      'player-run',
      'player_run',
      playerData.run.frameCount,
      playerData.run.frameRate
    );

    createCharacterAnimation(
      this,
      'player-idle',
      'player_idle',
      playerData.idle.frameCount,
      playerData.idle.frameRate
    );
  }

  // =========================
  // プレイヤー出現位置
  // =========================
  private findPlayerSpawn(map: Phaser.Tilemaps.Tilemap): Phaser.Types.Tilemaps.TiledObject | undefined {
    const objectLayerNames = ['Objects', 'Object Layer 1', 'Object Layer', 'objects', 'Spawn'];

    for (const name of objectLayerNames) {
      const objectLayer = map.getObjectLayer(name);

      if (!objectLayer || !objectLayer.objects || objectLayer.objects.length === 0) {
        continue;
      }

      const playerObject = objectLayer.objects.find(
        object => object.name === 'player' || object.type === 'player'
      );

      return playerObject ?? objectLayer.objects[0];
    }

    return undefined;
  }

  private getSpawnPosition(spawnObject?: Phaser.Types.Tilemaps.TiledObject): { x: number; y: number } {
    return {
      x: spawnObject?.x ?? 400,
      y: spawnObject?.y ?? 200
    };
  }

  // =========================
  // プレイヤー作成
  // =========================
  private createPlayer(
    spawnX: number,
    spawnY: number,
    spawnObject?: Phaser.Types.Tilemaps.TiledObject
  ): void {
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle');

    this.player
      .setScale(1)
      .setCollideWorldBounds(true)
      .setOrigin(0.5, 1);

    this.player.play('player-idle');
    this.setupPlayerHitbox(spawnObject);

    if (spawnObject) {
      this.adjustPlayerPosition(spawnObject);
    }
  }

  private setupPlayerHitbox(spawnObject?: Phaser.Types.Tilemaps.TiledObject): void {
    const map = this.make.tilemap({ key: 'map' });
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const hitboxWidth = spawnObject?.width || Math.min(
      map.tileWidth ?? 16,
      Math.max(12, Math.round(this.player.displayWidth * 0.6))
    );

    const hitboxHeight = spawnObject?.height || Math.min(
      map.tileHeight ?? 16,
      Math.max(12, Math.round(this.player.displayHeight * 0.8))
    );

    body.setSize(hitboxWidth, hitboxHeight);
    body.setOffset(80, 100);
  }

  private adjustPlayerPosition(spawnObject: Phaser.Types.Tilemaps.TiledObject): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    this.player.x = (spawnObject.x ?? this.player.x) + ((spawnObject.width ?? 0) / 2);
    this.player.y = Math.round(
      (spawnObject.y ?? this.player.y) + this.player.displayHeight - body.offset.y - body.height
    );
  }

  // =========================
  // ワールド設定
  // =========================
  private setupWorld(map: Phaser.Tilemaps.Tilemap): void {
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    const layer = this.children.list.find(
      object => object instanceof Phaser.Tilemaps.TilemapLayer
    ) as Phaser.Tilemaps.TilemapLayer;

    if (layer) {
      this.physics.add.collider(this.player, layer);
    }
  }

  // =========================
  // ステージHUD
  // =========================
  private createStageHud(): void {
    const width = this.scale.width;

    // HP
    this.add.text(20, 16, 'HP:', getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.add.rectangle(245, 32, 330, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.add.rectangle(245, 32, 330, 20, 0x16a526).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1);

    // MP
    this.add.text(20, 50, 'MP:', getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.add.rectangle(180, 66, 200, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.add.rectangle(180, 66, 200, 20, 0x16a9b5).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1);

    // バッグ
    createTextButton(this, 72, 118, 'バッグ', () => this.openInventory(), { fontSize: 22 })
      .setDepth(this.HUD_DEPTH);

    // 撤退
    createTextButton(
      this, width - 95, 65, '撤退',
      () => {
        showRetreatDialog(this, () => this.scene.start('SelectStageScene'));
      },
      { fontSize: 22 }
    ).setDepth(this.HUD_DEPTH);
  }

  // =========================
  // パーティHUD
  // =========================
  private createPartyHud(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const formation = testData.formation;

    for (let i = 0; i < 4; i++) {
      const characterId = formation[i];

      // 4人を横一列に配置
      const x = width / 2 - 450 + i * 300;
      const y = height - 75;

      // 枠
      this.add.rectangle(x, y, 200, 110, 0xffffff, 0.9)
        .setStrokeStyle(2, 0x536878)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH);

      // キャラクター検索
      const character = testData.characters.find(c => c.id === characterId);

      // 空き枠
      if (!character) {
        this.add.text(x, y, '空き', getTextStyle(20, { color: '#777777' }))
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(this.HUD_DEPTH + 1);
        continue;
      }

      // 名前
      this.add.text(x, y - 40, character.name, getTextStyle(20, { fontStyle: 'bold' }))
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH + 1);

      // HPバー & 数値
      this.createProgressBar(x - 100, y - 100, 200, 16, character.stats.hp, character.stats.hp, 0xff2026);
      this.add.text(x, y - 8, `HP ${character.stats.hp}/${character.stats.hp}`, getTextStyle(13, { color: '#ffffff' }))
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH + 2);

      // MPバー & 数値
      this.createProgressBar(x - 100, y  - 82, 200, 16, character.stats.mp, character.stats.mp, 0x16a9b5);
      this.add.text(x, y + 20, `MP ${character.stats.mp}/${character.stats.mp}`, getTextStyle(13, { color: '#ffffff' }))
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH + 2);
    }
  }

  // =========================
  // プログレスバー作成
  // =========================
  private createProgressBar(
    x: number, y: number, width: number, height: number,
    value: number, maxValue: number, color: number
  ): void {
    // 背景
    this.add.rectangle(x + width / 2, y + height / 2, width+5, height+5, 0x555555)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH + 1);

    // 現在値
    const percent = Phaser.Math.Clamp(value / maxValue, 0, 1);
    const currentWidth = width * percent;

    if (currentWidth <= 0) return;

    this.add.rectangle(x + currentWidth / 2, y + height / 2, currentWidth, height, color)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH + 2);
  }

  // =========================
  // バッグ
  // =========================
  private openInventory(): void {
    if (this.scene.isActive('InventoryScene')) return;

    this.scene.launch('InventoryScene', { returnScene: 'StageScene' });
    this.scene.bringToTop('InventoryScene');
    this.scene.pause('StageScene');
  }

  // =========================
  // 更新処理
  // =========================
  update(): void {
    if (!this.player || !this.cursors) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // 左右移動と停止
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-this.PLAYER_SPEED);
      this.player.setFlipX(true);
      changeCharacterAnimation(this.player, 'run');
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(this.PLAYER_SPEED);
      this.player.setFlipX(false);
      changeCharacterAnimation(this.player, 'run');
    } else {
      this.player.setVelocityX(0);
      changeCharacterAnimation(this.player, 'idle');
    }

    // ジャンプ
    if (this.cursors.up?.isDown && body.blocked.down) {
      this.player.setVelocityY(-this.JUMP_POWER);
    }
  }
}