import Phaser from 'phaser';

import flowerImg from '../assets/flower.png';

export class TrainingScene extends Phaser.Scene {
  private selectedTab = 'status';

  private infoTitle!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super('TrainingScene');
  }

  preload(): void {
    this.load.image(
      'trainingFlower',
      flowerImg
    );
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // =========================
    // 育成画面だけは左寄せしない
    // =========================
    this.cameras.main.setScroll(
      0,
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
        width / 2,
        50,
        '育成画面',
        this.getTextStyle(
          34
        )
      )
      .setOrigin(0.5);

    // =========================
    // 戻るボタン
    // =========================

    this.createBackButton();

    // =========================
    // 左メニュー枠
    // =========================

    this.add
      .rectangle(
        120,
        350,
        140,
        410,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      );

    // ステータス
    this.createTabButton(
      120,
      230,
      'ステータス',
      'status'
    );

    // レベル
    this.createTabButton(
      120,
      350,
      'レベル',
      'level'
    );

    // スキル
    this.createTabButton(
      120,
      470,
      'スキル',
      'skill'
    );

    // =========================
    // 中央キャラクター枠
    // =========================

    this.add
      .rectangle(
        460,
        350,
        520,
        410,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      );

    const flower =
      this.add.image(
        460,
        350,
        'trainingFlower'
      );

    flower.setScale(
      0.7
    );

    // =========================
    // 右情報枠
    // =========================

    this.add
      .rectangle(
        945,
        350,
        430,
        410,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      );

    // 情報タイトル
    this.infoTitle =
      this.add.text(
        770,
        190,
        '',
        this.getTextStyle(
          28
        )
      );

    // 情報本文
    this.infoText =
      this.add.text(
        770,
        245,
        '',
        {
          ...this.getTextStyle(
            22
          ),

          lineSpacing: 8,

          wordWrap: {
            width: 340,
          },
        }
      );

    // =========================
    // キャラ詳細ボタン
    // =========================

    this.createLargeButton(
      945,
      495,
      'キャラ詳細を見る',
      () => {
        this.scene.start(
          'CharacterDetailScene'
        );
      }
    );

    // =========================
    // 花一覧
    // =========================

    this.add
      .rectangle(
        width / 2,
        625,
        1030,
        95,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      );

    this.add
      .text(
        width / 2,
        625,
        '花一覧　　ひまわり　　？？？　　？？？',
        this.getTextStyle(
          24
        )
      )
      .setOrigin(0.5);

    // 初期表示
    this.changeTab(
      'status'
    );
  }

  // =========================
  // 戻るボタン
  // =========================

  private createBackButton(): void {
    const button =
      this.add
        .text(
          120,
          70,
          '← 戻る',
          {
            ...this.getTextStyle(
              26
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

    button.on(
      'pointerover',
      () => {
        button.setBackgroundColor(
          '#eeeeee'
        );
      }
    );

    button.on(
      'pointerout',
      () => {
        button.setBackgroundColor(
          '#ffffff'
        );
      }
    );

    button.on(
      'pointerdown',
      () => {
        button.setBackgroundColor(
          '#d0d0d0'
        );
      }
    );

    button.on(
      'pointerup',
      () => {
        this.scene.start(
          'HomeScene'
        );
      }
    );
  }

  // =========================
  // 左メニュー
  // =========================

  private createTabButton(
    x: number,
    y: number,
    label: string,
    tabName: string
  ): void {
    const button =
      this.add
        .text(
          x,
          y,
          label,
          {
            ...this.getTextStyle(
              22
            ),

            backgroundColor:
              '#ffffff',

            padding: {
              top: 12,
              bottom: 12,
              left: 12,
              right: 12,
            },
          }
        )
        .setOrigin(0.5)
        .setInteractive({
          useHandCursor: true,
        });

    button.on(
      'pointerover',
      () => {
        button.setBackgroundColor(
          '#eaf4fb'
        );
      }
    );

    button.on(
      'pointerout',
      () => {
        button.setBackgroundColor(
          '#ffffff'
        );
      }
    );

    button.on(
      'pointerdown',
      () => {
        this.changeTab(
          tabName
        );
      }
    );
  }

  // =========================
  // タブ切り替え
  // =========================

  private changeTab(
    tabName: string
  ): void {
    this.selectedTab =
      tabName;

    // ステータス
    if (
      this.selectedTab ===
      'status'
    ) {
      this.infoTitle.setText(
        'ステータス'
      );

      this.infoText.setText(
        'ひまわり ★★★\n\n' +
        'HP    100\n' +
        'MP     20\n' +
        'ATK    25\n' +
        'DEF    10'
      );
    }

    // レベル
    if (
      this.selectedTab ===
      'level'
    ) {
      this.infoTitle.setText(
        'レベル'
      );

      this.infoText.setText(
        '現在レベル\n\n' +
        'Lv.10 / 30\n\n' +
        '次のレベルまで\n' +
        '経験値 250'
      );
    }

    // スキル
    if (
      this.selectedTab ===
      'skill'
    ) {
      this.infoTitle.setText(
        'スキル'
      );

      this.infoText.setText(
        'スキル1\n' +
        'ファイヤースラッシュ Lv.2\n\n' +
        'スキル2\n' +
        'サンフラワー Lv.1'
      );
    }
  }

  // =========================
  // キャラ詳細ボタン
  // =========================

  private createLargeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): void {
    const background =
      this.add
        .rectangle(
          0,
          0,
          270,
          60,
          0xffffff
        )
        .setStrokeStyle(
          2,
          0x333333
        )
        .setInteractive({
          useHandCursor: true,
        });

    const text =
      this.add
        .text(
          0,
          0,
          label,
          this.getTextStyle(
            22
          )
        )
        .setOrigin(0.5);

    this.add.container(
      x,
      y,
      [
        background,
        text,
      ]
    );

    background.on(
      'pointerover',
      () => {
        background.setFillStyle(
          0xeaf4fb
        );
      }
    );

    background.on(
      'pointerout',
      () => {
        background.setFillStyle(
          0xffffff
        );
      }
    );

    background.on(
      'pointerdown',
      () => {
        background.setFillStyle(
          0xd5e8f5
        );
      }
    );

    background.on(
      'pointerup',
      () => {
        background.setFillStyle(
          0xeaf4fb
        );

        onClick();
      }
    );
  }

  // =========================
  // 共通テキスト
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