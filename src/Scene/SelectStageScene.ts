import Phaser from 'phaser';

import testData from './test_data';
import { specialText, wait } from '../functions';
import { createBackground } from '../background';
import backgroundImg from '../assets/background/2.png';
import bookImg from '../assets/images/stageIcons/717_1.png';
import swordImg from '../assets/images/stageIcons/701_1.png';

import {
  loadCharacterAnimation,
  createCharacterAnimation,
  createCharacterSprite,
  changeCharacterAnimation
} from '../animation/animation';
import { characterAnimations } from '../animation/animationData';
import { getTextStyle } from '../utils/ui';

interface SelectStageSceneData {
  areaId?: number;
  areaName?: string;
}

export class SelectStageScene extends Phaser.Scene {
  private stagePositions = [
      { id: 1, x: 150, y: 200, type: "story" },
      { id: 2, x: 230, y: 460, type: "battle" },
      { id: 3, x: 600, y: 260, type: "story" },
      { id: 4, x: 740, y: 530, type: "battle" },
      { id: 5, x: 1060, y: 520, type: "story" }
    ];
  // プレイヤー
  private player!: Phaser.GameObjects.Sprite;
  private currentChapter = 1;
  private isMoving = false;
  private isStageInfoOpen = false;

  constructor() {
    super('SelectStageScene');
  }

  // ========================================
  // preload
  // ========================================
  preload(): void {
    // 背景
    this.load.image('background', backgroundImg);
    // アイコン
    this.load.image('book', bookImg);
    this.load.image('sword', swordImg);

    // Playerのアニメーションデータ
    const playerData = characterAnimations.player;

    // 画像読み込み
    loadCharacterAnimation(this, 'player_run', playerData.run);
    loadCharacterAnimation(this, 'player_idle', playerData.idle);
  }

  // ========================================
  // create
  // ========================================
  create(data: SelectStageSceneData = {}): void {
    this.currentChapter = data.areaId ?? 1;

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
      if (position.type === 'story') {
        this.add.image(position.x, position.y-10, 'book').setScale(3).setDepth(1);
      }else if (position.type === 'battle') {
        this.add.image(position.x, position.y-10, 'sword').setScale(3).setDepth(1);
      }
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
    this.player = createCharacterSprite(this, this.stagePositions[this.currentStageIndex].x, this.stagePositions[this.currentStageIndex].y-50, 'player_idle', 'player-idle');
    this.player.setScale(1).setDepth(2);
  }

  // ========================================
  // 戻るボタン
  // ========================================
  private createBackButton(): void {
    const x = 110;
    const y = 80;
    const width = 130;
    const height = 48;
    const radius = 10;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    const COLOR_NORMAL = 0xffffff;
    const COLOR_HOVER  = 0xeaf4fb;
    const COLOR_DOWN   = 0xd5e8f5;
    const COLOR_BORDER = 0x536878;

    const drawButton = (faceColor: number, isPressed: boolean = false) => {
      bg.clear();
      const offset = isPressed ? 2 : 0;

      bg.fillStyle(0x000000, 0.15);
      bg.fillRoundedRect(-width / 2, -height / 2 + 4, width, height, radius);

      bg.fillStyle(faceColor, 1);
      bg.fillRoundedRect(-width / 2, -height / 2 + offset, width, height, radius);

      bg.lineStyle(2, COLOR_BORDER, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2 + offset, width, height, radius);
    };

    drawButton(COLOR_NORMAL);

    const text = this.add.text(0, 0, '← 戻る', {
      ...getTextStyle(20), // チームのメソッドを使用してエラーを回避
      color: '#536878',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      drawButton(COLOR_HOVER);
      this.tweens.add({
        targets: container,
        scale: 1.02, // 拡大率を抑えめに
        duration: 50, // 速度を速く
        ease: 'Power1'
      });
    });

    container.on('pointerout', () => {
      drawButton(COLOR_NORMAL);
      text.setY(0);
      this.tweens.add({
        targets: container,
        scale: 1.0,
        duration: 50, // 速度を速く
        ease: 'Power1'
      });
    });

    container.on('pointerdown', () => {
      drawButton(COLOR_DOWN, true);
      text.setY(2);
    });

    container.on('pointerup', () => {
      drawButton(COLOR_HOVER);
      text.setY(0);
      this.scene.start('AreaSelectScene');
    });
  }

