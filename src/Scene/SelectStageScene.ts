import Phaser from 'phaser';

import testData from './test_data';
import { AREA_STAGE_LAYOUTS, type StagePosition } from './stageSelectData';
type StageData = typeof testData.stages[number];
import { specialText, wait } from '../functions';
import { createBackground } from '../background';
import backgroundImg from '../assets/ui/stageslect_back.png';
import stageIcons from '../assets/ui/stageslect_icon.png';

import {
  loadCharacterAnimation,
  createCharacterAnimation,
  createCharacterSprite
} from '../animation/animation';
import { characterAnimations } from '../animation/animationData';
import { getTextStyle, preloadBackButton, createBackButton, applySmoothDisplay, smoothText } from '../utils/ui';

//debug機能
import { SCENE_KEYS } from './sceneKeys';

//--------------------------------------------------------------

interface SelectStageSceneData {
  areaId?: number;
  areaName?: string;
}

export class SelectStageScene extends Phaser.Scene {
  private readonly stageRouteOffsetY = 40;
  private stagePositions: StagePosition[] = [];
  private stages: StageData[] = [];
  // プレイヤー
  private player!: Phaser.GameObjects.Sprite;
  private currentChapter = 1;
  private isMoving = false;
  private isStageInfoOpen = false;

  constructor() {
    super(SCENE_KEYS.SELECT_STAGE);
  }

  // ========================================
  // preload
  // ========================================
  preload(): void {
    // 背景
    this.load.image('background', backgroundImg);
    // アイコン
    this.load.image('stage-icons', stageIcons);
    preloadBackButton(this);

    // Playerのアニメーションデータ
    const playerData = characterAnimations.player;

    // 画像読み込み
    loadCharacterAnimation(this, 'select-player-run', playerData.run);
    loadCharacterAnimation(this, 'select-player-idle', playerData.idle);
  }

  // ========================================
  // create
  // ========================================
  create(data: SelectStageSceneData = {}): void {
    this.currentChapter = AREA_STAGE_LAYOUTS[data.areaId ?? 1] ? (data.areaId ?? 1) : 1;
    this.stagePositions = AREA_STAGE_LAYOUTS[this.currentChapter];
    this.stages = this.stagePositions.map((position, index) => {
      const prototype = testData.stages.find(stage => stage.id === position.id);
      if (!prototype) throw new Error('Missing prototype stage: ' + position.id);
      return { ...prototype, name: this.currentChapter + '-' + (index + 1) };
    });
    this.currentStageIndex = 0;
    this.isMoving = false;
    this.isStageInfoOpen = false;
    this.prepareStageTextures();



    // ----------------------------------------
    // 背景
    // ----------------------------------------
    createBackground(this, 'background');

    // ----------------------------------------
    // タイトル
    // ----------------------------------------

    // ----------------------------------------
    // 戻るボタン
    // ----------------------------------------
    createBackButton(this,
      { x: 120, y: 66, width: 180, height: 60, fontSize: 23, depth: 10 },
      () => this.scene.start(SCENE_KEYS.AREA_SELECT)
    );


    // ----------------------------------------
    // ステージ作成
    // ----------------------------------------
    this.stagePositions.forEach((position, index) => {
      const stage = this.stages[index];
      const nextStage = this.stages[index + 1];

      if (!stage) return;

      // 次のステージがある場合だけ線を描画
      if (nextStage) {
        const nextPosition = this.stagePositions[index + 1];

        // 外側の黒い線
        this.createLine(nextPosition.x, nextPosition.y, position.x, position.y);
        // 内側の白い線
      }

      // ステージボタン
      this.createActionCircle(position.x, position.y, 110, stage.name);

    });

    // ----------------------------------------
    // Playerアニメーション作成
    // ----------------------------------------
    const playerData = characterAnimations.player;

    // Run
    createCharacterAnimation(this, 'select-player-run', 'select-player-run', playerData.run.frameCount, playerData.run.frameRate);
    // Idle
    createCharacterAnimation(this, 'select-player-idle', 'select-player-idle', Math.min(playerData.idle.frameCount, this.textures.get('select-player-idle').frameTotal - 1), playerData.idle.frameRate);

    // ----------------------------------------
    // Player作成
    // ----------------------------------------
    this.player = createCharacterSprite(this, this.stagePositions[this.currentStageIndex].x, this.stagePositions[this.currentStageIndex].y-50, 'select-player-idle', 'select-player-idle');
    this.player.setScale(1.5).setDepth(2);
  }

  // ========================================
  // 戻るボタン
  // ========================================
  private prepareStageTextures(): void {
    const texture = this.textures.get('stage-icons');
    const frames: Record<string, [number, number, number, number]> = {
      battle: [528, 318, 480, 255], story: [1020, 318, 480, 255], route: [75, 897, 1390, 55]
    };
    Object.entries(frames).forEach(([name, [x, y, width, height]]) => {
      if (!texture.has(name)) texture.add(name, 0, x, y, width, height);
    });
    applySmoothDisplay(this, ['stage-icons', 'background']);
  }

  // ========================================
  // ステージ情報 (文字＆ポップアップ拡大版)
  // ========================================
  private openStageInfo(
    scene: Phaser.Scene,
    stageLabel: string | StageData
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
      ? this.stages.find(stage => stage.name === stageLabel)
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
      closePopup(() => scene.scene.start(SCENE_KEYS.FORM));
    });

    const startBtn = createDialogButton(120, popupH / 2 - 55, 160, 56, '出撃', 0x4c8c5a, 0x60ab72, () => {
      closePopup(() => {
        console.log(`ステージID: ${stage.id} で StageScene に遷移`);
        const stageIndex = this.stages.findIndex(item => item.id === stage.id);
        const stageType = this.stagePositions[stageIndex]?.type;
        if(stageType === 'battle') {
          scene.scene.start(SCENE_KEYS.STAGE, { stageId: stage.id });
        } else if(stageType === 'story') {
          scene.scene.start(SCENE_KEYS.STORY, {
            chapter: 1,
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
    const targetIndex = this.stagePositions.findIndex(pos => pos.x === x && pos.y === y);
    const button = this.add.image(x, y + this.stageRouteOffsetY, 'stage-icons', this.stagePositions[targetIndex].type)
      .setDisplaySize(diameter, diameter * 255 / 480).setDepth(1).setInteractive({ useHandCursor: true });
    const text = specialText(this, x, y + this.stageRouteOffsetY + 48, 27, 4, label, '#ffffff', '#01070b')
      .setDepth(1);
    smoothText(text);
    button.on('pointerover', () => button.setTint(0xffe4b5));
    button.on('pointerout', () => button.clearTint());
    button.on('pointerup', () => {
      if (this.isMoving || this.isStageInfoOpen) return;
      this.movePlayerToStage(this.currentStageIndex, targetIndex);
    });
  }

  // ========================================
  // ステージ間の線
  // ========================================
  private createLine(x1: number, y1: number, x2: number, y2: number): void {
    this.add.image((x1 + x2) / 2, (y1 + y2) / 2 + this.stageRouteOffsetY + 5, 'stage-icons', 'route')
      .setDisplaySize(Phaser.Math.Distance.Between(x1, y1, x2, y2), 20)
      .setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2)).setDepth(0.5);
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
      this.stages[targetIndex]
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
  this.player.setFlipX(targetStage.x < this.player.x);
  this.player.play('select-player-run');

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
        this.player.play('select-player-idle');

        wait(this, 500).then(() => {
          this.openStageInfo(
            this,
            this.stages[targetIndex]
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