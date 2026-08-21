import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 背景色
    this.cameras.main.setBackgroundColor('#cfe3f5');

    // タイトル
    this.add
      .text(
        width / 2,
        height / 2 - 100,
        '花契記',
        {
          fontFamily:
            '"Yu Gothic", "Meiryo", sans-serif',

          fontSize: '72px',
          color: '#000000',

          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        }
      )
      .setOrigin(0.5);

    // スタートボタン
    const startButton = this.add
      .text(
        width / 2,
        height / 2 + 100,
        'スタート',
        {
          fontFamily:
            '"Yu Gothic", "Meiryo", sans-serif',

          fontSize: '36px',
          color: '#000000',
          backgroundColor: '#ffffff',

          padding: {
            top: 16,
            bottom: 18,
            left: 50,
            right: 50,
          },
        }
      )
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
      });

    startButton.on(
      'pointerover',
      () => {
        startButton.setBackgroundColor(
          '#eeeeee'
        );
      }
    );

    startButton.on(
      'pointerout',
      () => {
        startButton.setBackgroundColor(
          '#ffffff'
        );
      }
    );

    startButton.on(
      'pointerdown',
      () => {
        startButton.setBackgroundColor(
          '#d0d0d0'
        );
      }
    );

    startButton.on(
      'pointerup',
      () => {
        this.scene.start(
          'HomeScene'
        );
      }
    );
  }
}