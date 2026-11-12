/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { transitionWithLoading, openSceneWithLoading } from '../utils/ui/scene-loading';
import storyData from '../scenario_data/story_data.json';
import { getContractPool } from './stage/flowerContracts';
import Phaser from 'phaser';

import testData from './test_data';
import { loadFormation } from '../form/formationStorage';
import { AREA_STAGE_LAYOUTS, type StagePosition } from './stageSelectData';
/* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
 * 処理内容 : ステージ選択・詳細・移動を定義する
 * ================================== */
const battleData = import.meta.glob('../../php/stage/stage*.json', { eager: true, import: 'default' }) as Record<string, { enemies: { id: number; level: number }[] }>;
const formationPortraits = import.meta.glob('../assets/images/pixel_flowers/*.png', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
const formationPortraitKey = (id: number): string => 'stage-select-flower-' + id;
type StageData = typeof testData.stages[number];
import { specialText } from '../functions';
import { createBackground } from '../background';
import backgroundImg from '../assets/ui/stageslect_back.png';
import stageIcons from '../assets/ui/stageslect_icon.png';
import confirmPanel from '../assets/ui/training_panel.png';
import confirmButton from '../assets/ui/training_button_wood.png';
import confirmCard from '../assets/ui/formation_flower_card.png';
import confirmOrnament from '../assets/ui/training_title_ornament.png';

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
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
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

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() {
    super(SCENE_KEYS.SELECT_STAGE);
  }

  // ========================================
  // preload
  // ========================================
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    for (const { flower } of getContractPool('1-1')) {
      if (!this.textures.exists(flower.key)) this.load.image(flower.key, flower.url);
    }
    for (const flower of testData.characters) {
      const url = formationPortraits['../assets/images/pixel_flowers/' + flower.code + '.png'];
      const key = formationPortraitKey(flower.id);
      if (url && !this.textures.exists(key)) this.load.image(key, url);
    }
    this.load.image('stage-confirm-panel', confirmPanel);
    this.load.image('stage-confirm-button', confirmButton);
    this.load.image('stage-confirm-card', confirmCard);
    this.load.image('stage-confirm-ornament', confirmOrnament);
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 選択エリアと保存済みの位置からステージ一覧を準備する
     * ================================== */
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
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : クリア報酬の通知を一時表示する
     * ================================== */
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 戻る操作と画面内のステージ配置・道を用意する
     * ================================== */
    createBackButton(this,
      { width: 180, height: 60, fontSize: 23, depth: 10 },
      () => transitionWithLoading(this, SCENE_KEYS.AREA_SELECT)
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 主人公の移動アニメーションとステージ移動の準備を行う
     * ================================== */
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

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : ステージ選択位置を保存する
   * ================================== */
  private saveStageSelectProgress(): void {
    this.registry.set(getSavedPageKey(this.currentChapter), this.currentPage);
    this.registry.set(getSavedStageIndexKey(this.currentChapter, this.currentPage), this.currentStageIndex);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : ページ切り替え操作を作る
   * ================================== */
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
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 表示に使う画像・アニメーションを用意する
   * ================================== */
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
  private createFormationPreview(scene: Phaser.Scene, x: number, y: number, width: number): Phaser.GameObjects.Container {
    const preview = scene.add.container(x, y).setName('stage-formation-preview');
    const slots = loadFormation();
    preview.add(scene.add.rectangle(0, 0, width, 108, 0x72512d, .08)
      .setOrigin(0).setStrokeStyle(1, 0xb59a63, .5));
    preview.add(scene.add.text(12, 9, '出撃編成', getTextStyle(17, {
      color: '#51391f', fontStyle: 'bold', padding: {},
    })));

    const gap = 8;
    const slotWidth = (width - 24 - gap * (slots.length - 1)) / slots.length;
    slots.forEach((id, index) => {
      const left = 12 + index * (slotWidth + gap);
      const flower = testData.characters.find(character => character.id === id);
      preview.add(scene.add.image(left, 34, 'stage-confirm-card')
        .setOrigin(0).setDisplaySize(slotWidth, 62).setAlpha(flower ? 1 : .6));
      preview.add(scene.add.text(left + 6, 39, String(index + 1), getTextStyle(12, {
        color: '#7b674b', padding: {},
      })));

      const key = id === null ? null : formationPortraitKey(id);
      const hasPortrait = key !== null && scene.textures.exists(key);
      if (hasPortrait) {
        const portrait = scene.add.image(left + 36, 65, key);
        portrait.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        portrait.setScale(38 / Math.max(portrait.width, portrait.height));
        preview.add(portrait);
      }

      const name = scene.add.text(left + (hasPortrait ? 61 : 25), 65, flower?.name ?? '空き', getTextStyle(16, {
        color: flower ? '#493620' : '#89765a', padding: {},
      })).setOrigin(0, .5);
      const availableWidth = slotWidth - (hasPortrait ? 68 : 32);
      if (name.width > availableWidth) name.setScale(availableWidth / name.width);
      preview.add(name);
    });
    return preview;
  }

  private openStageInfo(
    scene: Phaser.Scene,
    stageLabel: string | StageData
  ): void {
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 詳細画面の重複表示を防ぎ、背後を暗くする
     * ================================== */
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

    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 指定ステージを検索し、詳細表示のコンテナを作る
     * ================================== */
    const container = scene.add.container(width / 2, height / 2).setDepth(3000);

    const stage = typeof stageLabel === 'string'
      ? this.stages.find(stage => stage.name === stageLabel)
      : stageLabel;
      
    if (!stage) {
      console.error(`ステージが見つかりません: ${stageLabel}`);
      darkBackground.destroy();
      return;
    }

    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 戦闘・会話データと契約候補を取得し、詳細枠の大きさを決める
     * ================================== */
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
    const popupH = Math.min(height * 0.9, isBattleStage ? (hasContracts ? 600 : 520) : 210);

    // Absorb clicks inside the panel before they reach the backdrop.
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 詳細枠の操作領域・影・背景を描く
     * ================================== */
    const dialogHitArea = scene.add.zone(0, 0, popupW, popupH).setInteractive();
    const dialogGfx = scene.add.graphics();
    
    const left = -popupW / 2;
    const top = -popupH / 2;
    dialogGfx.fillStyle(0x20170e, .4);
    dialogGfx.fillRect(left + 5, top + 7, popupW, popupH);
    const paper = scene.add.image(0, 0, 'stage-confirm-panel').setDisplaySize(popupW, popupH);
    const ornament = scene.add.image(0, top + 58, 'stage-confirm-ornament').setDisplaySize(320, 62);

    const titleText = scene.add.text(0, -popupH / 2 + 38, isBattleStage ? '出撃準備  ―  ' + stage.name : story?.title ?? 'ストーリー', {
      ...getTextStyle(28),
      color: '#51391f',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }).setOrigin(0.5);

    // ✕ボタン大きく (22 → 26)
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 詳細画面を閉じるボタンとマウス反応を作る
     * ================================== */
    const closePlate = scene.add.circle(popupW / 2 - 32, -popupH / 2 + 32, 17, 0x4b321d).setStrokeStyle(2, 0xc6a35d);
    const closeButton = scene.add.text(popupW / 2 - 32, -popupH / 2 + 32, '✕', {
      ...getTextStyle(26),
      color: '#fff1cd',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeButton.on('pointerover', () => closeButton.setColor('#ffd27b'));
    closeButton.on('pointerout', () => closeButton.setColor('#fff1cd'));

    // カードの高さ拡大 (160 → 210)
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 敵情報カードと敵・ボスの一覧文を作る
     * ================================== */
    const enemyCardGfx = scene.add.graphics();
    const cardW = hasContracts ? 264 : popupW - 60;
    const cardX = -popupW / 2 + 30;
    const cardH = hasContracts ? 285 : 210;
    const cardY = top + 73 + cardH / 2;

    enemyCardGfx.fillStyle(0x72512d, .07);
    enemyCardGfx.fillRect(cardX, cardY - cardH / 2, cardW, cardH);
    enemyCardGfx.lineStyle(1, 0xb59a63, .5);
    enemyCardGfx.strokeRect(cardX, cardY - cardH / 2, cardW, cardH);

    const enemyLines = stage.enemies.map(e => `・ 敵ID: ${e.id} 数量: ${e.num}体 Lv.${e.level}`).join('\n');
    const bossLine = `・ [BOSS] 敵ID: ${stage.boss.id} 数量: ${stage.boss.num}体 Lv.${stage.boss.level}`;

    const enemySummary = battle
      ? battle.enemies.map(enemy => '・ 敵ID: ' + enemy.id + ' Lv.' + enemy.level).join('\n')
      : [enemyLines, bossLine].filter(Boolean).join('\n');

    // サブタイトル大きく (18 → 22)
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 敵情報と契約候補の画像・名前・出現率を表示する
     * ================================== */
    const enemyTitle = scene.add.text(cardX + 20, cardY - cardH / 2 + 20, '出現する敵', {
      ...getTextStyle(22),
      color: '#51391f',
      fontStyle: 'bold',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    // 敵情報の文字大きく、行間も広げる (16 → 20)
    const contractList = scene.add.container(cardX + cardW + 16, cardY - cardH / 2);
    if (hasContracts) {
      const panelW = popupW - cardW - 76;
      const tileW = (panelW - 36) / 2;
      contractList.add(scene.add.rectangle(0, 0, panelW, cardH, 0x72512d, .07)
        .setOrigin(0).setStrokeStyle(1, 0xb59a63, .5));
      contractList.add(scene.add.text(12, 10, '契約可能な花', getTextStyle(20, {
        color: '#674725', fontStyle: 'bold',
      })));
      contractList.add(scene.add.text(panelW - 12, 16, '1体抽選・出現率順', getTextStyle(13, {
        color: '#7b674b',
      })).setOrigin(1, 0));
      pool.forEach(({ flower, chance }, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = 12 + column * (tileW + 12);
        const y = 45 + row * 45;
        contractList.add(scene.add.rectangle(x, y, tileW, 40, 0xfff6dc, .65)
          .setOrigin(0).setStrokeStyle(1, 0xb59a63, .4));
        const icon = scene.add.image(x + 22, y + 20, flower.key);
        icon.setScale(32 / Math.max(icon.width, icon.height));
        contractList.add(icon);
        contractList.add(scene.add.text(x + 43, y + 20, flower.name, getTextStyle(14, {
          color: '#493620',
        })).setOrigin(0, 0.5));
        contractList.add(scene.add.text(x + tileW - 9, y + 20, chance.toFixed(1) + '%', getTextStyle(14, {
          color: '#674725', fontStyle: 'bold',
        })).setOrigin(1, 0.5));
      });
    }
    const enemyDetails = scene.add.text(cardX + 20, cardY - cardH / 2 + 60, enemySummary, {
      ...getTextStyle(pool.length ? 14 : 20),
      color: '#655039',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 注意書きを表示し、詳細画面を閉じる演出を用意する
     * ================================== */
    enemyDetails.setLineSpacing(12);

    const formationPreview = isBattleStage
      ? this.createFormationPreview(scene, cardX, cardY + cardH / 2 + 12, popupW - 60)
      : null;

    let closing = false;
    const closePopup = (onComplete?: () => void) => {
      if (closing) return;
      closing = true;
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

    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    const createDialogButton = (
      x: number, y: number, btnW: number, btnH: number, text: string,
      bgColor: number, hoverColor: number, onClick: () => void
    ) => {
      const btnContainer = scene.add.container(x, y);
      // Account for transparent padding in the existing wooden button artwork.
      const bg = scene.add.image(0, 0, 'stage-confirm-button')
        .setDisplaySize(btnW + 8, btnH * 1.6);
      const drawBtn = (c: number) => bg.setTint(c);
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

    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : ボタン操作に応じて画面を切り替える
     * ================================== */
    const inventoryBtn = isBattleStage ? createDialogButton(
      cardX + cardW / 2, cardY + cardH / 2 - 34,
      Math.min(220, cardW - 40), 44, '所持品を見る', 0xe2d4b8, 0xffffff, () => {
        if (scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;
        openSceneWithLoading(scene, SCENE_KEYS.INVENTORY, { returnScene: scene.scene.key });
      }
    ) : null;
    // Reserve space only when the inventory button is shown.
    if (isBattleStage) enemyDetails.setCrop(0, 0, cardW - 40, Math.max(0, cardH - 134));

    // ボタンのサイズも少し大きく (150x48 → 160x56)
    const formationBtn = createDialogButton(-120, popupH / 2 - 55, 160, 56, '編成を変更', 0xe2d4b8, 0xffffff, () => {
      closePopup(() => {
        openSceneWithLoading(scene, SCENE_KEYS.FORM, { returnToStage: true }, 'sleep');
      });
    });

    const startBtn = createDialogButton(120, popupH / 2 - 55, 160, 56, isBattleStage ? '出撃' : '読む', 0xffffff, 0xffe4a8, () => {
      closePopup(() => {
        console.log(`ステージID: ${stage.id} で StageScene に遷移`);
        const stageIndex = this.stages.findIndex(item => item.id === stage.id);
        const stageType = this.stagePositions[stageIndex]?.type;
        if(stageType === 'battle') {
          transitionWithLoading(scene, SCENE_KEYS.STAGE, { stageId: stage.id, stageNumber: stage.name });
        } else if(stageType === 'story') {
          transitionWithLoading(scene, SCENE_KEYS.STORY, {
            chapter: this.currentChapter,
            stage: stage.id
          });
        }
      });
    });

    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 閉じる操作を接続し、詳細画面の表示部品をまとめる
     * ================================== */
    closeButton.on('pointerup', () => closePopup());
    darkBackground.on('pointerdown', () => closePopup());

    container.add([
      dialogHitArea, dialogGfx, paper, ornament, titleText, closePlate, closeButton, enemyCardGfx, enemyTitle,
      enemyDetails, formationBtn, startBtn
    ]);

    if (!isBattleStage) {
      for (const element of [enemyCardGfx, enemyTitle, enemyDetails, formationBtn]) element.setVisible(false);
      startBtn.setX(0);
    }
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 詳細画面を拡大しながら表示する
     * ================================== */
    if (inventoryBtn) container.add(inventoryBtn);
    if (formationPreview) container.add(formationPreview);
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
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : ステージの台座と選択操作を配置する
   * ================================== */
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
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : ステージの台座どうしを道の画像でつなぐ
   * ================================== */
  private createLine(x1: number, y1: number, x2: number, y2: number): void {
    this.add.image((x1 + x2) / 2, (y1 + y2) / 2 + this.stageRouteOffsetY + 5, 'stage-icons', 'route')
      .setDisplaySize(Phaser.Math.Distance.Between(x1, y1, x2, y2), 20)
      .setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2)).setDepth(0.5);
  }

  private movePlayerToStage(targetIndex: number): void {
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 選択したステージへ主人公を移動する
     * ================================== */
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 目的のステージまで台座を順にたどって主人公を移動する
     * ================================== */
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