  // ========================================
  // ステージ情報 (文字＆ポップアップ拡大版)
  // ========================================
  private openStageInfo(
    scene: Phaser.Scene,
    stageLabel: string | typeof testData.stages[number]
  ): void {
    if (this.isStageInfoOpen) return;

    const width = this.scale.width;
    const height = this.scale.height;

    const darkBackground = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(2999)
      .setInteractive();

    scene.tweens.add({
      targets: darkBackground,
      fillAlpha: 0.55,
      duration: 100 
    });

    const container = scene.add.container(width / 2, height / 2).setDepth(3000);

    const stage = typeof stageLabel === 'string'
      ? testData.stages.find(stage => stage.name === stageLabel)
      : stageLabel;
      
    if (!stage) {
      console.error(`ステージが見つかりません: ${stageLabel}`);
      darkBackground.destroy();
      return;
    }

    this.isStageInfoOpen = true;

    // 全体的に大きく（580x420 → 640x500）
    const popupW = Math.min(width * 0.8, 640);
    const popupH = Math.min(height * 0.8, 500);

    const dialogGfx = scene.add.graphics();
    
    dialogGfx.fillStyle(0x000000, 0.25);
    dialogGfx.fillRoundedRect(-popupW / 2 + 4, -popupH / 2 + 6, popupW, popupH, 16);
    
    dialogGfx.fillStyle(0xffffff, 1);
    dialogGfx.fillRoundedRect(-popupW / 2, -popupH / 2, popupW, popupH, 16);
    dialogGfx.lineStyle(3, 0x536878, 1);
    dialogGfx.strokeRoundedRect(-popupW / 2, -popupH / 2, popupW, popupH, 16);

    // ヘッダー帯も少し太く (54 → 60)
    dialogGfx.fillStyle(0x536878, 1);
    dialogGfx.fillRoundedRect(-popupW / 2, -popupH / 2, popupW, 60, { tl: 16, tr: 16, bl: 0, br: 0 });

    // タイトル文字大きく (24 → 28)
    const titleText = scene.add.text(0, -popupH / 2 + 30, stage.name, {
      ...getTextStyle(28),
      color: '#ffffff',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }).setOrigin(0.5);

    // ✕ボタン大きく (22 → 26)
    const closeButton = scene.add.text(popupW / 2 - 30, -popupH / 2 + 30, '✕', {
      ...getTextStyle(26),
      color: '#ffffff',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeButton.on('pointerover', () => closeButton.setColor('#ffaaaa'));
    closeButton.on('pointerout', () => closeButton.setColor('#ffffff'));

    // カードの高さ拡大 (160 → 210)
    const enemyCardGfx = scene.add.graphics();
    const cardW = popupW - 60;
    const cardH = 210;
    const cardY = -10;

    enemyCardGfx.fillStyle(0xf4f7f9, 1);
    enemyCardGfx.fillRoundedRect(-cardW / 2, cardY - cardH / 2, cardW, cardH, 10);
    enemyCardGfx.lineStyle(1, 0xd0d7de, 1);
    enemyCardGfx.strokeRoundedRect(-cardW / 2, cardY - cardH / 2, cardW, cardH, 10);

    const enemyLines = stage.enemies.map(e => `・ 敵ID: ${e.id} 数量: ${e.num}体 Lv.${e.level}`).join('\n');
    const bossLine = `・ [BOSS] 敵ID: ${stage.boss.id} 数量: ${stage.boss.num}体 Lv.${stage.boss.level}`;

    // サブタイトル大きく (18 → 22)
    const enemyTitle = scene.add.text(-cardW / 2 + 20, cardY - cardH / 2 + 20, '⚔️ エリアの敵情報', {
      ...getTextStyle(22),
      color: '#333333',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    // 敵情報の文字大きく、行間も広げる (16 → 20)
    const enemyDetails = scene.add.text(-cardW / 2 + 20, cardY - cardH / 2 + 60, `${enemyLines}\n${bossLine}`, {
      ...getTextStyle(20),
      color: '#444444',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    enemyDetails.setLineSpacing(12);

    // 注意書き大きく (15 → 18)
    const warningText = scene.add.text(0, popupH / 2 - 120, '※ 編成を変更してから出撃できます。', {
      ...getTextStyle(18),
      color: '#777777',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }).setOrigin(0.5);

    const closePopup = (onComplete?: () => void) => {
      scene.tweens.add({
        targets: darkBackground,
        alpha: 0,
        duration: 100 
      });
      scene.tweens.add({
        targets: container,
        scale: 0.9,
        alpha: 0,
        duration: 100, 
        ease: 'Power2',
        onComplete: () => {
          darkBackground.destroy();
          container.destroy();
          this.isStageInfoOpen = false;
          if (onComplete) onComplete();
        }
      });
    };

    const createDialogButton = (
      x: number, y: number, btnW: number, btnH: number, text: string,
      bgColor: number, hoverColor: number, onClick: () => void
    ) => {
      const btnContainer = scene.add.container(x, y);
      const bg = scene.add.graphics();

      const drawBtn = (c: number) => {
        bg.clear();
        bg.fillStyle(0x000000, 0.15);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2 + 3, btnW, btnH, 10);
        bg.fillStyle(c, 1);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      };
      drawBtn(bgColor);

      // ボタンの文字も大きく (20 → 22)
      const label = scene.add.text(0, 0, text, {
        ...getTextStyle(22),
        color: '#ffffff',
        fontStyle: 'bold',
        padding: { top: 0, bottom: 0, left: 0, right: 0 }
      }).setOrigin(0.5);

      btnContainer.add([bg, label]);
      btnContainer.setSize(btnW, btnH);
      btnContainer.setInteractive({ useHandCursor: true });

      btnContainer.on('pointerover', () => {
        drawBtn(hoverColor);
        scene.tweens.add({ targets: btnContainer, scale: 1.02, duration: 50 }); 
      });
      btnContainer.on('pointerout', () => {
        drawBtn(bgColor);
        scene.tweens.add({ targets: btnContainer, scale: 1.0, duration: 50 }); 
      });
      btnContainer.on('pointerdown', () => btnContainer.setScale(0.98)); 
      btnContainer.on('pointerup', () => {
        btnContainer.setScale(1.0);
        onClick();
      });

      return btnContainer;
    };

    // ボタンのサイズも少し大きく (150x48 → 160x56)
    const formationBtn = createDialogButton(-120, popupH / 2 - 55, 160, 56, '編成', 0x536878, 0x6d8396, () => {
      closePopup(() => scene.scene.start('FormScene'));
    });

    const startBtn = createDialogButton(120, popupH / 2 - 55, 160, 56, '出撃', 0x4c8c5a, 0x60ab72, () => {
      closePopup(() => {
        console.log(`ステージID: ${stage.id} で StageScene に遷移`);
        const stageIndex = testData.stages.findIndex(item => item.id === stage.id);
        const stageType = this.stagePositions[stageIndex]?.type;
        if(stageType === 'battle') {
          scene.scene.start('StageScene', { stageId: stage.id });
        } else if(stageType === 'story') {
          scene.scene.start('StoryScene', {
            chapter: this.currentChapter,
            stage: stage.id
          });
        }
      });
    });

    closeButton.on('pointerup', () => closePopup());
    darkBackground.on('pointerdown', () => closePopup());

    container.add([
      dialogGfx, titleText, closeButton, enemyCardGfx, enemyTitle,
      enemyDetails, warningText, formationBtn, startBtn
    ]);

    container.setScale(0.85);
    container.setAlpha(0);
    scene.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 150, 
      ease: 'Back.out'
    });
  }

  // ========================================
  // ステージボタン
  // ========================================
  private currentStageIndex: number = 0;
  private createActionCircle(x: number, y: number, diameter: number, label: string): void {
    const circle = this.add.ellipse(x, y, diameter, diameter / 1.8, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setInteractive({ useHandCursor: true });

    // ステージ名
    specialText(this, x, y + 50, 26, 4, label, '#ffffff', '#01070b');
    
    // マウスアクション
    circle.on('pointerover', () => circle.setFillStyle(0xeeeeee));
      circle.on('pointerout', () => circle.setFillStyle(0xffffff));
      let targetIndex = this.stagePositions.findIndex(pos => pos.x === x && pos.y === y) ;
    circle.on('pointerup', () => {
      if (this.isMoving || this.isStageInfoOpen) return;
      this.movePlayerToStage(this.currentStageIndex, targetIndex);
    });
  }

  // ========================================
  // ステージ間の線
  // ========================================
  private createLine(x1: number, y1: number, x2: number, y2: number, width: number, color: number): void {
    const line = this.add.line(0, 0, x1, y1 + 5, x2, y2 + 5, color).setOrigin(0, 0);
    line.setLineWidth(width);
  }

  // ========================================
  // プレイヤー移動
  // ========================================
 private movePlayerToStage(nowIndex: number, targetIndex: number, continuing = false): void {
  console.log(`現在地: ${nowIndex}, 目的地: ${targetIndex}`);
  // 範囲チェック
  if (
    targetIndex < 0 ||
    targetIndex >= this.stagePositions.length
  ) {
    console.error(`無効なステージインデックス: ${targetIndex}`);
    return;
  }

  // 現在地と目的地が同じ
  if (nowIndex === targetIndex) {
    this.openStageInfo(
      this,
      testData.stages[targetIndex]
    );
    return;
  }

  if (this.isMoving && !continuing) return;
  this.isMoving = true;

  // 移動方向
  const direction = nowIndex < targetIndex ? 1 : -1;

  // 現在地の次のステージ
  const nextIndex = nowIndex + direction;

  const targetStage = this.stagePositions[nextIndex];

  // 走る
  changeCharacterAnimation(this.player, 'run');

  // 1ステージ分移動
  this.tweens.add({
    targets: this.player,

    x: targetStage.x,
    y: targetStage.y - 50,

    duration: 1200,
    ease: 'Power1',

    onComplete: () => {

      // 目的地に到着したか
      if (nextIndex === targetIndex) {
        this.currentStageIndex = targetIndex;
        changeCharacterAnimation(this.player, 'idle');

        wait(this, 500).then(() => {
          this.openStageInfo(
            this,
            testData.stages[targetIndex]
          );
          this.isMoving = false;
        });

        return;
      }

      // まだ目的地じゃない
      // 現在地を nextIndex に更新してもう一度移動
      this.currentStageIndex = nextIndex;
      this.movePlayerToStage(
        nextIndex,
        targetIndex,
        true
      );
    }
  });
}
}