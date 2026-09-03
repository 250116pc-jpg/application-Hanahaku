import Phaser from 'phaser';

import testData from './test_data';
import { specialText, wait } from '../functions';
import { createBackground } from '../background';
import backgroundImg from '../assets/background/2.png';

import {
  loadCharacterAnimation,
  createCharacterAnimation,
  createCharacterSprite,
  changeCharacterAnimation
} from '../animation/animation';
import { characterAnimations } from '../animation/animationData';

export class SelectStageScene extends Phaser.Scene {
  private stagePositions = [
      { x: 150, y: 200, type: "story"},
      { x: 230, y: 460, type: "battle" },
      { x: 600, y: 260, type: "story" },
      { x: 740, y: 530, type: "battle" },
      { x: 1060, y: 520, type: "story" }
    ];
  // プレイヤー
  private player!: Phaser.GameObjects.Sprite;

  constructor() {
    super('SelectStageScene');
  }

  // ========================================
  // preload
  // ========================================
  preload(): void {
    // 背景
    this.load.image('background', backgroundImg);

    // Playerのアニメーションデータ
    const playerData = characterAnimations.player;

    // 画像読み込み
    loadCharacterAnimation(this, 'player_run', playerData.run);
    loadCharacterAnimation(this, 'player_idle', playerData.idle);
  }

  // ========================================
  // create
  // ========================================
  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;



    // ----------------------------------------
    // 背景
    // ----------------------------------------
    createBackground(this, 'background');

    // ----------------------------------------
    // タイトル
    // ----------------------------------------
    specialText(this, width / 2, height / 2 - 300, 55, 4, 'ステージ選択画面', '#000000', '#70f5cf');

    // ----------------------------------------
    // 戻るボタン
    // ----------------------------------------
    this.createBackButton();

    // ----------------------------------------
    // ステージ配置座標
    // ----------------------------------------
    

    // ----------------------------------------
    // ステージ作成
    // ----------------------------------------
    this.stagePositions.forEach((position, index) => {
      const stage = testData.stages[index];
      const nextStage = testData.stages[index + 1];

      if (!stage) return;

      // 次のステージがある場合だけ線を描画
      if (nextStage) {
        const nextPosition = this.stagePositions[index + 1];

        // 外側の黒い線
        this.createLine(nextPosition.x, nextPosition.y, position.x, position.y, 25, 0x000000);
        // 内側の白い線
        this.createLine(nextPosition.x, nextPosition.y, position.x, position.y, 20, 0xdddddd);
      }

      // ステージボタン
      this.createActionCircle(position.x, position.y, 100, stage.name);
    });

    // ----------------------------------------
    // Playerアニメーション作成
    // ----------------------------------------
    const playerData = characterAnimations.player;

    // Run
    createCharacterAnimation(this, 'player-run', 'player_run', playerData.run.frameCount, playerData.run.frameRate);
    // Idle
    createCharacterAnimation(this, 'player-idle', 'player_idle', playerData.idle.frameCount, playerData.idle.frameRate);

