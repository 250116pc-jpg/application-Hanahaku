/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { transitionWithLoading, returnWithLoading } from '../utils/ui/scene-loading';
import Phaser from 'phaser';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/AudioDefaults';
import { loadAudioSettings, saveAudioSettings, resumeAudioFromGesture, type AudioSettings } from '../audio/BgmManager';
import { preloadSettingsVoice, SettingsVoice } from '../audio/SettingsVoice';
import { loadDisplaySettings, saveDisplaySettings, type DisplaySettings } from '../display/DisplaySettings';
import { logout } from '../auth/Session';
import { applySmoothDisplay, BACK_BUTTON_POSITION } from '../utils/ui';
import background from '../assets/ui/settings_background.png';
import panel from '../assets/ui/settings_panel.png';
import button from '../assets/ui/button1.png';
import tabButton from '../assets/ui/training_tab_selected.png';

/* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
 * 処理内容 : 設定タブ・音量・画質・アカウント操作を定義する
 * ================================== */
const reactionImages = import.meta.glob('../assets/setting/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const reactionFiles = {
  bgmUp: 'BGM音量上げずんだ.png', bgmDown: 'BGM下げずんだ.png',
  seUp: 'SE上げずんだ.png', seDown: 'SE下げずんだ.png',
  voiceUp: '音声音量上げずんだ.png', voiceDown: '音声音量下げずんだ.png',
  undo: '取り消しずんだ.png', reset: '初期値ずんだ.png', mute: 'ミュートずんだ.png', unmute: 'ミュート解除ずんだ.png',
} as const;
type Tab = 'sound' | 'display' | 'guide' | 'credits' | 'account';
const TABS: Array<[Tab, string, string]> = [
  ['sound', 'サウンド', '♫'], ['display', '画面設定', '▣'], ['guide', '操作ガイド', '✥'],
  ['credits', 'クレジット', '▤'], ['account', 'アカウント', '♙'],
];
const INK = '#17243d';
const SETTINGS_CONTENT_OFFSET_Y = 30;

