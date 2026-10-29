import formationData from '../../../php/flower/formation.json';
import { getPhpBaseUrl } from '../../auth/PhpBaseUrl';
import Phaser from 'phaser';
import mapUrl from '../../assets/stage/Cainos/cainos_stage.tmj?url';
import terrainImg from '../../assets/stage/Cainos/Pixel Art Platformer - Village Props/Texture/TX Tileset Ground.png';
import propsImg from '../../assets/stage/Cainos/Pixel Art Platformer - Village Props/Texture/TX Village Props.png';
import backgroundImg from '../../assets/stage/flower_ruins/flower_ruins_background.png';
import bagButton from '../../assets/ui/button/bag_button.png';
import attackButton from '../../assets/ui/button/attack_button.png';
import jumpButton from '../../assets/ui/button/jump_button.png';
import skillButton from '../../assets/ui/button/skill_button.png';
import flowerIcon from '../../assets/flower.png';
import skillIcon01 from '../../assets/system/skill/icons/icon_01.png';
import skillIcon02 from '../../assets/system/skill/icons/icon_02.png';
import skillIcon03 from '../../assets/system/skill/icons/icon_03.png';
import skillIcon04 from '../../assets/system/skill/icons/icon_04.png';
import skillIcon05 from '../../assets/system/skill/icons/icon_05.png';
import skillIcon06 from '../../assets/system/skill/icons/icon_06.png';
import skillIcon07 from '../../assets/system/skill/icons/icon_07.png';
import skillIcon08 from '../../assets/system/skill/icons/icon_08.png';
import skillIcon09 from '../../assets/system/skill/icons/icon_09.png';
import skillIcon10 from '../../assets/system/skill/icons/icon_10.png';
import enemyIdle from '../../assets/characters/enemy/Seeker_Lite/Spritesheets/Seeker_Void_Idle_30x30_24f.png';
import enemyRun from '../../assets/characters/enemy/Seeker_Lite/Spritesheets/Seeker_Void_Run_30x30_10f.png';
import enemyAttack from '../../assets/characters/enemy/Seeker_Lite/Spritesheets/Seeker_Void_Attack1_90x50_8f.png';
import enemyHurt from '../../assets/characters/enemy/Seeker_Lite/Spritesheets/Seeker_Void_Hurt_55x80_9f.png';
import enemyDeath from '../../assets/characters/enemy/Seeker_Lite/Spritesheets/Seeker_Void_Death_40x50_20f.png';
import playerHurt from '../../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_hurt.png';
import { loadCharacterAnimation, createCharacterAnimation } from '../../animation/animation.ts';
import { characterAnimations } from '../../animation/animationData.ts';

// 分割したクラスのインポート
import { Player } from './Player.ts';
import { Enemy } from './Enemy.ts';
import { StageHUD } from './StageHUD.ts';
import { SCENE_KEYS } from '../sceneKeys';
import { completeStage } from './StageProgress';
import testData from '../test_data';

