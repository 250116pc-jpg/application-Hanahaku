import panelImg from './assets/elegant_ui/panel/panel.png'
import test_data from './test_data'

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' })
  }

  preload() {
    this.load.spritesheet('panel', panelImg, {
      frameWidth: 48,
      frameHeight: 48
    });
    
  }

  create() {
    const shopItems = test_data.shopItems;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // 背景
    const background = this.add.image(0, 50, 'panel', 9)
      .setOrigin(0, 0)
      .setDisplaySize(
        screenWidth + 560,
        screenHeight + 320
      )
      .setPosition(-260, -160);

    // タイトル
    this.add.text(screenWidth / 2, 30, 'ショップ画面', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 戻るボタン
    const to_GameScene = this.add.image(0, 40, 'button')
      .setScale(0.2)
      .setInteractive()
      .setOrigin(0, 0);

    to_GameScene.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.add.text(0, 20, 'タイトル画面へ', {
      fontSize: '16px',
      color: '#ffffff'
    });

    // 商品
    const shopContainer = this.add.container(0, 0);

    shopItems.forEach((item, index) => {
        const button = this.add.image(
            100 + (index % 5) * 150,
            100 + Math.floor(index / 5) * 150,
            'panel',
            item.frame
        )
            .setOrigin(0, 0)
            .setDisplaySize(110, 110)
            .setInteractive();

        button.on('pointerdown', () => {
            console.log('押されたインデックス:', index);
            console.log('商品:', shopItems[index]);
        });

        shopContainer.add(button);
        });

    // 商品の表示範囲
    const maskGraphics = this.make.graphics({});
    maskGraphics.fillRect(
      0,
      70,
      screenWidth,
      screenHeight - 120
    );

    shopContainer.setMask(
      maskGraphics.createGeometryMask()
    );

    // スクロール
    const maxScroll = 360;

    this.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
      deltaX: number,
      deltaY: number
    ) => {
      shopContainer.y = Phaser.Math.Clamp(
        shopContainer.y - deltaY,
        -maxScroll,
        0
      );
    });
  }
}