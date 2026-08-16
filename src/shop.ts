
import panelImg from './assets/elegant_ui/panel/panel.png'

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' })
  }

  preload() {
    this.load.image('panel', panelImg)
  }

  create() {
    this.add.text(500, 20, 'ショップ画面', {fontSize: '32px',color: '#ffffff'}).setOrigin(0.5)

    this.add.text(0, 20, 'タイトル画面へ', {fontSize: '16px',color: '#ffffff'}).setOrigin(0)

    const to_GameScene = this.add.image(0, 40, 'button').setScale(0.2).setInteractive().setOrigin(0, 0);
    to_GameScene.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    this.add.image(0, 0, 'panel').setScale(20).setInteractive().setOrigin(0, 0);

  }
}