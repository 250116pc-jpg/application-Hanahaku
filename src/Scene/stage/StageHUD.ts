import { ensureGuardButtonTexture } from '../../display/GuardButtonTexture';
import { loadBattleLayout } from '../../display/BattleButtonEditor';
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { transitionWithLoading, trackSceneLoading } from '../../utils/ui/scene-loading';
import { isBattlePreview } from '../../debug';
import { loadDisplaySettings } from '../../display/DisplaySettings';
import { battleNow } from './BattleClock';
import { playSe, playUiSe } from '../../audio/BgmManager';
import retreatPanel from '../../assets/inventory-fantasy/panel-frame.png';
import retreatButtonNormal from '../../assets/inventory-fantasy/button-normal.png';
import retreatButtonHover from '../../assets/inventory-fantasy/button-hover.png';
import retreatButtonPressed from '../../assets/inventory-fantasy/button-pressed.png';
import Phaser from 'phaser';
import { getTextStyle } from '../../utils/ui/index.ts';
import testData, { getFlowerSkill } from '../test_data.ts';
import type { CharacterData } from '../test_data.ts';
import { SCENE_KEYS } from '../sceneKeys';
import type { CombatTarget, Player } from './Player';
import { SkillEffects } from './SkillEffects';
import { beginStageSkillStates, type FlowerSkillState } from './SkillApi.ts';
import { loadFormation } from '../../form/formationStorage.ts';
import retreatButtonAsset from '../../assets/ui/button/retreat_button.png';
import rawSkillDefinitions from '../../../php/skill/skills.json?raw';
import rawStatusDefinitions from '../../../php/skill/statuses.json?raw';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 操作UIを定義する
 * ================================== */
type StatusDefinition = { id: string; icon: string; tone: string };
type SkillDefinition = { id: number; statusIds?: string[] };
const statusDefinitions = new Map<string, StatusDefinition>(
  (JSON.parse(rawStatusDefinitions) as { statuses: StatusDefinition[] }).statuses.map(status => [status.id, status])
);
const skillStatusIds = new Map<number, string[]>(
  (JSON.parse(rawSkillDefinitions) as { skills: SkillDefinition[] }).skills.map(skill => [skill.id, skill.statusIds ?? []])
);