    // ----------------------------------------
    // Player作成
    // ----------------------------------------
    this.player = createCharacterSprite(this, this.stagePositions[0].x, this.stagePositions[0].y-50, 'player_idle', 'player-idle');
    this.player.setScale(1);
  }

  // ========================================
  // 戻るボタン
  // ========================================
  private createBackButton(): void {
    const button = this.add.text(100, 80, '← 戻る', {
      ...this.getTextStyle(25),
      backgroundColor: '#ffffff',
      padding: { top: 12, bottom: 12, left: 20, right: 20 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#eeeeee'));
    button.on('pointerout', () => button.setBackgroundColor('#ffffff'));
    button.on('pointerup', () => this.scene.start('HomeScene'));
  }

  // ========================================
  // ステージ情報
  // ========================================
  private openStageInfo(scene: Phaser.Scene, stageLabel: string): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // コンテナ
    const container = scene.add.container(0, 0).setDepth(3000);

    // 背景を暗くする
    const darkBackground = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setScrollFactor(0)
      .setInteractive();

    // ポップアップ
    const popupWidth = width * 0.7;
    const popupHeight = height * 0.7;
    const popup = scene.add.rectangle(width / 2, height / 2, popupWidth, popupHeight, 0xffffff)
      .setStrokeStyle(3, 0x536878)
      .setScrollFactor(0);

    // ステージデータ取得
    const stage = testData.stages.find(stage => stage.name === stageLabel);
    if (!stage) {
      console.error(`ステージが見つかりません: ${stageLabel}`);
      return;
    }

    // ステージ名
    const title = specialText(scene, width / 2, height / 2 - 200, 28, 4, stage.name, '#000000', '#536878');
    title.setScrollFactor(0);

    // 敵情報
    const enemyText = stage.enemies
      .map(enemy => `敵ID: ${enemy.id} ${enemy.num}体 Lv.${enemy.level}`)
      .join('\n');
    const bossText = `ボス\n敵ID: ${stage.boss.id} ${stage.boss.num}体 Lv.${stage.boss.level}`;

    const stageInfo = specialText(scene, width / 2, height / 2 - 70, 20, 3, `敵情報\n${enemyText}\n\n${bossText}`, '#fff8f8', '#0d0d0d');
    stageInfo.setScrollFactor(0);

    // 警告
    const warning = scene.add.text(width / 2, height / 2 + 80, '編成を変更してから出撃できます。', {
      ...this.getTextStyle(18),
      color: '#888888'
    })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // 閉じるボタン
    const closeButton = scene.add.text(width / 2 + 250, height / 2 - 190, '×', {
      ...this.getTextStyle(32),
      color: '#888888'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    // 編成ボタン
    const formationButton = scene.add.text(width / 2 - 150, height / 2 + 150, '編成', {
      ...this.getTextStyle(22),
      color: '#ffffff',
      backgroundColor: '#536878',
      padding: { left: 35, right: 35, top: 15, bottom: 15 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    // 出撃ボタン
    const startButton = scene.add.text(width / 2 + 150, height / 2 + 150, '出撃', {
      ...this.getTextStyle(22),
      color: '#ffffff',
      backgroundColor: '#4c8c5a',
      padding: { left: 35, right: 35, top: 15, bottom: 15 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    // コンテナに追加
    container.add([
      darkBackground,
      popup,
      title,
      stageInfo,
      warning,
      formationButton,
      startButton,
      closeButton
    ]);

    // 編成画面へ
    formationButton.on('pointerdown', () => {
      container.destroy();
      scene.scene.start('FormScene');
    });

    // ステージ画面へ
    startButton.on('pointerdown', () => {
      container.destroy();
      scene.scene.start('StageScene', { stageId: stage.id });
    });

    // 閉じる
    closeButton.on('pointerdown', () => {
      container.destroy();
    });
  }

  // ========================================
  // ステージボタン
  // ========================================
  private createActionCircle(x: number, y: number, diameter: number, label: string): void {
    const circle = this.add.ellipse(x, y, diameter, diameter / 1.8, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setInteractive({ useHandCursor: true });

    // ステージ名
    specialText(this, x, y + 50, 26, 4, label, '#ffffff', '#01070b');

    // マウスアクション
    circle.on('pointerover', () => circle.setFillStyle(0xeeeeee));
    circle.on('pointerout', () => circle.setFillStyle(0xffffff));
    circle.on('pointerup', () => this.movePlayerToStage(this.stagePositions.findIndex(pos => pos.x === x && pos.y === y)));
  }

  // ========================================
  // 文字スタイル
  // ========================================
  private getTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: { top: 7, bottom: 7, left: 6, right: 6 }
    };
  }

  // ========================================
  // ステージ間の線
  // ========================================
  private createLine(x1: number, y1: number, x2: number, y2: number, width: number, color: number): void {
    const line = this.add.line(0, 0, x1, y1 + 5, x2, y2 + 5, color).setOrigin(0, 0);
    line.setLineWidth(width);
  }
  private movePlayerToStage(stageIndex: number): void {
    if (stageIndex < 0 || stageIndex >= this.stagePositions.length) {
      console.error(`無効なステージインデックス: ${stageIndex}`);
      return;
    }else {
      const targetPosition = this.stagePositions[stageIndex];
      changeCharacterAnimation(this.player, 'run');
      this.tweens.add({
        targets: this.player,
        x: targetPosition.x,
        y: targetPosition.y - 50,
        duration: 1200,
        ease: 'Power1',
        onComplete: () => {
          changeCharacterAnimation(this.player, 'idle');
          wait(this, 500).then(() => {
            this.openStageInfo(this,testData.stages[stageIndex].name);
          });
        }
      });
    }
  }
}