const flowerCodes: Record<number, string> = Object.fromEntries(formationData.characters.map(flower => [flower.id, flower.code]));
const pixelFlowerUrls = import.meta.glob('../../assets/images/pixel_flowers/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
const skillEffectUrls = import.meta.glob('../../assets/system/skill/skill_effects_v2/sheets/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
const statusIconUrls = import.meta.glob('../../assets/images/status/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export class StageScene extends Phaser.Scene {
  private player!: Player;
  private hud!: StageHUD;
  private enemies: Enemy[] = [];
  private stageId = 2;
  private stageNumber?: string;
  private isEnding = false;

  constructor() {
    super({ key: SCENE_KEYS.STAGE });
  }

  init(data: { stageId?: number; stageNumber?: string } = {}): void {
    this.stageId = data.stageId ?? 2;
    this.stageNumber = data.stageNumber ?? testData.stages.find(stage => stage.id === this.stageId)?.name;
  }

  preload(): void {
    const phpBaseUrl = getPhpBaseUrl();
    this.load.image('stage-terrain', terrainImg);
    this.load.image('stage-props', propsImg);
    this.load.image('stage-background', backgroundImg);
    this.load.image('stage-bag', bagButton);
    this.load.image('stage-attack', attackButton);
    this.load.image('stage-jump', jumpButton);
    this.load.image('stage-skill', skillButton);
    this.load.image('stage-flower', flowerIcon);
    Object.entries(flowerCodes).forEach(([id, code]) => {
      const image = pixelFlowerUrls[`../../assets/images/pixel_flowers/${code}.png`];
      if (image) this.load.image(`stage-flower-${id}`, image);
    });
    Object.entries(skillEffectUrls).forEach(([path, image]) => {
      const key = path.split('/').pop()?.replace(/\.png$/i, '');
      if (key) this.load.spritesheet(`skill-effect-${key}`, image, { frameWidth: 192, frameHeight: 192 });
    });
    Object.entries(statusIconUrls).forEach(([path, image]) => {
      const key = path.split('/').pop()?.replace(/\.png$/i, '');
      if (key) this.load.image(`status-${key}`, image);
    });
    [
      skillIcon01, skillIcon02, skillIcon03, skillIcon04, skillIcon05,
      skillIcon06, skillIcon07, skillIcon08, skillIcon09, skillIcon10
    ].forEach((icon, index) => this.load.image(`flower-skill-${index + 1}`, icon));
    this.load.tilemapTiledJSON('map', mapUrl);
    this.load.json(`stage-data-${this.stageId}`, `${phpBaseUrl}/stage/data.php?id=${this.stageId}`);
    this.load.spritesheet('stage-enemy-idle', enemyIdle, { frameWidth: 30, frameHeight: 30 });
    this.load.spritesheet('stage-enemy-run', enemyRun, { frameWidth: 30, frameHeight: 30 });
    this.load.spritesheet('stage-enemy-attack', enemyAttack, { frameWidth: 90, frameHeight: 50 });
    this.load.spritesheet('stage-enemy-hurt', enemyHurt, { frameWidth: 55, frameHeight: 80 });
    this.load.spritesheet('stage-enemy-death', enemyDeath, { frameWidth: 40, frameHeight: 50 });

    const playerData = characterAnimations.player;
    loadCharacterAnimation(this, 'player_run', playerData.run);
    loadCharacterAnimation(this, 'player_idle', playerData.idle);
    loadCharacterAnimation(this, 'player_jump', playerData.jump);
    loadCharacterAnimation(this, 'player_fall', playerData.fall);
    loadCharacterAnimation(this, 'player_land', playerData.land);
    loadCharacterAnimation(this, 'player_attack', playerData.attack);
    loadCharacterAnimation(this, 'player_skill', playerData.skill);
    loadCharacterAnimation(this, 'player_defend', playerData.defend);
    loadCharacterAnimation(this, 'player_death', playerData.death);
    loadCharacterAnimation(this, 'player_hurt', {
      image: playerHurt,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 5,
      frameRate: 12
    });
    loadCharacterAnimation(this, 'player_drink', playerData.drink);
  }

  create(data: { stageId?: number; stageNumber?: string } = {}): void {
    this.isEnding = false;
    this.createSkillEffectAnimations();
    this.physics.world.drawDebug = false;
    const map = this.createMap();
    if (!map) return;

    this.add.image(0, 0, 'stage-background')
      .setOrigin(0, 0)
      .setDisplaySize(map.widthInPixels, Math.max(map.heightInPixels, this.scale.height))
      // Keep ruins and castle aligned with the tiled ground while the camera follows the player.
      .setScrollFactor(1, 1)
      .setDepth(-100);
    this.createMapDecorations(map);

    this.createPlayerAnimations();
    this.createEnemyAnimation();

    const spawnObject = this.findPlayerSpawn(map);
    const spawnPosition = this.getSpawnPosition(spawnObject);
    
    const cursors = this.input.keyboard?.createCursorKeys();

    // プレイヤーの生成と設定を Player クラスに委譲
    this.player = new Player(this, spawnPosition.x, spawnPosition.y, cursors);
    this.player.setupHitbox(spawnObject, map.tileWidth, map.tileHeight);
    
    if (spawnObject) {
      this.player.adjustPosition(spawnObject);
    }

    this.enemies = this.createEnemies(this.stageId);
    this.setupWorld(map);

    // UI（HUD）の生成を StageHUD クラスに委譲
    this.hud = new StageHUD(this, this.player, this.enemies);
    this.hud.create(data.stageId, data.stageNumber);
  }

  private createSkillEffectAnimations(): void {
    Object.keys(skillEffectUrls).forEach(path => {
      const sheet = path.split('/').pop()?.replace(/\.png$/i, '');
      if (!sheet) return;
      const texture = `skill-effect-${sheet}`;
      const animation = `skill-effect-${sheet}`;
      if (this.anims.exists(animation) || !this.textures.exists(texture)) return;
      this.anims.create({
        key: animation,
        frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 11 }),
        frameRate: 16,
        repeat: 0,
      });
    });
  }

  // =========================
  // マップ作成
  // =========================
  private createMap(): Phaser.Tilemaps.Tilemap | null {
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('Cainos Ground', 'stage-terrain');

    if (!tileset) return null;

    const layer = map.createLayer('地形', tileset, 0, 0);
    if (!layer) return null;

    layer.setCollisionByProperty({ solid: true });
    return map;
  }

  private createMapDecorations(map: Phaser.Tilemaps.Tilemap): void {
    const propsTexture = this.textures.get('stage-props');
    const propFrames = ['tree-01', 'tree-02', 'bush-02', 'bush-03', 'brick-wall'];
    const frames = [
      { key: 'tree-01', x: 833, y: 446, width: 153, height: 163 },
      { key: 'tree-02', x: 694, y: 471, width: 120, height: 138 },
      { key: 'bush-02', x: 452, y: 573, width: 89, height: 36 },
      { key: 'bush-03', x: 576, y: 572, width: 95, height: 37 },
      { key: 'brick-wall', x: 733, y: 629, width: 136, height: 43 },
    ];
    frames.forEach(frame => {
      if (!propsTexture.has(frame.key)) {
        propsTexture.add(frame.key, 0, frame.x, frame.y, frame.width, frame.height);
      }
    });

    const decorations = map.getObjectLayer('装飾');
    decorations?.objects.forEach(object => {
      const rawProperties = object.properties;
      const frameFromTile = object.gid === undefined ? undefined : propFrames[object.gid - 257];
      const frameFromProperty = Array.isArray(rawProperties)
        ? rawProperties.find(property => property.name === 'frame')?.value
        : (rawProperties as Record<string, unknown> | undefined)?.frame;
      const frame = frameFromTile ?? frameFromProperty;
      if (typeof frame !== 'string' || !propsTexture.has(frame)) return;

      const width = object.width ?? 0;
      const height = object.height ?? 0;
      const imageX = (object.x ?? 0) + width / 2;
      const imageY = (object.y ?? 0) + (object.gid === undefined ? height : 0);
      this.add.image(imageX, imageY, 'stage-props', frame)
        .setOrigin(0.5, 1)
        .setDisplaySize(width, height)
        .setScrollFactor(1, 1)
        .setDepth(-1);
    });
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

    for (const action of ['jump', 'fall', 'land', 'attack', 'skill', 'defend', 'death', 'drink'] as const) {
      const animation = playerData[action];
      const textureKey = `player_${action}`;
      createCharacterAnimation(
        this,
        `player-${action}`,
        textureKey,
        animation.frameCount,
        animation.frameRate,
        action === 'land' || action === 'attack' || action === 'skill' ||
          action === 'defend' || action === 'death' || action === 'drink' ? 0 : -1
      );
    }
    createCharacterAnimation(this, 'player-hurt', 'player_hurt', 5, 12, 0);
  }

  private createEnemyAnimation(): void {
    createCharacterAnimation(this, 'enemy-idle', 'stage-enemy-idle', 24, 8);
    createCharacterAnimation(this, 'enemy-run', 'stage-enemy-run', 10, 10);
    createCharacterAnimation(this, 'enemy-attack', 'stage-enemy-attack', 8, 10, 0);
    createCharacterAnimation(this, 'enemy-hurt', 'stage-enemy-hurt', 9, 10, 0);
    createCharacterAnimation(this, 'enemy-death', 'stage-enemy-death', 20, 10, 0);
  }

  private createEnemies(stageId: number): Enemy[] {
    const stageData: unknown = this.cache.json.get(`stage-data-${stageId}`);
    if (
      typeof stageData !== 'object' ||
      stageData === null ||
      !('enemies' in stageData) ||
      !Array.isArray(stageData.enemies) ||
      stageData.enemies.length !== 3
    ) {
      console.error(`ステージ${this.stageNumber ?? stageId}の敵データを読み込めません。php/stage/stage${stageId}.jsonを確認してください。`);
      this.add.text(24, 130, '敵データを読み込めませんでした。', {
        color: '#ffb4a2',
        fontSize: '18px',
        backgroundColor: '#271b20',
        padding: { x: 10, y: 6 }
      }).setScrollFactor(0).setDepth(2000);
      return [];
    }

    const enemies: Enemy[] = [];
    for (const enemy of stageData.enemies) {
      if (
        typeof enemy !== 'object' ||
        enemy === null ||
        !('x' in enemy) ||
        !('y' in enemy) ||
        typeof enemy.x !== 'number' ||
        typeof enemy.y !== 'number' ||
        !Number.isFinite(enemy.x) ||
        !Number.isFinite(enemy.y)
      ) {
        console.error(`ステージ${this.stageNumber ?? stageId}の敵データに不正な座標があります。php/stage/stage${stageId}.jsonを確認してください。`);
        continue;
      }

      enemies.push(new Enemy(this, enemy.x, enemy.y, this.player));
    }
    return enemies;
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
      this.enemies.forEach(enemy => {
        this.physics.add.collider(enemy, layer);
        this.physics.add.collider(this.player, enemy);
      });
    }
  }

  // =========================
  // 更新処理
  // =========================
  update(): void {
    if (!this.player || this.isEnding) return;
    this.player.update();
    this.enemies.forEach(enemy => enemy.update(this.time.now));
    this.hud?.updateHealth(this.player.health, this.player.maxHealth);

    if (this.player.health <= 0) {
      this.finishStage(false);
    } else if (this.enemies.length > 0 && this.enemies.every(enemy => enemy.isDefeated)) {
      this.finishStage(true);
    }
  }

  private finishStage(victory: boolean): void {
    if (this.isEnding) return;
    this.isEnding = true;
    this.physics.pause();
    this.time.delayedCall(victory ? 250 : 700, () => {
      void this.openResult(victory);
    });
  }

  private async openResult(victory: boolean): Promise<void> {
    if (victory) {
      const completion = await completeStage(this.stageId);
      this.scene.start(SCENE_KEYS.RESULT, {
        stageId: this.stageId,
        stageNumber: this.stageNumber,
        victory,
        reward: completion.reward,
        coins: completion.coins,
        persisted: completion.persisted,
        saveError: completion.saveError,
      });
      return;
    }

    this.scene.start(SCENE_KEYS.RESULT, {
      stageId: this.stageId,
      stageNumber: this.stageNumber,
      victory,
      reward: 0,
      coins: 0,
      persisted: 'device',
    });
  }
}
