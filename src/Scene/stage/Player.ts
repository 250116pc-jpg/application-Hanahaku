import Phaser from 'phaser';
import { changeCharacterAnimation } from '../../animation/animation.ts';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private readonly PLAYER_SPEED = 160;
  private readonly JUMP_POWER = 330;
  private wasGrounded = true;
  private landingAnimationPlaying = false;
  private action: 'attack' | 'skill' | null = null;
  private dead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, cursors?: Phaser.Types.Input.Keyboard.CursorKeys) {
    super(scene, x, y, 'player_idle');
    
    // シーンと物理エンジンに自身を追加
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
      if (animation.key === 'player-land') {
        this.landingAnimationPlaying = false;
      }
      if (animation.key === 'player-attack' || animation.key === 'player-skill') {
        this.action = null;
      }
    });

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
    body.setOffset(
      Math.round((this.frame.width - hitboxWidth) / 2),
      this.frame.height - hitboxHeight
    );
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
    if (!body || !this.cursors || this.dead) return;

    if (this.action !== null) {
      this.setVelocityX(0);
    } else if (this.cursors.left?.isDown) {
      this.setVelocityX(-this.PLAYER_SPEED);
      this.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.setVelocityX(this.PLAYER_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (this.cursors.up?.isDown && body.blocked.down) this.jump();

    const isGrounded = body.blocked.down;
    if (this.action !== null) {
      // Keep the action animation visible until it completes.
    } else if (this.cursors.down?.isDown && isGrounded) {
      this.landingAnimationPlaying = false;
      this.playAnimation('player-defend');
    } else if (!isGrounded) {
      this.landingAnimationPlaying = false;
      changeCharacterAnimation(this, body.velocity.y < 0 ? 'jump' : 'fall');
    } else if (!this.wasGrounded) {
      this.landingAnimationPlaying = true;
      changeCharacterAnimation(this, 'land');
    } else if (!this.landingAnimationPlaying) {
      changeCharacterAnimation(this, body.velocity.x === 0 ? 'idle' : 'run');
    }

    this.wasGrounded = isGrounded;
  }

  public jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body?.blocked.down) this.setVelocityY(-this.JUMP_POWER);
  }

  public attack(): void {
    this.playAction('attack');
  }

  public skill(): void {
    this.playAction('skill');
  }

  public die(): void {
    if (this.dead || !this.scene.anims.exists('player-death')) return;
    this.dead = true;
    this.action = null;
    this.setVelocity(0, 0);
    const body = this.body;
    if (body) body.enable = false;
    this.play('player-death', true);
  }

  private playAction(action: 'attack' | 'skill'): void {
    const animationKey = `player-${action}`;
    if (this.dead || this.action !== null || !this.scene.anims.exists(animationKey)) return;
    this.action = action;
    this.landingAnimationPlaying = false;
    this.setVelocityX(0);
    this.play(animationKey, true);
  }

  private playAnimation(animationKey: string): void {
    if (this.anims.currentAnim?.key !== animationKey) {
      this.play(animationKey, true);
    }
  }
}
