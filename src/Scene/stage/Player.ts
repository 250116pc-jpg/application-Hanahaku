/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
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
// スキル範囲の表示と命中判定で共通して使う、1マスあたりのピクセル数。
const SKILL_AREA_CELL_SIZE = 40;
// 空中での重力を強めて跳躍を素早くしつつ、下降時だけ係数を下げて落下を緩やかにする。
const AIR_GRAVITY_SCALE = 4;
const FALL_GRAVITY_REDUCTION = 0.9;
const JUMP_POWER_SCALE = 1.4;
// Phaserのフレーム番号は1始まり。剣が伸びる2フレーム目で攻撃を命中させる。
const BASIC_ATTACK_IMPACT_FRAME = 2;
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
    const bonusRate = 0.25; // 編成人数にかかわらず1体につき25%。
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
    
    // シーンと物理エンジンに自身を追加
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.clearRegeneration());
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (animation.key === 'player-run' && (frame.index === 3 || frame.index === 7)) {
        this.playRunStep();
      }
      if (animation.key !== 'player-attack' || frame.index < BASIC_ATTACK_IMPACT_FRAME || !this.basicAttackTargets) return;
      // 攻撃アニメーションの指定フレームで一度だけ命中処理を行う。
      const targets = this.basicAttackTargets;
      this.basicAttackTargets = null;
      this.landBasicAttack(targets);
    });
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    this.on(Phaser.Animations.Events.ANIMATION_STOP, (animation: Phaser.Animations.Animation) => {
      if (animation.key === 'player-attack') this.basicAttackTargets = null;
    });
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
        // 行動アニメーション終了後に操作可能状態へ戻す。
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

    body.setSize(hitboxWidth, hitboxHeight);
    body.setOffset(
      // 描画サイズではなく元フレーム基準で中央寄せし、足元がスプライト下端に揃うよう配置する。
      Math.round((this.frame.width - hitboxWidth) / 2),
      this.frame.height - hitboxHeight
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
    if (this.action !== null || this.isGuarding() || battleNow(this.scene) < Math.max(this.chargeUntil, this.comboUntil)) {
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

    const isGrounded = body.blocked.down;
    const crouchGuarding = this.isGuarding();
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 操作と現在の状態を表示へ反映する
     * ================================== */
    if (crouchGuarding && !this.wasCrouchGuarding && !this.scene.sound.get('player-guard-hit')?.isPlaying) {
      playSe(this.scene, 'player-crouch', 0.5);
    }
    this.wasCrouchGuarding = crouchGuarding;

    if (this.action !== null) {
      // Keep the action animation visible until it completes.
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
    if (!this.dead && this.action === null && battleNow(this.scene) >= Math.max(this.chargeUntil, this.comboUntil) && !this.isGuarding() && body?.blocked.down) {
      // 接地かつ行動可能なときだけ離陸し、接地直前の負速度などで効果音が重複しないようにする。
      const takingOff = body.velocity.y >= 0;
      this.setVelocityY(-this.JUMP_POWER * JUMP_POWER_SCALE);
      if (takingOff) playSe(this.scene, 'player-jump', 0.5);
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 通常攻撃を行う
   * ================================== */
  public attack(targets: readonly CombatTarget[] = []): void {
    if (battleNow(this.scene) < Math.max(this.chargeUntil, this.comboUntil) || battleNow(this.scene) < this.continuousUntil ||
        battleNow(this.scene) < this.nextBasicAttackAt) return;
    if (!this.playAction('attack', 'player-attack')) return;
    // 次回攻撃可能時刻と、アニメーションの命中フレームで参照する対象一覧を記録する。
    this.nextBasicAttackAt = battleNow(this.scene) + this.stats.attackIntervalMs;
    this.basicAttackTargets = targets;
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 前方の敵1体へ通常攻撃のダメージと命中演出を適用する
   * ================================== */
  private landBasicAttack(targets: readonly CombatTarget[]): void {
    this.showSlash();
    const hits = this.getTargetsInRange(targets, 125, false);
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
    const x = this.x + direction * 48;
    const y = this.y - 65;
    const slash = this.scene.add.graphics().setDepth(18).setScrollFactor(1);
    // 同じ弧を太さと色を変えて重ね、短時間で消える斬撃の残像を描く。
    slash.lineStyle(18, 0xff5267, 0.24).beginPath()
      .arc(x, y, 82, direction > 0 ? -1.2 : Math.PI + 0.2, direction > 0 ? 0.55 : Math.PI - 0.55, direction < 0).strokePath();
    slash.lineStyle(8, 0xffa1ad, 0.95).beginPath()
      .arc(x, y, 82, direction > 0 ? -1.2 : Math.PI + 0.2, direction > 0 ? 0.55 : Math.PI - 0.55, direction < 0).strokePath();
    slash.lineStyle(2, 0xffe7ce, 0.95).beginPath()
      .arc(x, y, 82, direction > 0 ? -1.2 : Math.PI + 0.2, direction > 0 ? 0.55 : Math.PI - 0.55, direction < 0).strokePath();
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 240, onComplete: () => slash.destroy() });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃が命中した位置にヒット演出を表示する
   * ================================== */
  private showHit(x: number, y: number): void {
    this.scene.cameras.main.shake(70, 0.0025);
    const burst = this.scene.add.graphics({ x, y }).setDepth(19).setScrollFactor(1);
    burst.lineStyle(3, 0xffe4b0, 0.95);
    // 7方向へ短い線を伸ばし、縮尺と透明度のTweenで命中の瞬間を表現する。
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7;
      burst.lineBetween(Math.cos(angle) * 8, Math.sin(angle) * 8, Math.cos(angle) * 25, Math.sin(angle) * 25);
    }
    this.scene.tweens.add({ targets: burst, alpha: 0, scale: 1.35, duration: 180, onComplete: () => burst.destroy() });
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
    if (!this.playSkillAnimation(skill.type === 'heal' ? 'player-drink' :
      ['defensiveRecovery', 'fortify'].includes(skill.type) ? 'player-defend' : 'player-skill')) return false;

    this.emitSkillVisual(skill, 'cast');
    const windup = 160;
    // 多段攻撃と紅葉の連続段階は終了まで入力をロックするため、追加演出時間を加算する。
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
    // サーバー定義のタイプごとに、攻撃・回復・強化・状態異常の効果を適用する。
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
        // 強化期間中に弾を繰り返し発射し、発射時に決めた対象へ着弾後ダメージを与える。
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
          // 紅葉状態なら段階攻撃を行い、終了時に紅葉状態を解除する。
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
    if (this.dead || now < this.invulnerableUntil || amount <= 0) return;
    if (now < this.evasionUntil && Math.random() * 100 < this.evasionPercent) return;

    // 回避判定後に、防御力・防御バフ・ガード・物理防御アイテムの軽減を順に合成する。
    const defending = this.isGuarding();
    const activeDefenseBonus = now < this.defenseUntil ? this.defenseBonusPercent : 0;
    const defense = Math.max(0, damageType === 'magical' ? this.stats.magicDefense : this.stats.physicalDefense);
    const statDamageMultiplier = 100 / (100 + defense);
    const buffDamageMultiplier = Math.max(0.1, 1 - activeDefenseBonus / 100);
    const damageMultiplier = statDamageMultiplier * buffDamageMultiplier * (defending ? 0.5 : 1);
    this.health = Math.max(0, this.health - Math.ceil(amount * damageMultiplier * (damageType === 'physical' && now < this.itemDefenseUntil ? 0.8 : 1)));
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
    // radial=falseは向いている側の矩形範囲、trueは距離による円形範囲として判定する。
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
    // バフと攻撃宝石の倍率を重ね、最終ダメージは最低1に保つ。
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
