import Phaser from 'phaser'
import proxy from './functions'


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
    proxy.text(this, 100, 100, 20,  "タイトル画面")

    const btn = proxy.image(this, 100, 100, 0.4, "button")
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
    proxy.text(this, 100, 100, 20,  "ホーム画面")

    proxy.text(this, 100, 180, 20,  "ステージ画面へ")
    const btn = proxy.image(this, 100, 18, 0.4, "button")
    btn.on('pointerdown', () => {
      this.scene.start('StageScene')
    })

    proxy.text(this, 100, 250, 20,  "ショップ画面へ")
    
    const shop_btn = proxy.image(this, 100, 250, 0.4, "shop_button")
    shop_btn.on('pointerdown', () => {
      this.scene.start('ShopScene')
    })
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
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

