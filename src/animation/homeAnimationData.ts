import win from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_win.png';
import run from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Running.png';
import jump from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_jumping.png';
import fall from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_falling.png';
import land from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_landing.png';
import idle from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_idle.png';
import attack1 from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_1.png';
import attack2 from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_2.png';
import dashAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_3_Dash.png';
import downwardAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_downwards.png';
import duckingAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_ducking_attack.png';
import spinAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_spin_attack.png';

// ホーム専用。attackが付く画像を個別に読み込み、戦闘用の定義とは分離する。
// 1コマ192×128。frameRateで速度、repeatで繰り返し回数を調整する。
export const homeAnimationData = {
  // 待機中だけのピース動作。クリック時の抽選候補には含めない。
  win: { image: win, frameWidth: 192, frameHeight: 128, frameCount: 5, frameRate: 6, repeat: 0 },
  run: { image: run, frameWidth: 192, frameHeight: 128, frameCount: 9, frameRate: 9, repeat: -1 },
  jump: { image: jump, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 10, repeat: 0 },
  fall: { image: fall, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 8, repeat: 0 },
  land: { image: land, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 12, repeat: 0 },
  idle: { image: idle, frameWidth: 192, frameHeight: 128, frameCount: 5, frameRate: 8, repeat: -1 },
  attack1: { image: attack1, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  attack2: { image: attack2, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  dashAttack: { image: dashAttack, frameWidth: 192, frameHeight: 128, frameCount: 7, frameRate: 12, repeat: 0 },
  downwardAttack: { image: downwardAttack, frameWidth: 192, frameHeight: 128, frameCount: 11, frameRate: 12, repeat: 0 },
  duckingAttack: { image: duckingAttack, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12, repeat: 0 },
  spinAttack: { image: spinAttack, frameWidth: 192, frameHeight: 128, frameCount: 9, frameRate: 12, repeat: 0 },
};

export type HomeAnimationName = keyof typeof homeAnimationData;
export type HomeAttackName = Exclude<HomeAnimationName, 'idle' | 'run' | 'jump' | 'fall' | 'land' | 'win'>;

// 攻撃画像をつないで1本のコンボにする。速度は12fpsのまま維持する。
// attacksの順序を変えて組み合わせを調整できる。同じ攻撃も複数回指定可能。
export const homeAttackCombos = [
  { key: 'bladeRush', attacks: ['attack1', 'attack2', 'dashAttack', 'spinAttack'], frameRate: 12 }, // 連続斬り：約2.3秒
  { key: 'lowToHigh', attacks: ['duckingAttack', 'attack1', 'downwardAttack', 'dashAttack'], frameRate: 12 }, // 下段から連撃：約2.5秒
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
