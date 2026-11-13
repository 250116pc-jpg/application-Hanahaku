/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */

import { getPlayerAnimation } from './playerCharacter';
import type { PlayerAnimationName } from './playerCharacter';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : キャラクターアニメーション定義を定義する
 * ================================== */
const animation = (name: PlayerAnimationName) => ({
  get image(): string { return getPlayerAnimation(name).image; },
  get frameWidth(): number { return getPlayerAnimation(name).frameWidth; },
  get frameHeight(): number { return getPlayerAnimation(name).frameHeight; },
  get frameCount(): number { return getPlayerAnimation(name).frameCount; },
  get frameRate(): number { return getPlayerAnimation(name).frameRate; },
});

export const characterAnimations = {
  player: {
    run: animation('run'),
    idle: animation('idle'),
    jump: animation('jump'),
    fall: animation('fall'),
    land: animation('land'),
    attack: animation('attack'),
    skill: animation('skill'),
    defend: animation('defend'),
    death: animation('death'),
    drink: animation('drink'),
    hurt: animation('hurt'),
  }
};
