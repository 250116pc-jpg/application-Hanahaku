
import panelImg from './assets/elegant_ui/panel/panel.png'

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' })
  }

  preload() {
    
    
    // 例：1枠が 32x32 ピクセルの場合
    this.load.spritesheet('panel', panelImg, { 
        frameWidth: 48, 
        frameHeight: 48 
    });
  }

  create() {
    const xpadding = 80; 
    const ypadding = 40;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
// フレーム番号「9」を指定して左上(0,0)に配置
    const background = this.add.image(0, 50, 'panel', 9).setOrigin(0, 0);

    

    // 画面サイズより「余白×2」の分だけ大きく引き伸ばす
    background.setDisplaySize(screenWidth + (xpadding * 2), screenHeight + (ypadding * 2));

    // はみ出させた分だけ、配置場所を左上にマイナスしてずらす
    background.setPosition(-xpadding, -ypadding + 20);

    this.add.text(500, 20, 'ショップ画面', {fontSize: '32px',color: '#ffffff'}).setOrigin(0.5)

    this.add.text(0, 20, 'タイトル画面へ', {fontSize: '16px',color: '#ffffff'}).setOrigin(0)

    const to_GameScene = this.add.image(0, 40, 'button').setScale(0.2).setInteractive().setOrigin(0, 0);
    to_GameScene.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    

    

  }
}