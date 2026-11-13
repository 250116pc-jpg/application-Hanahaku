/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
import { getPlayerAnimation } from './playerCharacter';
import type { PlayerAnimationName } from './playerCharacter';

// 各攻撃の専用スプライト。
// 1コマ192×128。frameRateで速度、repeatで繰り返し回数を調整する。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : ホーム専用アニメーション定義を定義する
 * ================================== */
const playerAnimation = (name: PlayerAnimationName, repeat: number, yoyo = false) => ({
  get image(): string { return getPlayerAnimation(name).image; },
  get frameWidth(): number { return getPlayerAnimation(name).frameWidth; },
  get frameHeight(): number { return getPlayerAnimation(name).frameHeight; },
  get frameCount(): number { return getPlayerAnimation(name).frameCount; },
  get frameRate(): number { return getPlayerAnimation(name).frameRate; },
  repeat,
  ...(yoyo ? { yoyo: true } : {}),
});

export const homeAnimationData = {
  // 待機中の演出。クリック時の抽選候補には含めない。
  win: playerAnimation('win', 0, true),
  run: playerAnimation('run', -1),
  jump: playerAnimation('jump', 0),
  fall: playerAnimation('fall', 0),
  land: playerAnimation('land', 0),
  idle: playerAnimation('idle', -1),
  attack1: playerAnimation('attack', 0),
  attack2: playerAnimation('attack2', 0),
  dashAttack: playerAnimation('dashAttack', 0),
  downwardAttack: playerAnimation('downwardAttack', 0),
  duckingAttack: playerAnimation('duckingAttack', 0),
  spinAttack: playerAnimation('skill', 0),
};

export type HomeAnimationName = keyof typeof homeAnimationData;
export type HomeAttackName = Exclude<HomeAnimationName, 'idle' | 'run' | 'jump' | 'fall' | 'land' | 'win'>;

// 攻撃画像をつないで1本のコンボにする。速度は12fpsのまま維持する。
// attacksの順序を変えて組み合わせを調整できる。同じ攻撃も複数回指定可能。
export const homeAttackCombos = [
  { key: 'bladeRush', attacks: ['attack1', 'attack2', 'dashAttack', 'spinAttack'], frameRate: 12 }, // 連続斬り
  { key: 'lowToHigh', attacks: ['duckingAttack', 'attack1', 'downwardAttack', 'dashAttack'], frameRate: 12 }, // 下段から連撃
] as const satisfies readonly { key: string; attacks: readonly HomeAttackName[]; frameRate: number }[];

export const homeAnimationNames = Object.keys(homeAnimationData) as HomeAnimationName[];


export const homeSingleAttacks = ['attack1', 'attack2', 'dashAttack', 'downwardAttack', 'duckingAttack', 'spinAttack'] as const satisfies readonly HomeAttackName[];

// 移動1＋ジャンプ1＋個別攻撃6＋コンボ2の計10候補を、同じ確率で抽選する。
// fallとlandはジャンプの途中で再生するため、単独では抽選しない。
export const homeClickActions = [
  { kind: 'move' },
  { kind: 'jump' },
  ...homeSingleAttacks.map(attack => ({ kind: 'attack' as const, attack })),
  ...homeAttackCombos.map(combo => ({ kind: 'combo' as const, comboKey: combo.key })),
] as const;
