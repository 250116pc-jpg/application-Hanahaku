/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import { getPlayerAttackTiming } from '../../animation/playerCharacter';
import { showBattleNumber } from './BattleFeedback';
import { PLAYER_RUN_STEP_KEYS, playSe } from '../../audio/BgmManager';
import { SCENE_KEYS } from '../sceneKeys';
import { battleNow } from './BattleClock';
import Phaser from 'phaser';
import { changeCharacterAnimation } from '../../animation/animation.ts';
import type { ServerFlowerSkill } from './SkillApi.ts';
import { playerStats } from './allyStats.ts';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 主人公の操作・戦闘処理
 * ================================== */
const BUFF_EFFECT_COLOR = 0xff5964;
// スキル範囲の1マスの大きさ
const SKILL_AREA_CELL_SIZE = 40;
// ジャンプ時の重力調整
const AIR_GRAVITY_SCALE = 4;
const FALL_GRAVITY_REDUCTION = 0.9;
const JUMP_POWER_SCALE = 1.4;
// 通常攻撃の踏み込み速度（0は移動なし）
const BASIC_ATTACK_STEP_SPEEDS = [
  [0, 0, 0, 0, 90, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 80, 0, 0, 0, 0],
] as const;

export type DamageType = 'physical' | 'magical';

export interface CombatTarget {
  readonly x: number;
  readonly y: number;
  readonly isDefeated?: boolean;
  receiveDamage(amount: number, damageType?: DamageType): void;
  applyAttackSpeedSlow?(percent: number, durationMs: number): void;
  applyStatusIcon?(iconKey: string, durationMs: number): void;
  applyKnockback?(direction: number): void;
}

export type SkillVisualPhase = 'cast' | 'projectile' | 'buff' | 'charge' | 'impact' | 'heal';
export type SkillVisualHandler = (
  skill: ServerFlowerSkill,
  phase: SkillVisualPhase,
  targets: readonly CombatTarget[],
  area: readonly (readonly number[])[]
) => void;

