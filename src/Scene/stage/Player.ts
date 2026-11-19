/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
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
 * 処理内容 : 主人公操作・戦闘を定義する
 * ================================== */
const BUFF_EFFECT_COLOR = 0xff5964;
// スキル範囲の表示と敵の位置判定を同じ基準で行うため、1マスを40pxとして定数化する。
const SKILL_AREA_CELL_SIZE = 40;
// 上昇と下降で空中操作感を変える重力設定。
// 上昇中は4倍の重力でジャンプを素早く終え、下降中だけ緩和係数を掛けて落下を少しゆっくりにする。
const AIR_GRAVITY_SCALE = 4;
const FALL_GRAVITY_REDUCTION = 0.9;
const JUMP_POWER_SCALE = 1.4;
// 通常攻撃の各フレームで進ませる踏み込み距離を段ごとに設定する。
// 0は足を止めるフレーム、正の値は剣の動きに合わせた前進速度を表す。
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
  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 主人公の移動・行動・死亡状態とスキル効果の期限を保持する
   * ================================== */
  private stats = { ...playerStats };
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  // 移動速度やジャンプ力など、フレーム更新ごとに参照する基本能力値を保存する。
  private readonly PLAYER_SPEED = this.stats.moveSpeed;
  private readonly JUMP_POWER = this.stats.jumpPower;
  private readonly FALL_GRAVITY_BONUS = this.stats.fallGravityBonus;
  // 移動状態の前回値を保持し、着地・足音など「状態が切り替わった瞬間」の処理に使う。
  private wasGrounded = true;
  private nextRunStep = 0;
  private landingAnimationPlaying = false;
  // actionがnull以外の間は、攻撃や被弾などのアニメーションを優先して移動を制限する。
  private action: string | null = null;
  private dead = false;
  // バトル時計基準の期限を使うことで、ポーズ中に無敵時間やバフ時間が進まないようにする。
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
   * 処理内容 : モミジの紅葉状態を返す
   * ================================== */
  public get isMapleRed(): boolean { return this.mapleIsRed; }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル演出の通知先・最大HPの補正・通常攻撃の待機状態を保持する
   * ================================== */
  private skillVisualHandler?: SkillVisualHandler;
  private baseMaxHealth = this.stats.hp;
  private maxHealthBonus = 0;
  private maxHealthBonusUntil = 0;
  private nextBasicAttackAt = 0;
  private basicAttackTargets: readonly CombatTarget[] | null = null;
  private basicComboStep = -1;
  private basicComboUntil = 0;
  // 攻撃中に追加入力された攻撃を一時保留し、アニメーション終了後に次の段へ繰り越す。
  private queuedBasicAttack: readonly CombatTarget[] | null = null;
  private basicAttackDirection = 1;
  private airAttackTargets: readonly CombatTarget[] | null = null;
  private airAttackPreviousY = 0;
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 基本HPに強化分を加えた最大HPを返す
   * ================================== */
  public get maxHealth(): number {
    return this.baseMaxHealth + this.maxHealthBonus;
  }
  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 現在HPと攻撃・防御アイテムの効果終了時刻を保持する
   * ================================== */
  public health = this.maxHealth;
  private itemAttackUntil = 0;
  private itemDefenseUntil = 0;

  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 主人公の基本定義の最大MPをHUDへ渡す（花のMPは加算しない）
   * ================================== */
  public get maxMp(): number { return this.stats.mp; }

  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 戦闘開始時に花のMP以外の能力値を各25%加算し、主人公を最大HPで初期化する
   * ================================== */
  public applyFlowerStats(flowers: readonly { hp: number; mp: number; atk: number; def: number; cd: number }[]): void {
    // 前回の編成値を引き継がないよう毎回初期値へ戻してから、編成中の花の補正を合算する。
    this.stats = { ...playerStats };
    // 編成人数にかかわらず、編成される花1体につき各ステータスの25%を主人公へ加算する。
    const bonusRate = 0.25;
    for (const flower of flowers) {
      this.stats.hp += flower.hp * bonusRate;
      this.stats.physicalAttack += flower.atk * bonusRate;
      this.stats.physicalDefense += flower.def * bonusRate;
      this.stats.criticalDamage += flower.cd * bonusRate;
    }
    this.baseMaxHealth = this.stats.hp;
    // 最大HPも編成反映後の値に更新し、戦闘開始時のHPを満タンにする。
    this.health = this.maxHealth;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : アイテムを使えない理由を確認する
   * ================================== */
  public itemUnavailable(id: number): string | null {
    // nullは使用可能、それ以外はUIに表示する使用不可理由。
    if (id === 13) return this.recoveryPotionUnavailable;
    if (this.dead || !this.active) return '戦闘不能中は使用できません。';
    if (![14,15].includes(id)) return '使用できないアイテムです。';
    if (battleNow(this.scene) < (id === 14 ? this.itemAttackUntil : this.itemDefenseUntil)) return 'この宝石の効果中です。';
    return null;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 宝石の効果が継続中か確認する
   * ================================== */
  public isGemActive(id: number): boolean {
    // ID 14は攻撃、ID 15は防御の宝石。それぞれの期限を個別に判定する。
    return this.active && !this.dead && battleNow(this.scene) < (id === 14 ? this.itemAttackUntil : this.itemDefenseUntil);
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 戦闘アイテムの効果を開始する
   * ================================== */
  public startBattleItem(id: number): boolean {
    if (this.itemUnavailable(id)) return false;
    if (id === 13) return this.startRecoveryPotion();
    // 宝石効果は使用時刻から30秒間有効にし、HUDへ使用イベントを通知する。
    if (id === 14) this.itemAttackUntil = battleNow(this.scene) + 30000;
    else this.itemDefenseUntil = battleNow(this.scene) + 30000;
    this.emit('gem-used', id);
    return true;
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 回復薬の使用状態と継続回復タイマーを保持する
   * ================================== */
  private potionRecovering = false;
  private regenerationTimers: Phaser.Time.TimerEvent[] = [];

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 継続回復のタイマーを解除する
   * ================================== */
  private clearRegeneration(): void {
    // 継続回復を途中で置き換える場合も、旧タイマーが後から回復しないよう全て破棄する。
    this.regenerationTimers.forEach(timer => timer.remove());
    this.regenerationTimers = [];
    this.potionRecovering = false;
    this.emit('recovery-status', false);
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 花の継続回復を開始する
   * ================================== */
  private startFlowerRegeneration(durationMs: number, intervalMs: number, percent: number, onHeal?: () => void): void {
    if (durationMs <= 0 || intervalMs <= 0) return;
    this.clearRegeneration();
    this.emit('recovery-status', true);
    const endsAt = battleNow(this.scene) + durationMs;
    // 一定間隔で最大HP割合を回復する。効果時間終了後のタイマー発火は行わない。
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
   * 処理内容 : HPや回復中の状態からアイテムを使えない理由を返す
   * ================================== */
  public get recoveryPotionUnavailable(): string | null {
    if (this.dead || !this.active) return '戦闘不能中は使用できません。';
    if (this.potionRecovering) return '回復薬の効果中です。';
    if (this.health >= this.maxHealth) return 'HPは満タンです。';
    return null;
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 回復アイテムの効果を開始する
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
    // 15%分を10回に分けて1秒ごとに回復し、端数は累積目標との差分で配分する。
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
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    super(scene, x, y, 'player_idle');
    
    // 表示オブジェクトとArcade Physicsの両方へ登録し、このクラスの当たり判定を有効にする。
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;
    // オブジェクト破棄時に継続回復用タイマーだけを明示的に解除し、破棄後の回復を防ぐ。
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.clearRegeneration());
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      // player-runの指定フレームで足音を再生し、走りのリズムに合わせる。
      if (animation.key === 'player-run' && (frame.index === 3 || frame.index === 7)) {
        this.playRunStep();
      }
      // 攻撃アニメーション中に上方向が押された場合はジャンプ処理へ渡し、硬直をキャンセルする。
      if (this.action === 'attack' && this.cursors?.up?.isDown) {
        this.jump();
        return;
      }
      // 指定フレーム以前、または別アニメーション中はダメージ判定を行わない。
      if (!['player-attack', 'player-attack2', 'player-attack3'].includes(animation.key) || frame.index < getPlayerAttackTiming(this.basicComboStep).impactFrame || !this.basicAttackTargets) return;
      // ANIMATION_UPDATEはフレーム更新ごとに呼ばれるため、対象配列をnullにして命中処理は一度だけ行う。
      const targets = this.basicAttackTargets;
      this.basicAttackTargets = null;
      this.landBasicAttack(targets);
    });
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    this.on(Phaser.Animations.Events.ANIMATION_STOP, (animation: Phaser.Animations.Animation) => {
      if (animation.key === 'player-airAttack') {
        this.airAttackTargets = null;
        if (this.action === 'airAttack') this.action = null;
      }
      // 攻撃アニメーションが途中で停止した場合も、保留攻撃・敵配列・行動状態を確実に解除する。
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
        // 行動アニメーション終了後に操作可能状態へ戻す。
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
   * 処理内容 : 主人公の当たり判定と足元の位置を設定する
   * ================================== */
  public setupHitbox(spawnObject?: Phaser.Types.Tilemaps.TiledObject, mapTileWidth: number = 16, mapTileHeight: number = 16): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Tiledのスポーンオブジェクトに寸法があれば優先し、なければタイル内に収まる値を算出する。
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
      // 描画サイズではなく元フレーム基準で中央寄せし、足元がスプライト下端に揃うよう配置する。
      Math.round((this.frame.width - hitboxWidth / this.scaleX) / 2),
      this.frame.height - hitboxHeight / this.scaleY
    );
  }

  // =========================
  // 位置の微調整
  // =========================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : マップの出現位置に主人公を合わせる
   * ================================== */
  public adjustPosition(spawnObject: Phaser.Types.Tilemaps.TiledObject): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // スポーン領域の中央をX位置に使い、物理ボディの下端を領域の下端に合わせる。
    this.x = (spawnObject.x ?? this.x) + ((spawnObject.width ?? 0) / 2);
    this.y = Math.round(
      (spawnObject.y ?? this.y) + this.displayHeight - body.offset.y - body.height
    );
  }


  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 防御ボタンとしゃがみ防御の状態を保持する
   * ================================== */
  private guardHeld = false;
  private wasCrouchGuarding = false;

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 防御ボタンの押下状態を保持する
   * ================================== */
  public setGuardHeld(held: boolean): void {
    this.guardHeld = held;
    if (this.isGuarding()) {
      this.setVelocityX(0);
      this.playAnimation('player-defend');
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 現在防御中か確認する
   * ================================== */
  public isGuarding(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    // 地上にいて行動中でなく、チャージ中でもない場合に限り、下入力または防御ボタンを防御扱いする。
    return !this.dead && this.action === null && body?.blocked.down === true &&
      battleNow(this.scene) >= Math.max(this.chargeUntil, this.continuousUntil) &&
      (this.cursors?.down?.isDown === true || this.guardHeld);
  }

  public update(): void {
    if (this.action === 'airAttack') this.updateAirAttack();
    // 攻撃中や保留中にジャンプ入力がある場合は、先にジャンプへ割り込み処理を渡す。
    if (this.cursors?.up?.isDown && (this.action === 'attack' || this.queuedBasicAttack)) this.jump();
    // 保留された通常攻撃は、行動可能になりクールタイムも経過したタイミングで実行する。
    if (!this.dead && this.action === null && this.queuedBasicAttack && battleNow(this.scene) >= this.nextBasicAttackAt) {
      const targets = this.queuedBasicAttack;
      this.queuedBasicAttack = null;
      this.attack(targets);
    }
    if (this.action === 'attack') {
      // 通常攻撃中はアニメーションの現在フレームに対応する踏み込み速度を向きへ掛ける。
      const frame = this.anims.currentFrame?.index ?? 0;
      const speed = BASIC_ATTACK_STEP_SPEEDS[this.basicComboStep]?.[frame - 1] ?? 0;
      this.setVelocityX(this.basicAttackDirection * speed);
    }
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 操作と現在の状態を表示へ反映する
     * ================================== */
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body || !this.cursors || this.dead) return;

    const worldGravity = this.scene.physics.world.gravity.y;
    const isFalling = body.velocity.y > 0;
    const extraGravity = isFalling ? this.FALL_GRAVITY_BONUS : 0;
    const gravityScale = isFalling ? AIR_GRAVITY_SCALE * FALL_GRAVITY_REDUCTION : AIR_GRAVITY_SCALE;
    // Arcade Physicsの重力に追加重力を足し、上昇と下降で異なる空中操作感を作る。
    body.setGravityY(!body.blocked.down
      ? (worldGravity + extraGravity) * gravityScale - worldGravity
      : 0);

    // 行動アニメーション、防御、チャージ／コンボ中は横移動を止め、それ以外だけ入力を反映する。
    if (this.action === 'attack') {
      // 踏み込みは上で設定した物理速度で進め、壁との衝突を有効にする。
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

    // 接地中の上入力だけをジャンプとして扱い、空中での再ジャンプを防ぐ。
    if (this.cursors.up?.isDown && body.blocked.down) this.jump();

    const isGrounded = body.blocked.down && body.velocity.y >= 0;
    if (isGrounded && !this.wasGrounded && this.scene.scene.key === SCENE_KEYS.STAGE) {
      playSe(this.scene, PLAYER_RUN_STEP_KEYS[0], 0.3);
    }
    const crouchGuarding = this.isGuarding();
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 操作と現在の状態を表示へ反映する
     * ================================== */
    if (crouchGuarding && !this.wasCrouchGuarding && !this.scene.sound.get('player-guard-hit')?.isPlaying) {
      playSe(this.scene, 'player-crouch', 0.5);
    }
    this.wasCrouchGuarding = crouchGuarding;

    if (this.action !== null) {
      // 行動アニメーション再生中はANIMATION_COMPLETEまたはANIMATION_STOPで状態を解除するまで上書きしない。
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

    // 次フレームの着地判定やアニメーション切り替えで使うため、更新後の接地状態を保存する。
    this.wasGrounded = isGrounded;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 走行中の足音を再生する
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
   * 処理内容 : ジャンプを開始する
   * ================================== */
  public jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.dead || !body) return;
    // 通常攻撃中または連続攻撃の予約中のジャンプは、攻撃状態をキャンセルして空中アニメーションへ移行する。
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
   * 処理内容 : 通常攻撃を行う
   * ================================== */
  public attack(targets: readonly CombatTarget[] = []): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body && (!body.blocked.down || body.velocity.y < 0)) {
      this.startAirAttack(targets);
      return;
    }
    // 攻撃操作中のジャンプ入力はジャンプへ優先して処理し、攻撃は開始しない。
    if (this.cursors?.up?.isDown) {
      this.jump();
      return;
    }
    const now = battleNow(this.scene);
    // 被弾・チャージ・コンボ中は通常攻撃を開始できず、連続攻撃中の入力だけ予約する。
    if (this.dead || now < Math.max(this.chargeUntil, this.comboUntil, this.continuousUntil)) return;
    if (this.action === 'attack' || (this.action === null && now < this.nextBasicAttackAt && now < this.basicComboUntil)) {
      this.queuedBasicAttack = targets;
      return;
    }
    if (now < this.nextBasicAttackAt) return;
    // コンボ有効時間内なら次の段へ進め、有効時間外なら最初の攻撃へ戻す。
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
    // 前フレームからの落下区間を調べ、高速落下でも敵をすり抜けないようにする。
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
   * 処理内容 : 前方の敵1体へ通常攻撃のダメージと命中演出を適用する
   * ================================== */
  private landBasicAttack(targets: readonly CombatTarget[]): void {
    this.showSlash();
    const hits = this.getTargetsInRange(targets, getPlayerAttackTiming().range, false);
    if (hits.length > 0) playSe(this.scene, 'player-sword-hit', 0.65);
    else playSe(this.scene, 'player-sword-swing');
    // 範囲内の敵が複数いても、通常攻撃は最初の1体だけにダメージを与える。
    hits.slice(0, 1).forEach(target => {
      target.receiveDamage(this.applyPlayerCritical(this.applyAttackBonus(this.stats.physicalAttack)));
      this.showHit(target.x, target.y - 44);
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 主人公の通常攻撃の斬撃を表示する
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
    // 両端を細く絞った三層の軌跡で、鋭い芯と金色の残光を作る。
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
    // 軌跡に沿って小さな残光を散らし、剣筋から離れるほど早く消す。
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
   * 処理内容 : 攻撃が命中した位置にヒット演出を表示する
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
   * 処理内容 : 死亡・防御・行動中などの状態からスキルを使用できるか判定する
   * ================================== */
  public canUseSkill(): boolean {
    return !this.dead && !this.isGuarding() && this.action === null && battleNow(this.scene) >= Math.max(this.chargeUntil, this.comboUntil);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキル演出を呼び出す通知先を登録する
   * ================================== */
  public setSkillVisualHandler(handler: SkillVisualHandler): void {
    this.skillVisualHandler = handler;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの段階・対象・範囲を演出処理へ通知する
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
   * 処理内容 : スキルの発動を予約する
   * ================================== */
  public reserveSkill(): boolean {
    if (!this.canUseSkill()) return false;
    // API応答を待つ間も攻撃等で状態が変わらないよう、仮の行動状態にして移動を止める。
    this.action = 'skillPending';
    this.setVelocityX(0);
    return true;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの発動予約を取り消す
   * ================================== */
  public cancelReservedSkill(): void {
    if (this.action === 'skillPending') this.action = null;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 指定した花のスキルを実行する
   * ================================== */
  public useFlowerSkill(skill: ServerFlowerSkill, targets: readonly CombatTarget[] = []): boolean {
    // 花ごとにスキルの種類を判定し、回復・防御系と攻撃系で発動アニメーションを切り替える。
    if (!this.playSkillAnimation(skill.type === 'heal' ? 'player-drink' :
      ['defensiveRecovery', 'fortify'].includes(skill.type) ? 'player-defend' : 'player-skill')) return false;

    this.emitSkillVisual(skill, 'cast');
    const windup = 160;
    // アニメーション演出後に効果を発動するまでの準備時間として、基本の160msを設定する。
    // 多段攻撃と紅葉スキルは全段の演出が終わるまで入力をロックするため、段数分を追加する。
    const sequence = skill.type === 'multiHit' ? Math.max(0, skill.hitCount - 1) * 145
      : skill.type === 'maple' && this.mapleIsRed ? Math.max(0, skill.stages.length - 1) * 450 : 0;
    this.comboUntil = battleNow(this.scene) + windup + sequence;
    this.scheduleAfter(windup, () => this.executeFlowerSkill(skill, targets));
    return true;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : スキルの種類に応じた戦闘効果を処理する
   * ================================== */
  private executeFlowerSkill(skill: ServerFlowerSkill, targets: readonly CombatTarget[]): void {
    // サーバーから受け取ったskill.typeを分岐点にし、効果内容・演出・期限をそれぞれ適用する。
    // ここで行う分岐はサーバー定義に応じた主人公側の処理であり、対象へ与えるダメージは各case内で確定する。
    switch (skill.type) {
      case 'multiHit':
        // 各ヒット時点で生存・有効状態を確認し、範囲内の敵へ個別にダメージを与える。
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
        // チャージ中は防御強化を適用し、効果時間が終わった時点で範囲攻撃を発生させる。
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
        // 強化期間中に一定間隔で弾を発射する。
        // 発射時点で範囲内の対象を固定し、220ms後の着弾時点では既に撃破済みの対象を除外する。
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
        // 攻撃速度補正を間隔に反映し、持続中は範囲攻撃を繰り返す。
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
          // 紅葉状態なら保存された段ごとの範囲へ順番に攻撃を行い、最初の段から最後の段まで処理した後に解除する。
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
          // 通常状態なら回復・防御強化を行って紅葉状態へ移行する。
          this.mapleIsRed = true;
          this.applyDefenseBuff(skill.defenseBonusPercent, skill.durationMs);
          this.startFlowerRegeneration(skill.durationMs, skill.healIntervalMs, skill.healPercent, () => this.emitSkillVisual(skill, 'heal', [this]));
          this.emitSkillVisual(skill, 'buff', [this]);
        }
        break;
      case 'fortify': {
        // 最大HPの一時増加分だけ現在HPも増やす。期限後は最大HPを戻し、現在HPを新上限に収める。
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
        // 範囲内の対象にダメージを与えた後、攻撃速度低下を付与する。
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
        // 先に範囲攻撃を適用し、その後の攻撃を一定確率で回避する期限を設定する。
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
     * 処理内容 : 被ダメージと無敵・撃破処理を行う
     * ================================== */
    const now = battleNow(this.scene);
    // 死亡中、無敵時間中、回復値0以下の呼び出しでは被ダメージ処理を開始しない。
    if (this.dead || now < this.invulnerableUntil || amount <= 0) return;
    // 回避スキルの有効時間内に成功判定が出た場合は、ダメージ計算も演出も行わない。
    if (now < this.evasionUntil && Math.random() * 100 < this.evasionPercent) return;

    // 回避判定後に、防御力・防御バフ・ガード・物理防御アイテムの軽減を順に合成する。
    const defending = this.isGuarding();
    const activeDefenseBonus = now < this.defenseUntil ? this.defenseBonusPercent : 0;
    const defense = Math.max(0, damageType === 'magical' ? this.stats.magicDefense : this.stats.physicalDefense);
    const statDamageMultiplier = 100 / (100 + defense);
    const buffDamageMultiplier = Math.max(0.1, 1 - activeDefenseBonus / 100);
    const damageMultiplier = statDamageMultiplier * buffDamageMultiplier * (defending ? 0.5 : 1);
    const previousHealth = this.health;
    // 切り上げでダメージを求め、最小0から最大HPの範囲で現在HPを更新する。
    // 防御宝石の有効時間中だけ、物理ダメージへさらに20%軽減を掛ける。
    this.health = Math.max(0, this.health - Math.ceil(amount * damageMultiplier * (damageType === 'physical' && now < this.itemDefenseUntil ? 0.8 : 1)));
    showBattleNumber(this.scene, this.x, this.y, previousHealth - this.health, damageType);
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 被ダメージと無敵・撃破処理を行う
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
     * 処理内容 : 被ダメージと無敵・撃破処理を行う
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
   * 処理内容 : 主人公を死亡状態にし、移動と行動を停止する
   * ================================== */
  public die(): void {
    if (this.dead || !this.scene.anims.exists('player-death')) return;
    // 二重実行を防ぎ、物理ボディを無効化して死亡演出中の移動や衝突を止める。
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
   * 処理内容 : 行動可能か確認し、動作アニメーションを開始する
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
   * 処理内容 : スキルの発動条件を確認してアニメーションを開始する
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
   * 処理内容 : 向きと距離に応じて前方または周囲の攻撃対象を選ぶ
   * ================================== */
  private getTargetsInRange(
    targets: readonly CombatTarget[],
    range: number,
    radial: boolean
  ): CombatTarget[] {
    const direction = this.flipX ? -1 : 1;
    // radial=falseは主人公の向いている側を前方矩形として判定し、radial=trueは距離を円形範囲として判定する。
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
   * 処理内容 : スキル範囲内の対象へ指定した種類のダメージを与える
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
   * 処理内容 : 無属性スキルを物理、それ以外を魔法ダメージとして扱う
   * ================================== */
  private getSkillDamageType(skill: ServerFlowerSkill): DamageType {
    return skill.element === '無' ? 'physical' : 'magical';
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルのマス目と主人公の向きから命中対象を選ぶ
   * ================================== */
  private getTargetsInArea(
    targets: readonly CombatTarget[],
    area: readonly (readonly number[])[]
  ): CombatTarget[] {
    // エリア配列内の「1」をプレイヤー位置とし、「2」のセルに対応する敵だけを選ぶ。
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
   * 処理内容 : 攻撃力と威力の割合から基本スキルダメージを計算する
   * ================================== */
  private skillDamage(percent: number, attackPower: number): number {
    return Math.max(1, Math.round(attackPower * percent / 100));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 効果時間内のスキル・アイテムによる攻撃倍率を適用する
   * ================================== */
  private applyAttackBonus(damage: number): number {
    // スキルの攻撃強化と攻撃宝石の倍率をそれぞれ判定し、有効な場合だけ倍数へ加算する。
    // 加算後の倍率を掛けて端数を丸め、何があってもダメージが0以下にならないよう最低1にする。
    const bonus = battleNow(this.scene) < this.attackBonusUntil ? this.attackBonusPercent : 0;
    return Math.max(1, Math.round(damage * (1 + bonus / 100) * (battleNow(this.scene) < this.itemAttackUntil ? 1.2 : 1)));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : クリティカルを抽選してダメージを補正する
   * ================================== */
  private applyPlayerCritical(damage: number): number {
    // クリティカル率で抽選し、発生時はクリティカルダメージ割合を加算する。
    if (Math.random() * 100 >= this.stats.criticalRate) return damage;
    return Math.round(damage * (1 + this.stats.criticalDamage / 100));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃力・防御力の強化量と終了時刻を設定する
   * ================================== */
  private applyTimedBuff(attackPercent: number, defensePercent: number, durationMs: number): void {
    // 新しい期限で値を上書きする。古い解除タイマーは期限を比較するため延長効果を消さない。
    this.attackBonusPercent = attackPercent;
    this.attackBonusUntil = battleNow(this.scene) + durationMs;
    this.applyDefenseBuff(defensePercent, durationMs);
    this.scheduleAfter(durationMs, () => {
      if (battleNow(this.scene) >= this.attackBonusUntil) this.attackBonusPercent = 0;
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 防御力の強化量と終了時刻を設定する
   * ================================== */
  private applyDefenseBuff(defensePercent: number, durationMs: number): void {
    this.defenseBonusPercent = defensePercent;
    this.defenseUntil = battleNow(this.scene) + durationMs;
    this.scheduleAfter(durationMs, () => {
      if (battleNow(this.scene) >= this.defenseUntil) this.defenseBonusPercent = 0;
    });
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 指定時間の間、一定間隔で効果を繰り返す
   * ================================== */
  private repeatUntil(durationMs: number, intervalMs: number, effect: () => void): void {
    if (intervalMs <= 0) return;
    const endsAt = battleNow(this.scene) + durationMs;
    const repeat = (): void => {
      if (!this.active || this.dead) { this.clearRegeneration(); return; }
      // 効果期限を超えたら終了し、期限内なら処理後に次回分だけタイマーを登録する。
      if (battleNow(this.scene) >= endsAt) return;
      effect();
      this.scene.time.delayedCall(intervalMs, repeat);
    };
    this.scene.time.delayedCall(intervalMs, repeat);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 指定時間後に効果を実行するタイマーを登録する
   * ================================== */
  private scheduleAfter(delayMs: number, effect: () => void): void {
    // 遅延後にシーンから破棄済み、または死亡済みなら効果を実行しない。
    this.scene.time.delayedCall(delayMs, () => {
      if (this.active && !this.dead) effect();
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 最大HPを超えない範囲で回復し、回復量とHP変更を通知する
   * ================================== */
  private restoreHealth(amount: number): void {
    // 回復量を整数化して0以上に制限し、最大HPを超えない実回復量を表示・通知する。
    const healed = Math.min(this.maxHealth - this.health, Math.max(0, Math.round(amount)));
    this.health += healed;
    showBattleNumber(this.scene, this.x, this.y, healed, 'heal');
    this.emit('health-changed', this.health, this.maxHealth);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの攻撃範囲をマス目で表示する
   * ================================== */
  private showArea(area: readonly (readonly number[])[], color: number): void {
    // 範囲配列の「1」を自分の位置、「2」を効果範囲として向きに応じて左右反転して描画する。
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
   * 処理内容 : 必要な場合だけ主人公のアニメーションを切り替える
   * ================================== */
  private playAnimation(animationKey: string): void {
    if (this.anims.currentAnim?.key !== animationKey) {
      this.play(animationKey, true);
    }
  }
}
