import maleAttack2 from '../assets/characters/1001/sprites/combo-2-distinct.png';
import maleAttack3 from '../assets/characters/1001/sprites/combo-3-distinct.png';
import maleAttack from '../assets/characters/1001/sprites/attack-step-down.png';
import maleDashAttack from '../assets/characters/1001/sprites/dashAttack-polished.png';
import maleDeath from '../assets/characters/1001/sprites/death-polished.png';
import maleDefend from '../assets/characters/1001/sprites/defend-polished.png';
import maleDownwardAttack from '../assets/characters/1001/sprites/downwardAttack-polished.png';
import maleDrink from '../assets/characters/1001/sprites/drink-polished.png';
import maleDuckingAttack from '../assets/characters/1001/sprites/duckingAttack-polished.png';
import maleFall from '../assets/characters/1001/sprites/fall-polished.png';
import maleHurt from '../assets/characters/1001/sprites/hurt-polished.png';
import maleIdle from '../assets/characters/1001/sprites/idle-polished.png';
import maleJump from '../assets/characters/1001/sprites/jump-polished.png';
import maleLand from '../assets/characters/1001/sprites/land-polished.png';
import maleRun from '../assets/characters/1001/sprites/run-polished.png';
import maleSkill from '../assets/characters/1001/sprites/skill-polished.png';
import maleWin from '../assets/characters/1001/sprites/win-polished.png';
import femaleAttack2 from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_2.png';
import femaleAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_1.png';
import femaleDashAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_3_Dash.png';
import femaleDeath from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Death.png';
import femaleDefend from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_push.png';
import femaleDownwardAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_downwards.png';
import femaleDrink from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_drinking.png';
import femaleDuckingAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_ducking_attack.png';
import femaleFall from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_falling.png';
import femaleHurt from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_hurt.png';
import femaleIdle from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_idle.png';
import femaleJump from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_jumping.png';
import femaleLand from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_landing.png';
import femaleRun from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Running.png';
import femaleSkill from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_spin_attack.png';
import femaleWin from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_win.png';
import { getPhpBaseUrl } from '../auth/PhpBaseUrl';

export type PlayerCharacter = 'male' | 'female';
export type PlayerAnimationName =
  | 'idle' | 'run' | 'jump' | 'fall' | 'land' | 'attack' | 'skill'
  | 'defend' | 'death' | 'drink' | 'hurt' | 'win' | 'attack2'
  | 'attack3' | 'dashAttack' | 'downwardAttack' | 'duckingAttack';

export interface PlayerAnimationData {
  readonly image: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameCount: number;
  readonly frameRate: number;
}

type PlayerAnimationSet = Record<PlayerAnimationName, PlayerAnimationData>;

const maleAnimations: PlayerAnimationSet = {
  idle: { image: maleIdle, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 8 },
  run: { image: maleRun, frameWidth: 384, frameHeight: 128, frameCount: 8, frameRate: 12 },
  jump: { image: maleJump, frameWidth: 384, frameHeight: 128, frameCount: 4, frameRate: 10 },
  fall: { image: maleFall, frameWidth: 384, frameHeight: 128, frameCount: 2, frameRate: 8 },
  land: { image: maleLand, frameWidth: 384, frameHeight: 128, frameCount: 4, frameRate: 12 },
  attack: { image: maleAttack, frameWidth: 384, frameHeight: 128, frameCount: 8, frameRate: 15 },
  skill: { image: maleSkill, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 12 },
  defend: { image: maleDefend, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 8 },
  death: { image: maleDeath, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 8 },
  drink: { image: maleDrink, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 10 },
  hurt: { image: maleHurt, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 12 },
  win: { image: maleWin, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 8 },
  attack2: { image: maleAttack2, frameWidth: 384, frameHeight: 128, frameCount: 8, frameRate: 16 },
  attack3: { image: maleAttack3, frameWidth: 384, frameHeight: 128, frameCount: 8, frameRate: 14 },
  dashAttack: { image: maleDashAttack, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 12 },
  downwardAttack: { image: maleDownwardAttack, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 12 },
  duckingAttack: { image: maleDuckingAttack, frameWidth: 384, frameHeight: 128, frameCount: 6, frameRate: 12 },
};

const femaleAnimations: PlayerAnimationSet = {
  idle: { image: femaleIdle, frameWidth: 192, frameHeight: 128, frameCount: 5, frameRate: 8 },
  run: { image: femaleRun, frameWidth: 192, frameHeight: 128, frameCount: 9, frameRate: 12 },
  jump: { image: femaleJump, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 10 },
  fall: { image: femaleFall, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 8 },
  land: { image: femaleLand, frameWidth: 192, frameHeight: 128, frameCount: 4, frameRate: 12 },
  attack: { image: femaleAttack, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 15 },
  skill: { image: femaleSkill, frameWidth: 192, frameHeight: 128, frameCount: 9, frameRate: 12 },
  defend: { image: femaleDefend, frameWidth: 192, frameHeight: 128, frameCount: 3, frameRate: 8 },
  death: { image: femaleDeath, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 8 },
  drink: { image: femaleDrink, frameWidth: 192, frameHeight: 128, frameCount: 5, frameRate: 10 },
  hurt: { image: femaleHurt, frameWidth: 192, frameHeight: 128, frameCount: 5, frameRate: 12 },
  win: { image: femaleWin, frameWidth: 192, frameHeight: 128, frameCount: 5, frameRate: 8 },
  attack2: { image: femaleAttack2, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12 },
  attack3: { image: femaleDashAttack, frameWidth: 192, frameHeight: 128, frameCount: 7, frameRate: 14 },
  dashAttack: { image: femaleDashAttack, frameWidth: 192, frameHeight: 128, frameCount: 7, frameRate: 12 },
  downwardAttack: { image: femaleDownwardAttack, frameWidth: 192, frameHeight: 128, frameCount: 11, frameRate: 12 },
  duckingAttack: { image: femaleDuckingAttack, frameWidth: 192, frameHeight: 128, frameCount: 6, frameRate: 12 },
};

let selectedCharacter: PlayerCharacter = 'male';

export function getPlayerAnimation(name: PlayerAnimationName): PlayerAnimationData {
  return (selectedCharacter === 'female' ? femaleAnimations : maleAnimations)[name];
}

export function getPlayerAttackTiming(step = 0): { impactFrame: number; range: number } {
  return selectedCharacter === 'male'
    ? { impactFrame: step === 0 ? 6 : 5, range: 160 }
    : { impactFrame: 5, range: 125 };
}

export async function loadGlobalPlayerCharacter(): Promise<void> {
  try {
    const response = await fetch(`${getPhpBaseUrl()}/player-character.php`, { cache: 'no-store' });
    const result: unknown = await response.json();
    if (!response.ok || !result || typeof result !== 'object') {
      throw new Error('主人公の共通設定を読み込めませんでした。');
    }

    const data = result as { ok?: unknown; character?: unknown; error?: unknown };
    if (data.ok !== true || (data.character !== 'male' && data.character !== 'female')) {
      throw new Error(typeof data.error === 'string' ? data.error : '主人公の設定値が正しくありません。');
    }
    selectedCharacter = data.character;
  } catch (error) {
    console.warn('主人公の共通設定を取得できないため、男主人公を使用します。', error);
  }
}
