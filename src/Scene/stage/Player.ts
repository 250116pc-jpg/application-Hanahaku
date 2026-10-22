import Phaser from 'phaser';
import { changeCharacterAnimation } from '../../animation/animation.ts';
import type { FlowerSkillType } from '../test_data.ts';

export interface CombatTarget {
  readonly x: number;
  readonly y: number;
  receiveDamage(amount: number): void;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private readonly PLAYER_SPEED = 160;
  private readonly JUMP_POWER = 330;
  private wasGrounded = true;
  private landingAnimationPlaying = false;
  private action: string | null = null;
  private dead = false;
  private invulnerableUntil = 0;
  private defenseUntil = 0;
  public readonly maxHealth = 100;
  public health = this.maxHealth;

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
      if ([
        'player-attack',
        'player-skill',
        'player-hurt',
        'player-drink',
        'player-defend'
      ].includes(animation.key)) {
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

  public attack(targets: readonly CombatTarget[] = []): void {
    if (!this.playAction('attack', 'player-attack')) return;
    this.showRange('front', 125, 0xffb347);
    this.damageTargets(targets, 18, 125, false);
  }

  public useFlowerSkill(skill: FlowerSkillType, targets: readonly CombatTarget[] = []): boolean {
    switch (skill) {
      case 'singleAttack':
        if (!this.playAction('skill', 'player-skill')) return false;
        this.showRange('front', 190, 0xff5f61);
        this.damageTargets(targets, 45, 190, false);
        break;
      case 'areaAttack':
        if (!this.playAction('skill', 'player-skill')) return false;
        this.showRange('radial', 190, 0xff5f61);
        this.damageTargets(targets, 24, 190, true, true);
        break;
      case 'heal':
        if (!this.playAction('skill', 'player-drink')) return false;
        this.showRange('self', 72, 0x5de28c);
        this.health = Math.min(this.maxHealth, this.health + 35);
        this.emit('health-changed', this.health, this.maxHealth);
        break;
      case 'defense':
        if (!this.playAction('skill', 'player-defend')) return false;
        this.showRange('self', 72, 0x62c9ff);
        this.defenseUntil = this.scene.time.now + 5000;
        break;
    }
    return true;
  }

  public receiveDamage(amount: number): void {
    const now = this.scene.time.now;
    if (this.dead || now < this.invulnerableUntil || amount <= 0) return;

    const defending = this.cursors?.down?.isDown === true &&
      (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    const damageReduction = defending || now < this.defenseUntil ? 0.5 : 0;
    this.health = Math.max(0, this.health - Math.ceil(amount * (1 - damageReduction)));
    this.invulnerableUntil = now + 700;
    this.emit('health-changed', this.health, this.maxHealth);

    if (this.health === 0) {
      this.die();
      return;
    }

    this.action = 'hurt';
    this.landingAnimationPlaying = false;
    this.setVelocityX(0);
    this.play('player-hurt', true);
    this.setTint(0xffaaaa);
    this.scene.time.delayedCall(160, () => this.clearTint());
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

  private playAction(action: string, animationKey: string): boolean {
    if (this.dead || this.action !== null || !this.scene.anims.exists(animationKey)) return false;
    this.action = action;
    this.landingAnimationPlaying = false;
    this.setVelocityX(0);
    this.play(animationKey, true);
    return true;
  }

  private damageTargets(
    targets: readonly CombatTarget[],
    damage: number,
    range: number,
    hitAll: boolean,
    radial = false
  ): void {
    const direction = this.flipX ? -1 : 1;
    const inRange = targets.filter(target => {
      const distanceX = (target.x - this.x) * direction;
      const distanceY = target.y - this.y;
      return radial
        ? Math.hypot(distanceX, distanceY) <= range
        : distanceX >= -20 && distanceX <= range && Math.abs(distanceY) <= 100;
    });
    const hits = hitAll ? inRange : inRange.slice(0, 1);
    hits.forEach(target => target.receiveDamage(damage));
  }

  private showRange(shape: 'front' | 'radial' | 'self', range: number, color: number): void {
    const indicator = this.scene.add.graphics()
      .setDepth(4)
      .setScrollFactor(1);
    const fillColor = color;
    const fillAlpha = 0.18;
    indicator.fillStyle(fillColor, fillAlpha);
    indicator.lineStyle(3, fillColor, 0.85);

    if (shape === 'front') {
      const direction = this.flipX ? -1 : 1;
      const x = direction > 0 ? this.x : this.x - range;
      indicator.fillRoundedRect(x, this.y - 100, range, 200, 22);
      indicator.strokeRoundedRect(x, this.y - 100, range, 200, 22);
    } else {
      indicator.fillCircle(this.x, this.y - 40, range);
      indicator.strokeCircle(this.x, this.y - 40, range);
    }

    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      delay: 300,
      duration: 350,
      onComplete: () => indicator.destroy()
    });
  }

  private playAnimation(animationKey: string): void {
    if (this.anims.currentAnim?.key !== animationKey) {
      this.play(animationKey, true);
    }
  }
}
