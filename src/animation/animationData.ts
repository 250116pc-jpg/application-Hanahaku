
import playerIdle from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_idle.png'
import playerRun from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Running.png'
import playerJump from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_jumping.png'
import playerFall from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_falling.png'
import playerLand from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_landing.png'
import playerAttack from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_attack_1.png'


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
      frameRate: 12
    }
  }
};
