// 担当：たまおちゃん｜アニメーション・animationData

import playerIdle from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_idle.png'
import playerRun from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Running.png'
import playerJump from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_jumping.png'
import playerFall from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_falling.png'
import playerLand from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_landing.png'
import playerAttack from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_1.png'
import playerSkill from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_spin_attack.png'
import playerDefend from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_ducking.png'
import playerDeath from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Death.png'
import playerDrink from '../assets/characters/player/Red Cape Knight Character Asset/Player_Red sheets/Red_drinking.png'


export const characterAnimations = {
  player: {
    run: {
      image: playerRun,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 9,
      frameRate: 9
    },

    idle: {
      image: playerIdle,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 8,
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
      frameCount: 4,
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
      frameCount: 6,
      frameRate: 15
    },
    skill: {
      image: playerSkill,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 9,
      frameRate: 12
    },
    defend: {
      image: playerDefend,
      frameWidth: 192,
      frameHeight: 128,
      frameCount: 4,
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
      frameCount: 5,
      frameRate: 10
    }
  }
};
