import Phaser from 'phaser';

import flowerImg from '../assets/flower.png';
import {
  applyAudioSettings,
  loadAudioSettings,
  saveAudioSettings,
} from '../audio/BgmManager';
import { showDebugSceneName } from '../debug';

export class SettingsScene extends Phaser.Scene {
  private readonly guideStorageKey = 'hanahakuSettingsGuideSeen';
  private guideObjects: Phaser.GameObjects.GameObject[] = [];
  private returnScene = 'HomeScene';
  private resumeOnClose = false;
  private bgmVolume = 0.5;
  private seVolume = 0.7;
  private isMuted = false;

  private bgmText!: Phaser.GameObjects.Text;
  private seText!: Phaser.GameObjects.Text;
  private muteText!: Phaser.GameObjects.Text;
  private speechText!: Phaser.GameObjects.Text;

  constructor() {
    super('SettingsScene');
  }

  init(data: { returnScene?: string; resumeOnClose?: boolean } = {}): void {
    this.returnScene = data.returnScene ?? 'HomeScene';
    this.resumeOnClose = data.resumeOnClose ?? false;
  }

  preload(): void {
    this.load.image(
      'settingsCharacter',
      flowerImg
    );
  }

  create(): void {
    showDebugSceneName(this);
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setScroll(20, 0);
    this.cameras.main.setBackgroundColor('#cfe3f5');

    const audioSettings =
      loadAudioSettings(this);

    this.bgmVolume =
      audioSettings.bgmVolume;

    this.seVolume =
      audioSettings.seVolume;

    this.isMuted =
      audioSettings.isMuted;

    this.add
      .rectangle(
        width / 2,
        height / 2,
        width - 40,
        height - 40,
        0xcfe3f5
      )
      .setStrokeStyle(
        3,
        0x536878
      );

    this.add
      .text(
        width - 145,
        60,
        '設定',
        this.getTextStyle(38)
      )
      .setOrigin(0.5);

    this.createBackButton();
    this.createBgmControls();
    this.createSeControls();
    this.createMuteButton();
    this.createSpeechBubble();

    const character =
      this.add.image(
        750,
        455,
        'settingsCharacter'
      );

    character.setScale(0.55);

    this.createLargeButton(
      1050,
      500,
      '初期値に戻す',
      () => {
        this.bgmVolume = 0.5;
        this.seVolume = 0.7;
        this.isMuted = false;

        this.updateDisplay();
        this.setSpeech(
          '最初の設定に戻したよ'
        );
      },
      280
    );

    this.createLargeButton(
      1050,
      620,
      '保存して戻る',
      () => {
        this.closeSettings();
      },
      280
    );

    this.createLargeButton(730, 65, '操作ガイド', () => this.startGuide(), 200);

    this.updateDisplay();

    if (this.returnScene === 'HomeScene' && !this.hasSeenGuide()) {
      this.time.delayedCall(0, () => this.startGuide());
    }
  }

  private hasSeenGuide(): boolean {
    if (this.registry.get(this.guideStorageKey) === true) return true;
    try {
      return localStorage.getItem(this.guideStorageKey) === '1';
    } catch {
      return false;
    }
  }

  private startGuide(): void {
    if (this.guideObjects.length > 0) return;
    this.registry.set(this.guideStorageKey, true);
    try {
      localStorage.setItem(this.guideStorageKey, '1');
    } catch {
      // 保存できなくても今回のガイドは表示する。
    }
    this.showGuideStep(0);
  }

  private clearGuide(): void {
    this.guideObjects.forEach(object => object.destroy());
    this.guideObjects = [];
  }

