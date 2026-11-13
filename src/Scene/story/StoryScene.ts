/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250116
 * 氏名：武田優人、中村伊安
 * ================================== */
import { transitionWithLoading } from '../../utils/ui/scene-loading';
import Phaser from 'phaser';

import backImg from '../../assets/images/background/story/1.jpg?inline';
import { getPhpBaseUrl } from '../../auth/PhpBaseUrl';
import story_data from "../../scenario_data/story_data.json"
import { createBackground } from '../../background';
import { getTextStyle } from '../../utils/ui';
//debug機能
import { showDebugSceneName } from '../../debug';
import { SCENE_KEYS } from '../sceneKeys';

//--------------------------------------------------------------

// 1つのセリフの型
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
interface Dialogue {
  name: string;
  text: string;
  bg: string;
  bgm: string;
  effect: string;
}

interface StoryStage {
  stage: number;
  title: string;
  scenario: Dialogue[];
}

interface StoryChapter {
  chapter: number;
  title: string;
  stages: StoryStage[];
}

interface StorySceneData {
  chapter: number;
  stage: number;
}


export class StoryScene extends Phaser.Scene {
  // 現在のセリフ番号
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private currentIndex: number = 0;
  // AUTO再生中か
  private isAuto: boolean = false;
  // AUTOのタイマー
  private autoTimer?: Phaser.Time.TimerEvent;

  // セリフ表示
  private nameText!: Phaser.GameObjects.Text;
  private scenarioText!: Phaser.GameObjects.Text;

  // 会話ログ
  private log: Dialogue[] = [];

  // シナリオ
  private storyData: StoryChapter[] = story_data as StoryChapter[];
  private scenario: Dialogue[] = [];
  private currentChapter = 1;
  private currentStage = 1;
  private savingStarter = false;

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() {
    super(SCENE_KEYS.STORY);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    if (!this.textures.exists('story-background')) {
      this.load.image('story-background', backImg);
    }
  }

  create(data: StorySceneData = { chapter: 1, stage: 1 }): void {
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 指定章の会話・ログ・自動送り状態を初期化する
     * ================================== */
    showDebugSceneName(this);
    this.currentChapter = data.chapter;
    this.currentStage = data.stage;
    this.savingStarter = false;
    this.currentIndex = 0;
    this.isAuto = false;
    this.autoTimer = undefined;
    this.log = [];

    const chapterData = this.storyData.find((chapter) => chapter.chapter === data.chapter);
    const stageData = chapterData?.stages.find((stage) => stage.stage === data.stage);

    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : ボタン操作に応じて画面を切り替える
     * ================================== */
    if (!stageData) {
      console.error(`シナリオが見つかりません: chapter=${data.chapter}, stage=${data.stage}`);
      transitionWithLoading(this, SCENE_KEYS.SELECT_STAGE, { areaId: data.chapter });
      return;
    }

    this.scenario = stageData.scenario;

    const width = this.scale.width;
    const height = this.scale.height;

    // 背景とカメラ設定
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 会話の背景・話者名・セリフ枠を配置する
     * ================================== */
    createBackground(this, 'story-background');
    this.cameras.main.setBackgroundColor('#cfe3f5');

    // UI固定用コンテナ
    const ui = this.add.container(0, 0);
    ui.setScrollFactor(0);
    ui.setDepth(100);

    // =========================
    // 会話ウィンドウ
    // =========================
    this.add.rectangle(width / 2, height - 140, width - 100, 190, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.8);

    // キャラクター名の背景
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 画像・文字・パネルを配置する
     * ================================== */
    this.add.rectangle(120, height - 225, 180, 45, 0x536878, 0.95);

    // キャラクター名テキスト
    this.nameText = this.add.text(120, height - 225, '', getTextStyle(22, {
      color: '#ffffff',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    })).setOrigin(0.5);

    // セリフテキスト
    this.scenarioText = this.add.text(100, height - 170, '', getTextStyle(24, {
      color: '#ffffff',
      wordWrap: { width: width - 200 },
      lineSpacing: 10,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }));

    // =========================
    // 右上メニュー
    // =========================
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : スキップ・自動送り・終了のメニューボタンを配置する
     * ================================== */
    const skipButton = this.createMenuButton(width - 300, 45, 'SKIP');
    const logButton = this.createMenuButton(width - 210, 45, 'LOG');
    const autoButton = this.createMenuButton(width - 120, 45, 'AUTO');
    const exitButton = this.createMenuButton(width - 120, 95, 'EXIT');

    // ボタン処理
    skipButton.on('pointerdown', () => this.openSkipPopup());
    logButton.on('pointerdown', () => this.openLogPopup());
    autoButton.on('pointerdown', () => this.toggleAuto());
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 会話送り・ログ表示・終了操作のイベントを接続する
     * ================================== */
    exitButton.on('pointerdown', () => this.openExitPopup());

    // =========================
    // 画面クリックで次へ
    // =========================
    const advanceOnClick = (pointer: Phaser.Input.Pointer): void => {
      // メニューボタン付近（yが120未満）をクリックした場合は無視
      if (pointer.y < 120) return;
      this.nextScenario();
    };
    this.input.on('pointerdown', advanceOnClick);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off('pointerdown', advanceOnClick));

