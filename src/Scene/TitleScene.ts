import Phaser from 'phaser';
import { restoreSession } from '../auth/Session';
import titleBackground from '../assets/background/title_background.png';
import titleLogo from '../assets/background/title_logo.png';
import settingsButtonImage from '../assets/ui/button1.png';
import startButtonImage from '../assets/ui/title_stertbtn.png';
import { createTextImageButton } from '../utils/ui/buttons';
import { initializeAudio, preloadAudio, startBgm } from '../audio/BgmManager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload(): void {
    this.load.image('title_bg', titleBackground);
    this.load.image('title-logo', titleLogo);
    this.load.image('title-settings-button', settingsButtonImage);
    this.load.image('title-start-button', startButtonImage);
    preloadAudio(this);
  }

  create(): void {
    initializeAudio(this);
    this.input.enabled = false;
    let active = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { active = false; });
    void restoreSession().then(loggedIn => {
      if (!active) return;
      if (loggedIn) this.scene.start('HomeScene');
    }).catch(() => {
      // Keep manual login available when offline or the server is unavailable.
    }).finally(() => { if (active) this.input.enabled = true; });
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.image(width / 2, height / 2, 'title_bg');
    bg.setDisplaySize(width, height);

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
    this.applyDisplayQuality(settingsButton);

    const buttonImage = this.add.image(0, 0, 'title-start-button');
    const buttonScale = 360 / buttonImage.width;
    buttonImage.setScale(buttonScale);

    const startButton = this.add.container(
      width / 2,
      height / 2 + 200,
      [buttonImage]
    );
    startButton.setSize(buttonImage.displayWidth, buttonImage.displayHeight);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      buttonImage.clearTint();

      this.tweens.add({
        targets: startButton,
        scale: 1.02,
        duration: 20,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerout', () => {
      buttonImage.clearTint();

      this.tweens.add({
        targets: startButton,
        scale: 1,
        duration: 20,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerdown', () => {
      buttonImage.setTint(0xcccccc);

      this.tweens.add({
        targets: startButton,
        scale: 0.98,
        duration: 20,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerup', () => {
      buttonImage.clearTint();
      startBgm(this);

      this.tweens.add({
        targets: startButton,
        scale: 1,
        duration: 70,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.start('LoginScene');
        },
      });
    });

  }

  /** タイトルの画像・文字・画面拡大を滑らかにする設定。 */
  private applyDisplayQuality(settingsButton: Phaser.GameObjects.Container): void {
    const filter = Phaser.Textures.FilterMode.LINEAR;
    const imageKeys = ['title_bg', 'title-logo', 'title-settings-button', 'title-start-button'];
    imageKeys.forEach(key => this.textures.get(key).setFilter(filter));

    const textResolution = Math.max(2, window.devicePixelRatio || 1);
    settingsButton.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Text) {
        child.setResolution(textResolution);
        child.texture.setFilter(filter);
      }
    });

    // Canvasは他シーンと共用するため、タイトル終了時に元の設定へ戻す。
    const canvas = this.game.canvas;
    const previousImageRendering = canvas.style.imageRendering;
    canvas.style.imageRendering = 'auto';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      canvas.style.imageRendering = previousImageRendering;
    });
  }
}
