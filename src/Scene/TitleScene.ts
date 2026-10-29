import Phaser from 'phaser';
import { restoreSession } from '../auth/Session';
import titleBackground from '../assets/images/background/title_background.png';
import titleLogo from '../assets/images/background/title_logo.png';
import settingsButtonImage from '../assets/ui/button1.png';
import startButtonImage from '../assets/ui/title_stertbtn.png';
import { createTextImageButton, applySmoothDisplay } from '../utils/ui';
import { initializeAudio, preloadAudio, startBgm } from '../audio/BgmManager';
import { SCENE_KEYS } from './sceneKeys';
import { preloadTitlePetals, createTitlePetals } from './title/TitlePetals';
import { createTitleLogoLight } from './title/TitleLogoLight';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  preload(): void {
    this.load.image('title_bg', titleBackground);
    this.load.image('title-logo', titleLogo);
    this.load.image('title-settings-button', settingsButtonImage);
    this.load.image('title-start-button', startButtonImage);
    preloadTitlePetals(this);
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

    // 背景の上、ロゴとボタンの後ろに花びらを描画する。
    createTitlePetals(this);

    // 太陽の逆光をイメージした光を、文字の背後に重ねる。
    createTitleLogoLight(this, width / 2, height / 3 + 80, 850);

    // ロゴは縦横比を保ったまま上部中央に表示する
    const logo = this.add.image(width / 2, height / 3+80, 'title-logo');
    logo.setScale(850 / logo.width);

    const settingsButton = createTextImageButton(this, width - 140, 75, 180, '設定', () => {
      this.scene.launch('SettingsScene', {
        returnScene: 'TitleScene',
        resumeOnClose: true,
      });
      this.scene.pause();
    }, { key: 'title-settings-button', width: 180, height: 65 });
    applySmoothDisplay(this, ['title_bg', 'title-logo', 'title-settings-button', 'title-start-button'], [settingsButton]);

    this.createStartButton(width / 2, height / 2 + 200);
  }

  private createStartButton(x: number, y: number): void {
    // ボタン全体の枠と飾りを含め、外側の透明な余白だけ除く。
    const texture = this.textures.get('title-start-button');
    if (!texture.has('start-button')) texture.add('start-button', 0, 180, 156, 1700, 448);
    const label = this.add.image(0, 0, 'title-start-button', 'start-button');
    label.setScale(320 / label.width);
    const prompt = this.add.container(x, y, [label]).setSize(label.displayWidth, label.displayHeight);
    prompt.setInteractive({ useHandCursor: true });

    const hint = this.add.text(x, y + 77, 'クリック / タップ / Enter で開始', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '14px',
      color: '#fff3dc', resolution: 2,
    }).setOrigin(.5).setShadow(0, 2, '#152238', 4);
    // 待機中は85〜100%の明るさで、ゆっくり控えめに明滅させる。
    const breathing = this.tweens.add({
      targets: label, alpha: .85, duration: 1500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    let starting = false;
    let pressed = false;
    const animateScale = (scale: number): void => {
      this.tweens.killTweensOf(prompt);
      this.tweens.add({ targets: prompt, scale, duration: 45, ease: 'Sine.easeOut' });
    };
    const start = (): void => {
      if (starting || !this.input.enabled) return;
      starting = true;
      prompt.disableInteractive();
      breathing.stop();

      label.setAlpha(1).clearTint();
      startBgm(this);
      animateScale(1);
      this.tweens.add({ targets: [prompt, hint], alpha: 0, duration: 240 });
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENE_KEYS.LOGIN);
      });
      this.cameras.main.fadeOut(280, 15, 24, 36);
    };
    prompt.on('pointerover', () => {
      if (starting) return;

      breathing.pause();
      label.setAlpha(1).setTint(0xffe7b0);
      animateScale(1.025);
    });
    prompt.on('pointerout', () => {
      if (starting) return;
      pressed = false;
      label.clearTint();
      breathing.resume();

      animateScale(1);
    });
    prompt.on('pointerdown', () => {
      if (starting) return;
      pressed = true;
      breathing.pause();
      label.setAlpha(1);
      label.setTint(0xd8c9ad);
      animateScale(.97);
    });
    prompt.on('pointerup', () => { if (pressed) start(); });
    // タイトル以外でキー入力が残らないよう、終了時に解除する。
    this.input.keyboard?.on('keydown-ENTER', start);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', start);
    });
  }

}







