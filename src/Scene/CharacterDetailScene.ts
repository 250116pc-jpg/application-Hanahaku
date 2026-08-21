import Phaser from 'phaser';

import flowerImg from '../assets/flower.png';

export class CharacterDetailScene extends Phaser.Scene {
  constructor() {
    super(
      'CharacterDetailScene'
    );
  }

  preload(): void {
    this.load.image(
      'detailFlower',
      flowerImg
    );
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // =========================
    // 画面全体を40px左へ
    // =========================

    this.cameras.main.setScroll(
      40,
      0
    );

    // 背景
    this.cameras.main.setBackgroundColor(
      '#cfe3f5'
    );

    // =========================
    // 外枠
    // =========================

    this.add
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

    // =========================
    // タイトル
    // =========================

    this.add
      .text(
        width - 200,
        65,
        'キャラ詳細',
        this.getTextStyle(
          34
        )
      )
      .setOrigin(0.5);

    // =========================
    // 育成画面へ戻る
    // =========================

    const backButton =
      this.add
        .text(
          170,
          70,
          '← 育成画面へ',
          {
            ...this.getTextStyle(
              25
            ),

            backgroundColor:
              '#ffffff',

            padding: {
              top: 10,
              bottom: 12,
              left: 18,
              right: 18,
            },
          }
        )
        .setOrigin(0.5)
        .setInteractive({
          useHandCursor: true,
        });

    backButton.on(
      'pointerover',
      () => {
        backButton.setBackgroundColor(
          '#eeeeee'
        );
      }
    );

    backButton.on(
      'pointerout',
      () => {
        backButton.setBackgroundColor(
          '#ffffff'
        );
      }
    );

    backButton.on(
      'pointerdown',
      () => {
        backButton.setBackgroundColor(
          '#d0d0d0'
        );
      }
    );

    backButton.on(
      'pointerup',
      () => {
        this.scene.start(
          'TrainingScene'
        );
      }
    );

    // =========================
    // キャラクター画像枠
    // =========================

    this.add
      .rectangle(
        300,
        260,
        340,
        330,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      );

    // キャラクター画像
    const flower =
      this.add.image(
        300,
        260,
        'detailFlower'
      );

    flower.setScale(
      0.7
    );

    // =========================
    // 基本情報
    // =========================

    this.add.text(
      560,
      170,
      'ひまわり ★★★\n' +
      'サンフラワー\n' +
      'レベル 10 / 30',
      {
        ...this.getTextStyle(
          30
        ),

        lineSpacing: 10,
      }
    );

    // =========================
    // ステータス
    // =========================

    this.add.text(
      150,
      470,
      'ステータス',
      this.getTextStyle(
        28
      )
    );

    this.add.text(
      170,
      520,
      'HP   100\n' +
      'MP    20\n' +
      'ATK   25\n' +
      'DEF   10',
      {
        ...this.getTextStyle(
          24
        ),

        lineSpacing: 8,
      }
    );

    // =========================
    // スキル
    // =========================

    this.add.text(
      560,
      440,
      'スキル',
      this.getTextStyle(
        28
      )
    );

    this.add.text(
      560,
      500,
      'スキル1\n' +
      'ファイヤースラッシュ Lv.2\n\n' +
      'スキル2\n' +
      'サンフラワー Lv.1',
      {
        ...this.getTextStyle(
          23
        ),

        lineSpacing: 8,
      }
    );

    // =========================
    // ホームボタン
    // =========================

    const homeButton =
      this.add
        .text(
          width - 150,
          height - 70,
          'ホームへ',
          {
            ...this.getTextStyle(
              24
            ),

            backgroundColor:
              '#ffffff',

            padding: {
              top: 12,
              bottom: 12,
              left: 25,
              right: 25,
            },
          }
        )
        .setOrigin(0.5)
        .setInteractive({
          useHandCursor: true,
        });

    homeButton.on(
      'pointerover',
      () => {
        homeButton.setBackgroundColor(
          '#eeeeee'
        );
      }
    );

    homeButton.on(
      'pointerout',
      () => {
        homeButton.setBackgroundColor(
          '#ffffff'
        );
      }
    );

    homeButton.on(
      'pointerdown',
      () => {
        homeButton.setBackgroundColor(
          '#d0d0d0'
        );
      }
    );

    homeButton.on(
      'pointerup',
      () => {
        this.scene.start(
          'HomeScene'
        );
      }
    );
  }

  // =========================
  // 共通文字スタイル
  // =========================

  private getTextStyle(
    fontSize: number
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily:
        '"Yu Gothic", "Meiryo", sans-serif',

      fontSize:
        `${fontSize}px`,

      color:
        '#000000',

      padding: {
        top: 8,
        bottom: 8,
        left: 6,
        right: 6,
      },
    };
  }
}