    // 最初のセリフを表示
    this.showScenario();
  }

  // ==================================================
  // メニューボタン作成
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 会話画面のメニューボタンを作る
   * ================================== */
  private createMenuButton(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, getTextStyle(18, {
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { left: 18, right: 18, top: 10, bottom: 10 }
    }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => { /* 必要に応じて色変更などを追加 */ });
  }

  // ==================================================
  // シナリオ表示
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 現在の話者とセリフを表示し、会話ログへ追加する
   * ================================== */
  private showScenario(): void {
    const data = this.scenario[this.currentIndex];

    if (!data) {
      this.finishScenario();
      return;
    }

    this.nameText.setText(data.name);
    this.scenarioText.setText(data.text);

    // ログに追加
    this.log.push(data);
  }

  // ==================================================
  // 次のセリフ
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 次のセリフへ進み、終端なら次の画面へ移る
   * ================================== */
  private nextScenario(): void {
    if (this.currentIndex >= this.scenario.length - 1) {
      this.finishScenario();
      return;
    }

    this.currentIndex++;
    this.showScenario();
  }

  // ==================================================
  // AUTO
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 会話の自動送りを切り替える
   * ================================== */
  private toggleAuto(): void {
    this.isAuto = !this.isAuto;

    if (this.isAuto) {
      this.autoTimer = this.time.addEvent({
        delay: 2500,
        callback: () => this.nextScenario(),
        loop: true
      });
    } else {
      if (this.autoTimer) {
        this.autoTimer.remove();
        this.autoTimer = undefined;
      }
    }
  }

  // ==================================================
  // シナリオ終了
  // ==================================================
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 会話を終了して次の画面へ進む
   * ================================== */
  private async finishScenario(readToEnd = true): Promise<void> {
    if (this.savingStarter) return;
    this.isAuto = false;

    if (this.autoTimer) {
      this.autoTimer.remove();
      this.autoTimer = undefined;
    }

    if (readToEnd && this.currentChapter === 1 && this.currentStage === 1) {
      this.savingStarter = true;
      const request = new AbortController();
      const shutdown = () => request.abort();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, shutdown);
      const timeout = window.setTimeout(shutdown, 8000);
      this.scenarioText.setText('ジニアとの花契を保存中…');
      try {
        const response = await fetch(`${getPhpBaseUrl()}/flower/story-starter.php`, {
          method: 'POST',
          credentials: 'include',
          signal: request.signal,
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) {
          throw new Error(result.error ?? '花契を保存できませんでした。');
        }
      } catch {
        if (this.sys.isActive() && this.events.listeners(Phaser.Scenes.Events.SHUTDOWN).includes(shutdown)) {
          this.scenarioText.setText('花契を保存できませんでした。ログイン・通信状態を確認して、画面を押すと再試行します。');
        }
        return;
      } finally {
        window.clearTimeout(timeout);
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, shutdown);
        if (!request.signal.aborted || this.sys.isActive()) this.savingStarter = false;
      }
      if (request.signal.aborted || !this.sys.isActive()) return;
    }

    transitionWithLoading(this, SCENE_KEYS.SELECT_STAGE, { areaId: this.currentChapter });
  }

  // ==================================================
  // SKIP / EXIT 確認
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : ストーリーをスキップするか確認する
   * ================================== */
  private openSkipPopup(): void {
    this.openConfirmPopup('シナリオをスキップしますか？', () => {
      void this.finishScenario(false);
    });
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : ストーリー終了の確認を表示する
   * ================================== */
  private openExitPopup(): void {
    this.openConfirmPopup('シナリオを終了しますか？', () => {
      transitionWithLoading(this, SCENE_KEYS.HOME);
    });
  }

  // ==================================================
  // 確認ポップアップ（汎用）
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 確認ダイアログを表示する
   * ================================== */
  private openConfirmPopup(message: string, onYes: () => void): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const container = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);

    // 暗い背景
    const darkBackground = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setInteractive();

    // ポップアップ
    const popup = this.add.rectangle(width / 2, height / 2, 600, 300, 0xffffff)
      .setStrokeStyle(3, 0x536878);

    // メッセージ
    const text = this.add.text(width / 2, height / 2 - 50, message, getTextStyle(24, {
      color: '#333333',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    })).setOrigin(0.5);

    // YESボタン
    const yesButton = this.add.text(width / 2 - 100, height / 2 + 70, 'はい', getTextStyle(22, {
      color: '#ffffff',
      backgroundColor: '#536878',
      padding: { left: 40, right: 40, top: 15, bottom: 15 }
    }))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // NOボタン
    const noButton = this.add.text(width / 2 + 100, height / 2 + 70, 'いいえ', getTextStyle(22, {
      color: '#ffffff',
      backgroundColor: '#888888',
      padding: { left: 30, right: 30, top: 15, bottom: 15 }
    }))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    container.add([darkBackground, popup, text, yesButton, noButton]);

    yesButton.on('pointerdown', () => {
      container.destroy();
      onYes();
    });

    noButton.on('pointerdown', () => {
      container.destroy();
    });
  }

  // ==================================================
  // LOG ポップアップ
  // ==================================================
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 会話ログを表示する
   * ================================== */
  private openLogPopup(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const container = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);

    const darkBackground = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setInteractive();

    const popup = this.add.rectangle(width / 2, height / 2, width * 0.75, height * 0.75, 0xffffff)
      .setStrokeStyle(3, 0x536878);

    // ログテキストの生成（配列をまとめて文字列化）
    const logTextStr = this.log.map(data => `${data.name}\n${data.text}\n`).join('\n');

    const log = this.add.text(width * 0.17, height * 0.18, logTextStr, getTextStyle(18, {
      color: '#333333',
      wordWrap: { width: width * 0.65 },
      lineSpacing: 8,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }));

    const closeButton = this.add.text(width * 0.82, height * 0.15, '×', {
      fontSize: '36px',
      color: '#666666'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    container.add([darkBackground, popup, log, closeButton]);

    closeButton.on('pointerdown', () => {
      container.destroy();
    });
  }
}