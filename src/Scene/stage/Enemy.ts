import Phaser from 'phaser';
import type { Player } from './Player.ts';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly player: Player;
  private readonly homeX: number;
  private readonly patrolDistance = 90;
  private readonly patrolSpeed = 35;
  private readonly chaseSpeed = 65;
  private readonly aggroRange = 520;
  private readonly attackRange = 72;
  private readonly maxHealth = 45;
  private readonly visual: Phaser.GameObjects.Sprite;
  private readonly healthBarBackground: Phaser.GameObjects.Rectangle;
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private health = this.maxHealth;
  private nextAttackAt = 0;
  private locked = false;
  private dead = false;
  private patrolDirection = -1;
  private visualBottomPadding = 2;

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super(scene, x, y, 'stage-enemy-idle');
    this.player = player;
    this.homeX = x;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1)
      .setScale(3)
      .setDepth(5)
      .setVisible(false)
      .setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 20);
    body.setOffset(7, 10);

    this.visual = scene.add.sprite(x, y, 'stage-enemy-idle')
      .setOrigin(0.5, 1)
      .setScale(3)
      .setDepth(6);
    this.visual.play('enemy-idle');
    this.visual.on(Phaser.Animations.Events.ANIMATION_START, (animation: Phaser.Animations.Animation) => {
      this.visualBottomPadding = this.getVisualBottomPadding(animation.key);
    });
    this.visual.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
      if (animation.key === 'enemy-death') {
        this.destroy();
      } else {
        this.locked = false;
        if (!this.dead) this.playVisual('enemy-idle');
      }
    });

    const barY = y - 96;
    this.healthBarBackground = scene.add.rectangle(x, barY, 48, 6, 0x17131b, 0.9)
      .setDepth(10);
    this.healthBar = scene.add.rectangle(x, barY, 44, 4, 0xe54e62)
      .setDepth(11);
  }

  public update(time: number): void {
    if (this.dead || !this.body || !this.body.enable) return;

    this.syncVisualAndHealthBar();
    if (this.locked) return;

    const distanceX = this.player.x - this.x;
    const distanceY = Math.abs(this.player.y - this.y);
    const distance = Math.abs(distanceX);
    if (distanceY <= 90 && distance <= this.attackRange) {
      this.setVelocityX(0);
      this.setFlipX(distanceX < 0);
      this.visual.setFlipX(this.flipX);
      if (time >= this.nextAttackAt) this.attack(time);
      return;
    }

    if (distanceY <= 120 && distance <= this.aggroRange) {
      this.move(Math.sign(distanceX), this.chaseSpeed);
      return;
    }

    if (this.x <= this.homeX - this.patrolDistance) this.patrolDirection = 1;
    if (this.x >= this.homeX + this.patrolDistance) this.patrolDirection = -1;
    this.move(this.patrolDirection, this.patrolSpeed);
  }

  public receiveDamage(amount: number): void {
    if (this.dead || amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    this.visual.setTint(0xffbbbb);
    this.scene.time.delayedCall(120, () => {
      if (this.visual.active && !this.dead) this.visual.clearTint();
    });

    if (this.health === 0) {
      this.dead = true;
      this.locked = true;
      this.setVelocity(0, 0);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      this.playVisual('enemy-death');
      return;
    }

    this.locked = true;
    this.setVelocityX(0);
    this.playVisual('enemy-hurt');
  }

  public get isDefeated(): boolean {
    return this.dead;
  }

  private move(direction: number, speed: number): void {
    this.setVelocityX(direction * speed);
    this.setFlipX(direction < 0);
    this.visual.setFlipX(this.flipX);
    this.playVisual('enemy-run');
  }

  private attack(time: number): void {
    this.nextAttackAt = time + 1100;
    this.locked = true;
    this.setVelocityX(0);
    this.playVisual('enemy-attack');
    this.scene.time.delayedCall(300, () => {
      if (!this.active || this.dead) return;
      if (
        Math.abs(this.player.x - this.x) <= this.attackRange + 20 &&
        Math.abs(this.player.y - this.y) <= 90
      ) {
        this.player.receiveDamage(12);
      }
    });
  }

  private playVisual(animationKey: string): void {
    if (this.visual.anims.currentAnim?.key !== animationKey) {
      this.visual.play(animationKey, true);
    }
  }

  private getVisualBottomPadding(animationKey: string): number {
    switch (animationKey) {
      case 'enemy-attack': return 12;
      case 'enemy-hurt': return 29;
      case 'enemy-death': return 2;
      default: return 2;
    }
  }

  private syncVisualAndHealthBar(): void {
    this.visual.setPosition(
      this.x,
      this.y + this.visualBottomPadding * this.visual.scaleY
    );
    const barY = this.y - 96;
    this.healthBarBackground.setPosition(this.x, barY);
    this.healthBar.setSize(44 * this.health / this.maxHealth, 4)
      .setPosition(
        this.x - 22 + 22 * this.health / this.maxHealth,
        barY
      );
  }

  private updateHealthBar(): void {
    const width = 44 * this.health / this.maxHealth;
    this.healthBar.setSize(width, 4)
      .setPosition(this.x - 22 + width / 2, this.y - 96);
  }

  public override destroy(fromScene?: boolean): void {
    this.visual.destroy();
    this.healthBarBackground.destroy();
    this.healthBar.destroy();
    super.destroy(fromScene);
  }
}
