// 担当：たまおちゃん｜ステージ選択画面
import storyData from '../scenario_data/story_data.json';
import { getContractPool } from './stage/flowerContracts';
import Phaser from 'phaser';

import testData from './test_data';
import { AREA_STAGE_LAYOUTS, type StagePosition } from './stageSelectData';
const battleData = import.meta.glob('../../php/stage/stage*.json', { eager: true, import: 'default' }) as Record<string, { enemies: { id: number; level: number }[] }>;
type StageData = typeof testData.stages[number];
import { specialText } from '../functions';
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
  clearReward?: number;
  page?: number;
}

const STAGES_PER_PAGE = 6;

const getSavedPageKey = (areaId: number): string => `stageSelectPage:${areaId}`;
const getSavedStageIndexKey = (areaId: number, page: number): string => `stageSelectStage:${areaId}:${page}`;

export class SelectStageScene extends Phaser.Scene {
  private readonly stageRouteOffsetY = 40;
  private stagePositions: StagePosition[] = [];
  private stages: StageData[] = [];
  // プレイヤー
  private player!: Phaser.GameObjects.Sprite;
  private currentChapter = 1;
  private currentStageIndex = 0;
  private isMoving = false;
  private isStageInfoOpen = false;
  private currentPage = 0;
  private pageCount = 1;

  constructor() {
    super(SCENE_KEYS.SELECT_STAGE);
  }

  // ========================================
  // preload
  // ========================================
  preload(): void {
    for (const { flower } of getContractPool('1-1')) {
      if (!this.textures.exists(flower.key)) this.load.image(flower.key, flower.url);
    }
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
    this.pageCount = Math.ceil(this.stagePositions.length / STAGES_PER_PAGE);
    const savedPage = this.registry.get(getSavedPageKey(this.currentChapter)) as number | undefined;
    const initialPage = data.page ?? savedPage ?? 0;
    this.currentPage = Phaser.Math.Clamp(initialPage, 0, this.pageCount - 1);
    const pageStart = this.currentPage * STAGES_PER_PAGE;
    const pageEnd = Math.min(pageStart + STAGES_PER_PAGE, this.stagePositions.length);
    const savedStageIndex = this.registry.get(getSavedStageIndexKey(this.currentChapter, this.currentPage)) as number | undefined;
    const initialStageIndex = savedStageIndex ?? pageStart;
    this.currentStageIndex = initialStageIndex >= pageStart && initialStageIndex < pageEnd
      ? initialStageIndex
      : pageStart;
    this.saveStageSelectProgress();
    let storyCount = 0;
    let battleCount = 0;
    this.stages = this.stagePositions.map(position => {
      const prototype = testData.stages.find(stage => stage.id === position.id);
      if (!prototype) throw new Error('Missing prototype stage: ' + position.id);
      const name = position.type === 'story'
        ? `${this.currentChapter}-${++storyCount}-a`
        : `${this.currentChapter}-${++battleCount}`;
      return { ...prototype, name };
    });
    this.isMoving = false;
    this.isStageInfoOpen = false;
    this.prepareStageTextures();
    if (data.clearReward !== undefined) {
      const message = data.clearReward > 0 ? 'クリア報酬  +' + data.clearReward + ' コイン' : 'ステージクリア';
      const notice = this.add.text(this.scale.width / 2, 100, message, getTextStyle(20, {
        color: '#fff1d7', backgroundColor: '#172a39',
      })).setOrigin(0.5).setDepth(4000).setScrollFactor(0);
      this.time.delayedCall(3200, () => notice.destroy());
    }



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
      { width: 180, height: 60, fontSize: 23, depth: 10 },
      () => this.scene.start(SCENE_KEYS.AREA_SELECT)
    );


