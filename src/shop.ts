

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' })
  }

  preload() {
    
  }

  create() {
    this.add.text(400, 220, 'ショップ画面', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const btn = this.add.image(400, 320, 'button').setScale(0.4).setInteractive()
    btn.on('pointerdown', () => {
      this.scene.start('GameScene')
    })
  }
}