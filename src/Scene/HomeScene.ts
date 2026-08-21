import Phaser from 'phaser';

import flowerImg from '../assets/flower.png';

export class HomeScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super('HomeScene');
  }

  preload(): void {
    this.load.image(
      'homeFlower',
      flowerImg
    );
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 背景
    this.cameras.main.setBackgroundColor(
      '#cfe3f5'
    );

    // =====================================
    // ホーム画面全体
    // =====================================
    // 数字をマイナスにすると左へ移動する
    //
    // -30 → 少し左
    // -50 → さらに左
    // -70 → 今回
    // -90 → かなり左
    //
    const ui = this.add.container(
      -40,
      0
    );

    // =====================================
    // 外枠
    // =====================================

    const outerFrame = this.add
      .rectangle(
        width / 2,
        height / 2,
        1180,
        650,
        0xcfe3f5
      )
      .setStrokeStyle(
        3,
        0x536878
      );

    ui.add(
      outerFrame
    );

    // =====================================
    // ホーム画面タイトル背景
    // =====================================

    const titleBackground = this.add
      .rectangle(
        width / 2,
        55,
        230,
        60,
        0xffe5cf
      )
      .setStrokeStyle(
        2,
        0x806b5a
      );

    ui.add(
      titleBackground
    );

    // =====================================
    // ホーム画面タイトル
    // =====================================

    const titleText = this.add
      .text(
        width / 2,
        55,
        'ホーム画面',
        {
          fontFamily:
            '"Yu Gothic", "Meiryo", sans-serif',

          fontSize: '30px',
          color: '#000000',

          padding: {
            top: 6,
            bottom: 6,
            left: 6,
            right: 6,
          },
        }
      )
      .setOrigin(0.5);

    ui.add(
      titleText
    );

    // =====================================
    // 花表示エリア
    // =====================================

    const flowerFrame = this.add
      .rectangle(
        455,
        330,
        570,
        360,
        0xffffff
      )
      .setStrokeStyle(
        3,
        0x536878
      );

    ui.add(
      flowerFrame
    );

    // 花画像
    const flower = this.add.image(
      455,
      330,
      'homeFlower'
    );

    flower.setScale(
      0.7
    );

    ui.add(
      flower
    );

    // =====================================
    // ステージ選択ボタン
    // =====================================

    const stageButton =
      this.createCircleButton(
        940,
        320,
        150,
        'ステージ\n選択',
        () => {
          this.scene.start(
            'TestScene'
          );
        }
      );

    ui.add(
      stageButton
    );

    // =====================================
    // 設定ボタン
    // =====================================

    const settingsButton =
      this.createCircleButton(
        1130,
        115,
        95,
        '設定',
        () => {
          this.scene.start(
            'SettingsScene'
          );
        }
      );

    ui.add(
      settingsButton
    );

    // =====================================
    // 育成
    // =====================================

    const trainingButton =
      this.createMenuButton(
        300,
        590,
        '育成',
        () => {
          this.scene.start(
            'TrainingScene'
          );
        }
      );

    ui.add(
      trainingButton
    );

    // =====================================
    // 編成
    // =====================================

    const formationButton =
      this.createMenuButton(
        500,
        590,
        '編成',
        () => {
          this.showMessage(
            '編成画面は準備中です'
          );
        }
      );

    ui.add(
      formationButton
    );

    // =====================================
    // 図鑑
    // =====================================

    const encyclopediaButton =
      this.createMenuButton(
        700,
        590,
        '図鑑',
        () => {
          this.showMessage(
            '図鑑画面は準備中です'
          );
        }
      );

    ui.add(
      encyclopediaButton
    );

    // =====================================
    // ショップ
    // =====================================

    const shopButton =
      this.createMenuButton(
        900,
        590,
        'ショップ',
        () => {
          this.showMessage(
            'ショップ画面は準備中です'
          );
        }
      );

    ui.add(
      shopButton
    );

    // =====================================
    // メッセージ
    // =====================================

    this.messageText = this.add
      .text(
        width / 2,
        665,
        '',
        {
          fontFamily:
            '"Yu Gothic", "Meiryo", sans-serif',

          fontSize: '22px',
          color: '#333333',

          padding: {
            top: 6,
            bottom: 6,
            left: 6,
            right: 6,
          },
        }
      )
      .setOrigin(0.5);

    ui.add(
      this.messageText
    );
  }

  // =====================================
  // 下のメニューボタン
  // =====================================

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const background = this.add
      .rectangle(
        0,
        0,
        150,
        65,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      )
      .setInteractive({
        useHandCursor: true,
      });

    const text = this.add
      .text(
        0,
        0,
        label,
        {
          fontFamily:
            '"Yu Gothic", "Meiryo", sans-serif',

          fontSize: '26px',
          color: '#000000',

          padding: {
            top: 6,
            bottom: 6,
            left: 6,
            right: 6,
          },
        }
      )
      .setOrigin(0.5);

    const container =
      this.add.container(
        x,
        y,
        [
          background,
          text,
        ]
      );

    // マウスを乗せた時
    background.on(
      'pointerover',
      () => {
        background.setFillStyle(
          0xeaf4fb
        );
      }
    );

    // マウスを外した時
    background.on(
      'pointerout',
      () => {
        background.setFillStyle(
          0xffffff
        );
      }
    );

    // 押した時
    background.on(
      'pointerdown',
      () => {
        background.setFillStyle(
          0xd5e8f5
        );
      }
    );

    // 離した時
    background.on(
      'pointerup',
      () => {
        background.setFillStyle(
          0xeaf4fb
        );

        onClick();
      }
    );

    return container;
  }

  // =====================================
  // 丸型ボタン
  // =====================================

  private createCircleButton(
    x: number,
    y: number,
    diameter: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const background = this.add
      .circle(
        0,
        0,
        diameter / 2,
        0xffffff
      )
      .setStrokeStyle(
        3,
        0x536878
      )
      .setInteractive({
        useHandCursor: true,
      });

    const text = this.add
      .text(
        0,
        0,
        label,
        {
          fontFamily:
            '"Yu Gothic", "Meiryo", sans-serif',

          fontSize:
            diameter <= 100
              ? '22px'
              : '27px',

          color: '#000000',
          align: 'center',

          padding: {
            top: 6,
            bottom: 6,
            left: 6,
            right: 6,
          },
        }
      )
      .setOrigin(0.5);

    const container =
      this.add.container(
        x,
        y,
        [
          background,
          text,
        ]
      );

    // マウスを乗せた時
    background.on(
      'pointerover',
      () => {
        background.setFillStyle(
          0xeaf4fb
        );
      }
    );

    // マウスを外した時
    background.on(
      'pointerout',
      () => {
        background.setFillStyle(
          0xffffff
        );
      }
    );

    // 押した時
    background.on(
      'pointerdown',
      () => {
        background.setFillStyle(
          0xd5e8f5
        );
      }
    );

    // 離した時
    background.on(
      'pointerup',
      () => {
        background.setFillStyle(
          0xeaf4fb
        );

        onClick();
      }
    );

    return container;
  }

  // =====================================
  // 準備中メッセージ
  // =====================================

  private showMessage(
    message: string
  ): void {
    this.messageText.setText(
      message
    );

    this.time.delayedCall(
      2000,
      () => {
        this.messageText.setText(
          ''
        );
      }
    );
  }
}