import Phaser from 'phaser'
import {text, image} from './functions'


import heroImg from './assets/hero.png'
import grassImg from './assets/stage/test/grass.png'

import { StageScene } from './stage'
import { ShopScene } from './shop'


class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    this.load.image('button', heroImg)
    this.load.image('shop_button', grassImg)
  }

  create() {
    text(this, 100, 100, 20,  "タイトル画面")

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
    text(this, 100, 100, 20,  "ホーム画面")

    text(this, 100, 180, 20,  "ステージ画面へ")
    const btn = image(this, 100, 18, 0.4, "button")
    btn.on('pointerdown', () => {
      this.scene.start('StageScene')
    })

    text(this, 100, 250, 20,  "ショップ画面へ")
    
    const shop_btn = image(this, 100, 250, 0.4, "shop_button")
    shop_btn.on('pointerdown', () => {
      this.scene.start('ShopScene')
    })
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  scene: [MainScene, GameScene, StageScene, ShopScene],
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