  private showGuideStep(index: number): void {
    this.clearGuide();
    const steps = [
      { target: new Phaser.Geom.Rectangle(100, 160, 300, 165),
        message: 'ここでBGMの音量を調整できます。\n＋と－を押して試してみましょう。' },
      { target: new Phaser.Geom.Rectangle(100, 328, 300, 165),
        message: 'ここではボタンなどの\n効果音の音量を調整できます。' },
      { target: new Phaser.Geom.Rectangle(118, 540, 240, 85),
        message: 'ミュートを押すと音を消せます。\nもう一度押すと元に戻ります。' },
      { target: new Phaser.Geom.Rectangle(900, 458, 300, 85),
        message: 'BGMを50%、SEを70%に戻し、\nミュートも解除します。' },
      { target: new Phaser.Geom.Rectangle(900, 578, 300, 85),
        message: '「保存して戻る」を押すと、\n変更した音量が次回も残ります。' }
    ];
    if (index >= steps.length) return;

    const { target, message } = steps[index];
    const right = this.scale.width + 40;
    const bottom = this.scale.height;
    const dim = (x: number, y: number, width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      this.guideObjects.push(this.add.rectangle(x, y, width, height, 0x000000, 0.48)
        .setOrigin(0).setDepth(5000).setInteractive());
    };
    dim(0, 0, right, target.y);
    dim(0, target.y, target.x, target.height);
    dim(target.right, target.y, right - target.right, target.height);
    dim(0, target.bottom, right, bottom - target.bottom);

    this.guideObjects.push(this.add.graphics().setDepth(5001)
      .lineStyle(4, 0xffdc70, 1)
      .strokeRoundedRect(target.x - 4, target.y - 4, target.width + 8, target.height + 8, 12));
    this.guideObjects.push(this.add.rectangle(850, 350, 620, 200, 0xffffff, 0.98)
      .setStrokeStyle(3, 0x536878).setDepth(5002).setInteractive());
    this.guideObjects.push(this.add.text(565, 267, `操作ガイド  ${index + 1} / ${steps.length}`,
      { ...this.getTextStyle(25), fontStyle: 'bold' }).setDepth(5003));
    this.guideObjects.push(this.add.text(565, 315, message,
      { ...this.getTextStyle(23), wordWrap: { width: 550 } }).setDepth(5003));

    const skip = this.add.text(710, 412, 'スキップ', {
      ...this.getTextStyle(23), backgroundColor: '#e7edf2',
      padding: { left: 22, right: 22, top: 12, bottom: 12 }
    }).setOrigin(0.5).setDepth(5004).setInteractive({ useHandCursor: true });
    skip.on('pointerup', () => this.clearGuide());
    this.guideObjects.push(skip);

    const next = this.add.text(1010, 412, index === steps.length - 1 ? '完了' : '次へ', {
      ...this.getTextStyle(23), backgroundColor: '#ffdc70',
      padding: { left: 28, right: 28, top: 12, bottom: 12 }
    }).setOrigin(0.5).setDepth(5004).setInteractive({ useHandCursor: true });
    next.on('pointerup', () => index === steps.length - 1
      ? this.clearGuide()
      : this.showGuideStep(index + 1));
    this.guideObjects.push(next);
  }

