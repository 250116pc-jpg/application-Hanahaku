
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
    const xpadding = 260;
    const ypadding = 140;

    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    const background = this.add.image(0, 50, 'panel', 9)
        .setOrigin(0, 0);

    background.setDisplaySize(
        screenWidth + (xpadding * 2),
        screenHeight + (ypadding * 2)
    );

    background.setPosition(-xpadding, -ypadding);

    const title = this.add.text(500, 20, 'ショップ画面', {
        fontSize: '32px',
        color: '#ffffff'
    }).setOrigin(0.5);

    const backText = this.add.text(0, 20, 'タイトル画面へ', {
        fontSize: '16px',
        color: '#ffffff'
    }).setOrigin(0);

    const to_GameScene = this.add.image(0, 40, 'button')
        .setScale(0.2)
        .setInteractive()
        .setOrigin(0, 0);

    to_GameScene.on('pointerdown', () => {
        this.scene.start('GameScene');
    });

    // 商品
    const items: Phaser.GameObjects.Image[] = [];

    for (let i = 0; i < 30; i++) {
        items.push(
            this.add.image(
                100 + (i % 5) * 150,
                100 + Math.floor(i / 5) * 150,
                'panel',
                9
            )
            .setOrigin(0, 0)
            .setDisplaySize(110, 110)
        );
    }

    // 商品用カメラ
    const shopCamera = this.cameras.add(
        0,              // x
        70,             // y
        screenWidth,    // 幅
        screenHeight - 70 // 高さ
    );

    // 商品用カメラのスクロール範囲
    const contentHeight = 100 + 6 * 150;

    shopCamera.setBounds(
        0,
        0,
        screenWidth,
        contentHeight
    );

    // メインカメラには商品を表示させない
    this.cameras.main.ignore(items);

    // 商品カメラにはヘッダーを表示させない
    shopCamera.ignore([
        background,
        title,
        backText,
        to_GameScene
    ]);

    // マウスホイールで商品をスクロール
    this.input.on('wheel', (
        pointer: Phaser.Input.Pointer,
        gameObjects: Phaser.GameObjects.GameObject[],
        deltaX: number,
        deltaY: number
    ) => {
        shopCamera.scrollY += deltaY;

        // 上端・下端を超えないようにする
        shopCamera.scrollY = Phaser.Math.Clamp(
            shopCamera.scrollY,
            0,
            contentHeight - (screenHeight - 70)
        );
    });
}
}