export class Player extends Phaser.Physics.Arcade.Sprite {
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 主人公の状態管理
   * ================================== */
  private stats = { ...playerStats };
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  // 主人公の基本能力値
  private readonly PLAYER_SPEED = this.stats.moveSpeed;
  private readonly JUMP_POWER = this.stats.jumpPower;
  private readonly FALL_GRAVITY_BONUS = this.stats.fallGravityBonus;
  // 前回の接地状態
  private wasGrounded = true;
  private nextRunStep = 0;
  private landingAnimationPlaying = false;
  // 現在の行動
  private action: string | null = null;
  private dead = false;
  // ポーズ中は効果時間を進めない
  private invulnerableUntil = 0;
  private defenseUntil = 0;
  private defenseBonusPercent = 0;
  private attackBonusPercent = 0;
  private attackBonusUntil = 0;
  private evasionUntil = 0;
  private evasionPercent = 0;
  private chargeUntil = 0;
  private comboUntil = 0;
  private continuousUntil = 0;
  private mapleIsRed = false;
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : モミジの紅葉状態の取得
   * ================================== */
  public get isMapleRed(): boolean { return this.mapleIsRed; }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル効果と通常攻撃の管理
   * ================================== */
  private skillVisualHandler?: SkillVisualHandler;
  private baseMaxHealth = this.stats.hp;
  private maxHealthBonus = 0;
  private maxHealthBonusUntil = 0;
  private nextBasicAttackAt = 0;
  private basicAttackTargets: readonly CombatTarget[] | null = null;
  private basicComboStep = -1;
  private basicComboUntil = 0;
  // 次の通常攻撃の入力予約
  private queuedBasicAttack: readonly CombatTarget[] | null = null;
  private basicAttackDirection = 1;
  private airAttackTargets: readonly CombatTarget[] | null = null;
  private airAttackPreviousY = 0;
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 最大HPの取得
   * ================================== */
  public get maxHealth(): number {
    return this.baseMaxHealth + this.maxHealthBonus;
  }
  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : HPとアイテム効果の管理
   * ================================== */
  public health = this.maxHealth;
  private itemAttackUntil = 0;
  private itemDefenseUntil = 0;

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 最大MPの取得
   * ================================== */
  public get maxMp(): number { return this.stats.mp; }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 編成した花のステータスを反映
   * ================================== */
  public applyFlowerStats(flowers: readonly { hp: number; mp: number; atk: number; def: number; cd: number }[]): void {
    // 基本ステータスに戻す
    this.stats = { ...playerStats };
    // 花1体につき各能力値の25%を加算
    const bonusRate = 0.25;
    for (const flower of flowers) {
      this.stats.hp += flower.hp * bonusRate;
      this.stats.physicalAttack += flower.atk * bonusRate;
      this.stats.physicalDefense += flower.def * bonusRate;
      this.stats.criticalDamage += flower.cd * bonusRate;
    }
    this.baseMaxHealth = this.stats.hp;
    // 最大HPで開始
    this.health = this.maxHealth;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : アイテムの使用条件
   * ================================== */
  public itemUnavailable(id: number): string | null {
    // nullの場合は使用可能
    if (id === 13) return this.recoveryPotionUnavailable;
    if (this.dead || !this.active) return '戦闘不能中は使用できません。';
    if (![14,15].includes(id)) return '使用できないアイテムです。';
    if (battleNow(this.scene) < (id === 14 ? this.itemAttackUntil : this.itemDefenseUntil)) return 'この宝石の効果中です。';
    return null;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 宝石の効果確認
   * ================================== */
  public isGemActive(id: number): boolean {
    // 14:攻撃宝石 15:防御宝石
    return this.active && !this.dead && battleNow(this.scene) < (id === 14 ? this.itemAttackUntil : this.itemDefenseUntil);
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 戦闘アイテムの使用
   * ================================== */
  public startBattleItem(id: number): boolean {
    if (this.itemUnavailable(id)) return false;
    if (id === 13) return this.startRecoveryPotion();
    // 効果時間は30秒
    if (id === 14) this.itemAttackUntil = battleNow(this.scene) + 30000;
    else this.itemDefenseUntil = battleNow(this.scene) + 30000;
    this.emit('gem-used', id);
    return true;
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 回復アイテムの状態管理
   * ================================== */
  private potionRecovering = false;
  private regenerationTimers: Phaser.Time.TimerEvent[] = [];

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 回復タイマーの解除
   * ================================== */
  private clearRegeneration(): void {
    // 前の回復タイマーを解除
    this.regenerationTimers.forEach(timer => timer.remove());
    this.regenerationTimers = [];
    this.potionRecovering = false;
    this.emit('recovery-status', false);
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 花の継続回復
   * ================================== */
  private startFlowerRegeneration(durationMs: number, intervalMs: number, percent: number, onHeal?: () => void): void {
    if (durationMs <= 0 || intervalMs <= 0) return;
    this.clearRegeneration();
    this.emit('recovery-status', true);
    const endsAt = battleNow(this.scene) + durationMs;
    // 効果時間内のみ回復
    const timer = this.scene.time.addEvent({ delay: intervalMs, loop: true, callback: () => {
      if (!this.active || this.dead) { this.clearRegeneration(); return; }
      if (battleNow(this.scene) >= endsAt) return;
      this.restoreHealth(this.maxHealth * percent / 100);
      onHeal?.();
    }});
    const end = this.scene.time.delayedCall(durationMs, () => this.clearRegeneration());
    this.regenerationTimers = [timer, end];
  }


  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 回復薬の使用条件
   * ================================== */
  public get recoveryPotionUnavailable(): string | null {
    if (this.dead || !this.active) return '戦闘不能中は使用できません。';
    if (this.potionRecovering) return '回復薬の効果中です。';
    if (this.health >= this.maxHealth) return 'HPは満タンです。';
    return null;
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 回復薬の使用
   * ================================== */
  public startRecoveryPotion(): boolean {
    if (this.recoveryPotionUnavailable) return false;
    this.clearRegeneration();
    this.potionRecovering = true;
    this.emit('recovery-status', true);
    this.emit('potion-recovery', true);
    this.showArea([[0, 2, 0], [2, 1, 2], [0, 2, 0]], BUFF_EFFECT_COLOR);
    const total = Math.max(1, Math.round(this.maxHealth * 0.15));
    let delivered = 0;
    let tick = 0;
    // 最大HPの15%を10秒かけて回復
    const timer = this.scene.time.addEvent({ delay: 1000, repeat: 9, callback: () => {
      if (!this.active || this.dead) {
        this.clearRegeneration();
        return;
      }
      tick++;
      const target = Math.round(total * tick / 10);
      this.restoreHealth(target - delivered);
      delivered = target;
      if (tick === 10) {
        this.clearRegeneration();
      }
    }});
    this.regenerationTimers = [timer];
    return true;
  }


  constructor(scene: Phaser.Scene, x: number, y: number, cursors?: Phaser.Types.Input.Keyboard.CursorKeys) {
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 主人公の初期設定
     * ================================== */
    super(scene, x, y, 'player_idle');
    
    // シーンと物理演算に登録
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;
    // 破棄時に回復タイマーを解除
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.clearRegeneration());
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      // 足音の再生タイミング
      if (animation.key === 'player-run' && (frame.index === 3 || frame.index === 7)) {
        this.playRunStep();
      }
      // 攻撃中のジャンプ入力
      if (this.action === 'attack' && this.cursors?.up?.isDown) {
        this.jump();
        return;
      }
      // 攻撃の判定タイミング
      if (!['player-attack', 'player-attack2', 'player-attack3'].includes(animation.key) || frame.index < getPlayerAttackTiming(this.basicComboStep).impactFrame || !this.basicAttackTargets) return;
      // 二重ヒット防止
      const targets = this.basicAttackTargets;
      this.basicAttackTargets = null;
      this.landBasicAttack(targets);
    });
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : アニメーション終了時の処理
     * ================================== */
    this.on(Phaser.Animations.Events.ANIMATION_STOP, (animation: Phaser.Animations.Animation) => {
      if (animation.key === 'player-airAttack') {
        this.airAttackTargets = null;
        if (this.action === 'airAttack') this.action = null;
      }
      // 攻撃が中断された場合
      if (['player-attack', 'player-attack2', 'player-attack3'].includes(animation.key)) {
        this.basicAttackTargets = null;
        this.queuedBasicAttack = null;
        this.basicComboUntil = 0;
        if (this.action === 'attack') this.action = null;
        this.setVelocityX(0);
      }
    });
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
      if (animation.key === 'player-land') {
        this.landingAnimationPlaying = false;
      }
      if ([
        'player-attack',
        'player-attack2',
        'player-attack3',
        'player-skill',
        'player-hurt',
        'player-drink',
        'player-defend'
      ].includes(animation.key)) {
        this.action = null;
        this.setVelocityX(0);
      }
    });

    this.setScale(1.3)
        .setCollideWorldBounds(true)
        .setOrigin(0.5, 1);

    this.play('player-idle');
  }

  // =========================
  // ヒットボックス設定
  // =========================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 当たり判定の設定
   * ================================== */
  public setupHitbox(spawnObject?: Phaser.Types.Tilemaps.TiledObject, mapTileWidth: number = 16, mapTileHeight: number = 16): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 当たり判定のサイズ
    const hitboxWidth = spawnObject?.width || Math.min(
      mapTileWidth,
      Math.max(12, Math.round(this.displayWidth * 0.6))
    );

    const hitboxHeight = spawnObject?.height || Math.min(
      mapTileHeight,
      Math.max(12, Math.round(this.displayHeight * 0.8))
    );

    body.setSize(hitboxWidth / this.scaleX, hitboxHeight / this.scaleY);
    body.setOffset(
      // 当たり判定を足元に合わせる
      Math.round((this.frame.width - hitboxWidth / this.scaleX) / 2),
      this.frame.height - hitboxHeight / this.scaleY
    );
  }

