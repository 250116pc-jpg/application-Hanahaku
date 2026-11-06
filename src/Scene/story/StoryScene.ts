import Phaser from 'phaser';

import backImg from '../../assets/images/background/story/1.jpg';
import story_data from "../../scenario_data/story_data.json"
import { createBackground } from '../../background';
import { getTextStyle } from '../../utils/ui';
//debug機能
import { showDebugSceneName } from '../../debug';
import { SCENE_KEYS } from '../sceneKeys';

//--------------------------------------------------------------

// 1つのセリフの型
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

  constructor() {
    super(SCENE_KEYS.STORY);
  }

  preload(): void {
    this.load.image('Background', backImg);
  }

  create(data: StorySceneData = { chapter: 1, stage: 1 }): void {
    showDebugSceneName(this);
    this.currentChapter = data.chapter;
    this.currentIndex = 0;
    this.isAuto = false;
    this.autoTimer = undefined;
    this.log = [];

    const chapterData = this.storyData.find((chapter) => chapter.chapter === data.chapter);
    const stageData = chapterData?.stages.find((stage) => stage.stage === data.stage);

    if (!stageData) {
      console.error(`シナリオが見つかりません: chapter=${data.chapter}, stage=${data.stage}`);
      this.scene.start(SCENE_KEYS.SELECT_STAGE, { areaId: data.chapter });
      return;
    }

    this.scenario = stageData.scenario;

    const width = this.scale.width;
    const height = this.scale.height;

    // 背景とカメラ設定
    createBackground(this, 'Background');
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
    const skipButton = this.createMenuButton(width - 300, 45, 'SKIP');
    const logButton = this.createMenuButton(width - 210, 45, 'LOG');
    const autoButton = this.createMenuButton(width - 120, 45, 'AUTO');
    const exitButton = this.createMenuButton(width - 120, 95, 'EXIT');

    // ボタン処理
    skipButton.on('pointerdown', () => this.openSkipPopup());
    logButton.on('pointerdown', () => this.openLogPopup());
    autoButton.on('pointerdown', () => this.toggleAuto());
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
  private finishScenario(): void {
    this.isAuto = false;

    if (this.autoTimer) {
      this.autoTimer.remove();
      this.autoTimer = undefined;
    }

    // 次の画面へ
    this.scene.start(SCENE_KEYS.SELECT_STAGE, { areaId: this.currentChapter });
  }

  // ==================================================
  // SKIP / EXIT 確認
  // ==================================================
  private openSkipPopup(): void {
    this.openConfirmPopup('シナリオをスキップしますか？', () => {
      this.finishScenario();
    });
  }

  private openExitPopup(): void {
    this.openConfirmPopup('シナリオを終了しますか？', () => {
      this.scene.start(SCENE_KEYS.HOME);
    });
  }

  // ==================================================
  // 確認ポップアップ（汎用）
  // ==================================================
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