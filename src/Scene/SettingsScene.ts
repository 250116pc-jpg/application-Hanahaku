import Phaser from 'phaser';

import flowerImg from '../assets/flower.png';
import {
  applyAudioSettings,
  loadAudioSettings,
  saveAudioSettings,
} from '../audio/BgmManager';

export class SettingsScene extends Phaser.Scene {
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

  preload(): void {
    this.load.image(
      'settingsCharacter',
      flowerImg
    );
  }

  create(): void {
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
        this.saveSettings();
        this.scene.start('HomeScene');
      },
      280
    );

    this.updateDisplay();
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
        this.saveSettings();
        this.scene.start('HomeScene');
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
}
