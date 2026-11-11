/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { transitionWithLoading, openSceneWithLoading, trackSceneLoading } from '../utils/ui/scene-loading';
import Phaser from 'phaser';
import { restoreSession } from '../auth/Session';
import { shouldSkipLogin } from '../debug';
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
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    this.load.image('title_bg', titleBackground);
    this.load.image('title-logo', titleLogo);
    this.load.image('title-settings-button', settingsButtonImage);
    this.load.image('title-start-button', startButtonImage);
    preloadTitlePetals(this);
    preloadAudio(this);
  }

  create(): void {
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : ログイン状態を復元し、開始先と音声を準備する
     * ================================== */
    initializeAudio(this);
    if (shouldSkipLogin()) {
      this.input.enabled = true;
    } else {
      this.input.enabled = false;
      let active = true;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { active = false; });
      trackSceneLoading(this, restoreSession().then(loggedIn => {
        if (!active) return;
        if (loggedIn) transitionWithLoading(this, SCENE_KEYS.HOME);
      }).catch(() => {
        // Keep manual login available when offline or the server is unavailable.
      }).finally(() => { if (active) this.input.enabled = true; }));
    }
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 画面サイズに合わせて背景を配置する
     * ================================== */
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.image(width / 2, height / 2, 'title_bg');
    bg.setDisplaySize(width, height);

    // 背景の上、ロゴとボタンの後ろに花びらを描画する。
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 花びらとロゴの光演出を表示する
     * ================================== */
    createTitlePetals(this);

    // 太陽の逆光をイメージした光を、文字の背後に重ねる。
    createTitleLogoLight(this, width / 2, height / 3 + 80, 850);

    // ロゴは縦横比を保ったまま上部中央に表示する
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : ロゴ画像を配置する
     * ================================== */
    const logo = this.add.image(width / 2, height / 3+80, 'title-logo');
    logo.setScale(850 / logo.width);

    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
     * 処理内容 : 設定・スタートボタンと表示品質を設定する
     * ================================== */
    const settingsButton = createTextImageButton(this, width - 140, 75, 180, '設定', () => {
      openSceneWithLoading(this, 'SettingsScene', {
        returnScene: 'TitleScene',
        resumeOnClose: true,
      });
    }, { key: 'title-settings-button', width: 180, height: 65 });
    applySmoothDisplay(this, ['title_bg', 'title-logo', 'title-settings-button', 'title-start-button'], [settingsButton]);

    this.createStartButton(width / 2, height / 2 + 200);
  }

  private createStartButton(x: number, y: number): void {
    // ボタン全体の枠と飾りを含め、外側の透明な余白だけ除く。
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : スタートボタンの見た目と操作を設定する
     * ================================== */
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
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
     * 処理内容 : ログイン状態を確認して画面の開始先を決める
     * ================================== */
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
      transitionWithLoading(this, shouldSkipLogin() ? SCENE_KEYS.HOME : SCENE_KEYS.LOGIN);
    };
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : ボタンのホバー・押下・キー操作を設定する
     * ================================== */
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







