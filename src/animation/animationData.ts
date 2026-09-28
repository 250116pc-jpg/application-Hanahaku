
import playerIdle from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_idle.png'
import playerRun from '../assets/player/Red Cape Knight Character Asset/Player_Red sheets/Red_Running.png'



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
    }
  }
};