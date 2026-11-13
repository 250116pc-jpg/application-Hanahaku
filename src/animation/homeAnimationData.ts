import win from '../assets/characters/1001/sprites/win-v5.png';
import skill from '../assets/characters/1001/sprites/skill-v5.png';
import duckingAttack from '../assets/characters/1001/sprites/duckingAttack-v5.png';
import downwardAttack from '../assets/characters/1001/sprites/downwardAttack-v5.png';
import dashAttack from '../assets/characters/1001/sprites/dashAttack-v5.png';
import attack2 from '../assets/characters/1001/sprites/attack2-v5.png';
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
import run from '../assets/characters/1001/sprites/run-v7.png';
import jump from '../assets/characters/1001/sprites/jump-v6.png';
import fall from '../assets/characters/1001/sprites/fall-v6.png';
import land from '../assets/characters/1001/sprites/land-v6.png';
import idle from '../assets/characters/1001/sprites/idle-v6.png';
import attack from '../assets/characters/1001/sprites/attack-v7.png';

// 各攻撃の専用スプライト。
// 1コマ192×128。frameRateで速度、repeatで繰り返し回数を調整する。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : ホーム専用アニメーション定義を定義する
 * ================================== */
export const homeAnimationData = {
  // 待機中の演出。クリック時の抽選候補には含めない。
  win: { image: win, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 8, repeat: 0, yoyo: true },
  run: { image: run, frameWidth: 192, frameHeight: 128, frameCount: 8, frameRate: 12, repeat: -1 },
  jump: { image: jump, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 10, repeat: 0 },
  fall: { image: fall, frameWidth: 192, frameHeight: 128, frameCount: 2, frameRate: 8, repeat: 0 },
  land: { image: land, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 12, repeat: 0 },
  idle: { image: idle, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 8, repeat: -1 },
  attack1: { image: attack, frameWidth: 192, frameHeight: 128, frameCount: 8, frameRate: 12, repeat: 0 },
  attack2: { image: attack2, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  dashAttack: { image: dashAttack, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  downwardAttack: { image: downwardAttack, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  duckingAttack: { image: duckingAttack, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  spinAttack: { image: skill, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
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