  // =========================
  // 位置の微調整
  // =========================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 出現位置の調整
   * ================================== */
  public adjustPosition(spawnObject: Phaser.Types.Tilemaps.TiledObject): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 出現位置の調整
    this.x = (spawnObject.x ?? this.x) + ((spawnObject.width ?? 0) / 2);
    this.y = Math.round(
      (spawnObject.y ?? this.y) + this.displayHeight - body.offset.y - body.height
    );
  }


  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 防御状態の管理
   * ================================== */
  private guardHeld = false;
  private wasCrouchGuarding = false;

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 防御ボタンの入力
   * ================================== */
  public setGuardHeld(held: boolean): void {
    this.guardHeld = held;
    if (this.isGuarding()) {
      this.setVelocityX(0);
      this.playAnimation('player-defend');
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 防御中かどうかの判定
   * ================================== */
  public isGuarding(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    // 地上で下キーか防御ボタンを押すと防御
    return !this.dead && this.action === null && body?.blocked.down === true &&
      battleNow(this.scene) >= Math.max(this.chargeUntil, this.continuousUntil) &&
      (this.cursors?.down?.isDown === true || this.guardHeld);
  }

  public update(): void {
    if (this.action === 'airAttack') this.updateAirAttack();
    // 攻撃よりジャンプを優先
    if (this.cursors?.up?.isDown && (this.action === 'attack' || this.queuedBasicAttack)) this.jump();
    // 予約した攻撃を実行
    if (!this.dead && this.action === null && this.queuedBasicAttack && battleNow(this.scene) >= this.nextBasicAttackAt) {
      const targets = this.queuedBasicAttack;
      this.queuedBasicAttack = null;
      this.attack(targets);
    }
    if (this.action === 'attack') {
      // 攻撃中の踏み込み
      const frame = this.anims.currentFrame?.index ?? 0;
      const speed = BASIC_ATTACK_STEP_SPEEDS[this.basicComboStep]?.[frame - 1] ?? 0;
      this.setVelocityX(this.basicAttackDirection * speed);
    }
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 主人公の移動処理
     * ================================== */
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body || !this.cursors || this.dead) return;

    const worldGravity = this.scene.physics.world.gravity.y;
    const isFalling = body.velocity.y > 0;
    const extraGravity = isFalling ? this.FALL_GRAVITY_BONUS : 0;
    const gravityScale = isFalling ? AIR_GRAVITY_SCALE * FALL_GRAVITY_REDUCTION : AIR_GRAVITY_SCALE;
    // 上昇と下降で重力を変更
    body.setGravityY(!body.blocked.down
      ? (worldGravity + extraGravity) * gravityScale - worldGravity
      : 0);

    // 行動中は移動を制限
    if (this.action === 'attack') {
      // 踏み込みは上で処理済み
    } else if (this.action !== null || this.isGuarding() || battleNow(this.scene) < Math.max(this.chargeUntil, this.comboUntil)) {
      this.setVelocityX(0);
    } else if (this.cursors.left?.isDown) {
      this.setVelocityX(-this.PLAYER_SPEED * this.stats.agility / 100);
      this.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.setVelocityX(this.PLAYER_SPEED * this.stats.agility / 100);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // 地上にいる場合のみジャンプ
    if (this.cursors.up?.isDown && body.blocked.down) this.jump();

    const isGrounded = body.blocked.down && body.velocity.y >= 0;
    if (isGrounded && !this.wasGrounded && this.scene.scene.key === SCENE_KEYS.STAGE) {
      playSe(this.scene, PLAYER_RUN_STEP_KEYS[0], 0.3);
    }
    const crouchGuarding = this.isGuarding();
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 防御音とアニメーションの切り替え
     * ================================== */
    if (crouchGuarding && !this.wasCrouchGuarding && !this.scene.sound.get('player-guard-hit')?.isPlaying) {
      playSe(this.scene, 'player-crouch', 0.5);
    }
    this.wasCrouchGuarding = crouchGuarding;

    if (this.action !== null) {
      // 行動中はアニメーションを変更しない
    } else if (battleNow(this.scene) < this.chargeUntil) {
      this.playAnimation('player-defend');
    } else if (crouchGuarding) {
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

    // 接地状態を更新
    this.wasGrounded = isGrounded;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 足音の再生
   * ================================== */
  private playRunStep(): void {
    if (this.scene.scene.key !== SCENE_KEYS.STAGE) return;
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body?.enable || this.dead || this.action !== null || this.scene.physics.world.isPaused ||
        !body.blocked.down || body.velocity.x === 0 || Math.abs(body.deltaX()) < 0.01) return;

    playSe(this.scene, PLAYER_RUN_STEP_KEYS[this.nextRunStep], 0.4);
    this.nextRunStep = (this.nextRunStep + 1) % PLAYER_RUN_STEP_KEYS.length;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : ジャンプ処理
   * ================================== */
  public jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.dead || !body) return;
    // ジャンプで攻撃をキャンセル
    if (this.action === 'attack' || this.queuedBasicAttack) {
      this.queuedBasicAttack = null;
      this.basicAttackTargets = null;
      this.basicComboUntil = 0;
      this.basicComboStep = -1;
      if (this.action === 'attack') {
        this.anims.stop();
        this.action = null;
        this.setVelocityX(0);
        this.landingAnimationPlaying = false;
        this.playAnimation(body.velocity.y <= 0 ? 'player-jump' : 'player-fall');
      }
    }
    if (this.action === null && battleNow(this.scene) >= Math.max(this.chargeUntil, this.comboUntil) && !this.isGuarding() && body.blocked.down && body.velocity.y >= 0) {
      this.setVelocityY(-this.JUMP_POWER * JUMP_POWER_SCALE);
      this.landingAnimationPlaying = false;
      this.playAnimation('player-jump');
      playSe(this.scene, 'player-jump', 0.5);
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 通常攻撃
   * ================================== */
  public attack(targets: readonly CombatTarget[] = []): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body && (!body.blocked.down || body.velocity.y < 0)) {
      this.startAirAttack(targets);
      return;
    }
    // 上キー入力時はジャンプを優先
    if (this.cursors?.up?.isDown) {
      this.jump();
      return;
    }
    const now = battleNow(this.scene);
    // コンボの先行入力
    if (this.dead || now < Math.max(this.chargeUntil, this.comboUntil, this.continuousUntil)) return;
    if (this.action === 'attack' || (this.action === null && now < this.nextBasicAttackAt && now < this.basicComboUntil)) {
      this.queuedBasicAttack = targets;
      return;
    }
    if (now < this.nextBasicAttackAt) return;
    // コンボの段数を決める
    const step = now <= this.basicComboUntil ? (this.basicComboStep + 1) % 3 : 0;
    const key = ['player-attack', 'player-attack2', 'player-attack3'][step];
    if (!this.playAction('attack', key)) return;
    this.basicComboStep = step;
    this.basicAttackDirection = this.flipX ? -1 : 1;
    this.nextBasicAttackAt = now + this.stats.attackIntervalMs;
    this.basicComboUntil = Math.max(this.nextBasicAttackAt, now + 600) + 900;
    this.basicAttackTargets = targets;
  }

  private startAirAttack(targets: readonly CombatTarget[]): void {
    const now = battleNow(this.scene);
    if (now < Math.max(this.nextBasicAttackAt, this.chargeUntil, this.comboUntil, this.continuousUntil)) return;
    if (!this.playAction('airAttack', 'player-airAttack')) return;
    this.queuedBasicAttack = null;
    this.basicAttackTargets = null;
    this.basicComboUntil = 0;
    this.basicComboStep = -1;
    this.airAttackTargets = targets;
    this.airAttackPreviousY = this.y;
    this.nextBasicAttackAt = now + this.stats.attackIntervalMs;
    playSe(this.scene, 'player-sword-swing');
  }

  private updateAirAttack(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const ready = (this.anims.currentFrame?.index ?? 0) >= 3;
    const swordX = this.x;
    if (ready && !body.blocked.down) this.setVelocityY(Math.max(body.velocity.y, 420));
    // 落下攻撃のすり抜け防止
    if (ready && body.velocity.y >= 0 && this.airAttackTargets) {
      const top = Math.min(this.airAttackPreviousY, this.y) - 24;
      const bottom = Math.max(this.airAttackPreviousY, this.y) + 40;
      const target = this.airAttackTargets.find(enemy => !enemy.isDefeated &&
        Math.abs(enemy.x - swordX) <= 44 && enemy.y - 40 >= top && enemy.y - 40 <= bottom);
      if (target) {
        this.airAttackTargets = null;
        target.receiveDamage(this.applyPlayerCritical(this.applyAttackBonus(this.stats.physicalAttack)));
        playSe(this.scene, 'player-sword-hit', 0.65);
        this.showHit(target.x, target.y - 40);
      }
    }
    this.airAttackPreviousY = this.y;
    if (body.blocked.down && body.velocity.y >= 0) {
      this.airAttackTargets = null;
      this.action = null;
      this.setVelocityX(0);
      this.landingAnimationPlaying = true;
      this.wasGrounded = true;
      this.showHit(swordX, this.y - 4);
      this.play('player-land');
    }
  }
  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 通常攻撃の当たり判定
   * ================================== */
  private landBasicAttack(targets: readonly CombatTarget[]): void {
    this.showSlash();
    const hits = this.getTargetsInRange(targets, getPlayerAttackTiming().range, false);
    if (hits.length > 0) playSe(this.scene, 'player-sword-hit', 0.65);
    else playSe(this.scene, 'player-sword-swing');
    // 通常攻撃は敵1体まで
    hits.slice(0, 1).forEach(target => {
      target.receiveDamage(this.applyPlayerCritical(this.applyAttackBonus(this.stats.physicalAttack)));
      this.showHit(target.x, target.y - 44);
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 斬撃エフェクト
   * ================================== */
  private showSlash(): void {
    const direction = this.flipX ? -1 : 1;
    const range = getPlayerAttackTiming().range;
    const slash = this.scene.add.graphics({ x: this.x, y: this.y })
      .setDepth(18).setScale(direction, 1).setBlendMode(Phaser.BlendModes.ADD);
    const paths = [
      [new Phaser.Math.Vector2(10, -143), new Phaser.Math.Vector2(145, -139), new Phaser.Math.Vector2(105, -5)],
      [new Phaser.Math.Vector2(24, -96), new Phaser.Math.Vector2(range * 1.75, -72), new Phaser.Math.Vector2(36, -38)],
      [new Phaser.Math.Vector2(24, -65), new Phaser.Math.Vector2(range * 0.6, -65), new Phaser.Math.Vector2(range, -65)],
    ];
    const [start, control, end] = paths[Math.max(0, this.basicComboStep)];
    const curve = new Phaser.Curves.QuadraticBezier(start, control, end);
    // 斬撃の残光
    for (const [width, color, alpha] of [[22, 0xff982b, 0.22], [11, 0xffca5c, 0.8], [3.5, 0xfff9df, 1]]) {
      const outside: Phaser.Math.Vector2[] = [];
      const inside: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        const thickness = Math.sin(Math.PI * t) * width * (this.basicComboStep === 2 ? 0.45 : 1);
        outside.push(new Phaser.Math.Vector2(point.x - tangent.y * thickness, point.y + tangent.x * thickness));
        inside.push(new Phaser.Math.Vector2(point.x + tangent.y * thickness, point.y - tangent.x * thickness));
      }
      slash.fillStyle(color, alpha).fillPoints([...outside, ...inside.reverse()], true);
    }
    // 火花エフェクト
    const embers = this.scene.add.graphics({ x: this.x, y: this.y })
      .setDepth(19).setScale(direction, 1).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 1; i <= 7; i++) {
      const point = curve.getPoint(i / 8);
      const offset = i % 2 === 0 ? 12 : -12;
      embers.fillStyle(i % 2 === 0 ? 0xffdb80 : 0xfff7db, 0.85)
        .fillTriangle(point.x, point.y + offset, point.x - 7, point.y + offset - 2, point.x - 12, point.y + offset + 2);
    }
    this.scene.tweens.add({ targets: slash, alpha: 0, scaleY: 1.06, duration: 210, ease: 'Quad.easeOut', onComplete: () => slash.destroy() });
    this.scene.tweens.add({ targets: embers, x: this.x + direction * 14, y: this.y - 9, alpha: 0, duration: 290, ease: 'Quad.easeOut', onComplete: () => embers.destroy() });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃の命中エフェクト
   * ================================== */
  private showHit(x: number, y: number): void {
    this.scene.cameras.main.shake(70, 0.0025);
    const flash = this.scene.add.graphics({ x, y }).setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
    flash.fillStyle(0xffb84a, 0.6).fillCircle(0, 0, 13);
    flash.fillStyle(0xfff8db, 1).fillPoints([
      new Phaser.Math.Vector2(-23, 0), new Phaser.Math.Vector2(-4, -4),
      new Phaser.Math.Vector2(0, -15), new Phaser.Math.Vector2(4, -4),
      new Phaser.Math.Vector2(23, 0), new Phaser.Math.Vector2(4, 4),
      new Phaser.Math.Vector2(0, 15), new Phaser.Math.Vector2(-4, 4),
    ], true);
    flash.lineStyle(2, 0xffdc83, 0.8).strokeCircle(0, 0, 16);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.6, duration: 140, onComplete: () => flash.destroy() });
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8 + 0.2;
      const distance = 28 + (i % 3) * 12;
      const spark = this.scene.add.graphics({ x, y }).setDepth(20)
        .setRotation(angle).setBlendMode(Phaser.BlendModes.ADD);
      spark.fillStyle(i % 2 === 0 ? 0xfff8df : 0xffbf54, 1).fillTriangle(13, 0, -4, -2, -4, 2);
      this.scene.tweens.add({
        targets: spark, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance,
        alpha: 0, scaleX: 0.3, scaleY: 0.6, duration: 190 + i * 12, ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの使用条件
   * ================================== */
  public canUseSkill(): boolean {
    return !this.dead && !this.isGuarding() && this.action === null && battleNow(this.scene) >= Math.max(this.chargeUntil, this.comboUntil);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル演出の登録
   * ================================== */
  public setSkillVisualHandler(handler: SkillVisualHandler): void {
    this.skillVisualHandler = handler;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル演出の呼び出し
   * ================================== */
  private emitSkillVisual(
    skill: ServerFlowerSkill,
    phase: SkillVisualPhase,
    targets: readonly CombatTarget[] = [],
    area: readonly (readonly number[])[] = skill.area
  ): void {
    if (this.skillVisualHandler) this.skillVisualHandler(skill, phase, targets, area);
    else this.showArea(area, phase === 'impact' ? 0xff5f61 : phase === 'charge' ? 0xffc247 : BUFF_EFFECT_COLOR);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの発動予約
   * ================================== */
  public reserveSkill(): boolean {
    if (!this.canUseSkill()) return false;
    // APIの応答待ち中は操作を制限
    this.action = 'skillPending';
    this.setVelocityX(0);
    return true;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル予約の解除
   * ================================== */
  public cancelReservedSkill(): void {
    if (this.action === 'skillPending') this.action = null;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 花のスキル発動
   * ================================== */
  public useFlowerSkill(skill: ServerFlowerSkill, targets: readonly CombatTarget[] = []): boolean {
    // スキルの種類ごとにアニメーションを変更
    if (!this.playSkillAnimation(skill.type === 'heal' ? 'player-drink' :
      ['defensiveRecovery', 'fortify'].includes(skill.type) ? 'player-defend' : 'player-skill')) return false;

    this.emitSkillVisual(skill, 'cast');
    const windup = 160;
    // 連続攻撃中は入力を制限
    const sequence = skill.type === 'multiHit' ? Math.max(0, skill.hitCount - 1) * 145
      : skill.type === 'maple' && this.mapleIsRed ? Math.max(0, skill.stages.length - 1) * 450 : 0;
    this.comboUntil = battleNow(this.scene) + windup + sequence;
    this.scheduleAfter(windup, () => this.executeFlowerSkill(skill, targets));
    return true;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : スキルごとの効果処理
   * ================================== */
  private executeFlowerSkill(skill: ServerFlowerSkill, targets: readonly CombatTarget[]): void {
    // スキルごとの処理
    switch (skill.type) {
      case 'multiHit':
        // 多段攻撃
        for (let hit = 0; hit < skill.hitCount; hit++) {
          this.scene.time.delayedCall(hit * 145, () => {
            if (!this.active || this.dead) return;
            const hitTargets = this.damageTargetsInArea(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.area, this.getSkillDamageType(skill));
            this.emitSkillVisual(skill, 'impact', hitTargets);
          });
        }
        break;
      case 'defensiveRecovery':
        this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
        this.startFlowerRegeneration(skill.durationMs, skill.healIntervalMs, skill.healPercent, () => this.emitSkillVisual(skill, 'heal', [this]));
        this.emitSkillVisual(skill, 'buff', [this]);
        break;
      case 'charge':
        // チャージ後に攻撃
        this.chargeUntil = battleNow(this.scene) + skill.durationMs;
        this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
        this.scene.time.delayedCall(skill.durationMs, () => {
          if (!this.active || this.dead) return;
          const hitTargets = this.damageTargetsInArea(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.area, this.getSkillDamageType(skill));
          this.emitSkillVisual(skill, 'impact', hitTargets);
        });
        this.emitSkillVisual(skill, 'charge', [this]);
        break;
      case 'balanced':
        // 着弾前に倒された敵は除外
        this.applyTimedBuff(skill.attackBonusPercent, skill.defenseBonusPercent, skill.durationMs);
        this.repeatUntil(skill.durationMs, skill.repeatIntervalMs, () => {
          const launched = this.getTargetsInArea(targets, skill.area);
          this.emitSkillVisual(skill, 'projectile', launched);
          this.scheduleAfter(220, () => {
            const hitTargets = launched.filter(target => !target.isDefeated);
            hitTargets.forEach(target => target.receiveDamage(this.skillDamage(skill.damagePercent, skill.attackPower), this.getSkillDamageType(skill)));
            this.emitSkillVisual(skill, 'impact', hitTargets);
          });
        });
        this.emitSkillVisual(skill, 'buff', [this]);
        break;
      case 'continuous':
        // 攻撃速度に応じて攻撃間隔を変更
        this.applyTimedBuff(skill.attackBonusPercent, skill.defenseBonusPercent, skill.durationMs);
        this.continuousUntil = battleNow(this.scene) + skill.durationMs;
        this.repeatUntil(
          skill.durationMs,
          Math.max(100, Math.round(skill.repeatIntervalMs / (1 + skill.attackSpeedBonusPercent / 100))),
          () => {
          const hitTargets = this.damageTargetsInArea(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.area, this.getSkillDamageType(skill));
          this.emitSkillVisual(skill, 'impact', hitTargets);
          }
        );
        this.emitSkillVisual(skill, 'buff', [this]);
        break;
      case 'maple':
        if (this.mapleIsRed) {
          // 紅葉時の連続攻撃
          this.mapleIsRed = false;
          skill.stages.forEach((stage, index) => {
            this.scene.time.delayedCall(index * 450, () => {
              if (!this.active || this.dead) return;
              const hitTargets = this.getTargetsInArea(targets, stage.area);
              const hitTarget = hitTargets[0];
              this.emitSkillVisual(skill, 'impact', hitTarget ? [hitTarget] : [], stage.area);
              if (hitTarget) {
                hitTarget.receiveDamage(this.skillDamage(stage.damagePercent, skill.attackPower), this.getSkillDamageType(skill));
                if (stage.knockback) hitTarget.applyKnockback?.(this.flipX ? -1 : 1);
              }
            });
          });
        } else {
          // 回復、防御と紅葉状態への切り替え
          this.mapleIsRed = true;
          this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
          this.startFlowerRegeneration(skill.durationMs, skill.healIntervalMs, skill.healPercent, () => this.emitSkillVisual(skill, 'heal', [this]));
          this.emitSkillVisual(skill, 'buff', [this]);
        }
        break;
      case 'fortify': {
        // 最大HPと現在HPを増加
        const bonusHealth = Math.round(this.baseMaxHealth * skill.maxHealthBonusPercent / 100);
        this.maxHealthBonus = bonusHealth;
        this.maxHealthBonusUntil = battleNow(this.scene) + skill.durationMs;
        this.health = Math.min(this.maxHealth, this.health + bonusHealth);
        this.applyTimedBuff(skill.attackBonusPercent, skill.defenseBonusPercent, skill.durationMs);
        this.scheduleAfter(skill.durationMs, () => {
          if (battleNow(this.scene) >= this.maxHealthBonusUntil) {
            this.maxHealthBonus = 0;
            this.health = Math.min(this.health, this.maxHealth);
            this.emit('health-changed', this.health, this.maxHealth);
          }
        });
        this.emit('health-changed', this.health, this.maxHealth);
        this.emitSkillVisual(skill, 'buff', [this]);
        break;
      }
      case 'slowAttack':
        // ダメージと攻撃速度低下
        const affectedTargets = this.getTargetsInArea(targets, skill.area);
        this.emitSkillVisual(skill, 'impact', affectedTargets);
        affectedTargets.forEach(target => {
          target.receiveDamage(this.skillDamage(skill.damagePercent, skill.attackPower), this.getSkillDamageType(skill));
          target.applyAttackSpeedSlow?.(skill.slowPercent, skill.durationMs);
        });
        break;
      case 'heal':
        this.restoreHealth(this.maxHealth * skill.healPercent / 100);
        this.emitSkillVisual(skill, 'heal', [this]);
        break;
      case 'evasion':
        // 攻撃後に回避効果を付与
        const hitTargets = this.damageTargetsInArea(targets, this.skillDamage(skill.damagePercent, skill.attackPower), skill.area, this.getSkillDamageType(skill));
        this.emitSkillVisual(skill, 'impact', hitTargets);
        this.evasionUntil = battleNow(this.scene) + skill.durationMs;
        this.evasionPercent = skill.evasionPercent;
        this.emitSkillVisual(skill, 'buff', [this]);
        break;
    }
  }

  public receiveDamage(amount: number, damageType: DamageType = 'physical'): void {
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : ダメージ計算
     * ================================== */
    const now = battleNow(this.scene);
    // 死亡中や無敵中はダメージを受けない
    if (this.dead || now < this.invulnerableUntil || amount <= 0) return;
    // 回避判定
    if (now < this.evasionUntil && Math.random() * 100 < this.evasionPercent) return;

    // 防御力と各種効果によるダメージ軽減
    const defending = this.isGuarding();
    const activeDefenseBonus = now < this.defenseUntil ? this.defenseBonusPercent : 0;
    const defense = Math.max(0, damageType === 'magical' ? this.stats.magicDefense : this.stats.physicalDefense);
    const statDamageMultiplier = 100 / (100 + defense);
    const buffDamageMultiplier = Math.max(0.1, 1 - activeDefenseBonus / 100);
    const damageMultiplier = statDamageMultiplier * buffDamageMultiplier * (defending ? 0.5 : 1);
    const previousHealth = this.health;
    // 防御宝石で物理ダメージを20%軽減
    this.health = Math.max(0, this.health - Math.ceil(amount * damageMultiplier * (damageType === 'physical' && now < this.itemDefenseUntil ? 0.8 : 1)));
    showBattleNumber(this.scene, this.x, this.y, previousHealth - this.health, damageType);
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 被ダメージ時の効果音と無敵時間
     * ================================== */
    this.scene.sound.stopByKey('player-crouch');
    playSe(this.scene, defending ? 'player-guard-hit' : 'player-damage', 0.65);
    this.invulnerableUntil = now + 700;
    this.emit('health-changed', this.health, this.maxHealth);

    if (this.health === 0) {
      this.die();
      return;
    }

    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : ダメージを受けたときの動作
     * ================================== */
    this.basicComboUntil = 0;
    this.queuedBasicAttack = null;
    this.basicAttackTargets = null;
    this.airAttackTargets = null;
    this.action = 'hurt';
    this.landingAnimationPlaying = false;
    this.setVelocityX(0);
    this.play('player-hurt', true);
    this.setTint(0xffaaaa);
    this.scene.time.delayedCall(160, () => this.clearTint());
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 死亡処理
   * ================================== */
  public die(): void {
    if (this.dead || !this.scene.anims.exists('player-death')) return;
    // 死亡時は移動を停止
    this.dead = true;
    this.airAttackTargets = null;
    this.queuedBasicAttack = null;
    this.basicAttackTargets = null;
    this.action = null;
    this.setVelocity(0, 0);
    const body = this.body;
    if (body) body.enable = false;
    this.play('player-death', true);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 行動アニメーションの再生
   * ================================== */
  private playAction(action: string, animationKey: string): boolean {
    if (this.dead || this.isGuarding() || this.action !== null || !this.scene.anims.exists(animationKey)) return false;
    this.action = action;
    this.landingAnimationPlaying = false;
    this.setVelocityX(0);
    this.play(animationKey, true);
    return true;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルアニメーションの再生
   * ================================== */
  private playSkillAnimation(animationKey: string): boolean {
    if (
      !this.scene.anims.exists(animationKey) ||
      this.isGuarding() ||
      (this.action !== 'skillPending' && this.action !== null) ||
      this.dead
    ) {
      return false;
    }
    this.queuedBasicAttack = null;
    this.basicComboUntil = 0;
    this.action = 'skill';
    this.landingAnimationPlaying = false;
    this.setVelocityX(0);
    this.play(animationKey, true);
    return true;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃範囲の判定
   * ================================== */
  private getTargetsInRange(
    targets: readonly CombatTarget[],
    range: number,
    radial: boolean
  ): CombatTarget[] {
    const direction = this.flipX ? -1 : 1;
    // trueなら円形、falseなら前方
    return targets.filter(target => {
      if (target.isDefeated) return false;
      const distanceX = (target.x - this.x) * direction;
      const distanceY = target.y - this.y;
      return radial
        ? Math.hypot(distanceX, distanceY) <= range
        : distanceX >= -20 && distanceX <= range && Math.abs(distanceY) <= 100;
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 範囲内の敵へのダメージ処理
   * ================================== */
  private damageTargetsInArea(
    targets: readonly CombatTarget[],
    damage: number,
    area: readonly (readonly number[])[],
    damageType: DamageType = 'physical'
  ): CombatTarget[] {
    const hitTargets = this.getTargetsInArea(targets, area);
    hitTargets.forEach(target => target.receiveDamage(damage, damageType));
    return hitTargets;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの物理・魔法判定
   * ================================== */
  private getSkillDamageType(skill: ServerFlowerSkill): DamageType {
    return skill.element === '無' ? 'physical' : 'magical';
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの命中判定
   * ================================== */
  private getTargetsInArea(
    targets: readonly CombatTarget[],
    area: readonly (readonly number[])[]
  ): CombatTarget[] {
    // 1:自分の位置 2:攻撃範囲
    const originRow = area.findIndex(row => row.includes(1));
    if (originRow < 0) return [];
    const originColumn = area[originRow].indexOf(1);
    const direction = this.flipX ? -1 : 1;

    return targets.filter(target => {
      if (target.isDefeated) return false;
      const column = originColumn + Math.round((target.x - this.x) * direction / SKILL_AREA_CELL_SIZE);
      const row = originRow + Math.round((target.y - this.y) / SKILL_AREA_CELL_SIZE);
      return area[row]?.[column] === 2;
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルのダメージ計算
   * ================================== */
  private skillDamage(percent: number, attackPower: number): number {
    return Math.max(1, Math.round(attackPower * percent / 100));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃力の補正
   * ================================== */
  private applyAttackBonus(damage: number): number {
    // スキルと攻撃宝石の倍率
    const bonus = battleNow(this.scene) < this.attackBonusUntil ? this.attackBonusPercent : 0;
    return Math.max(1, Math.round(damage * (1 + bonus / 100) * (battleNow(this.scene) < this.itemAttackUntil ? 1.2 : 1)));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : クリティカル判定
   * ================================== */
  private applyPlayerCritical(damage: number): number {
    // クリティカル時のダメージ補正
    if (Math.random() * 100 >= this.stats.criticalRate) return damage;
    return Math.round(damage * (1 + this.stats.criticalDamage / 100));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃・防御バフの設定
   * ================================== */
  private applyTimedBuff(attackPercent: number, defensePercent: number, durationMs: number): void {
    // バフの再発動時に古いタイマーで解除されるのを防ぐ
    this.attackBonusPercent = attackPercent;
    this.attackBonusUntil = battleNow(this.scene) + durationMs;
    this.applyDefenseBuff(defensePercent, durationMs);
    this.scheduleAfter(durationMs, () => {
      if (battleNow(this.scene) >= this.attackBonusUntil) this.attackBonusPercent = 0;
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 防御バフの設定
   * ================================== */
  private applyDefenseBuff(defensePercent: number, durationMs: number): void {
    this.defenseBonusPercent = defensePercent;
    this.defenseUntil = battleNow(this.scene) + durationMs;
    this.scheduleAfter(durationMs, () => {
      if (battleNow(this.scene) >= this.defenseUntil) this.defenseBonusPercent = 0;
    });
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 効果の繰り返し処理
   * ================================== */
  private repeatUntil(durationMs: number, intervalMs: number, effect: () => void): void {
    if (intervalMs <= 0) return;
    const endsAt = battleNow(this.scene) + durationMs;
    const repeat = (): void => {
      if (!this.active || this.dead) { this.clearRegeneration(); return; }
      // 効果時間内は処理を繰り返す
      if (battleNow(this.scene) >= endsAt) return;
      effect();
      this.scene.time.delayedCall(intervalMs, repeat);
    };
    this.scene.time.delayedCall(intervalMs, repeat);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 遅延処理
   * ================================== */
  private scheduleAfter(delayMs: number, effect: () => void): void {
    // 死亡・破棄後は実行しない
    this.scene.time.delayedCall(delayMs, () => {
      if (this.active && !this.dead) effect();
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : HPの回復
   * ================================== */
  private restoreHealth(amount: number): void {
    // 最大HPを超えないように回復
    const healed = Math.min(this.maxHealth - this.health, Math.max(0, Math.round(amount)));
    this.health += healed;
    showBattleNumber(this.scene, this.x, this.y, healed, 'heal');
    this.emit('health-changed', this.health, this.maxHealth);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル範囲の表示
   * ================================== */
  private showArea(area: readonly (readonly number[])[], color: number): void {
    // 1:自分の位置 2:効果範囲
    const originRow = area.findIndex(row => row.includes(1));
    if (originRow < 0) return;
    const originColumn = area[originRow].indexOf(1);
    const direction = this.flipX ? -1 : 1;
    const cellSize = SKILL_AREA_CELL_SIZE - 3;
    const indicator = this.scene.add.graphics().setDepth(8).setScrollFactor(1);

    area.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
      if (cell === 0) return;
      const x = this.x + (columnIndex - originColumn) * SKILL_AREA_CELL_SIZE * direction;
      const y = this.y + (rowIndex - originRow) * SKILL_AREA_CELL_SIZE;
      const cellColor = cell === 1 ? 0xfff1b8 : color;
      indicator.fillStyle(cellColor, cell === 1 ? 0.34 : 0.22);
      indicator.lineStyle(2, cellColor, 0.9);
      indicator.fillRoundedRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize, 5);
      indicator.strokeRoundedRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize, 5);
    }));

    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      delay: 320,
      duration: 380,
      onComplete: () => indicator.destroy()
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : アニメーションの切り替え
   * ================================== */
  private playAnimation(animationKey: string): void {
    if (this.anims.currentAnim?.key !== animationKey) {
      this.play(animationKey, true);
    }
  }
}
