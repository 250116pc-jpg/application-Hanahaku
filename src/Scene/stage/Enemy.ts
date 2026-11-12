/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
import { showBattleNumber } from './BattleFeedback';
import { playSe } from '../../audio/BgmManager';
import { battleNow } from './BattleClock';
import Phaser from 'phaser';
import type { DamageType, Player } from './Player.ts';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
export interface EnemyStats {
  level: number;
  enhancementId: number;
  job: string;
  direction: string;
  hp: number;
  physicalAttack: number;
  magicAttack: number;
  physicalDefense: number;
  magicDefense: number;
  healingPower: number;
  attackIntervalMs: number;
  agility: number;
  criticalRate: number;
  criticalDamage: number;
  contractFlowerId: number;
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 受け取った値の形式と利用条件を確認する
 * ================================== */
export function isEnemyStats(value: unknown): value is EnemyStats {
  if (typeof value !== 'object' || value === null) return false;
  const stats = value as Record<string, unknown>;
  const numericKeys = ['level', 'enhancementId', 'hp', 'mp', 'physicalAttack', 'magicAttack', 'physicalDefense', 'magicDefense',
    'healingPower', 'attackIntervalMs', 'agility', 'criticalRate', 'criticalDamage', 'contractFlowerId'];
  return typeof stats.job === 'string' && typeof stats.direction === 'string' && numericKeys.every(key =>
    typeof stats[key] === 'number' && Number.isFinite(stats[key])
  );
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private readonly player: Player;
  private readonly homeX: number;
  private readonly maxHealth: number;
  private readonly stats: EnemyStats;
  private readonly patrolDistance = 90;
  private readonly patrolSpeed = 35;
  private readonly chaseSpeed = 65;
  private readonly aggroRange = 520;
  private readonly attackRange = 72;
  private readonly attackVerticalRange = 90;
  private readonly attackReachPadding = 20;
  private readonly aggroVerticalRange = 120;
  private readonly attackWindupMs = 300;
  private readonly healthBarOffsetY = 96;
  private readonly visual: Phaser.GameObjects.Sprite;
  private readonly healthBarBackground: Phaser.GameObjects.Rectangle;
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private statusIconPlate?: Phaser.GameObjects.Arc;
  private statusIcon?: Phaser.GameObjects.Image;
  private statusIconUntil = 0;
  private health: number;
  private nextAttackAt = 0;
  private attackSpeedSlowUntil = 0;
  private attackSpeedSlowPercent = 0;
  private locked = false;
  private dead = false;
  private patrolDirection = -1;
  private visualBottomPadding = 2;
  private readonly enemyId: number;

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵の能力値・当たり判定・表示とHPバーを初期化する
   * ================================== */
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, stats: EnemyStats, enemyId = 1) {
    super(scene, x, y, 'stage-enemy-idle');
    this.player = player;
    this.stats = stats;
    this.enemyId = enemyId;
    this.maxHealth = stats.hp;
    this.health = this.maxHealth;
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
    this.playVisual('enemy-idle');
    this.visual.on(Phaser.Animations.Events.ANIMATION_START, (animation: Phaser.Animations.Animation) => {
      this.visualBottomPadding = this.getVisualBottomPadding(animation.key);
    });
    this.visual.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
      if (animation.key.startsWith('enemy-death')) {
        this.destroy();
      } else {
        this.locked = false;
        if (!this.dead) this.playVisual('enemy-idle');
      }
    });

    const barY = y - this.healthBarOffsetY;
    this.healthBarBackground = scene.add.rectangle(x, barY, 48, 6, 0x17131b, 0.9)
      .setDepth(10);
    this.healthBar = scene.add.rectangle(x, barY, 44, 4, 0xe54e62)
      .setDepth(11);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 操作と現在の状態を表示へ反映する
   * ================================== */
  public update(time: number): void {
    if (this.dead || !this.body || !this.body.enable) return;

    this.syncVisualAndHealthBar();
    if (this.locked) return;

    const distanceX = this.player.x - this.x;
    const distanceY = Math.abs(this.player.y - this.y);
    const distance = Math.abs(distanceX);
    if (distanceY <= this.attackVerticalRange && distance <= this.attackRange) {
      this.setVelocityX(0);
      this.setFlipX(distanceX < 0);
      this.visual.setFlipX(this.flipX);
      if (time >= this.nextAttackAt) this.attack(time);
      return;
    }

    if (distanceY <= this.aggroVerticalRange && distance <= this.aggroRange) {
      this.move(Math.sign(distanceX), this.chaseSpeed);
      return;
    }

    if (this.x <= this.homeX - this.patrolDistance) this.patrolDirection = 1;
    if (this.x >= this.homeX + this.patrolDistance) this.patrolDirection = -1;
    this.move(this.patrolDirection, this.patrolSpeed);
  }

  public receiveDamage(amount: number, damageType: DamageType = 'physical'): void {
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 被ダメージと無敵・撃破処理を行う
     * ================================== */
    if (this.dead || amount <= 0) return;
    const defense = Math.max(0, damageType === 'magical' ? this.stats.magicDefense : this.stats.physicalDefense);
    const mitigatedDamage = amount * 100 / (100 + defense);
    const damage = Math.min(this.health, Math.max(1, Math.round(mitigatedDamage)));
    this.health -= damage;
    showBattleNumber(this.scene, this.x, this.y, damage, damageType);
    this.updateHealthBar();
    this.visual.setTint(0xffbbbb);
    this.scene.time.delayedCall(120, () => {
      if (this.visual.active && !this.dead) this.visual.clearTint();
    });

    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : HPが0なら撃破処理を行い、生存時は被弾動作へ切り替える
     * ================================== */
    if (this.health === 0) {
      this.dead = true;
      this.locked = true;
      this.setVelocity(0, 0);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      this.playVisual('enemy-death');
      // とどめの命中音と消滅音が重なるのを防ぐ。
      this.scene.sound.stopByKey('player-sword-hit');
      if (!this.scene.sound.getAllPlaying().some(sound => sound.key === 'enemy-vanish')) {
        playSe(this.scene, 'enemy-vanish', 0.42);
      }
      return;
    }

    this.locked = true;
    this.setVelocityX(0);
    this.playVisual('enemy-hurt');
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃速度を下げる割合と効果の終了時刻を更新する
   * ================================== */
  public applyAttackSpeedSlow(percent: number, durationMs: number): void {
    this.attackSpeedSlowPercent = Math.max(this.attackSpeedSlowPercent, percent);
    this.attackSpeedSlowUntil = Math.max(this.attackSpeedSlowUntil, battleNow(this.scene) + durationMs);
    this.applyStatusIcon('debuff_atk_down', durationMs);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵の状態効果アイコンを一定時間表示する
   * ================================== */
  public applyStatusIcon(iconKey: string, durationMs: number): void {
    if (this.dead || durationMs <= 0 || !this.scene.textures.exists(`status-${iconKey}`)) return;
    this.statusIconUntil = Math.max(this.statusIconUntil, battleNow(this.scene) + durationMs);
    if (!this.statusIcon?.active) {
      this.statusIconPlate = this.scene.add.circle(this.x + 36, this.y - this.healthBarOffsetY, 17, 0x3978be, 0.9)
        .setStrokeStyle(2, 0xd9ecff, 0.95)
        .setDepth(12);
      this.statusIcon = this.scene.add.image(this.x + 36, this.y - this.healthBarOffsetY, `status-${iconKey}`)
        .setDisplaySize(28, 28)
        .setDepth(13);
    } else {
      this.statusIcon.setTexture(`status-${iconKey}`).setVisible(true);
    }
    const expiresAt = this.statusIconUntil;
    const remaining = Math.max(0, expiresAt - battleNow(this.scene));
    this.scene.time.delayedCall(remaining + 30, () => {
      if (this.statusIcon?.active && this.statusIconUntil <= expiresAt && battleNow(this.scene) >= this.statusIconUntil) {
        this.statusIcon.destroy();
        this.statusIcon = undefined;
        this.statusIconPlate?.destroy();
        this.statusIconPlate = undefined;
      }
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵を攻撃方向へ押し戻す
   * ================================== */
  public applyKnockback(direction: number): void {
    if (this.dead || !Number.isFinite(direction)) return;
    this.setVelocityX(Math.sign(direction) * 300);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵が撃破済みかを返す
   * ================================== */
  public get isDefeated(): boolean {
    return this.dead;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵の移動方向と速度を更新する
   * ================================== */
  private move(direction: number, speed: number): void {
    this.setVelocityX(direction * speed * this.stats.agility / 100);
    this.setFlipX(direction < 0);
    this.visual.setFlipX(this.flipX);
    this.playVisual('enemy-run');
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 通常攻撃を行う
   * ================================== */
  private attack(time: number): void {
    const slowPercent = time < this.attackSpeedSlowUntil ? this.attackSpeedSlowPercent : 0;
    if (slowPercent === 0) this.attackSpeedSlowPercent = 0;
    this.nextAttackAt = time + this.stats.attackIntervalMs * (1 + slowPercent / 100);
    this.locked = true;
    this.setVelocityX(0);
    this.playVisual('enemy-attack');
    this.scene.time.delayedCall(this.attackWindupMs, () => {
      if (!this.active || this.dead) return;
      if (
        Math.abs(this.player.x - this.x) <= this.attackRange + this.attackReachPadding &&
        Math.abs(this.player.y - this.y) <= this.attackVerticalRange
      ) {
        const isCritical = Math.random() * 100 < this.stats.criticalRate;
        const damage = isCritical
          ? Math.round(this.stats.physicalAttack * (1 + this.stats.criticalDamage / 100))
          : this.stats.physicalAttack;
        this.player.receiveDamage(damage);
      }
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵の種類に応じたアニメーションを再生する
   * ================================== */
  private playVisual(animationKey: string): void {
    const variantKey = `${animationKey}-${this.enemyId}`;
    if (this.scene.anims.exists(variantKey)) animationKey = variantKey;
    if (this.visual.anims.currentAnim?.key !== animationKey) {
      this.visual.play(animationKey, true);
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : アニメーションごとの画像の足元の余白を返す
   * ================================== */
  private getVisualBottomPadding(animationKey: string): number {
    switch (animationKey) {
      case 'enemy-attack': return 12;
      case 'enemy-hurt': return 29;
      case 'enemy-death': return 2;
      default: return 2;
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 敵の表示画像・HPバー・状態アイコンを本体の位置に合わせる
   * ================================== */
  private syncVisualAndHealthBar(): void {
    this.visual.setPosition(
      this.x,
      this.y + this.visualBottomPadding * this.visual.scaleY
    );
    const barY = this.y - this.healthBarOffsetY;
    this.healthBarBackground.setPosition(this.x, barY);
    this.healthBar.setSize(44 * this.health / this.maxHealth, 4)
      .setPosition(
        this.x - 22 + 22 * this.health / this.maxHealth,
        barY
      );
    this.statusIconPlate?.setPosition(this.x + 36, barY);
    this.statusIcon?.setPosition(this.x + 36, barY);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 残りHPの割合に合わせて敵のHPバーの幅と位置を更新する
   * ================================== */
  private updateHealthBar(): void {
    const width = 44 * this.health / this.maxHealth;
    this.healthBar.setSize(width, 4)
      .setPosition(this.x - 22 + width / 2, this.y - this.healthBarOffsetY);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 画面終了時に表示とイベントを解除する
   * ================================== */
  public override destroy(fromScene?: boolean): void {
    this.visual.destroy();
    this.healthBarBackground.destroy();
    this.healthBar.destroy();
    this.statusIcon?.destroy();
    this.statusIconPlate?.destroy();
    super.destroy(fromScene);
  }
}
