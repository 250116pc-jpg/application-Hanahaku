import Phaser from 'phaser';

export class TestScene extends Phaser.Scene {
  private retreatPopup?: Phaser.GameObjects.Container;

  constructor() {
    super('TestScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setScroll(40, 0);
    this.cameras.main.setBackgroundColor('#cfe3f5');

    this.add
      .rectangle(
        width / 2,
        height / 2,
        width + 300,
        height + 300,
        0xcfe3f5,
        1
      )
      .setScrollFactor(0)
      .setDepth(-100);

    this.add
      .text(
        width / 2,
        70,
        'ステージ画面',
        this.getTextStyle(34)
      )
      .setOrigin(0.5);

    this.add.text(
      40,
      30,
      'HP:',
      this.getTextStyle(24)
    );

    this.add.rectangle(
      260,
      45,
      330,
      22,
      0x555555
    );

    this.add.rectangle(
      260,
      45,
      330,
      22,
      0x16a526
    );

    this.add.text(
      40,
      65,
      'MP:',
      this.getTextStyle(24)
    );

    this.add.rectangle(
      195,
      80,
      200,
      22,
      0x555555
    );

    this.add.rectangle(
      195,
      80,
      200,
      22,
      0x16a9b5
    );

    this.createBackButton();
    this.createBagButton();
    this.createRetreatButton();

    this.add
      .rectangle(
        260,
        500,
        120,
        100,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x333333
      );

    this.add
      .text(
        260,
        500,
        'キャラ',
        this.getTextStyle(22)
      )
      .setOrigin(0.5);

    this.createActionCircle(
      1070,
      600,
      120,
      '通常攻撃'
    );

    this.createActionCircle(
      940,
      620,
      100,
      'ジャンプ'
    );

    this.createActionCircle(
      990,
      510,
      100,
      'スキル\n1'
    );

    this.createActionCircle(
      1110,
      470,
      100,
      'スキル\n2'
    );
  }

  private createBackButton(): void {
    const button =
      this.add
        .text(
          100,
          130,
          '← 戻る',
          {
            ...this.getTextStyle(25),
            backgroundColor: '#ffffff',
            padding: {
              top: 12,
              bottom: 12,
              left: 20,
              right: 20,
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
      'pointerup',
      () => {
        this.scene.start(
          'HomeScene'
        );
      }
    );
  }

  private createBagButton(): void {
    const button =
      this.add
        .text(
          100,
          220,
          'バッグ',
          {
            ...this.getTextStyle(25),
            backgroundColor: '#ffffff',
            padding: {
              top: 18,
              bottom: 18,
              left: 24,
              right: 24,
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
      'pointerup',
      () => {
        console.log(
          'インベントリは後で実装します'
        );
      }
    );
  }

  private createRetreatButton(): void {
    const width =
      this.scale.width;

    const button =
      this.add
        .text(
          width - 120,
          100,
          '撤退',
          {
            ...this.getTextStyle(25),
            backgroundColor: '#ffffff',
            padding: {
              top: 14,
              bottom: 14,
              left: 28,
              right: 28,
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
      'pointerup',
      () => {
        this.showRetreatPopup();
      }
    );
  }

  private showRetreatPopup(): void {
    if (
      this.retreatPopup
    ) {
      return;
    }

    const width =
      this.scale.width;

    const height =
      this.scale.height;

    this.retreatPopup =
      this.add.container(
        0,
        0
      );

    this.retreatPopup.setDepth(
      3000
    );

    const darkBackground =
      this.add
        .rectangle(
          width / 2,
          height / 2,
          width + 500,
          height + 500,
          0x000000,
          0.55
        )
        .setScrollFactor(0)
        .setInteractive();

    const popup =
      this.add
        .rectangle(
          width / 2,
          height / 2,
          650,
          330,
          0xffffff
        )
        .setScrollFactor(0)
        .setStrokeStyle(
          3,
          0x536878
        );

    const title =
      this.add
        .text(
          width / 2,
          height / 2 - 90,
          'ステージから撤退しますか？',
          this.getTextStyle(32)
        )
        .setOrigin(0.5)
        .setScrollFactor(0);

    const warning =
      this.add
        .text(
          width / 2,
          height / 2 - 20,
          '進行状況が失われます。',
          {
            ...this.getTextStyle(24),
            color: '#444444',
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);

    const cancelButton =
      this.createPopupButton(
        width / 2 - 150,
        height / 2 + 90,
        'キャンセル',
        () => {
          this.closeRetreatPopup();
        }
      );

    const retreatButton =
      this.createPopupButton(
        width / 2 + 150,
        height / 2 + 90,
        '撤退する',
        () => {
          this.retreatFromStage();
        }
      );

    this.retreatPopup.add([
      darkBackground,
      popup,
      title,
      warning,
      cancelButton,
      retreatButton,
    ]);
  }

  private createPopupButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const background =
      this.add
        .rectangle(
          0,
          0,
          210,
          70,
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
          this.getTextStyle(25)
        )
        .setOrigin(0.5);

    const button =
      this.add.container(
        x,
        y,
        [
          background,
          text,
        ]
      );

    button.setScrollFactor(0);

    background.on(
      'pointerover',
      () => {
        background.setFillStyle(
          0xeeeeee
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
      'pointerup',
      () => {
        onClick();
      }
    );

    return button;
  }

  private closeRetreatPopup(): void {
    if (
      !this.retreatPopup
    ) {
      return;
    }

    this.retreatPopup.destroy(
      true
    );

    this.retreatPopup =
      undefined;
  }

  private retreatFromStage(): void {
    this.closeRetreatPopup();

    this.scene.start(
      'HomeScene'
    );
  }

  private createActionCircle(
    x: number,
    y: number,
    diameter: number,
    label: string
  ): void {
    this.add
      .circle(
        x,
        y,
        diameter / 2,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x333333
      );

    this.add
      .text(
        x,
        y,
        label,
        {
          ...this.getTextStyle(18),
          align: 'center',
        }
      )
      .setOrigin(0.5);
  }

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
        top: 7,
        bottom: 7,
        left: 6,
        right: 6,
      },
    };
  }
}