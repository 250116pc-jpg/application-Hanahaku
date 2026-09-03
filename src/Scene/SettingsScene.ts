import Phaser from 'phaser';

import flowerImg from '../assets/flower.png';

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
    this.load.image('settingsCharacter', flowerImg);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // =========================
    // 全体を20px左へ
    // =========================
    this.cameras.main.setScroll(20, 0);

    // 背景
    this.cameras.main.setBackgroundColor('#cfe3f5');

    // =========================
    // 設定値の読み込み
    // =========================
    this.bgmVolume = this.registry.get('bgmVolume') ?? 0.5;
    this.seVolume = this.registry.get('seVolume') ?? 0.7;
    this.isMuted = this.registry.get('isMuted') ?? false;

    // =========================
    // 外枠
    // =========================
    this.add.rectangle(width / 2, height / 2, width - 40, height - 40, 0xcfe3f5)
      .setStrokeStyle(3, 0x536878);

    // =========================
    // タイトル
    // =========================
    this.add.text(width - 145, 60, '設定', this.getTextStyle(38))
      .setOrigin(0.5);

    // =========================
    // 各種UIの生成
    // =========================
    this.createBackButton();
    this.createBgmControls();
    this.createSeControls();
    this.createMuteButton();
    this.createSpeechBubble();

    // =========================
    // キャラクター
    // =========================
    const character = this.add.image(750, 455, 'settingsCharacter');
    character.setScale(0.55);

    // =========================
    // アクションボタン
    // =========================
    this.createLargeButton(1050, 500, '初期値に戻す', () => {
      this.bgmVolume = 0.5;
      this.seVolume = 0.7;
      this.isMuted = false;

      this.updateDisplay();
      this.setSpeech('最初の設定に戻したよ');
    }, 280);

    this.createLargeButton(1050, 620, '保存して戻る', () => {
      this.saveSettings();
      this.scene.start('HomeScene');
    }, 280);

    // 初期表示の更新
    this.updateDisplay();
  }

  // =========================
  // 戻るボタン
  // =========================
  private createBackButton(): void {
    const button = this.add.text(80, 65, '←', {
      ...this.getTextStyle(52),
      backgroundColor: '#ffffff',
      padding: { top: 4, bottom: 8, left: 20, right: 20 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.saveSettings();
      this.scene.start('HomeScene');
    });
  }

  // =========================
  // BGMコントロール
  // =========================
  private createBgmControls(): void {
    this.add.text(130, 185, 'BGM音量', this.getTextStyle(32));

    // マイナスボタン
    this.createSmallButton(145, 270, '－', () => {
      this.bgmVolume = Phaser.Math.Clamp(this.bgmVolume - 0.1, 0, 1);
      this.updateDisplay();
      this.setSpeech('BGMを小さくしたよ');
    });

    // BGMテキスト
    this.bgmText = this.add.text(245, 270, '', this.getTextStyle(30))
      .setOrigin(0.5);

    // プラスボタン
    this.createSmallButton(345, 270, '＋', () => {
      this.bgmVolume = Phaser.Math.Clamp(this.bgmVolume + 0.1, 0, 1);
      this.updateDisplay();
      this.setSpeech('BGMを大きくしたよ');
    });
  }

  // =========================
  // SEコントロール
  // =========================
  private createSeControls(): void {
    this.add.text(130, 350, 'SE音量', this.getTextStyle(32));

    // マイナスボタン
    this.createSmallButton(145, 435, '－', () => {
      this.seVolume = Phaser.Math.Clamp(this.seVolume - 0.1, 0, 1);
      this.updateDisplay();
      this.setSpeech('効果音を小さくしたよ');
    });

    // SEテキスト
    this.seText = this.add.text(245, 435, '', this.getTextStyle(30))
      .setOrigin(0.5);

    // プラスボタン
    this.createSmallButton(345, 435, '＋', () => {
      this.seVolume = Phaser.Math.Clamp(this.seVolume + 0.1, 0, 1);
      this.updateDisplay();
      this.setSpeech('効果音を大きくしたよ');
    });
  }

  // =========================
  // ミュートボタン
  // =========================
  private createMuteButton(): void {
    this.muteText = this.add.text(130, 560, '', {
      ...this.getTextStyle(28),
      backgroundColor: '#ffffff',
      padding: { top: 13, bottom: 13, left: 20, right: 20 },
    })
      .setInteractive({ useHandCursor: true });

    this.muteText.on('pointerdown', () => {
      this.isMuted = !this.isMuted;
      this.updateDisplay();
      this.setSpeech(this.isMuted ? '音を消したよ' : '音を戻したよ');
    });
  }

  // =========================
  // 吹き出し（スピーチ）
  // =========================
  private createSpeechBubble(): void {
    // 吹き出し本体
    this.add.ellipse(750, 190, 380, 170, 0xffffff)
      .setStrokeStyle(3, 0x536878);

    // 吹き出しの尻尾
    this.add.triangle(665, 295, 0, 0, 90, 0, 30, 75, 0xffffff)
      .setStrokeStyle(3, 0x536878);

    // 吹き出しテキスト
    this.speechText = this.add.text(750, 190, '音量を変更できるよ', {
      ...this.getTextStyle(28),
      align: 'center',
      wordWrap: { width: 300 },
    })
      .setOrigin(0.5);
  }

  // =========================
  // 汎用ボタン（小）
  // =========================
  private createSmallButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, `[${label}]`, {
      ...this.getTextStyle(30),
      backgroundColor: '#ffffff',
      padding: { top: 10, bottom: 10, left: 14, right: 14 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerup', () => {
      onClick();
    });

    return button;
  }

  // =========================
  // 汎用ボタン（大）
  // =========================
  private createLargeButton(x: number, y: number, label: string, onClick: () => void, buttonWidth: number): void {
    const background = this.add.rectangle(0, 0, buttonWidth, 70, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(0, 0, label, this.getTextStyle(26))
      .setOrigin(0.5);

    this.add.container(x, y, [background, text]);

    background.on('pointerup', () => {
      onClick();
    });
  }

  // =========================
  // 共通テキストスタイル
  // =========================
  private getTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: { top: 8, bottom: 8, left: 6, right: 6 },
    };
  }

  // =========================
  // 表示の更新処理
  // =========================
  private updateDisplay(): void {
    this.bgmText.setText(`${Math.round(this.bgmVolume * 100)}%`);
    this.seText.setText(`${Math.round(this.seVolume * 100)}%`);
    this.muteText.setText(this.isMuted ? 'ミュート解除' : 'ミュート');
    this.sound.mute = this.isMuted;
  }

  // =========================
  // セリフの更新
  // =========================
  private setSpeech(message: string): void {
    this.speechText.setText(message);
  }

  // =========================
  // 設定の保存
  // =========================
  private saveSettings(): void {
    this.registry.set('bgmVolume', this.bgmVolume);
    this.registry.set('seVolume', this.seVolume);
    this.registry.set('isMuted', this.isMuted);
  }
}