    // ----------------------------------------
    // ステージ作成
    // ----------------------------------------
    for (let index = pageStart; index < pageEnd; index++) {
      const position = this.stagePositions[index];
      const stage = this.stages[index];
      const nextPosition = this.stagePositions[index + 1];

      if (!position || !stage) continue;

      if (index + 1 < pageEnd && nextPosition) {
        this.createLine(nextPosition.x, nextPosition.y, position.x, position.y);
      }

      this.createActionCircle(position.x, position.y, 110, index);
    }

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
    this.player = createCharacterSprite(
      this,
      this.stagePositions[this.currentStageIndex].x,
      this.stagePositions[this.currentStageIndex].y + this.stageRouteOffsetY - 50,
      'select-player-idle',
      'select-player-idle'
    );
    this.player.setScale(1.5).setDepth(2);
    this.createPageControls();
  }

  private saveStageSelectProgress(): void {
    this.registry.set(getSavedPageKey(this.currentChapter), this.currentPage);
    this.registry.set(getSavedStageIndexKey(this.currentChapter, this.currentPage), this.currentStageIndex);
  }

  private createPageControls(): void {
    if (this.pageCount < 2) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const createArrow = (x: number, direction: -1 | 1, enabled: boolean): void => {
      const circle = this.add.circle(x, height / 2, 34, 0x172a39, 0.88)
        .setStrokeStyle(2, 0xf2d28a, 0.9)
        .setAlpha(enabled ? 1 : 0.45)
        .setDepth(10)
        .setScrollFactor(0);
      this.add.text(x, height / 2 - 2, direction < 0 ? '‹' : '›', getTextStyle(44, {
        color: '#fff8df',
        fontStyle: 'bold',
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
      })).setOrigin(0.5).setDepth(11).setScrollFactor(0);

      if (!enabled) return;
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerover', () => circle.setFillStyle(0x345747, 1));
      circle.on('pointerout', () => circle.setFillStyle(0x172a39, 0.88));
      circle.on('pointerup', () => {
        if (this.isMoving || this.isStageInfoOpen) return;
        this.scene.restart({ areaId: this.currentChapter, page: this.currentPage + direction });
      });
    };

    createArrow(58, -1, this.currentPage > 0);
    createArrow(width - 58, 1, this.currentPage < this.pageCount - 1);
    this.add.text(width / 2, height - 24, `${this.currentPage + 1} / ${this.pageCount}`, getTextStyle(17, {
      color: '#fff8df',
      backgroundColor: '#172a39',
      padding: { left: 12, right: 12, top: 4, bottom: 4 },
    })).setOrigin(0.5).setDepth(10).setScrollFactor(0);
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

    const stageIndex = this.stages.findIndex(item => item.id === stage.id);
    const isBattleStage = this.stagePositions[stageIndex]?.type === 'battle';
    const story = !isBattleStage ? storyData.find(chapter => chapter.chapter === this.currentChapter)?.stages.find(entry => entry.stage === stage.id) : undefined;
    const battle = this.currentChapter === 1 && isBattleStage ? battleData['../../php/stage/stage' + stage.id + '.json'] : undefined;
    const pool = isBattleStage
      ? getContractPool(stage.name).sort((a, b) => b.chance - a.chance || a.flower.id - b.flower.id)
      : [];
    const hasContracts = pool.length > 0;
    const popupW = Math.min(width * 0.9, hasContracts ? 880 : 640);
    const popupH = Math.min(height * 0.88, hasContracts ? 560 : 500);

    // Absorb clicks inside the panel before they reach the backdrop.
    const dialogHitArea = scene.add.zone(0, 0, popupW, popupH).setInteractive();
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
    const titleText = scene.add.text(0, -popupH / 2 + 30, isBattleStage ? stage.name : story?.title ?? 'ストーリー', {
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
    const cardW = hasContracts ? 264 : popupW - 60;
    const cardX = -popupW / 2 + 30;
    const cardH = hasContracts ? 285 : 210;
    const cardY = hasContracts ? -52 : -10;

    enemyCardGfx.fillStyle(0xf4f7f9, 1);
    enemyCardGfx.fillRoundedRect(cardX, cardY - cardH / 2, cardW, cardH, 10);
    enemyCardGfx.lineStyle(1, 0xd0d7de, 1);
    enemyCardGfx.strokeRoundedRect(cardX, cardY - cardH / 2, cardW, cardH, 10);

    const enemyLines = stage.enemies.map(e => `・ 敵ID: ${e.id} 数量: ${e.num}体 Lv.${e.level}`).join('\n');
    const bossLine = `・ [BOSS] 敵ID: ${stage.boss.id} 数量: ${stage.boss.num}体 Lv.${stage.boss.level}`;

    const enemySummary = battle
      ? battle.enemies.map(enemy => '・ 敵ID: ' + enemy.id + ' Lv.' + enemy.level).join('\n')
      : [enemyLines, bossLine].filter(Boolean).join('\n');

    // サブタイトル大きく (18 → 22)
    const enemyTitle = scene.add.text(cardX + 20, cardY - cardH / 2 + 20, '⚔️ エリアの敵情報', {
      ...getTextStyle(22),
      color: '#333333',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    // 敵情報の文字大きく、行間も広げる (16 → 20)
    const contractList = scene.add.container(cardX + cardW + 16, cardY - cardH / 2);
    if (hasContracts) {
      const panelW = popupW - cardW - 76;
      const tileW = (panelW - 36) / 2;
      contractList.add(scene.add.rectangle(0, 0, panelW, cardH, 0xf2f6ee)
        .setOrigin(0).setStrokeStyle(1, 0xc9d6bf));
      contractList.add(scene.add.text(12, 10, '契約可能な花', getTextStyle(20, {
        color: '#345747', fontStyle: 'bold',
      })));
      contractList.add(scene.add.text(panelW - 12, 16, '1体抽選・出現率順', getTextStyle(13, {
        color: '#526454',
      })).setOrigin(1, 0));
      pool.forEach(({ flower, chance }, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = 12 + column * (tileW + 12);
        const y = 45 + row * 45;
        contractList.add(scene.add.rectangle(x, y, tileW, 40, 0xffffff)
          .setOrigin(0).setStrokeStyle(1, 0xd9e3d2));
        const icon = scene.add.image(x + 22, y + 20, flower.key);
        icon.setScale(32 / Math.max(icon.width, icon.height));
        contractList.add(icon);
        contractList.add(scene.add.text(x + 43, y + 20, flower.name, getTextStyle(14, {
          color: '#263b32',
        })).setOrigin(0, 0.5));
        contractList.add(scene.add.text(x + tileW - 9, y + 20, chance.toFixed(1) + '%', getTextStyle(14, {
          color: '#345747', fontStyle: 'bold',
        })).setOrigin(1, 0.5));
      });
    }
    const enemyDetails = scene.add.text(cardX + 20, cardY - cardH / 2 + 60, enemySummary, {
      ...getTextStyle(pool.length ? 14 : 20),
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

    const inventoryBtn = isBattleStage ? createDialogButton(
      cardX + cardW / 2, cardY + cardH / 2 - 34,
      Math.min(220, cardW - 40), 44, '所持品を見る', 0x536878, 0x6d8396, () => {
        if (scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;
        scene.scene.launch(SCENE_KEYS.INVENTORY, { returnScene: scene.scene.key });
        scene.scene.pause();
      }
    ) : null;
    // Reserve space only when the inventory button is shown.
    if (isBattleStage) enemyDetails.setCrop(0, 0, cardW - 40, Math.max(0, cardH - 134));

    // ボタンのサイズも少し大きく (150x48 → 160x56)
    const formationBtn = createDialogButton(-120, popupH / 2 - 55, 160, 56, '編成', 0x536878, 0x6d8396, () => {
      closePopup(() => {
        scene.scene.launch(SCENE_KEYS.FORM, { returnToStage: true });
        scene.scene.sleep();
      });
    });

    const startBtn = createDialogButton(120, popupH / 2 - 55, 160, 56, story ? '読む' : '出撃', 0x4c8c5a, 0x60ab72, () => {
      closePopup(() => {
        console.log(`ステージID: ${stage.id} で StageScene に遷移`);
        const stageIndex = this.stages.findIndex(item => item.id === stage.id);
        const stageType = this.stagePositions[stageIndex]?.type;
        if(stageType === 'battle') {
          scene.scene.start(SCENE_KEYS.STAGE, { stageId: stage.id, stageNumber: stage.name });
        } else if(stageType === 'story') {
          scene.scene.start(SCENE_KEYS.STORY, {
            chapter: this.currentChapter,
            stage: stage.id
          });
        }
      });
    });

    closeButton.on('pointerup', () => closePopup());
    darkBackground.on('pointerdown', () => closePopup());

    container.add([
      dialogHitArea, dialogGfx, titleText, closeButton, enemyCardGfx, enemyTitle,
      enemyDetails, warningText, formationBtn, startBtn
    ]);

    if (story) {
      for (const element of [enemyCardGfx, enemyTitle, enemyDetails, warningText, formationBtn]) element.setVisible(false);
      startBtn.setX(0);
    }
    if (inventoryBtn) container.add(inventoryBtn);
    container.add(contractList);
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
  private createActionCircle(x: number, y: number, diameter: number, targetIndex: number): void {
    const position = this.stagePositions[targetIndex];
    const button = this.add.image(x, y + this.stageRouteOffsetY, 'stage-icons', position.type)
      .setDisplaySize(diameter, diameter * 255 / 480).setDepth(1).setInteractive({ useHandCursor: true });
    if (position.type === 'battle') {
      const text = specialText(this, x, y + this.stageRouteOffsetY + 48, 27, 4, this.stages[targetIndex].name, '#ffffff', '#01070b')
        .setDepth(1);
      smoothText(text);
    }
    button.on('pointerover', () => button.setTint(0xffe4b5));
    button.on('pointerout', () => button.clearTint());
    button.on('pointerup', () => {
      if (this.isMoving || this.isStageInfoOpen) return;
      this.movePlayerToStage(targetIndex);
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

  private movePlayerToStage(targetIndex: number): void {
    const pageStart = this.currentPage * STAGES_PER_PAGE;
    const pageEnd = Math.min(pageStart + STAGES_PER_PAGE, this.stagePositions.length);
    if (targetIndex < pageStart || targetIndex >= pageEnd || !this.stagePositions[targetIndex] || !this.stages[targetIndex]) {
      console.error(`無効なステージインデックス: ${targetIndex}`);
      return;
    }

    if (targetIndex === this.currentStageIndex) {
      this.openStageInfo(this, this.stages[targetIndex]);
      return;
    }

    this.isMoving = true;
    const moveAlongRoute = (): void => {
      const nextIndex = this.currentStageIndex + Math.sign(targetIndex - this.currentStageIndex);
      const nextPosition = this.stagePositions[nextIndex];
      if (!nextPosition) {
        this.isMoving = false;
        console.error(`無効な経路インデックス: ${nextIndex}`);
        return;
      }

      this.player.setFlipX(nextPosition.x < this.player.x).play('select-player-run');
      this.tweens.add({
        targets: this.player,
        x: nextPosition.x,
        y: nextPosition.y + this.stageRouteOffsetY - 50,
        duration: 1200,
        ease: 'Power1',
        onComplete: () => {
          this.currentStageIndex = nextIndex;
          this.saveStageSelectProgress();
          if (nextIndex !== targetIndex) {
            moveAlongRoute();
            return;
          }

          this.player.play('select-player-idle');
          this.isMoving = false;
          this.openStageInfo(this, this.stages[targetIndex]);
        }
      });
    };

    moveAlongRoute();
  }

}
