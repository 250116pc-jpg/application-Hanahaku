import playerDrink from '../assets/characters/1001/sprites/drink-v5.png'
import playerDeath from '../assets/characters/1001/sprites/death-v5.png'
import playerDefend from '../assets/characters/1001/sprites/defend-v5.png'
import playerSkill from '../assets/characters/1001/sprites/skill-v5.png'
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */

import playerIdle from '../assets/characters/1001/sprites/idle-v6.png'
import playerRun from '../assets/characters/1001/sprites/run-v7.png'
import playerJump from '../assets/characters/1001/sprites/jump-v6.png'
import playerFall from '../assets/characters/1001/sprites/fall-v6.png'
import playerLand from '../assets/characters/1001/sprites/land-v6.png'
import playerAttack from '../assets/characters/1001/sprites/attack-v7.png'


/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : キャラクターアニメーション定義を定義する
 * ================================== */
export const characterAnimations = {
  player: {
    run: {
      image: playerRun,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 8,
      frameRate: 12
    },

    idle: {
      image: playerIdle,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 6,
      frameRate: 8
    },

    jump: {
      image: playerJump,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 4,
      frameRate: 10
    },

    fall: {
      image: playerFall,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 2,
      frameRate: 8
    },

    land: {
      image: playerLand,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 4,
      frameRate: 12
    },
    attack: {
      image: playerAttack,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 8,
      frameRate: 15
    },
    skill: {
      image: playerSkill,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 6,
      frameRate: 12
    },
    defend: {
      image: playerDefend,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 6,
      frameRate: 8
    },
    death: {
      image: playerDeath,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 6,
      frameRate: 8
    },
    drink: {
      image: playerDrink,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 6,
      frameRate: 10
    }
  }
};
