import Phaser from 'phaser';
import { changeCharacterAnimation } from '../../animation/animation.ts';
import type { ServerFlowerSkill } from './SkillApi.ts';

const BUFF_EFFECT_COLOR = 0xff5964;
const DEBUFF_EFFECT_COLOR = 0x4a93d1;

export interface CombatTarget {
  readonly x: number;
  readonly y: number;
  receiveDamage(amount: number): void;
  applyAttackSpeedSlow?(percent: number, durationMs: number): void;
  applyStatusIcon?(iconKey: string, durationMs: number): void;
  applyKnockback?(direction: number): void;
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
  private defenseBonusPercent = 0;
  private attackBonusPercent = 0;
  private attackBonusUntil = 0;
  private evasionUntil = 0;
  private evasionPercent = 0;
  private chargeUntil = 0;
  private continuousUntil = 0;
  private mapleIsRed = false;
  private readonly baseMaxHealth = 100;
  private maxHealthBonus = 0;
  private maxHealthBonusUntil = 0;
  public get maxHealth(): number {
    return this.baseMaxHealth + this.maxHealthBonus;
  }
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
    if (this.scene.time.now < this.chargeUntil || this.scene.time.now < this.continuousUntil) return;
    if (!this.playAction('attack', 'player-attack')) return;
    this.showRange('front', 125, 0xffb347);
    this.damageTargets(targets, this.applyAttackBonus(18), 125, false);
  }

  public canUseSkill(): boolean {
    return !this.dead && this.action === null && this.scene.time.now >= this.chargeUntil;
  }

  public reserveSkill(): boolean {
    if (!this.canUseSkill()) return false;
    this.action = 'skillPending';
    this.setVelocityX(0);
    return true;
  }

  public cancelReservedSkill(): void {
    if (this.action === 'skillPending') this.action = null;
  }

  public useFlowerSkill(skill: ServerFlowerSkill, targets: readonly CombatTarget[] = []): boolean {
    if (!this.playSkillAnimation(skill.type === 'heal' ? 'player-drink' :
      ['defensiveRecovery', 'fortify'].includes(skill.type) ? 'player-defend' : 'player-skill')) return false;

    switch (skill.type) {
      case 'multiHit':
        this.showRange('front', skill.range, 0xff5f61);
        for (let hit = 0; hit < skill.hitCount; hit++) {
          this.damageTargets(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.range, false);
        }
        break;
      case 'defensiveRecovery':
        this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
        this.repeatUntil(skill.durationMs, skill.healIntervalMs, () => this.restoreHealth(
          this.maxHealth * skill.healPercent / 100
        ));
        this.showRange('self', skill.range, BUFF_EFFECT_COLOR);
        break;
      case 'charge':
        this.chargeUntil = this.scene.time.now + skill.durationMs;
        this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
        this.scene.time.delayedCall(skill.durationMs, () => {
          if (!this.active || this.dead) return;
          this.showRange('front', skill.range, 0xff5f61);
          this.damageTargets(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.range, false);
        });
        this.showRange('self', skill.range / 2, DEBUFF_EFFECT_COLOR);
        break;
      case 'balanced':
        this.applyTimedBuff(skill.attackBonusPercent, skill.defenseBonusPercent, skill.durationMs);
        this.repeatUntil(skill.durationMs, skill.repeatIntervalMs, () => {
          this.damageTargets(targets, this.skillDamage(skill.damagePercent, skill.attackPower), 10000, false, true);
        });
        this.showRange('self', skill.range, BUFF_EFFECT_COLOR);
        break;
      case 'continuous':
        this.applyTimedBuff(skill.attackBonusPercent, skill.defenseBonusPercent, skill.durationMs);
        this.continuousUntil = this.scene.time.now + skill.durationMs;
        this.repeatUntil(
          skill.durationMs,
          Math.max(100, Math.round(skill.repeatIntervalMs / (1 + skill.attackSpeedBonusPercent / 100))),
          () => {
          this.damageTargets(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.range, false);
          this.showRange('front', skill.range, 0xff5f61);
          }
        );
        this.showRange('self', skill.range / 2, BUFF_EFFECT_COLOR);
        break;
      case 'maple':
        if (this.mapleIsRed) {
          this.mapleIsRed = false;
          skill.stages.forEach((stage, index) => {
            this.scene.time.delayedCall(index * 450, () => {
              if (!this.active || this.dead) return;
              this.showRange('front', stage.range, 0xff5f61);
              const hitTargets = this.getTargetsInRange(targets, stage.range, false);
              hitTargets.slice(0, 1).forEach(target => {
                target.receiveDamage(this.skillDamage(stage.damagePercent, skill.attackPower));
                if (stage.knockback) target.applyKnockback?.(this.flipX ? -1 : 1);
              });
            });
          });
        } else {
          this.mapleIsRed = true;
          this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
          this.repeatUntil(skill.durationMs, skill.healIntervalMs, () => this.restoreHealth(
            this.maxHealth * skill.healPercent / 100
          ));
          this.showRange('self', skill.range, BUFF_EFFECT_COLOR);
        }
        break;
      case 'fortify': {
        const bonusHealth = Math.round(this.baseMaxHealth * skill.maxHealthBonusPercent / 100);
        this.maxHealthBonus = bonusHealth;
        this.maxHealthBonusUntil = this.scene.time.now + skill.durationMs;
        this.health = Math.min(this.maxHealth, this.health + bonusHealth);
        this.applyTimedBuff(skill.attackBonusPercent, skill.defenseBonusPercent, skill.durationMs);
        this.scheduleAfter(skill.durationMs, () => {
          if (this.scene.time.now >= this.maxHealthBonusUntil) {
            this.maxHealthBonus = 0;
            this.health = Math.min(this.health, this.maxHealth);
            this.emit('health-changed', this.health, this.maxHealth);
          }
        });
        this.emit('health-changed', this.health, this.maxHealth);
        this.showRange('self', skill.range, BUFF_EFFECT_COLOR);
        break;
      }
      case 'slowAttack':
        this.showRange('radial', skill.range, DEBUFF_EFFECT_COLOR);
        this.damageTargets(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.range, true, true);
        targets.forEach(target => target.applyAttackSpeedSlow?.(skill.slowPercent, skill.durationMs));
        break;
      case 'heal':
        this.showRange('self', skill.range, BUFF_EFFECT_COLOR);
        this.restoreHealth(this.maxHealth * skill.healPercent / 100);
        break;
      case 'evasion':
        this.showRange('front', skill.range, 0xff5f61);
        this.damageTargets(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.range, false);
        this.evasionUntil = this.scene.time.now + skill.durationMs;
        this.evasionPercent = skill.evasionPercent;
        break;
    }
    return true;
  }

  public receiveDamage(amount: number): void {
    const now = this.scene.time.now;
    if (this.dead || now < this.invulnerableUntil || amount <= 0) return;
    if (now < this.evasionUntil && Math.random() * 100 < this.evasionPercent) return;

    const defending = this.cursors?.down?.isDown === true &&
      (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    const activeDefenseBonus = now < this.defenseUntil ? this.defenseBonusPercent : 0;
    const damageMultiplier = defending ? 0.5 : Math.max(0.1, 1 - activeDefenseBonus / 100);
    this.health = Math.max(0, this.health - Math.ceil(amount * damageMultiplier));
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

  private playSkillAnimation(animationKey: string): boolean {
    if (
      !this.scene.anims.exists(animationKey) ||
      (this.action !== 'skillPending' && this.action !== null) ||
      this.dead
    ) {
      return false;
    }
    this.action = 'skill';
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
    this.getTargetsInRange(targets, range, radial).slice(0, hitAll ? undefined : 1)
      .forEach(target => target.receiveDamage(damage));
  }

  private getTargetsInRange(
    targets: readonly CombatTarget[],
    range: number,
    radial: boolean
  ): CombatTarget[] {
    const direction = this.flipX ? -1 : 1;
    return targets.filter(target => {
      const distanceX = (target.x - this.x) * direction;
      const distanceY = target.y - this.y;
      return radial
        ? Math.hypot(distanceX, distanceY) <= range
        : distanceX >= -20 && distanceX <= range && Math.abs(distanceY) <= 100;
    });
  }

  private skillDamage(percent: number, attackPower: number): number {
    return Math.max(1, Math.round(attackPower * percent / 100));
  }

  private applyAttackBonus(damage: number): number {
    const bonus = this.scene.time.now < this.attackBonusUntil ? this.attackBonusPercent : 0;
    return Math.max(1, Math.round(damage * (1 + bonus / 100)));
  }

  private applyTimedBuff(attackPercent: number, defensePercent: number, durationMs: number): void {
    this.attackBonusPercent = attackPercent;
    this.attackBonusUntil = this.scene.time.now + durationMs;
    this.applyDefenseBuff(defensePercent, durationMs);
    this.scheduleAfter(durationMs, () => {
      if (this.scene.time.now >= this.attackBonusUntil) this.attackBonusPercent = 0;
    });
  }

  private applyDefenseBuff(defensePercent: number, durationMs: number): void {
    this.defenseBonusPercent = defensePercent;
    this.defenseUntil = this.scene.time.now + durationMs;
    this.scheduleAfter(durationMs, () => {
      if (this.scene.time.now >= this.defenseUntil) this.defenseBonusPercent = 0;
    });
  }

  private repeatUntil(durationMs: number, intervalMs: number, effect: () => void): void {
    if (intervalMs <= 0) return;
    const endsAt = this.scene.time.now + durationMs;
    const repeat = (): void => {
      if (!this.active || this.dead || this.scene.time.now >= endsAt) return;
      effect();
      this.scene.time.delayedCall(intervalMs, repeat);
    };
    this.scene.time.delayedCall(intervalMs, repeat);
  }

  private scheduleAfter(delayMs: number, effect: () => void): void {
    this.scene.time.delayedCall(delayMs, () => {
      if (this.active && !this.dead) effect();
    });
  }

  private restoreHealth(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + Math.max(0, Math.round(amount)));
    this.emit('health-changed', this.health, this.maxHealth);
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
