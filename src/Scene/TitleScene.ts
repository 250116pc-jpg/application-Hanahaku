import Phaser from 'phaser';
import { restoreSession } from '../auth/Session';
import titleBackground from '../assets/background/background.png';
import { initializeAudio, preloadAudio, startBgm } from '../audio/BgmManager';
import { SCENE_KEYS } from './sceneKeys';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  preload(): void {
    this.load.image('title_bg', titleBackground);
    preloadAudio(this);
  }

  create(): void {
    initializeAudio(this);
    this.input.enabled = false;
    let active = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { active = false; });
    void restoreSession().then(loggedIn => {
      if (!active) return;
      if (loggedIn) this.scene.start(SCENE_KEYS.HOME);
    }).catch(() => {
      // Keep manual login available when offline or the server is unavailable.
    }).finally(() => { if (active) this.input.enabled = true; });
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.image(width / 2, height / 2, 'title_bg');
    bg.setDisplaySize(width, height);

    const btnWidth = 240;
    const btnHeight = 60;
    const btnRadius = 30;

    const btnGraphics = this.add.graphics();
    const btnText = this.add.text(0, 0, 'スタート', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const drawButton = (state: 'normal' | 'hover' | 'down') => {
      btnGraphics.clear();

      const faceColor =
        state === 'hover'
          ? 0xabdbf5
          : state === 'down'
            ? 0x7aa9d5
            : 0x8ab9e5;

      const edgeColor = 0x5c8ec4;

      let yOffset = 0;

      if (state === 'hover') {
        yOffset = -2;
      }

      if (state === 'down') {
        yOffset = 4;
      }

      btnGraphics.fillStyle(
        0x000000,
        state === 'down' ? 0.15 : 0.25
      );

      btnGraphics.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2 + 8,
        btnWidth,
        btnHeight,
        btnRadius
      );

      btnGraphics.fillStyle(edgeColor, 1);

      btnGraphics.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2 + 4,
        btnWidth,
        btnHeight,
        btnRadius
      );

      btnGraphics.fillStyle(faceColor, 1);

      btnGraphics.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2 + yOffset,
        btnWidth,
        btnHeight,
        btnRadius
      );

      btnText.setY(yOffset);
    };

    drawButton('normal');

    const startButton = this.add.container(
      width / 2,
      height / 2 + 170,
      [btnGraphics, btnText]
    );

    startButton.setSize(btnWidth, btnHeight);
    startButton.setInteractive({
      useHandCursor: true,
    });

    startButton.on('pointerover', () => {
      drawButton('hover');

      this.tweens.add({
        targets: startButton,
        scale: 1.05,
        duration: 100,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerout', () => {
      drawButton('normal');

      this.tweens.add({
        targets: startButton,
        scale: 1,
        duration: 100,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerdown', () => {
      drawButton('down');

      this.tweens.add({
        targets: startButton,
        scale: 0.95,
        duration: 50,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerup', () => {
      drawButton('normal');
      startBgm(this);

      this.tweens.add({
        targets: startButton,
        scale: 1,
        duration: 100,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.start(SCENE_KEYS.LOGIN);
        },
      });
    });

    const registerButton = this.add.text(
      width / 2,
      height / 2 + 250,
      '新規ユーザー登録',
      {
        fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#536878',
        padding: { left: 28, right: 28, top: 13, bottom: 13 },
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    registerButton.on('pointerup', () => {
      startBgm(this);
      this.scene.start(SCENE_KEYS.REGISTER);
    });
  }
}
