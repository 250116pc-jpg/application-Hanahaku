import Phaser from 'phaser'
import heroImg from './assets/hero.png'
import { StageScene } from './stage'

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    this.load.image('button', heroImg)
  }

  create() {
    this.add.text(400, 220, 'タイトル画面', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const btn = this.add.image(400, 320, 'button').setScale(0.4).setInteractive()
    btn.on('pointerdown', () => {
      this.scene.start('GameScene')
    })
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.add.text(400, 220, 'ホーム画面', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const btn = this.add.image(400, 320, 'button').setScale(0.4).setInteractive()
    btn.on('pointerdown', () => {
      this.scene.start('StageScene')
    })
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  scene: [MainScene, GameScene, StageScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: true
    }
  },
  backgroundColor: '#000000'
}

new Phaser.Game(config)

