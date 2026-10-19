import Phaser from 'phaser';
import mapJson from '../../assets/stage/test/test_map.json';
import grassImg from '../../assets/stage/test/grass.png';
import bagButton from '../../assets/button/bag_button.png';
import retreatButton from '../../assets/button/retreat_button.png';
import attackButton from '../../assets/button/attack_button.png';
import jumpButton from '../../assets/button/jump_button.png';
import skillButton from '../../assets/button/skill_button.png';
import flowerIcon from '../../assets/flower.png';
import { loadCharacterAnimation, createCharacterAnimation } from '../../animation/animation.ts';
import { characterAnimations } from '../../animation/animationData.ts';

// 分割したクラスのインポート
import { Player } from './Player.ts';
import { StageHUD } from './StageHUD.ts';
import { SCENE_KEYS } from '../sceneKeys';

export class StageScene extends Phaser.Scene {
  private player!: Player;
  private hud!: StageHUD;

  constructor() {
    super({ key: SCENE_KEYS.STAGE });
  }

  preload(): void {
    this.load.image('tiles', grassImg);
    this.load.image('stage-bag', bagButton);
    this.load.image('stage-retreat', retreatButton);
    this.load.image('stage-attack', attackButton);
    this.load.image('stage-jump', jumpButton);
    this.load.image('stage-skill', skillButton);
    this.load.image('stage-flower', flowerIcon);
    this.load.tilemapTiledJSON('map', mapJson);

    const playerData = characterAnimations.player;
    loadCharacterAnimation(this, 'player_run', playerData.run);
    loadCharacterAnimation(this, 'player_idle', playerData.idle);
    loadCharacterAnimation(this, 'player_jump', playerData.jump);
    loadCharacterAnimation(this, 'player_fall', playerData.fall);
    loadCharacterAnimation(this, 'player_land', playerData.land);
    loadCharacterAnimation(this, 'player_attack', playerData.attack);
  }

  create(data: { stageId?: number } = {}): void {
    this.physics.world.drawDebug = false;
    const map = this.createMap();
    if (!map) return;

    this.createPlayerAnimations();

    const spawnObject = this.findPlayerSpawn(map);
    const spawnPosition = this.getSpawnPosition(spawnObject);
    
    const cursors = this.input.keyboard?.createCursorKeys();

    // プレイヤーの生成と設定を Player クラスに委譲
    this.player = new Player(this, spawnPosition.x, spawnPosition.y, cursors);
    this.player.setupHitbox(spawnObject, map.tileWidth, map.tileHeight);
    
    if (spawnObject) {
      this.player.adjustPosition(spawnObject);
    }

    this.setupWorld(map);

    // UI（HUD）の生成を StageHUD クラスに委譲
    this.hud = new StageHUD(this, this.player);
    this.hud.create(data.stageId);
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
    return map;
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

    for (const action of ['jump', 'fall', 'land', 'attack'] as const) {
      const animation = playerData[action];
      const textureKey = `player_${action}`;
      createCharacterAnimation(
        this,
        `player-${action}`,
        textureKey,
        animation.frameCount,
        animation.frameRate,
        action === 'land' || action === 'attack' ? 0 : -1
      );
    }
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
  // 更新処理
  // =========================
  update(): void {
    // プレイヤーの更新処理を呼び出す
    if (this.player) {
      this.player.update();
    }
  }
}
