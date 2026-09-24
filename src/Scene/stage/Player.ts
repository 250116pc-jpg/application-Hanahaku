import Phaser from 'phaser';
import { changeCharacterAnimation } from '../../animation/animation.ts';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly PLAYER_SPEED = 160;
  private readonly JUMP_POWER = 330;

  constructor(scene: Phaser.Scene, x: number, y: number, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    super(scene, x, y, 'player_idle');
    
    // シーンと物理エンジンに自身を追加
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;

    this.setScale(1)
        .setCollideWorldBounds(true)
        .setOrigin(0.5, 1);

    this.play('player-idle');
  }

  // =========================
  // ヒットボックス設定
  // =========================
  public setupHitbox(spawnObject?: Phaser.Types.Tilemaps.TiledObject, mapTileWidth: number = 16, mapTileHeight: number = 16): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    const hitboxWidth = spawnObject?.width || Math.min(
      mapTileWidth,
      Math.max(12, Math.round(this.displayWidth * 0.6))
    );

    const hitboxHeight = spawnObject?.height || Math.min(
      mapTileHeight,
      Math.max(12, Math.round(this.displayHeight * 0.8))
    );

    body.setSize(hitboxWidth, hitboxHeight);
    body.setOffset(80, 100);
  }

  // =========================
  // 位置の微調整
  // =========================
  public adjustPosition(spawnObject: Phaser.Types.Tilemaps.TiledObject): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.x = (spawnObject.x ?? this.x) + ((spawnObject.width ?? 0) / 2);
    this.y = Math.round(
      (spawnObject.y ?? this.y) + this.displayHeight - body.offset.y - body.height
    );
  }


  public update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // 左右移動と停止
    if (this.cursors.left?.isDown) {
      this.setVelocityX(-this.PLAYER_SPEED);
      this.setFlipX(true);
      changeCharacterAnimation(this, 'run');
    } else if (this.cursors.right?.isDown) {
      this.setVelocityX(this.PLAYER_SPEED);
      this.setFlipX(false);
      changeCharacterAnimation(this, 'run');
    } else {
      this.setVelocityX(0);
      changeCharacterAnimation(this, 'idle');
    }

    // ジャンプ
    if (this.cursors.up?.isDown && body.blocked.down) {
      this.setVelocityY(-this.JUMP_POWER);
    }
  }
}