/** Screen-fixed controls and status display for the side-scrolling stage. */
export class StageHUD {
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private readonly depth = 2000;
  private readonly controlButtons = new Map<string, { container: Phaser.GameObjects.Container; size: number }>();
  private placeRetreat?: () => void;

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 戦闘ボタンの画像・タップ領域を一緒に拡大し、花の枠と画面端から離して配置する
   * ================================== */
  private applyControlLayout(): void {
    const large = loadDisplaySettings().battleButtonSize === 'large';
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const layout: Record<string, [number, number, number]> = {
      'stage-bag': [72, 184, large ? 104 : 74],
      'stage-settings-ui': [72, 304, large ? 104 : 74],
      'stage-attack': [w - 270, h - 100, large ? 160 : 130],
      'stage-jump': [w - 100, h - 100, large ? 160 : 130],
      'stage-guard': [w - 100, h - 282, large ? 140 : 106],
    };
    const custom = loadBattleLayout();
    for (const [key, button] of this.controlButtons) {
      let [x, y, size] = layout[key];
      if (custom[key]) {
        size = custom[key].size;
        x = Phaser.Math.Clamp(custom[key].x * w, size / 2, w - size / 2);
        y = Phaser.Math.Clamp(custom[key].y * h, size / 2, h - size / 2);
      }
      button.container.setPosition(x, y).setScale(size / button.size);
    }
    this.placeRetreat?.();
  }
  private readonly scene: Phaser.Scene;
  private readonly player?: Player;
  private readonly enemies: readonly CombatTarget[];
  private formation = loadFormation();
  private flowers: CharacterData[] = [];
  public isReady = false;
  private selectedFlower = 0;
  private readonly playerStatusUntil = new Map<string, number>();
  private playerStatusContainer?: Phaser.GameObjects.Container;
  private readonly flowerMp = new Map(testData.characters.map(character =>
    [character.id, character.stats.mp] as const
  ));
  private readonly flowerMaxMp = new Map(testData.characters.map(character =>
    [character.id, character.stats.mp] as const
  ));
  private readonly flowerMpLabels: Array<Phaser.GameObjects.Text | undefined> = [];
  private readonly flowerMpBars: Array<Phaser.GameObjects.Rectangle | undefined> = [];
  private readonly flowerMpBarLayouts: Array<{ x: number; y: number; width: number } | undefined> = [];
  private readonly flowerSkills = new Map<number, FlowerSkillState['skill']>();
  private readonly flowerCooldownUntil = new Map<number, number>();
  private readonly flowerCooldownDuration = new Map<number, number>();
  private readonly flowerCooldownOverlays: Array<Phaser.GameObjects.Graphics | undefined> = [];
  private readonly flowerSkillIconCenters: Array<{ x: number; y: number } | undefined> = [];
  private retreatDialog: HTMLDivElement | null = null;
  private hpBar?: Phaser.GameObjects.Rectangle;
  private delayedHpBar?: Phaser.GameObjects.Rectangle;
  private previousHealth?: number;
  private delayedHpRatio = 0;
  private lastHealthUpdate = 0;
  private hpDelayUntil = 0;
  private hpBarX = 0;
  private hpBarY = 0;
  private hpBarWidth = 0;
  private hpBarHeight = 0;
  private skillLoadError = '';
  private disposed = false;
  private notice = '';
  private noticeUntil = 0;
  private effects?: SkillEffects;
  private skillNameText?: Phaser.GameObjects.Text;

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 主人公・敵の参照とスキル演出を接続する
   * ================================== */
  constructor(scene: Phaser.Scene, player?: Player, enemies: readonly CombatTarget[] = []) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.disposed = true; });
    if (this.player) {
      const effects = this.effects = new SkillEffects(scene, this.player);
      const onHealthChanged = (current: number, maximum: number): void => this.updateHealth(current, maximum);
      this.player.on('health-changed', onHealthChanged);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.player?.off('health-changed', onHealthChanged);
      });
      this.player.setSkillVisualHandler((skill, phase, targets, area) => effects.play(skill, phase, targets, area));
    }
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : HP・ステージ名・操作ボタン・編成花のHUDを組み立てる
   * ================================== */
  public create(stageId?: number, stageNumber?: string): void {
    // 移動・防御・攻撃などを複数の指で同時に操作できるようにする。
    const missingPointers = 4 - this.scene.input.manager.pointersTotal;
    if (missingPointers > 0) this.scene.input.addPointer(missingPointers);
    this.createStageLabel(stageId, stageNumber);
    this.createUtilityButtons();
    this.applyControlLayout();
    const refreshControls = (): void => this.applyControlLayout();
    this.scene.events.on(Phaser.Scenes.Events.RESUME, refreshControls);
    this.scene.events.on(Phaser.Scenes.Events.WAKE, refreshControls);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.events.off(Phaser.Scenes.Events.RESUME, refreshControls);
      this.scene.events.off(Phaser.Scenes.Events.WAKE, refreshControls);
      this.controlButtons.clear();
      this.placeRetreat = undefined;
    });
    if (stageId === 2) this.createOpeningBattleGuide();
    trackSceneLoading(this.scene, this.initializeFlowerSkills(stageId ?? 2));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 現在HPの割合に合わせてHUDのHPバーを更新する
   * ================================== */
  public updateHealth(current: number, maximum: number): void {
    if (!this.hpBar || !this.delayedHpBar) return;
    const now = battleNow(this.scene);
    const ratio = Phaser.Math.Clamp(maximum > 0 ? current / maximum : 0, 0, 1);

    if (this.previousHealth === undefined) {
      this.delayedHpRatio = ratio;
    } else if (current < this.previousHealth) {
      this.hpDelayUntil = now + 3000;
    } else {
      // 待機終了後の経過時間だけを使い、毎秒最大HPの25%ずつ追従する。
      const elapsed = Math.max(0, now - Math.max(this.lastHealthUpdate, this.hpDelayUntil));
      this.delayedHpRatio = Math.max(ratio, this.delayedHpRatio - elapsed / 4000);
    }
    this.delayedHpRatio = Math.max(ratio, this.delayedHpRatio);
    this.previousHealth = current;
    this.lastHealthUpdate = now;

    const width = this.hpBarWidth * ratio;
    this.hpBar.setSize(width, this.hpBarHeight)
      .setPosition(this.hpBarX + width / 2, this.hpBarY + this.hpBarHeight / 2);
    const delayedWidth = this.hpBarWidth * this.delayedHpRatio;
    this.delayedHpBar.setSize(delayedWidth, this.hpBarHeight)
      .setPosition(this.hpBarX + delayedWidth / 2, this.hpBarY + this.hpBarHeight / 2);
  }

  private createOpeningBattleGuide(): void {
    const width = this.scene.scale.width;
    const guide = this.text(width / 2, 122,
      'ジニア「影と距離を取って！」\n← → で移動   ↑ でジャンプ   ↓ 長押しで防御\n近づいたら剣ボタン。花のカードを押すとスキルが使えるよ。',
      17, '#fff4e8').setOrigin(0.5, 0).setAlign('center')
      .setWordWrapWidth(width - 64)
      .setPadding(16, 9)
      .setBackgroundColor('#162330')
      .setDepth(this.depth + 5);
    const close = this.text(width / 2, guide.getBounds().bottom + 3, '案内を閉じる ×', 14, '#fff4e8')
      .setOrigin(0.5, 0).setPadding(10, 5).setBackgroundColor('#162330')
      .setDepth(this.depth + 5).setInteractive({ useHandCursor: true })
      .once('pointerup', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        guide.destroy();
        close.destroy();
      });
  }

  private createStatusPanel(): void {
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 先頭の花の名前とレベルをステータス枠へ表示する
     * ================================== */
    const leader = this.flowers.find(c => c.id === this.formation[0]);
    const w = this.scene.scale.width;
    const compact = w < 760;
    const x = compact ? 12 : 24;
    const y = 18;
    const panelW = compact ? 214 : 330;
    const panelH = 106;
    this.panel(x, y, panelW, panelH, 14);
    this.text(x + 16, y + 10, leader ? `${leader.name}  Lv.${leader.level}` : '主人公', compact ? 13 : 17, '#fff', 'bold');
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 回復・宝石効果のアイコンと使用時の演出を連動させる
     * ================================== */
    if (this.player) {
      const icon = this.scene.add.image(x + panelW - 30, y + 21, 'status-buff_hp_regen')
        .setDisplaySize(22, 22).setScrollFactor(0).setDepth(this.depth + 3).setVisible(false);
      const onRecovery = (active: boolean): void => { icon.setVisible(active); };
      const onPotion = (): void => { this.effects?.play({ type: 'heal', durationMs: 10000 }, 'heal', [], [[1]]); };
      const attackIcon = this.scene.add.image(x + panelW - 56, y + 21, 'status-buff_atk_up')
        .setDisplaySize(22, 22).setScrollFactor(0).setDepth(this.depth + 3).setVisible(false);
      const defenseIcon = this.scene.add.image(x + panelW - 82, y + 21, 'status-buff_def_up')
        .setDisplaySize(22, 22).setScrollFactor(0).setDepth(this.depth + 3).setVisible(false);
      const updateGems = (): void => {
        attackIcon.setVisible(this.player?.isGemActive(14) ?? false);
        defenseIcon.setVisible(this.player?.isGemActive(15) ?? false);
      };
      const onGem = (id: number): void => {
        updateGems();
        this.effects?.play({ type: id === 14 ? 'balanced' : 'fortify', durationMs: 1800 }, 'buff', [], [[1]]);
      };
      this.player.on('gem-used', onGem);
      this.scene.events.on(Phaser.Scenes.Events.UPDATE, updateGems);
      this.player.on('recovery-status', onRecovery);
      this.player.on('potion-recovery', onPotion);
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.player?.off('gem-used', onGem);
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, updateGems);
        this.player?.off('recovery-status', onRecovery);
        this.player?.off('potion-recovery', onPotion);
      });
    }
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 主人公の現在HPと最大HPからHPバーを作る
     * ================================== */
    this.text(x + 16, y + 37, 'HP', 12, '#ff9bad', 'bold');
    this.hpBarX = x + 50;
    this.hpBarY = y + 40;
    this.hpBarWidth = panelW - (compact ? 66 : 88);
    this.hpBarHeight = 9;
    this.delayedHpBar = this.bar(
      this.hpBarX, this.hpBarY, this.hpBarWidth, this.hpBarHeight, 1, 1, 0xf4eee5
    );
    this.hpBar = this.scene.add.rectangle(
      this.hpBarX, this.hpBarY, 0, this.hpBarHeight, 0xf05b86
    ).setScrollFactor(0).setDepth(this.depth + 3);
    this.updateHealth(this.player?.health ?? 100, this.player?.maxHealth ?? 100);
    this.text(x + 16, y + 59, 'MP', 12, '#7ee6fa', 'bold');
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 主人公のMPバーを表示専用で満タンにする（花のMPやスキル消費には影響しない）
     * ================================== */
    this.bar(x + 50, y + 62, panelW - (compact ? 66 : 88), 9, 1, 1, 0x32bddb);
    this.playerStatusContainer = this.scene.add.container(x + 16, y + 87)
      .setScrollFactor(0).setDepth(this.depth + 5);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : ステージ名を画面上部へ表示する
   * ================================== */
  private createStageLabel(stageId?: number, stageNumber?: string): void {
    const stage = testData.stages.find(item => item.id === stageId);
    const label = stage || stageNumber
      ? `花の遺跡　•　${stageNumber ?? stage?.name}`
      : '花の遺跡　•　戦闘中';
    const w = this.scene.scale.width;
    const boxW = Math.min(300, w * 0.38);
    const x = w - boxW - 22;
    this.panel(x, 20, boxW, 48, 18, 0.9);
    this.text(x + boxW / 2, 44, label, Math.min(17, boxW / 16), '#fff4e8', 'bold').setOrigin(0.5);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : バッグと撤退の操作ボタンを配置する
   * ================================== */
  private createUtilityButtons(): void {
    this.imageButton(72, 170, 74, '', 'stage-bag', () => this.openInventory());
    this.imageButton(72, 260, 74, '', 'stage-settings-ui', () => this.openSettings());
    const x = this.scene.scale.width - 68;
    this.createRetreatDomButton(x, 282, 76);
  }

  private createRetreatDomButton(x: number, y: number, size: number): void {
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 撤退ボタンをCanvasの表示位置に合わせて配置する
     * ================================== */
    const canvas = this.scene.game.canvas;
    if (!canvas.parentElement) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', '撤退');
    Object.assign(button.style, {
      position: 'fixed',
      margin: '0',
      padding: '0',
      border: '0',
      background: `url("${retreatButtonAsset}") center / contain no-repeat`,
      cursor: 'pointer',
      zIndex: '100',
      touchAction: 'manipulation'
    });

    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 画面サイズに合わせて配置の基準を求める
     * ================================== */
    const standardSize = size;
    const placeButton = (): void => {
      const custom = loadBattleLayout()['stage-retreat'];
      const width = this.scene.scale.width;
      const height = this.scene.scale.height;
      size = custom?.size ?? (loadDisplaySettings().battleButtonSize === 'large' ? 104 : standardSize);
      const positionX = custom ? Phaser.Math.Clamp(custom.x * width, size / 2, width - size / 2) : x;
      const positionY = custom ? Phaser.Math.Clamp(custom.y * height, size / 2, height - size / 2) : y;
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.scene.scale.width;
      const scaleY = canvasRect.height / this.scene.scale.height;
      button.style.left = `${canvasRect.left + positionX * scaleX - size * scaleX / 2}px`;
      button.style.top = `${canvasRect.top + positionY * scaleY - size * scaleY / 2}px`;
      button.style.width = `${size * scaleX}px`;
      button.style.height = `${size * scaleY}px`;
    };

    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 撤退ボタンをDOMへ追加し、押下と画面サイズ変更を監視する
     * ================================== */
    this.placeRetreat = placeButton;
    document.body.appendChild(button);
    placeButton();
    const resizeObserver = new ResizeObserver(placeButton);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', placeButton);

    // DOM controls must follow the same pause state as the canvas bag button.
    const hideButton = (): void => {
      button.disabled = true;
      button.hidden = true;
    };
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 戦闘の再開に合わせて撤退ボタンを表示する
     * ================================== */
    const showButton = (): void => {
      button.disabled = false;
      button.hidden = false;
      placeButton();
    };
    this.scene.events.on(Phaser.Scenes.Events.PAUSE, hideButton);
    this.scene.events.on(Phaser.Scenes.Events.SLEEP, hideButton);
    this.scene.events.on(Phaser.Scenes.Events.RESUME, showButton);
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 画面の休止・終了時に撤退ボタンとイベントを片付ける
     * ================================== */
    this.scene.events.on(Phaser.Scenes.Events.WAKE, showButton);

    button.addEventListener('click', () => {
      if (!this.scene.sys.isActive() || this.scene.scene.isActive(SCENE_KEYS.INVENTORY) || this.retreatDialog) return;
      this.retreatDialog = this.createRetreatDialog();
      this.scene.scene.pause(SCENE_KEYS.STAGE);
    });

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.events.off(Phaser.Scenes.Events.PAUSE, hideButton);
      this.scene.events.off(Phaser.Scenes.Events.SLEEP, hideButton);
      this.scene.events.off(Phaser.Scenes.Events.RESUME, showButton);
      this.scene.events.off(Phaser.Scenes.Events.WAKE, showButton);
      resizeObserver.disconnect();
      window.removeEventListener('resize', placeButton);
      button.remove();
      this.retreatDialog?.remove();
      this.retreatDialog = null;
    });
  }

  private createRetreatDialog(): HTMLDivElement {
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : Canvasを覆う撤退確認用の暗い背景を作る
     * ================================== */
    const largeMenu = loadDisplaySettings().menuButtonSize === 'large';
    const canvasRect = this.scene.game.canvas.getBoundingClientRect();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '撤退確認');
    Object.assign(dialog.style, {
      position: 'fixed',
      left: `${canvasRect.left}px`,
      top: `${canvasRect.top}px`,
      width: `${canvasRect.width}px`,
      height: `${canvasRect.height}px`,
      zIndex: '10001',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.55)',
      fontFamily: 'Yu Mincho, YuMincho, serif'
    });

    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 撤退確認パネルの素材・大きさ・配置を設定する
     * ================================== */
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      boxSizing: 'border-box',
      width: largeMenu ? 'min(780px, 94%)' : 'min(650px, 90%)',
      minHeight: largeMenu ? 'min(330px, 88%)' : 'min(280px, 84%)',
      maxHeight: '94%',
      overflowY: 'auto',
      padding: 'clamp(14px, 4vh, 30px) 18px',
      border: 'solid transparent',
      borderWidth: '20px 28px',
      borderImage: `url("${retreatPanel}") 220 330 fill / 20px 28px / 0 stretch`,
      borderRadius: '0',
      background: 'transparent',
      imageRendering: 'pixelated',
      color: '#45301e',
      boxShadow: 'none',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'clamp(10px, 3vh, 20px)'
    });
    const title = document.createElement('div');
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 撤退の確認文・注意書き・選択ボタンの領域を作る
     * ================================== */
    title.textContent = 'ステージから撤退しますか？';
    Object.assign(title.style, { fontSize: largeMenu ? 'clamp(24px, 3.5vw, 38px)' : 'clamp(20px, 3vw, 32px)', fontWeight: 'bold' });
    const warning = document.createElement('div');
    warning.textContent = '進行状況が失われます。';
    Object.assign(warning.style, { fontSize: largeMenu ? 'clamp(19px, 2.5vw, 28px)' : 'clamp(16px, 2vw, 24px)', color: '#795331' });
    const actions = document.createElement('div');
    Object.assign(actions.style, { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', width: '100%', gap: '12px' });
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    const makeAction = (label: string, onClick: () => void): HTMLButtonElement => {
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = label;
      Object.assign(action.style, {
        minWidth: '0',
        minHeight: largeMenu ? '64px' : '48px',
        padding: '8px 4px',
        border: 'solid transparent',
        borderWidth: '0 18px',
        borderImage: `url("${retreatButtonNormal}") 0 450 fill / 0 18px / 0 stretch`,
        borderRadius: '0',
        background: 'transparent',
        imageRendering: 'pixelated',
        color: '#f5e6c5',
        font: largeMenu ? 'bold clamp(18px, 2.6vw, 25px) Meiryo, sans-serif' : 'bold clamp(14px, 2vw, 20px) Meiryo, sans-serif',
        cursor: 'pointer'
      });
      action.addEventListener('click', onClick);
      action.addEventListener('pointerdown', () => { action.style.borderImageSource = `url("${retreatButtonPressed}")`; });
      action.addEventListener('pointerup', () => { action.style.borderImageSource = `url("${retreatButtonNormal}")`; });
      action.addEventListener('pointerenter', () => { action.style.borderImageSource = `url("${retreatButtonHover}")`; });
      action.addEventListener('pointerleave', () => { action.style.borderImageSource = `url("${retreatButtonNormal}")`; });
      return action;
    };
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 撤退確認を閉じ、ステージ選択へ移動または戦闘を再開する
     * ================================== */
    let closing = false;
    const closeDialog = (retreat: boolean): void => {
      if (closing) return;
      playUiSe(this.scene, 'cancel', 0.5);
      closing = true;
      dialog.style.pointerEvents = 'none';
      let finished = false;
      const finish = (): void => {
        if (finished) return;
        finished = true;
        if (!dialog.isConnected) return;
        dialog.remove();
        this.retreatDialog = null;
        if (retreat) transitionWithLoading(this.scene, SCENE_KEYS.SELECT_STAGE);
        else this.scene.scene.resume(SCENE_KEYS.STAGE);
      };
      if (!retreat || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof dialog.animate !== 'function') {
        finish();
        return;
      }
      panel.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)' }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
      const animation = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
      animation.finished.then(finish, finish);
      window.setTimeout(finish, 250);
    };
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 画像・文字・パネルを配置する
     * ================================== */
    actions.append(
      makeAction('キャンセル', () => closeDialog(false)),
      makeAction('撤退する', () => closeDialog(true))
    );
    panel.append(title, warning, actions);
    dialog.append(panel);
    document.body.append(dialog);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof dialog.animate === 'function') {
      dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
      panel.animate([{ transform: 'translateY(-28px)' }, { transform: 'translateY(0)' }], { duration: 150, easing: 'ease-out' });
    }
    return dialog;
  }

  private createPartyHud(): void {
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 編成中の花の名前・画像・MP・スキル操作を配置する
     * ================================== */
    const formation = this.formation;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const gap = 10;
    const totalW = Math.min(width * 0.72, 700);
    const cardW = (totalW - gap * 3) / 4;
    const cardH = 150;
    const left = Math.max(16, Math.min(220, width - totalW - 16));
    const top = height - cardH - 18;

    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    for (let i = 0; i < 4; i++) {
      const x = left + i * (cardW + gap);
      const character = this.flowers.find(c => c.id === formation[i]);
      if (!character) {
        this.flowerMpLabels.push(undefined);
        this.flowerMpBars.push(undefined);
        this.flowerMpBarLayouts.push(undefined);
        this.flowerCooldownOverlays.push(undefined);
        this.flowerSkillIconCenters.push(undefined);
        this.text(x + cardW / 2, top + cardH / 2, '＋ 空き枠', 16, '#d4dce5', 'bold').setOrigin(0.5);
        continue;
      }
      this.text(x + 8, top + 4, `${character.name}  Lv.${character.level}`, Math.min(16, cardW / 10), '#fff4e8', 'bold')
        .setStroke('#111923', 5);
      this.text(x + 8, top + 27, 'MP', 12, '#b9e6ee', 'bold').setStroke('#111923', 4);
      const mpLabel = this.text(x + cardW - 8, top + 27, '', 12, '#f5f0e8').setOrigin(1, 0)
        .setStroke('#111923', 4);
      const mpBar = this.bar(
        x + 8,
        top + 49,
        cardW - 16,
        8,
        this.flowerMp.get(character.id) ?? 0,
        character.stats.mp,
        0x38c4dc
      );
      this.flowerMpLabels.push(mpLabel);
      this.flowerMpBars.push(mpBar);
      this.flowerMpBarLayouts.push({ x: x + 8, y: top + 49, width: cardW - 16 });
      this.scene.add.image(x + 53, top + 108, `stage-flower-${character.id}`)
        .setDisplaySize(86, 86).setScrollFactor(0).setDepth(this.depth + 2);
      const skillX = x + cardW - 39;
      const skillY = top + cardH - 38;
      this.scene.add.rectangle(skillX, skillY, 72, 72, 0x101923, 0.96)
        .setStrokeStyle(2, 0xe0c184, 1).setScrollFactor(0).setDepth(this.depth + 3);
      if (this.scene.textures.exists(`flower-skill-${character.id}`)) {
        this.scene.add.image(skillX, skillY, `flower-skill-${character.id}`)
          .setDisplaySize(64, 64).setScrollFactor(0).setDepth(this.depth + 4);
      } else this.text(skillX, skillY, '準備中', 12, '#d4dce5').setOrigin(0.5);
      const cooldownOverlay = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth + 5);
      this.flowerCooldownOverlays.push(cooldownOverlay);
      this.flowerSkillIconCenters.push({ x: skillX, y: skillY });
      this.scene.add.zone(skillX, skillY, 72, 72).setName('stage-skill')
        .setScrollFactor(0).setDepth(this.depth + 10).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.selectFlower(i);
          this.useSelectedFlowerSkill(i);
        });
      this.updateFlowerMp(i, character);
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 選択内容と一覧表示を切り替える
   * ================================== */
  private selectFlower(index: number): void {
    this.selectedFlower = index;
    this.updateSkillLabel();
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 主人公の状態効果と表示終了時刻を登録する
   * ================================== */
  private setPlayerStatuses(statusIds: string[], durationMs: number): void {
    if (durationMs <= 0) return;
    const expiresAt = battleNow(this.scene) + durationMs;
    statusIds.forEach(statusId => {
      this.playerStatusUntil.set(statusId, Math.max(this.playerStatusUntil.get(statusId) ?? 0, expiresAt));
    });
    this.renderPlayerStatuses();
    this.scene.time.delayedCall(durationMs + 30, () => this.renderPlayerStatuses());
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 主人公の状態効果アイコンをHPパネルへ表示する
   * ================================== */
  private renderPlayerStatuses(): void {
    const container = this.playerStatusContainer;
    const untilByStatus = this.playerStatusUntil;
    if (!container) return;
    container.removeAll(true);
    for (const [statusId, until] of untilByStatus) {
      if (until <= battleNow(this.scene)) untilByStatus.delete(statusId);
    }
    const active = [...untilByStatus.keys()];
    active.forEach((statusId, slot) => {
      const definition = statusDefinitions.get(statusId);
      if (!definition) return;
      const tint = this.getStatusTint(definition.tone);
      const x = slot * 27;
      const badge = this.scene.add.rectangle(x + 11, 0, 24, 24, tint, 0.9)
        .setStrokeStyle(2, 0xffecd0, 0.95);
      const iconName = definition.icon.replace('{stack}', '1');
      const icon = this.scene.add.image(x + 11, 0, `status-${iconName}`).setDisplaySize(20, 20);
      container.add([badge, icon]);
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 強化・弱体などの区分に対応する表示色を返す
   * ================================== */
  private getStatusTint(tone: string): number {
    switch (tone) {
      case 'buff': return 0xc94f53;
      case 'debuff': return 0x3978be;
      case 'poison': return 0x54934c;
      case 'weak': return 0x836bb0;
      case 'silence': return 0x587b9e;
      case 'faint': return 0x687381;
      case 'decline': return 0x947349;
      case 'stone': return 0x81848b;
      default: return 0x77699d;
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 移動パッドと方向入力を設定する
   * ================================== */
  private createMovementPad(): void {
    const x = Math.max(120, this.scene.scale.width * 0.105);
    const y = this.scene.scale.height - Math.min(166, this.scene.scale.height * 0.22);
    const radius = Math.min(78, this.scene.scale.height * 0.105);
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth);
    g.fillStyle(0x101d2c, 0.72).fillCircle(x, y, radius);
    g.lineStyle(2, 0xf5dfc1, 0.8).strokeCircle(x, y, radius);
    g.lineStyle(1, 0xf5dfc1, 0.5).strokeCircle(x, y, radius * 0.42);
    const arrows = [['▲', x, y - radius * 0.62], ['▼', x, y + radius * 0.62], ['◀', x - radius * 0.62, y], ['▶', x + radius * 0.62, y]] as const;
    arrows.forEach(([label, ax, ay]) => this.text(ax, ay, label, 17, '#eadbc8', 'bold').setOrigin(0.5));
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 攻撃・ジャンプなどの戦闘操作ボタンを配置する
   * ================================== */
  private createActionButtons(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const baseX = w - 72;
    this.createGuardButton(baseX - 90, h - 199);
    //攻撃
    this.imageButton(baseX - 154, h - 94, 130, '', 'stage-attack', () => this.player?.attack(this.enemies));
    // Flower cards are the skill buttons; this label reports the selected flower's skill state.
    this.skillNameText = this.text(w - 190, h - 282, '', 14, '#fff4e8', 'bold').setOrigin(1, .5).setWordWrapWidth(150);
    this.updateSkillLabel();
    this.scene.time.addEvent({ delay: 50, loop: true, callback: () => this.updateSkillLabel() });
    //ジャンプ
    this.imageButton(baseX - 40, h - 64, 130, '', 'stage-jump', () => this.player?.jump());
    this.applyControlLayout();
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 押している間の防御と指を離したときの解除を設定する
   * ================================== */
  private createGuardButton(x: number, y: number): void {
    const key = 'stage-guard';
    ensureGuardButtonTexture(this.scene);
    const button = this.imageButton(x, y, 106, '', key, () => {}, held => this.player?.setGuardHeld(held));
    const label = this.text(x, y + 23, '防御', 19, '#f4dfb8', 'bold')
      .setOrigin(0.5).setDepth(this.depth + 4);
    label.setPosition(0, 23).setScrollFactor(1);
    this.controlButtons.get(key)!.container.add(label);
    this.scene.time.addEvent({ delay: 50, loop: true, callback: () => {
      const active = this.player?.isGuarding() === true;
      if (active) button.setTint(0xa0ebff);
      else button.clearTint();
      label.setText(active ? '防御中' : '防御');
    } });
  }

  private imageButton(x: number, y: number, size: number, label: string, texture: string, onClick: () => void, onHoldChange?: (held: boolean) => void): Phaser.GameObjects.Image {
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    const image = this.scene.add.image(x, y, texture).setDisplaySize(size, size)
      .setScrollFactor(0).setDepth(this.depth + 3);
    // Use a screen-fixed rectangular target independent of the PNG's transparent pixels.
    // Phaser skips fully transparent objects during input hit testing, so keep a tiny alpha.
    const hitArea = this.scene.add.rectangle(x, y, size, size, 0xffffff, 0.01).setName(texture)
      .setScrollFactor(0).setDepth(this.depth + 5)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);
    if (hitArea.input) hitArea.input.cursor = 'pointer';
    const caption = this.text(x, y + size * 0.34, label, Math.max(10, size * 0.15), '#fff4e8', 'bold')
      .setOrigin(0.5).setDepth(this.depth + 4);
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(this.depth + 5);
    image.setPosition(0, 0).setScrollFactor(1);
    // 入力判定も画面固定にし、カメラ移動後も画像と一致させる。
    hitArea.setPosition(0, 0).setScrollFactor(0);
    caption.setPosition(0, size * 0.34).setScrollFactor(1);
    container.add([image, caption, hitArea]);
    this.controlButtons.set(texture, { container, size });
    // setDisplaySize changes displayWidth/Height; preserve that base scale for hover feedback.
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
     * ================================== */
    const baseScale = image.scale;
    hitArea.on('pointerover', () => this.scene.tweens.add({ targets: image, scale: baseScale * 1.04, duration: 90 }));
    hitArea.on('pointerout', () => this.scene.tweens.add({ targets: image, scale: baseScale, duration: 90 }));
    hitArea.on('pointerdown', () => image.setScale(baseScale * 0.97));
    hitArea.on('pointerup', () => {
      image.setScale(baseScale);
      onClick();
    });
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 戦闘ボタンの押下状態と、画面外・休止時も含む解除処理を設定する
     * ================================== */
    hitArea.on('pointerupoutside', () => image.setScale(baseScale));
    if (onHoldChange) {
      let heldPointer: Phaser.Input.Pointer | null = null;
      const release = (): void => {
        if (!heldPointer) return;
        heldPointer = null;
        image.setScale(baseScale);
        onHoldChange(false);
      };
      hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (heldPointer || (!pointer.wasTouch && pointer.button !== 0)) return;
        heldPointer = pointer;
        onHoldChange(true);
      });
      const releasePointer = (pointer: Phaser.Input.Pointer): void => {
        if (pointer === heldPointer) release();
      };
      const checkRelease = (): void => {
        if (heldPointer && (!heldPointer.isDown || !this.scene.input.enabled)) release();
      };
      // Keep guarding while held, even when dragged off the button. Release anywhere.
      this.scene.input.on('pointerup', releasePointer);
      this.scene.input.on('pointerupoutside', releasePointer);
      this.scene.input.on('gameout', release);
      this.scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, checkRelease);
      this.scene.events.on(Phaser.Scenes.Events.PAUSE, release);
      this.scene.events.on(Phaser.Scenes.Events.SLEEP, release);
      window.addEventListener('blur', release);
      this.scene.game.canvas.addEventListener('touchcancel', release);
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        release();
        this.scene.input.off('pointerup', releasePointer);
        this.scene.input.off('pointerupoutside', releasePointer);
        this.scene.input.off('gameout', release);
        this.scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, checkRelease);
        this.scene.events.off(Phaser.Scenes.Events.PAUSE, release);
        this.scene.events.off(Phaser.Scenes.Events.SLEEP, release);
        window.removeEventListener('blur', release);
        this.scene.game.canvas.removeEventListener('touchcancel', release);
      });
    }
    return image;
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : MPと再使用時間を確認してスキルを発動する
   * ================================== */
  private useSelectedFlowerSkill(index = this.selectedFlower): void {
    const formationId = this.formation[index];
    const flower = this.flowers.find(character => character.id === formationId);
    if (!flower || !this.player) return;
    const cooldownUntil = this.flowerCooldownUntil.get(flower.id) ?? 0;
    if (cooldownUntil > battleNow(this.scene)) {
      if (!this.scene.sound.getAllPlaying().some(sound => sound.key === 'skill-cooldown')) {
        playSe(this.scene, 'skill-cooldown', 0.35);
      }
      this.skillNameText?.setText(`再使用まで${Math.ceil((cooldownUntil - battleNow(this.scene)) / 1000)}秒`);
      return;
    }
    if (!this.flowerSkills.has(flower.id)) {
      this.skillNameText?.setText(this.isReady ? 'この花のスキルは未実装です。' : 'スキルを読み込み中');
      return;
    }
    const skill = this.flowerSkills.get(flower.id);
    if (!skill) {
      this.skillNameText?.setText('スキルを読み込めません');
      return;
    }
    const currentMp = this.flowerMp.get(flower.id) ?? 0;
    if (currentMp < skill.mpCost) {
      this.notice = 'MPが足りません';
      this.noticeUntil = battleNow(this.scene) + 1500;
      this.skillNameText?.setText(this.notice);
      return;
    }
    if (!this.player.reserveSkill()) return;
    const redMaple = skill.type === 'maple' && this.player.isMapleRed;

    this.flowerMp.set(flower.id, currentMp - skill.mpCost);
    this.flowerCooldownUntil.set(flower.id, battleNow(this.scene) + skill.cooldownSeconds * 1000);
    this.flowerCooldownDuration.set(flower.id, skill.cooldownSeconds * 1000);
    this.updateFlowerMp(index, flower);
    if (!this.player.useFlowerSkill(skill, this.enemies)) {
      this.player.cancelReservedSkill();
      this.flowerMp.set(flower.id, currentMp);
      this.flowerCooldownUntil.set(flower.id, cooldownUntil);
      this.updateFlowerMp(index, flower);
      this.skillNameText?.setText('スキル効果を反映できませんでした。');
      return;
    }
    const duration = skill.durationMs || 1500;
    const appliedStatuses = skillStatusIds.get(flower.id) ?? [];
    // Enemy debuffs must not be displayed as a debuff on the caster.
    if (skill.type !== 'slowAttack' && !redMaple) {
      this.scene.time.delayedCall(160, () => {
        if (this.player && this.player.health > 0) this.setPlayerStatuses(appliedStatuses, duration);
      });
    }
    this.updateSkillLabel();
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 選択スキルの名前・再使用待ち・エラーを表示する
   * ================================== */
  private updateSkillLabel(): void {
    if (!this.skillNameText) return;
    const formationId = this.formation[this.selectedFlower];
    const flower = this.flowers.find(character => character.id === formationId);
    const skill = flower
      ? this.flowerSkills.get(flower.id) ?? getFlowerSkill(flower.id)
      : undefined;
    if (this.skillLoadError) { this.skillNameText.setText(this.skillLoadError); return; }
    this.skillNameText.setText(skill?.name ?? '花を選択');
    this.updateCooldownOverlays();
    if (battleNow(this.scene) < this.noticeUntil) { this.skillNameText.setText(this.notice); return; }
    const cooldownUntil = flower ? this.flowerCooldownUntil.get(flower.id) ?? 0 : 0;
    if (cooldownUntil > battleNow(this.scene)) {
      this.skillNameText.setText(`${skill?.name ?? 'スキル'} ${Math.ceil((cooldownUntil - battleNow(this.scene)) / 1000)}秒`);
    }
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : DBの育成値で編成・主人公・花スキルを初期化し、取得成功後に操作UIを有効にする
   * ================================== */
  private async initializeFlowerSkills(stageId: number): Promise<void> {
    if (this.skillNameText) this.skillNameText.setText('スキル読み込み中…');
    try {
      const flowers = testData.characters.map(flower => ({
        flowerId: flower.id,
        level: flower.level,
        attackPower: flower.stats.atk
      }));
      const battle = await beginStageSkillStates(stageId, flowers, this.formation);
      if (this.disposed) return;
      this.formation = battle.formation;
      this.flowers = import.meta.env.DEV && isBattlePreview ? testData.characters : battle.flowers.flatMap(saved => {
        const definition = testData.characters.find(flower => flower.id === saved.flowerId);
        return definition ? [{ ...definition, level: saved.level, stats: { ...definition.stats, ...saved.stats } }] : [];
      });
      const selected = new Set(this.formation.filter(id => id !== null));
      this.player?.applyFlowerStats(battle.flowers.filter(flower => selected.has(flower.flowerId)).map(flower => flower.stats));
      battle.skills.forEach(state => {
        this.flowerMp.set(state.flowerId, state.mp);
        this.flowerMaxMp.set(state.flowerId, state.maxMp);
        this.flowerCooldownUntil.set(state.flowerId, battleNow(this.scene) + Math.max(0, state.cooldownUntil - Date.now()));
        this.flowerSkills.set(state.flowerId, state.skill);
        this.flowerCooldownDuration.set(state.flowerId, state.skill.cooldownSeconds * 1000);
        const formationIndex = this.formation.indexOf(state.flowerId);
        const flower = this.flowers.find(character => character.id === state.flowerId);
        if (formationIndex >= 0 && flower) this.updateFlowerMp(formationIndex, flower);
      });
      this.createStatusPanel();
      this.createPartyHud();
      this.createMovementPad();
      this.createActionButtons();
      this.isReady = true;
      this.updateSkillLabel();
      if (import.meta.env.DEV && isBattlePreview && this.player) {
        const { attachPreviewControls } = await import('./SkillPreview');
        if (!this.disposed) attachPreviewControls(this.scene, this.player, this.flowerSkills, this.enemies);
      }
    } catch (error) {
      if (this.disposed) return;
      const message = error instanceof Error ? error.message : 'スキルデータを読み込めませんでした。';
      this.skillLoadError = message;
      const errorLabel = this.text(24, 145, `育成データを読み込めません。${message}\nここを押して再試行できます。`, 16, '#ffb4a2');
      errorLabel.setWordWrapWidth(650).setInteractive({ useHandCursor: true }).once('pointerdown', () => {
        errorLabel.destroy(); this.skillLoadError = '';
        trackSceneLoading(this.scene, this.initializeFlowerSkills(stageId));
      });
      console.error('Flower skill state loading failed:', error);
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : スキルの再使用待ち時間をアイコン上に表示する
   * ================================== */
  private updateCooldownOverlays(): void {
    const now = battleNow(this.scene);
    this.flowerCooldownOverlays.forEach((overlay, index) => {
      const center = this.flowerSkillIconCenters[index];
      if (!overlay || !center) return;
      const flowerId = this.formation[index];
      if (typeof flowerId !== 'number') return;
      const remaining = (this.flowerCooldownUntil.get(flowerId) ?? 0) - now;
      const duration = this.flowerCooldownDuration.get(flowerId) ?? 0;
      const progress = duration > 0 ? Phaser.Math.Clamp(remaining / duration, 0, 1) : 0;
      overlay.clear();
      if (progress > 0) {
        // A dark cover recedes from the top as the skill becomes ready.
        overlay.fillStyle(0x07101b, 0.7);
        overlay.fillRect(center.x - 32, center.y - 32, 64, 64 * progress);
      }
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 花の現在MPとMPゲージを更新する
   * ================================== */
  private updateFlowerMp(index: number, flower: CharacterData): void {
    const currentMp = this.flowerMp.get(flower.id) ?? 0;
    const maximumMp = this.flowerMaxMp.get(flower.id) ?? flower.stats.mp;
    const label = this.flowerMpLabels[index];
    if (label) label.setText(`${currentMp}/${maximumMp}`);

    const bar = this.flowerMpBars[index];
    const layout = this.flowerMpBarLayouts[index];
    if (bar && layout) {
      const fillWidth = layout.width * Phaser.Math.Clamp(maximumMp > 0 ? currentMp / maximumMp : 0, 0, 1);
      bar.setSize(fillWidth, 8).setPosition(layout.x + fillWidth / 2, layout.y + 4);
    }
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 角丸の戦闘HUDパネルと枠線を描く
   * ================================== */
  private panel(x: number, y: number, w: number, h: number, radius: number, alpha = 0.94, highlight = false): void {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth);
    g.fillStyle(0x06121f, 0.36).fillRoundedRect(x, y + 4, w, h, radius);
    g.fillStyle(0x14283e, alpha).fillRoundedRect(x, y, w, h, radius);
    g.lineStyle(highlight ? 2 : 1, highlight ? 0xffc968 : 0xd5c3a8, highlight ? 0.95 : 0.65)
      .strokeRoundedRect(x, y, w, h, radius);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 位置・大きさ・色を指定して文字を生成する
   * ================================== */
  private text(x: number, y: number, value: string, size: number, color: string, fontStyle?: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, value, getTextStyle(size, {
      color, fontStyle,
      fontFamily: 'Yu Mincho, YuMincho, serif',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    })).setScrollFactor(0).setDepth(this.depth + 1);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 現在値と最大値の比率でゲージを描く
   * ================================== */
  private bar(x: number, y: number, w: number, h: number, value: number, max: number, color: number): Phaser.GameObjects.Rectangle | undefined {
    this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x091521, 0.95).setScrollFactor(0).setDepth(this.depth + 1);
    const fill = w * Phaser.Math.Clamp(max > 0 ? value / max : 0, 0, 1);
    if (fill <= 0) return undefined;
    return this.scene.add.rectangle(x + fill / 2, y + h / 2, fill, h, color)
      .setScrollFactor(0)
      .setDepth(this.depth + 2);
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 戦闘を一時停止してバッグを開く
   * ================================== */
  // 担当：250056 斎藤永聖。設定中は戦闘を停止し、閉じると同じ戦闘を再開する。
  private openSettings(): void {
    if (isBattlePreview) return;
    if (this.scene.scene.isActive(SCENE_KEYS.SETTINGS)) return;
    this.scene.scene.launch(SCENE_KEYS.SETTINGS, {
      returnScene: SCENE_KEYS.STAGE,
      resumeOnClose: true,
    });
    this.scene.scene.bringToTop(SCENE_KEYS.SETTINGS);
    this.scene.scene.pause(SCENE_KEYS.STAGE);
  }

  private openInventory(): void {
    if (isBattlePreview) return;
    if (this.scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;
    this.scene.scene.launch(SCENE_KEYS.INVENTORY, { returnScene: SCENE_KEYS.STAGE });
    this.scene.scene.bringToTop(SCENE_KEYS.INVENTORY);
    this.scene.scene.pause(SCENE_KEYS.STAGE);
  }
}
