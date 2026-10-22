import { DEFAULT_AUDIO_SETTINGS } from '../audio/AudioDefaults';
import Phaser from 'phaser';
import { openSettingsPanel } from '../display/SettingsPanel';
import { logout } from '../auth/Session';
import { preloadSettingsVoice, SettingsVoice } from '../audio/SettingsVoice';

import flowerImg from '../assets/flower.png';
import {
  applyAudioSettings,
  loadAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from '../audio/BgmManager';

interface LoggedInUser {
  id: number;
  name: string;
  email: string;
}

export class SettingsScene extends Phaser.Scene {
  private readonly guideStorageKey = 'hanahakuSettingsGuideSeen';
  private guideObjects: Phaser.GameObjects.GameObject[] = [];
  private voice!: SettingsVoice;
  private returnScene = 'HomeScene';
  private resumeOnClose = false;
  private originalAudioSettings!: AudioSettings;
  private bgmVolume = DEFAULT_AUDIO_SETTINGS.bgmVolume;
  private seVolume = DEFAULT_AUDIO_SETTINGS.seVolume;
  private voiceVolume = DEFAULT_AUDIO_SETTINGS.voiceVolume;
  private bgmSliderFill!: Phaser.GameObjects.Graphics;
  private bgmSliderKnob!: Phaser.GameObjects.Arc;
  private voiceText!: Phaser.GameObjects.Text;
  private seSliderFill!: Phaser.GameObjects.Graphics;
  private seSliderKnob!: Phaser.GameObjects.Arc;
  private voiceSliderFill!: Phaser.GameObjects.Graphics;
  private voiceSliderKnob!: Phaser.GameObjects.Arc;
  private activeSliderUpdate: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  private activeSliderEnd: (() => void) | null = null;
  private sliderInputInstalled = false;
  private isMuted = DEFAULT_AUDIO_SETTINGS.isMuted;

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
    preloadSettingsVoice(this);
    this.load.image(
      'settingsCharacter',
      flowerImg
    );
  }

  create(): void {
    this.voice = new SettingsVoice(this);
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setScroll(20, 0);
    this.cameras.main.setBackgroundColor('#cfe3f5');

    const audioSettings =
      loadAudioSettings(this);
    this.originalAudioSettings = { ...audioSettings };

    this.bgmVolume =
      audioSettings.bgmVolume;

    this.seVolume =
      audioSettings.seVolume;

    this.isMuted =
      audioSettings.isMuted;
    this.voiceVolume = audioSettings.voiceVolume;

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

    this.createLoggedInUserInfo();
    let loggingOut = false;
    this.createLargeButton(1085, 305, 'ログアウト', () => {
      if (loggingOut) return;
      loggingOut = true;
      this.input.enabled = false;
      void logout().then(() => {
        // Stop paused gameplay as well, so another user cannot resume it.
        for (const scene of this.scene.manager.getScenes(false)) {
          if (scene !== this) this.scene.stop(scene.scene.key);
        }
        this.scene.start('LoginScene');
      }).catch(() => {
        this.setSpeech('ログアウトできません。接続を確認して再度お試しください。');
      }).finally(() => { loggingOut = false; this.input.enabled = true; });
    }, 240);

    this.createLargeButton(1050, 400, '画面設定・クレジット', () => openSettingsPanel(this), 300);
    this.createBackButton();
    this.createBgmControls();
    this.createSeControls();
    this.createVoiceControls();
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
        this.bgmVolume = DEFAULT_AUDIO_SETTINGS.bgmVolume;
        this.seVolume = DEFAULT_AUDIO_SETTINGS.seVolume;
        this.voiceVolume = DEFAULT_AUDIO_SETTINGS.voiceVolume;
        this.isMuted = DEFAULT_AUDIO_SETTINGS.isMuted;

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
        this.closeSettings(true);
      },
      280
    );

    this.createLargeButton(730, 65, '操作ガイド', () => this.startGuide(), 200);

    this.updateDisplay();

    this.add.text(640, 690, '音声：VOICEVOX:ずんだもん', {
      ...this.getTextStyle(16), color: '#334455'
    }).setOrigin(0.5);
    this.voice.speak('音量を変更できるよ');

    if (this.returnScene === 'HomeScene' && !this.hasSeenGuide()) {
      this.time.delayedCall(0, () => this.startGuide());
    }
  }

  private createLoggedInUserInfo(): void {
    const user = this.loadLoggedInUser();
    const panel = this.add
      .rectangle(1085, 190, 250, 130, 0xffffff, 0.94)
      .setStrokeStyle(2, 0xd8aa45);
    const label = user
      ? `ログイン中\n${user.name}\n${user.email}`
      : 'ユーザー情報\n未ログイン';
    const text = this.add
      .text(1085, 190, label, {
        ...this.getTextStyle(16),
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: 225, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    panel.setDepth(1);
    text.setDepth(2);
  }

  private loadLoggedInUser(): LoggedInUser | null {
    try {
      const value = localStorage.getItem('hanahakuCurrentUser');
      if (!value) return null;

      const user = JSON.parse(value) as Partial<LoggedInUser>;
      if (
        typeof user.id !== 'number' ||
        typeof user.name !== 'string' ||
        typeof user.email !== 'string'
      ) {
        return null;
      }

      return user as LoggedInUser;
    } catch {
      return null;
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
      { target: new Phaser.Geom.Rectangle(100, 160, 400, 165),
        message: 'ここでBGMの音量を調整できます。\nスライダーを左右に動かしてみましょう。' },
      { target: new Phaser.Geom.Rectangle(100, 328, 400, 165),
        message: 'ここではスライダーを左右に動かして、\nボタンなどの効果音を調整できます。' },
      { target: new Phaser.Geom.Rectangle(100, 490, 400, 120),
        message: 'スライダーを左右に動かして、\nずんだもんの声を調整できます。\n話している間はBGMが小さくなります。' },
      { target: new Phaser.Geom.Rectangle(118, 610, 240, 85),
        message: 'ミュートを押すと音を消せます。\nもう一度押すと元に戻ります。' },
      { target: new Phaser.Geom.Rectangle(890, 355, 320, 90),
        message: '「画面設定・クレジット」から、\n最大FPSと画質を変更できます。\n保存後、再読み込みすると反映されます。' },
      { target: new Phaser.Geom.Rectangle(890, 355, 320, 90),
        message: '同じ画面の「クレジットを見る」で、\n制作チームや使用した素材・音声の\n情報を確認できます。' },
      { target: new Phaser.Geom.Rectangle(900, 458, 300, 85),
        message: 'BGM50%、SE70%、音声100%に戻し、\nミュートも解除します。' },
      { target: new Phaser.Geom.Rectangle(955, 260, 260, 90),
        message: '「ログアウト」を押すと、\nログイン状態を解除してログイン画面へ戻ります。\n別のアカウントに切り替えるときに使います。' },
      { target: new Phaser.Geom.Rectangle(900, 578, 300, 85),
        message: '「保存して戻る」を押すと、\n変更した音量が次回も残ります。' }
    ];
    if (index >= steps.length) return;

    const { target, message } = steps[index];
    // Keep the guide beside right-hand controls rather than covering them.
    const panelOffsetX = target.x >= 850 ? -440 : 0;
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
    this.guideObjects.push(this.add.rectangle(850 + panelOffsetX, 350, 620, 240, 0xffffff, 0.98)
      .setStrokeStyle(3, 0x536878).setDepth(5002).setInteractive());
    this.guideObjects.push(this.add.text(565 + panelOffsetX, 247, `操作ガイド  ${index + 1} / ${steps.length}`,
      { ...this.getTextStyle(25), fontStyle: 'bold' }).setDepth(5003));
    this.guideObjects.push(this.add.text(565 + panelOffsetX, 295, message,
      { ...this.getTextStyle(23), wordWrap: { width: 550 } }).setDepth(5003));

    const skip = this.add.text(710 + panelOffsetX, 432, 'スキップ', {
      ...this.getTextStyle(23), backgroundColor: '#e7edf2',
      padding: { left: 22, right: 22, top: 12, bottom: 12 }
    }).setOrigin(0.5).setDepth(5004).setInteractive({ useHandCursor: true });
    skip.on('pointerup', () => this.clearGuide());
    this.guideObjects.push(skip);

    const next = this.add.text(1010 + panelOffsetX, 432, index === steps.length - 1 ? '完了' : '次へ', {
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
        this.closeSettings(false);
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

    let dragStartVolume = this.bgmVolume;
    this.createVolumeSlider(270, this.bgmVolume, value => {
      this.bgmVolume = value;
      this.updateDisplay();
    }, () => {
      this.setSpeech(this.bgmVolume < dragStartVolume ? 'BGMを小さくしたよ' : 'BGMを大きくしたよ');
    }, (fill, knob, text) => {
      this.bgmSliderFill = fill;
      this.bgmSliderKnob = knob;
      this.bgmText = text;
    }, () => {
      dragStartVolume = this.bgmVolume;
    });
  }

  private createSeControls(): void {
    this.add.text(
      130,
      350,
      'SE音量',
      this.getTextStyle(32)
    );

    let dragStartVolume = this.seVolume;
    this.createVolumeSlider(435, this.seVolume, value => {
      this.seVolume = value;
      this.updateDisplay();
    }, () => {
      this.setSpeech(this.seVolume < dragStartVolume ? '効果音を小さくしたよ' : '効果音を大きくしたよ');
    }, (fill, knob, text) => {
      this.seSliderFill = fill;
      this.seSliderKnob = knob;
      this.seText = text;
    }, () => {
      dragStartVolume = this.seVolume;
    });
  }

  private createVoiceControls(): void {
    this.add.text(130, 495, '音声音量', this.getTextStyle(28));
    this.createVolumeSlider(570, this.voiceVolume, value => {
      this.voiceVolume = value;
      this.updateDisplay();
    }, () => {
      this.speechText.setText(`音声音量を${Math.round(this.voiceVolume * 100)}%にしたよ`);
      this.voice.speak('音量を変更できるよ');
    }, (fill, knob, text) => {
      this.voiceSliderFill = fill;
      this.voiceSliderKnob = knob;
      this.voiceText = text;
    }, () => {
      this.voice.stop();
    });
  }

  private createVolumeSlider(
    y: number,
    initialValue: number,
    onChange: (value: number) => void,
    onEnd: () => void,
    setDisplay: (
      fill: Phaser.GameObjects.Graphics,
      knob: Phaser.GameObjects.Arc,
      text: Phaser.GameObjects.Text
    ) => void,
    onStart?: () => void
  ): void {
    const sliderStartX = 160;
    const sliderWidth = 200;
    const updateFromPointer = (pointer: Phaser.Input.Pointer): void => {
      const ratio = Phaser.Math.Clamp((pointer.worldX - sliderStartX) / sliderWidth, 0, 1);
      onChange(Math.round(ratio * 100) / 100);
    };
    // Soft, rounded track with a generous touch target kept separate from the artwork.
    this.add.graphics()
      .fillStyle(0xffffff, 0.65)
      .fillRoundedRect(sliderStartX - 12, y - 18, sliderWidth + 24, 36, 18)
      .fillStyle(0xd4e2dd, 1)
      .fillRoundedRect(sliderStartX, y - 5, sliderWidth, 10, 5);
    const fill = this.add.graphics().setPosition(sliderStartX, y);
    this.drawSliderFill(fill, initialValue);
    const knob = this.add.circle(
      sliderStartX + sliderWidth * initialValue, y, 12, 0xffffff
    ).setStrokeStyle(3, 0x5a9277).setDepth(fill.depth + 1);
    this.add.graphics()
      .fillStyle(0xffffff, 0.82)
      .fillRoundedRect(394, y - 20, 72, 40, 14)
      .lineStyle(1, 0xb5cfc2, 0.7)
      .strokeRoundedRect(394, y - 20, 72, 40, 14);
    const text = this.add.text(430, y, '', {
      ...this.getTextStyle(22), color: '#35644f', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(
      sliderStartX + sliderWidth / 2,
      y,
      sliderWidth + 24,
      44,
      0xffffff,
      0
    ).setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => knob.setFillStyle(0xf0faf4));
    hitArea.on('pointerout', () => knob.setFillStyle(0xffffff));
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      onStart?.();
      this.activeSliderUpdate = updateFromPointer;
      knob.setScale(1.18).setStrokeStyle(3, 0x397658);
      this.activeSliderEnd = () => {
        knob.setScale(1).setStrokeStyle(3, 0x5a9277);
        onEnd();
      };
      updateFromPointer(pointer);
    });

    if (this.sliderInputInstalled) {
      setDisplay(fill, knob, text);
      return;
    }
    this.sliderInputInstalled = true;
    const onPointerMove = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.isDown) this.activeSliderUpdate?.(pointer);
    };
    const onPointerUp = (): void => {
      const finish = this.activeSliderEnd;
      this.activeSliderUpdate = null;
      this.activeSliderEnd = null;
      finish?.();
    };
    this.input.on('pointermove', onPointerMove);
    this.input.on('pointerup', onPointerUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.activeSliderUpdate = null;
      this.activeSliderEnd = null;
      this.sliderInputInstalled = false;
      this.input.off('pointermove', onPointerMove);
      this.input.off('pointerup', onPointerUp);
    });
    setDisplay(fill, knob, text);
  }

  private drawSliderFill(fill: Phaser.GameObjects.Graphics, value: number): void {
    const width = 200 * Phaser.Math.Clamp(value, 0, 1);
    fill.clear();
    if (width > 0) {
      fill.fillStyle(0x71ac8c, 1).fillRoundedRect(0, -5, width, 10, Math.min(5, width / 2));
    }
  }
  private createMuteButton(): void {
    this.muteText =
      this.add
        .text(
          130,
          630,
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
    this.drawSliderFill(this.bgmSliderFill, this.bgmVolume);
    this.bgmSliderKnob.setX(160 + 200 * this.bgmVolume);
    this.drawSliderFill(this.seSliderFill, this.seVolume);
    this.seSliderKnob.setX(160 + 200 * this.seVolume);

    this.voiceText.setText(`${Math.round(this.voiceVolume * 100)}%`);
    this.drawSliderFill(this.voiceSliderFill, this.voiceVolume);
    this.voiceSliderKnob.setX(160 + 200 * this.voiceVolume);

    this.muteText.setText(
      this.isMuted
        ? 'ミュート解除'
        : 'ミュート'
    );

    applyAudioSettings(this, {
      bgmVolume: this.bgmVolume,
      seVolume: this.seVolume,
      voiceVolume: this.voiceVolume,
      isMuted: this.isMuted,
    });
  }

  private setSpeech(
    message: string
  ): void {
    this.speechText.setText(
      message
    );
    this.voice.speak(message);
  }

  private saveSettings(): void {
    saveAudioSettings(
      this,
      {
        bgmVolume:
          this.bgmVolume,
        seVolume:
          this.seVolume,
        voiceVolume: this.voiceVolume,
        isMuted:
          this.isMuted,
      }
    );
  }

  private closeSettings(saveChanges: boolean): void {
    this.clearGuide();
    if (saveChanges) {
      this.saveSettings();
    } else {
      this.voice.stop();
      applyAudioSettings(this, this.originalAudioSettings);
    }
    if (this.resumeOnClose) {
      this.scene.resume(this.returnScene);
      this.scene.stop();
    } else {
      this.scene.start(this.returnScene);
    }
  }
}