  private createBackButton(): void {
    const button =
      this.add
        .text(
          80,
          65,
          '←',
          {
            ...this.getTextStyle(52),
            backgroundColor: '#ffffff',
            padding: {
              top: 4,
              bottom: 8,
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
      'pointerdown',
      () => {
        this.closeSettings();
      }
    );
  }

  private createBgmControls(): void {
    this.add.text(
      130,
      185,
      'BGM音量',
      this.getTextStyle(32)
    );

    this.createSmallButton(
      145,
      270,
      '－',
      () => {
        this.bgmVolume =
          Phaser.Math.Clamp(
            this.bgmVolume - 0.1,
            0,
            1
          );

        this.updateDisplay();
        this.setSpeech(
          'BGMを小さくしたよ'
        );
      }
    );

    this.bgmText =
      this.add
        .text(
          245,
          270,
          '',
          this.getTextStyle(30)
        )
        .setOrigin(0.5);

    this.createSmallButton(
      345,
      270,
      '＋',
      () => {
        this.bgmVolume =
          Phaser.Math.Clamp(
            this.bgmVolume + 0.1,
            0,
            1
          );

        this.updateDisplay();
        this.setSpeech(
          'BGMを大きくしたよ'
        );
      }
    );
  }

  private createSeControls(): void {
    this.add.text(
      130,
      350,
      'SE音量',
      this.getTextStyle(32)
    );

    this.createSmallButton(
      145,
      435,
      '－',
      () => {
        this.seVolume =
          Phaser.Math.Clamp(
            this.seVolume - 0.1,
            0,
            1
          );

        this.updateDisplay();
        this.setSpeech(
          '効果音を小さくしたよ'
        );
      }
    );

    this.seText =
      this.add
        .text(
          245,
          435,
          '',
          this.getTextStyle(30)
        )
        .setOrigin(0.5);

    this.createSmallButton(
      345,
      435,
      '＋',
      () => {
        this.seVolume =
          Phaser.Math.Clamp(
            this.seVolume + 0.1,
            0,
            1
          );

        this.updateDisplay();
        this.setSpeech(
          '効果音を大きくしたよ'
        );
      }
    );
  }

  private createMuteButton(): void {
    this.muteText =
      this.add
        .text(
          130,
          560,
          '',
          {
            ...this.getTextStyle(28),
            backgroundColor: '#ffffff',
            padding: {
              top: 13,
              bottom: 13,
              left: 20,
              right: 20,
            },
          }
        )
        .setInteractive({
          useHandCursor: true,
        });

    this.muteText.on(
      'pointerdown',
      () => {
        this.isMuted =
          !this.isMuted;

        this.updateDisplay();

        this.setSpeech(
          this.isMuted
            ? '音を消したよ'
            : '音を戻したよ'
        );
      }
    );
  }

  private createSpeechBubble(): void {
    this.add
      .ellipse(
        750,
        190,
        380,
        170,
        0xffffff
      )
      .setStrokeStyle(
        3,
        0x536878
      );

    this.add
      .triangle(
        665,
        295,
        0,
        0,
        90,
        0,
        30,
        75,
        0xffffff
      )
      .setStrokeStyle(
        3,
        0x536878
      );

    this.speechText =
      this.add
        .text(
          750,
          190,
          '音量を変更できるよ',
          {
            ...this.getTextStyle(28),
            align: 'center',
            wordWrap: {
              width: 300,
            },
          }
        )
        .setOrigin(0.5);
  }

  private createSmallButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const button =
      this.add
        .text(
          x,
          y,
          `[${label}]`,
          {
            ...this.getTextStyle(30),
            backgroundColor: '#ffffff',
            padding: {
              top: 10,
              bottom: 10,
              left: 14,
              right: 14,
            },
          }
        )
        .setOrigin(0.5)
        .setInteractive({
          useHandCursor: true,
        });

    button.on(
      'pointerup',
      () => {
        onClick();
      }
    );

    return button;
  }

  private createLargeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    buttonWidth: number
  ): void {
    const background =
      this.add
        .rectangle(
          0,
          0,
          buttonWidth,
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
          this.getTextStyle(26)
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
      'pointerup',
      () => {
        onClick();
      }
    );
  }

  private getTextStyle(
    fontSize: number
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily:
        '"Yu Gothic", "Meiryo", sans-serif',
      fontSize:
        `${fontSize}px`,
      color: '#000000',
      padding: {
        top: 8,
        bottom: 8,
        left: 6,
        right: 6,
      },
    };
  }

  private updateDisplay(): void {
    this.bgmText.setText(
      `${Math.round(
        this.bgmVolume * 100
      )}%`
    );

    this.seText.setText(
      `${Math.round(
        this.seVolume * 100
      )}%`
    );

    this.muteText.setText(
      this.isMuted
        ? 'ミュート解除'
        : 'ミュート'
    );

    applyAudioSettings(
      this,
      {
        bgmVolume:
          this.bgmVolume,
        seVolume:
          this.seVolume,
        isMuted:
          this.isMuted,
      }
    );
  }

  private setSpeech(
    message: string
  ): void {
    this.speechText.setText(
      message
    );
  }

  private saveSettings(): void {
    saveAudioSettings(
      this,
      {
        bgmVolume:
          this.bgmVolume,
        seVolume:
          this.seVolume,
        isMuted:
          this.isMuted,
      }
    );
  }

  private closeSettings(): void {
    this.clearGuide();
    this.saveSettings();
    if (this.resumeOnClose) {
      this.scene.resume(this.returnScene);
      this.scene.stop();
    } else {
      this.scene.start(this.returnScene);
    }
  }
}