export class SettingsScene extends Phaser.Scene {
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private returnScene = 'HomeScene';
  private resumeOnClose = false;
  private audio!: AudioSettings;
  private audioOnOpen!: AudioSettings;
  private display!: DisplaySettings;
  private voice!: SettingsVoice;
  private layout!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;
  private tabs: Phaser.GameObjects.Image[] = [];
  private character?: Phaser.GameObjects.Image;
  private leaving = false;
  private active = false;
  private drag?: { move: (pointer: Phaser.Input.Pointer) => void; end: () => void };

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() { super('SettingsScene'); }
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 呼び出し元と表示対象を受け取る
   * ================================== */
  init(data: { returnScene?: string; resumeOnClose?: boolean } = {}): void {
    this.returnScene = data.returnScene ?? 'HomeScene';
    this.resumeOnClose = data.resumeOnClose ?? false;
  }
  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    preloadSettingsVoice(this);
    this.load.image('settings-background', background);
    this.load.image('settings-panel', panel);
    this.load.image('settings-button', button);
    this.load.image('settings-tab', tabButton);
    for (const [reaction, file] of Object.entries(reactionFiles)) {
      const url = reactionImages[`../assets/setting/${file}`];
      if (url && !this.textures.exists(`settings-${reaction}`)) this.load.image(`settings-${reaction}`, url);
    }
  }

  create(): void {
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
     * 処理内容 : タブ・パネル用の画像と描画素材を準備する
     * ================================== */
    const tabTexture = this.textures.get('settings-tab');
    if (!tabTexture.has('rect')) tabTexture.add('rect', 0, 8, 160, 1936, 460);
    // 育成画面と同じクリーム色・金縁の未選択タブ。単色の部品なので画像は増やさない。
    if (!this.textures.exists('settings-tab-cream')) {
      const texture = this.textures.createCanvas('settings-tab-cream', 215, 62);
      if (texture) {
        const context = texture.context;
        context.fillStyle = '#f7ecd4'; context.strokeStyle = '#b79553'; context.lineWidth = 1;
        context.beginPath(); context.roundRect(.5, .5, 214, 61, 6); context.fill(); context.stroke();
        texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 設定画面の操作フラグと選択タブを初期化する
     * ================================== */
    this.active = true;
    this.leaving = false;
    this.tabs = [];
    this.drag = undefined;
    this.input.enabled = true;
    this.cameras.main.setScroll(0, 0).setRoundPixels(false);
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 音声と画質の保存設定を読み込む
     * ================================== */
    this.voice = new SettingsVoice(this);
    this.audioOnOpen = loadAudioSettings(this);
    this.audio = { ...this.audioOnOpen };
    this.display = loadDisplaySettings();
    // 他の画面と同じ1280×720の座標で組み、縦横比を保って画面に収める。
    const scale = Math.min(this.scale.width / 1280, this.scale.height / 720);
    this.layout = this.add.container((this.scale.width - 1280 * scale) / 2, (this.scale.height - 720 * scale) / 2).setScale(scale);
    this.layout.add(this.add.image(640, 360, 'settings-background').setDisplaySize(1280, 720));
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
     * 処理内容 : 背景・見出し・戻るボタンを配置する
     * ================================== */
    this.layout.add(this.add.rectangle(640, 360, 1280, 720, 0x071932, .25));
    // 共通の戻るボタンは固定し、設定カード全体に上の余白を設ける。
    const content = this.add.container(0, SETTINGS_CONTENT_OFFSET_Y);
    this.layout.add(content);
    // カードの大きさは全タブ共通。パネル画像の透明な余白を含めて配置する。
    content.add(this.add.image(640, 330, 'settings-panel').setDisplaySize(1100, 610));
    this.text(content, 153, 88, '✿', 32, '#b8883e');
    this.text(content, 201, 85, '設定', 34).setFontFamily('"Yu Mincho", "MS PMincho", serif');
    const lines = this.add.graphics().lineStyle(1, 0xb1803e);
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 設定タブと本文を区切る線・表示領域を用意する
     * ================================== */
    lines.lineBetween(152, 140, 1126, 140).lineBetween(380, 170, 380, 570);
    content.add(lines);
    TABS.forEach(([tab, label, icon], index) => {
      this.tabs.push(this.artButton(content, 252, 207 + index * 75, 215, 62, `${icon}   ${label}`, () => this.renderTab(tab), 'settings-tab'));
    });
    this.body = this.add.container(0, 0);
    content.add(this.body);
    // リアクションのメッセージは、ずんだもんの頭上に中央揃えで表示する。
    this.message = this.text(content, 1030, 260, '', 16, '#536044')
      .setWordWrapWidth(190).setAlign('center').setOrigin(.5, 1).setLineSpacing(4);
    this.artButton(this.layout, BACK_BUTTON_POSITION.x, BACK_BUTTON_POSITION.y, 180, 48, '‹  もどる', () => this.closeSettings());
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
     * 処理内容 : 表示状態と操作フラグを初期化する
     * ================================== */
    const move = (pointer: Phaser.Input.Pointer): void => { if (pointer.isDown) this.drag?.move(pointer); };
    const release = (): void => { const drag = this.drag; this.drag = undefined; drag?.end(); };
    this.input.on('pointermove', move);
    this.input.on('pointerup', release);
    this.input.on('gameout', release);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.active = false;
      this.drag = undefined;
      this.character = undefined;
      this.input.off('pointermove', move);
      this.input.off('pointerup', release);
      this.input.off('gameout', release);
      this.voice.stop();
    });
    this.renderTab('sound');
    applySmoothDisplay(this, ['settings-background', 'settings-panel', 'settings-button', 'settings-tab', ...Object.keys(reactionFiles).map(key => `settings-${key}`).filter(key => this.textures.exists(key))]);
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 位置・大きさ・色を指定して文字を生成する
   * ================================== */
  private text(parent: Phaser.GameObjects.Container, x: number, y: number, label: string, size = 22, color = INK): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, label, { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: size, fontStyle: 'bold', color, resolution: 2 });
    parent.add(text);
    return text;
  }
  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : 画像ボタンと押下時の反応を作る
   * ================================== */
  private artButton(parent: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number, label: string, onClick: () => void, texture = 'settings-button'): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, texture, texture === 'settings-tab' ? 'rect' : undefined).setDisplaySize(width, height).setInteractive({ useHandCursor: true });
    parent.add(image);
    image.setData('label', this.text(parent, x, y, label, 21, '#fff5df').setOrigin(.5));
    image.on('pointerover', () => image.setAlpha(.85));
    image.on('pointerout', () => image.setAlpha(1));
    image.on('pointerup', () => { if (!this.leaving) { resumeAudioFromGesture(this); onClick(); } });
    return image;
  }
  private renderTab(tab: Tab): void {
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
     * 処理内容 : 選択した設定タブを表示する
     * ================================== */
    if (this.leaving) return;
    this.drag = undefined;
    this.character = undefined;
    this.body.removeAll(true);
    this.message.setText('');
    this.tabs.forEach((image, index) => {
      const selected = TABS[index][0] === tab;
      image.setTexture(selected ? 'settings-tab' : 'settings-tab-cream', selected ? 'rect' : undefined)
        .setDisplaySize(215, 62).clearTint();
      (image.getData('label') as Phaser.GameObjects.Text).setColor(selected ? '#fff5df' : INK);
    });
    this.text(this.body, 410, 174, TABS.find(item => item[0] === tab)![1], 29).setFontFamily('"Yu Mincho", "MS PMincho", serif');
    const line = this.add.graphics().lineStyle(1, 0xb1803e).lineBetween(410, 222, 1120, 222);
    this.body.add(line);
    if (tab === 'sound') this.renderSound();
    else if (tab === 'display') this.renderDisplay();
    else if (tab === 'guide') this.renderGuide();
    else if (tab === 'credits') this.renderCredits();
    else this.renderAccount();

  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 音量とミュート設定を表示する
   * ================================== */
  private renderSound(): void {
    this.slider('bgmVolume', 'BGM音量', 270, 'bgmUp', 'bgmDown');
    this.slider('seVolume', 'SE音量', 337, 'seUp', 'seDown');
    this.slider('voiceVolume', '音声音量', 404, 'voiceUp', 'voiceDown');
    this.text(this.body, 410, 454, 'ミュート', 23);
    const toggle = this.add.graphics();
    this.body.add(toggle);
    const draw = (): void => {
      toggle.clear().fillStyle(this.audio.isMuted ? 0x086372 : 0xb9ae99).fillRoundedRect(540, 456, 64, 30, 15)
        .lineStyle(1, 0x8a7c68).strokeRoundedRect(540, 456, 64, 30, 15)
        .fillStyle(0xfff9e8).fillCircle(this.audio.isMuted ? 589 : 555, 471, 12);
    };
    draw();
    const label = this.text(this.body, 624, 456, this.audio.isMuted ? 'ON' : 'OFF', 20);
    const hit = this.add.zone(572, 471, 90, 44).setInteractive({ useHandCursor: true });
    this.body.add(hit);
    hit.on('pointerdown', () => {
      this.audio.isMuted = !this.audio.isMuted;
      saveAudioSettings(this, this.audio);
      draw(); label.setText(this.audio.isMuted ? 'ON' : 'OFF');
      this.react(this.audio.isMuted ? 'mute' : 'unmute');
      this.speak(this.audio.isMuted ? '音を消したよ' : '音を戻したよ');
    });
    this.character = this.add.image(1030, 382, `settings-${this.audio.isMuted ? 'mute' : 'unmute'}`);
    this.body.add(this.character);
    this.react(this.audio.isMuted ? 'mute' : 'unmute');
    this.artButton(this.body, 752, 531, 230, 58, '初期値に戻す', () => {
      this.audio = { ...DEFAULT_AUDIO_SETTINGS };
      saveAudioSettings(this, this.audio);
      this.renderTab('sound'); this.react('reset'); this.speak('最初の設定に戻したよ');
    });
    this.artButton(this.body, 1000, 531, 240, 58, '変更を取り消す', () => {
      this.voice.stop();
      this.audio = { ...this.audioOnOpen };
      saveAudioSettings(this, this.audio);
      this.renderTab('sound');
      this.react('undo');
      this.speak('変更を取り消したよ');
    });
  }
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 音量スライダーと操作反応を設定する
   * ================================== */
  private slider(key: 'bgmVolume' | 'seVolume' | 'voiceVolume', name: string, y: number, up: keyof typeof reactionFiles, down: keyof typeof reactionFiles): void {
    const start = 550, width = 285;
    this.text(this.body, 410, y - 16, name, 23);
    const graphic = this.add.graphics(); this.body.add(graphic);
    const value = this.text(this.body, 908, y, '', 21).setOrigin(1, .5);
    const draw = (): void => {
      graphic.clear().fillStyle(0xe7dbbd).fillRoundedRect(start, y - 7, width, 14, 7)
        .lineStyle(1, 0xa1885b).strokeRoundedRect(start, y - 7, width, 14, 7);
      const fill = width * this.audio[key];
      if (fill > 0) graphic.fillStyle(0x065363).fillRoundedRect(start, y - 6, fill, 12, Math.min(6, fill / 2));
      graphic.fillStyle(0xfff4d7).fillCircle(start + fill, y, 14).lineStyle(2, 0xa97523).strokeCircle(start + fill, y, 14);
      value.setText(`${Math.round(this.audio[key] * 100)}%`);
    };
    draw();
    const hit = this.add.zone(start + width / 2, y, width + 30, 48).setInteractive({ useHandCursor: true });
    this.body.add(hit);
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const initial = this.audio[key];
      resumeAudioFromGesture(this);
      if (key === 'voiceVolume') this.voice.stop();
      const move = (p: Phaser.Input.Pointer): void => {
        const local = this.layout.getWorldTransformMatrix().applyInverse(p.worldX, p.worldY);
        const next = Math.round(Phaser.Math.Clamp((local.x - start) / width, 0, 1) * 100) / 100;
        if (next === this.audio[key]) return;
        this.react(next > this.audio[key] ? up : down);
        this.audio[key] = next;
        saveAudioSettings(this, this.audio); draw();
      };
      this.drag = { move, end: () => {
        const lower = this.audio[key] < initial;
        this.speak(key === 'bgmVolume' ? lower ? 'BGMを小さくしたよ' : 'BGMを大きくしたよ'
          : key === 'seVolume' ? lower ? '効果音を小さくしたよ' : '効果音を大きくしたよ' : '音量を変更できるよ');
      } };
      move(pointer);
    });
  }

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 画質とFPS設定を表示する
   * ================================== */
  private renderDisplay(): void {
    this.text(this.body, 410, 253, '最大FPS', 23);
    ([30, 60, 120] as const).forEach((fps, index) => {
      const image = this.artButton(this.body, 700 + index * 155, 274, 145, 53, `${fps} FPS`, () => {
        this.updateDisplay({ ...this.display, maxFps: fps });
      });
      if (this.display.maxFps === fps) image.setTint(0xa7eff2);
    });
    this.text(this.body, 410, 331, '画質', 23);
    (['crisp', 'smooth'] as const).forEach((quality, index) => {
      const image = this.artButton(this.body, 743 + index * 230, 351, 218, 53, quality === 'crisp' ? 'くっきり' : 'なめらか', () => {
        this.updateDisplay({ ...this.display, quality });
      });
      if (this.display.quality === quality) image.setTint(0xa7eff2);
    });
    this.text(this.body, 410, 407, '画面設定は自動で保存され、再読み込み後に反映されます。\n実際のFPSは端末やディスプレイによって異なります。', 17, '#786449').setLineSpacing(10);
    // TODO: 表示方法などの追加設定は、この画面設定タブに実装する。
  }
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 操作ガイドを表示する
   * ================================== */
  private renderGuide(): void {
    this.text(this.body, 410, 247, '設定画面の使い方', 23);
    this.text(this.body, 410, 293,
      '① 左のタブから設定項目を選びます。\n② 音量はスライダーを左右に動かして調整します。\n③ 設定は変更すると自動で保存されます。\n「変更を取り消す」で開いたときの音量とミュートに戻せます。\n\n画質と最大FPSは再読み込み後に反映されます。\n音声：VOICEVOX:ずんだもん', 18).setLineSpacing(13);
    // TODO: キー割り当て・タッチ操作などゲーム全体のガイドをここに追加する。
  }
  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 素材・音声などのクレジットを表示する
   * ================================== */
  private renderCredits(): void {
    this.text(this.body, 410, 245, 'フラワーリンク  − Flower link −', 23);
    this.text(this.body, 410, 287, [
      '制作：Aチーム（中村・武田・斎藤）',
      '音声：VOICEVOX:ずんだもん',
      'BGM：PeriTune',
      '  Frosylva / Harbor Morning / Ancient Gust / Harvest6 / Glimmering Woods',
      '効果音：OtoLogic（CC BY 4.0） / 効果音ラボ',
      '一部の立ち絵：三日月アルペジオ（忠藤いづる）',
      '画像・制作支援：ChatGPT / Gemini / AutoSprite',
      '本のアニメーション：Art by Gridwright',
      '人物録の紙素材：Robin/LCSkeleton',
      "UI art: Zanyar's Asset Store",
      'Pixel UI Fantasy Free by heyheythere — CC BY 4.0',
      'https://heyheythere.itch.io/pixel-ui-fantasy-free',
      'ゲームエンジン：Phaser',
    ].join('\n'), 16).setLineSpacing(5);
  }
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : アカウント情報とログアウト操作を表示する
   * ================================== */
  private renderAccount(): void {
    let user: { name?: unknown; email?: unknown } | null = null;
    try { user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null'); } catch { /* 未ログイン表示 */ }
    this.text(this.body, 410, 250, 'ログイン中のアカウント', 19, '#8d6c37');
    this.text(this.body, 410, 296, typeof user?.name === 'string' ? user.name : '未ログイン', 26).setWordWrapWidth(630);
    this.text(this.body, 410, 348, typeof user?.email === 'string' ? user.email : '', 17).setWordWrapWidth(630);
    this.text(this.body, 410, 406, 'ログアウトするとログイン画面に戻ります。', 18);
    this.artButton(this.body, 996, 492, 240, 58, 'ログアウト', () => { void this.logoutUser(); });
  }
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 操作に応じた案内画像へ切り替える
   * ================================== */
  private react(reaction: keyof typeof reactionFiles): void {
    if (!this.character || !this.textures.exists(`settings-${reaction}`)) return;
    this.character.setTexture(`settings-${reaction}`);
    this.character.setScale(Math.min(180 / this.character.width, 270 / this.character.height));
  }
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 案内文と音声を再生する
   * ================================== */
  private speak(message: string): void { this.message.setText(message); this.voice.speak(message); }
  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : 設定を反映して元の画面へ戻る
   * ================================== */
  private updateDisplay(next: DisplaySettings): void {
    if (!saveDisplaySettings(next)) {
      this.message.setText('画面設定を保存できません。ブラウザの保存設定を確認してください。'); return;
    }
    this.display = next;
    this.renderTab('display');
  }

  private closeSettings(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.voice.stop();
    if (this.resumeOnClose) returnWithLoading(this, this.returnScene);
    else transitionWithLoading(this, this.returnScene);
  }
  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : ログアウトして認証状態を解除する
   * ================================== */
  private async logoutUser(): Promise<void> {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    this.message.setText('ログアウトしています…');
    try {
      await logout();
      if (!this.active) return;
      this.voice.stop();
      for (const scene of this.scene.manager.getScenes(false)) if (scene !== this) this.scene.stop(scene.scene.key);
      transitionWithLoading(this, 'LoginScene');
    } catch {
      if (!this.active) return;
      this.leaving = false;
      this.input.enabled = true;
      this.message.setText('ログアウトできません。接続を確認して再度お試しください。');
    }
  }
}


