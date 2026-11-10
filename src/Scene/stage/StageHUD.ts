/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜戦闘画面UIと操作ボタン
import { isBattlePreview } from '../../debug';
import { battleNow } from './BattleClock';
import { playUiSe } from '../../audio/BgmManager';
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
  private readonly depth = 2000;
  private readonly scene: Phaser.Scene;
  private readonly player?: Player;
  private readonly enemies: readonly CombatTarget[];
  private readonly formation = loadFormation();
  private selectedFlower = 0;
  private readonly partySelectionBorders: Phaser.GameObjects.Graphics[] = [];
  private readonly partyStatusContainers: Array<Phaser.GameObjects.Container | undefined> = [];
  private readonly partyStatusUntil = Array.from({ length: 4 }, () => new Map<string, number>());
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

  constructor(scene: Phaser.Scene, player?: Player, enemies: readonly CombatTarget[] = []) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.disposed = true; });
    if (this.player) {
      const effects = this.effects = new SkillEffects(scene, this.player);
      this.player.setSkillVisualHandler((skill, phase, targets, area) => effects.play(skill, phase, targets, area));
    }
  }

  public create(stageId?: number, stageNumber?: string): void {
    this.createStatusPanel();
    this.createStageLabel(stageId, stageNumber);
    this.createUtilityButtons();
    this.createPartyHud();
    this.createMovementPad();
    this.createActionButtons();
    void this.initializeFlowerSkills(stageId ?? 2);
  }

  public updateHealth(current: number, maximum: number): void {
    if (!this.hpBar) return;
    const width = this.hpBarWidth * Phaser.Math.Clamp(maximum > 0 ? current / maximum : 0, 0, 1);
    this.hpBar.setSize(width, this.hpBarHeight)
      .setPosition(this.hpBarX + width / 2, this.hpBarY + this.hpBarHeight / 2);
  }

  private createStatusPanel(): void {
    const leader = testData.characters.find(c => c.id === this.formation[0]);
    if (!leader) return;
    const w = this.scene.scale.width;
    const compact = w < 760;
    const x = compact ? 12 : 24;
    const y = 18;
    const panelW = compact ? 214 : 330;
    const panelH = compact ? 80 : 96;
    this.panel(x, y, panelW, panelH, 14);
    this.text(x + 16, y + 10, `${leader.name}  Lv.${leader.level}`, compact ? 13 : 17, '#fff', 'bold');
    if (this.player) {
      /* === [ 担当 : 250056 斎藤永聖 ] ===
       * 処理内容 : 回復中アイコンと宝石の強化アイコンを生成し、効果イベント・更新処理に連動させ、終了時にイベントを解除する（演出の一部は共同編集）。
       * ================================== */
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
    this.text(x + 16, y + 37, 'HP', 12, '#ff9bad', 'bold');
    this.hpBarX = x + 50;
    this.hpBarY = y + 40;
    this.hpBarWidth = panelW - (compact ? 66 : 88);
    this.hpBarHeight = 9;
    this.hpBar = this.bar(
      this.hpBarX,
      this.hpBarY,
      this.hpBarWidth,
      this.hpBarHeight,
      this.player?.health ?? 100,
      this.player?.maxHealth ?? 100,
      0xf05b86
    );
    this.text(x + 16, y + 59, 'MP', 12, '#7ee6fa', 'bold');
    this.bar(x + 50, y + 62, panelW - (compact ? 66 : 88), 9, leader.stats.mp, leader.stats.mp, 0x32bddb);
  }

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

  private createUtilityButtons(): void {
    this.imageButton(72, 170, 74, '', 'stage-bag', () => this.openInventory());
    const x = this.scene.scale.width - 68;
    this.createRetreatDomButton(x, 282, 76);
  }

  private createRetreatDomButton(x: number, y: number, size: number): void {
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

    const placeButton = (): void => {
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.scene.scale.width;
      const scaleY = canvasRect.height / this.scene.scale.height;
      button.style.left = `${canvasRect.left + x * scaleX - size * scaleX / 2}px`;
      button.style.top = `${canvasRect.top + y * scaleY - size * scaleY / 2}px`;
      button.style.width = `${size * scaleX}px`;
      button.style.height = `${size * scaleY}px`;
    };

    document.body.appendChild(button);
    placeButton();
    const resizeObserver = new ResizeObserver(placeButton);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', placeButton);

    // DOM controls must follow the same pause state as the canvas bag button.
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 停止・スリープ中はDOMの撤退ボタンを無効化し、再開時に表示位置と操作を復旧する。
     * ================================== */
    const hideButton = (): void => {
      button.disabled = true;
      button.hidden = true;
    };
    const showButton = (): void => {
      button.disabled = false;
      button.hidden = false;
      placeButton();
    };
    this.scene.events.on(Phaser.Scenes.Events.PAUSE, hideButton);
    this.scene.events.on(Phaser.Scenes.Events.SLEEP, hideButton);
    this.scene.events.on(Phaser.Scenes.Events.RESUME, showButton);
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

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      boxSizing: 'border-box',
      width: 'min(650px, 90%)',
      /* === [ 担当 : 250056 斎藤永聖 ] ===
       * 処理内容 : 撤退確認の紙枠・余白・表示上限を調整し、小さい画面でも内容を閲覧できるようにする。
       * ================================== */
      minHeight: 'min(280px, 84%)',
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
    title.textContent = 'ステージから撤退しますか？';
    Object.assign(title.style, { fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 'bold' });
    const warning = document.createElement('div');
    warning.textContent = '進行状況が失われます。';
    Object.assign(warning.style, { fontSize: 'clamp(16px, 2vw, 24px)', color: '#795331' });
    const actions = document.createElement('div');
    Object.assign(actions.style, { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', width: '100%', gap: '12px' });
    const makeAction = (label: string, onClick: () => void): HTMLButtonElement => {
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = label;
      Object.assign(action.style, {
        minWidth: '0',
        minHeight: '48px',
        padding: '8px 4px',
        border: 'solid transparent',
        borderWidth: '0 18px',
        borderImage: `url("${retreatButtonNormal}") 0 450 fill / 0 18px / 0 stretch`,
        borderRadius: '0',
        background: 'transparent',
        imageRendering: 'pixelated',
        color: '#f5e6c5',
        font: 'bold clamp(14px, 2vw, 20px) Meiryo, sans-serif',
        cursor: 'pointer'
      });
      action.addEventListener('click', onClick);
      action.addEventListener('pointerdown', () => { action.style.borderImageSource = `url("${retreatButtonPressed}")`; });
      action.addEventListener('pointerup', () => { action.style.borderImageSource = `url("${retreatButtonNormal}")`; });
      action.addEventListener('pointerenter', () => { action.style.borderImageSource = `url("${retreatButtonHover}")`; });
      action.addEventListener('pointerleave', () => { action.style.borderImageSource = `url("${retreatButtonNormal}")`; });
      return action;
    };
    let closing = false;
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 撤退確認の多重終了を防ぎ、閉じる演出後にキャンセルなら戦闘再開、撤退ならステージ選択へ移動する。
     * ================================== */
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
        if (retreat) this.scene.scene.start(SCENE_KEYS.SELECT_STAGE);
        else this.scene.scene.resume(SCENE_KEYS.STAGE);
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof dialog.animate !== 'function') {
        finish();
        return;
      }
      panel.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)' }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
      const animation = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
      animation.finished.then(finish, finish);
      window.setTimeout(finish, 250);
    };
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
    const formation = this.formation;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const gap = 10;
    const totalW = Math.min(width * 0.72, 750);
    const cardW = (totalW - gap * 3) / 4;
    const cardH = 150;
    const left = Math.max(16, Math.min(220, width - totalW - 16));
    const top = height - cardH - 18;

    for (let i = 0; i < 4; i++) {
      const x = left + i * (cardW + gap);
      const character = testData.characters.find(c => c.id === formation[i]);
      const border = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth + 2);
      this.partySelectionBorders.push(border);
      this.drawPartySelection(border, x, top, cardW, cardH, i === this.selectedFlower);
      if (!character) {
        this.flowerMpLabels.push(undefined);
        this.flowerMpBars.push(undefined);
        this.flowerMpBarLayouts.push(undefined);
        this.partyStatusContainers.push(undefined);
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
      this.scene.add.image(skillX, skillY, `flower-skill-${character.id}`)
        .setDisplaySize(64, 64).setScrollFactor(0).setDepth(this.depth + 4);
      const cooldownOverlay = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth + 5);
      this.flowerCooldownOverlays.push(cooldownOverlay);
      this.flowerSkillIconCenters.push({ x: skillX, y: skillY });
      this.scene.add.zone(skillX, skillY, 72, 72)
        .setScrollFactor(0).setDepth(this.depth + 10).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.selectFlower(i, cardH);
          this.useSelectedFlowerSkill(i);
        });
      const statusContainer = this.scene.add.container(x + 8, top + 76)
        .setScrollFactor(0).setDepth(this.depth + 5);
      this.partyStatusContainers.push(statusContainer);
      this.updateFlowerMp(i, character);
    }
  }

  private selectFlower(index: number, height: number): void {
    this.selectedFlower = index;
    this.partySelectionBorders.forEach((border, i) => {
      // Card positions are evenly spaced; derive each border rectangle from its index.
      const gap = 10;
      const totalW = Math.min(this.scene.scale.width * 0.72, 750);
      const cardW = (totalW - gap * 3) / 4;
      const left = Math.max(16, Math.min(220, this.scene.scale.width - totalW - 16));
      const top = this.scene.scale.height - height - 18;
      this.drawPartySelection(border, left + i * (cardW + gap), top, cardW, height, i === index);
    });
    this.updateSkillLabel();
  }

  private drawPartySelection(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, selected: boolean): void {
    graphics.clear();
    if (selected) graphics.lineStyle(2, 0xffc968, 0.98).strokeRoundedRect(x, y, width, height, 11);
  }

  private setPartyStatuses(index: number, statusIds: string[], durationMs: number): void {
    if (durationMs <= 0) return;
    const untilByStatus = this.partyStatusUntil[index];
    statusIds.forEach(statusId => untilByStatus.set(statusId, battleNow(this.scene) + durationMs));
    this.renderPartyStatuses(index);
    this.scene.time.delayedCall(durationMs + 30, () => this.renderPartyStatuses(index));
  }

  private renderPartyStatuses(index: number): void {
    const container = this.partyStatusContainers[index];
    const untilByStatus = this.partyStatusUntil[index];
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

  private createActionButtons(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const baseX = w - 72;
    this.createGuardButton(baseX - 90, h - 199);
    //攻撃
    this.imageButton(baseX - 154, h - 94, 130, '', 'stage-attack', () => this.player?.attack(this.enemies));
    // Flower cards are the skill buttons; this label reports the selected flower's skill state.
    this.skillNameText = this.text(w - 24, h - 295, '', 14, '#fff4e8', 'bold').setOrigin(1, .5).setWordWrapWidth(240);
    this.updateSkillLabel();
    this.scene.time.addEvent({ delay: 50, loop: true, callback: () => this.updateSkillLabel() });
    //ジャンプ
    this.imageButton(baseX - 40, h - 64, 130, '', 'stage-jump', () => this.player?.jump());
  }

  private createGuardButton(x: number, y: number): void {
    const key = 'stage-guard';
    if (!this.scene.textures.exists(key)) {
      const art = this.scene.make.graphics({ x: 0, y: 0 }, false);
      art.fillStyle(0x202a37).fillCircle(60, 60, 55);
      art.lineStyle(2, 0xe5d4a5).strokeCircle(60, 60, 54);
      art.lineStyle(1, 0xbca780).strokeCircle(60, 60, 50);
      for (const [px, py] of [[60, 9], [111, 60], [60, 111], [9, 60]]) {
        art.strokePoints([{ x: px, y: py - 4 }, { x: px + 4, y: py },
          { x: px, y: py + 4 }, { x: px - 4, y: py }], true);
      }
      art.fillStyle(0xf4dfb8).fillPoints([{ x: 39, y: 31 }, { x: 60, y: 24 },
        { x: 81, y: 31 }, { x: 78, y: 53 }, { x: 60, y: 69 }, { x: 42, y: 53 }], true);
      art.lineStyle(2, 0x8b7458).lineBetween(60, 32, 60, 60).lineBetween(47, 43, 73, 43);
      art.generateTexture(key, 120, 120);
      art.destroy();
    }
    const button = this.imageButton(x, y, 106, '', key, () => {}, held => this.player?.setGuardHeld(held));
    const label = this.text(x, y + 23, '防御', 19, '#f4dfb8', 'bold')
      .setOrigin(0.5).setDepth(this.depth + 4);
    this.scene.time.addEvent({ delay: 50, loop: true, callback: () => {
      const active = this.player?.isGuarding() === true;
      if (active) button.setTint(0xa0ebff);
      else button.clearTint();
      label.setText(active ? '防御中' : '防御');
    } });
  }

  private imageButton(x: number, y: number, size: number, label: string, texture: string, onClick: () => void, onHoldChange?: (held: boolean) => void): Phaser.GameObjects.Image {
    const image = this.scene.add.image(x, y, texture).setDisplaySize(size, size)
      .setScrollFactor(0).setDepth(this.depth + 3);
    // Use a screen-fixed rectangular target independent of the PNG's transparent pixels.
    // Phaser skips fully transparent objects during input hit testing, so keep a tiny alpha.
    const hitArea = this.scene.add.rectangle(x, y, size, size, 0xffffff, 0.01).setName(texture)
      .setScrollFactor(0).setDepth(this.depth + 5)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);
    if (hitArea.input) hitArea.input.cursor = 'pointer';
    this.text(x, y + size * 0.34, label, Math.max(10, size * 0.15), '#fff4e8', 'bold')
      .setOrigin(0.5).setDepth(this.depth + 4);
    // setDisplaySize changes displayWidth/Height; preserve that base scale for hover feedback.
    const baseScale = image.scale;
    hitArea.on('pointerover', () => this.scene.tweens.add({ targets: image, scale: baseScale * 1.04, duration: 90 }));
    hitArea.on('pointerout', () => this.scene.tweens.add({ targets: image, scale: baseScale, duration: 90 }));
    hitArea.on('pointerdown', () => image.setScale(baseScale * 0.97));
    hitArea.on('pointerup', () => {
      image.setScale(baseScale);
      onClick();
    });
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

  private useSelectedFlowerSkill(index = this.selectedFlower): void {
    const formationId = this.formation[index];
    const flower = testData.characters.find(character => character.id === formationId);
    if (!flower || !this.player) return;
    const cooldownUntil = this.flowerCooldownUntil.get(flower.id) ?? 0;
    if (cooldownUntil > battleNow(this.scene)) {
      this.skillNameText?.setText(`再使用まで${Math.ceil((cooldownUntil - battleNow(this.scene)) / 1000)}秒`);
      return;
    }
    if (!this.flowerSkills.has(flower.id)) {
      this.skillNameText?.setText('スキルを読み込み中');
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
        if (this.player && this.player.health > 0) this.setPartyStatuses(index, appliedStatuses, duration);
      });
    }
    this.updateSkillLabel();
  }

  private updateSkillLabel(): void {
    if (!this.skillNameText) return;
    const formationId = this.formation[this.selectedFlower];
    const flower = testData.characters.find(character => character.id === formationId);
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

  private async initializeFlowerSkills(stageId: number): Promise<void> {
    if (this.skillNameText) this.skillNameText.setText('スキル読み込み中…');
    try {
      const flowers = testData.characters.map(flower => ({
        flowerId: flower.id,
        level: flower.level,
        attackPower: flower.stats.atk
      }));
      const states = await beginStageSkillStates(stageId, flowers);
      if (this.disposed) return;
      states.forEach(state => {
        this.flowerMp.set(state.flowerId, state.mp);
        this.flowerMaxMp.set(state.flowerId, state.maxMp);
        this.flowerCooldownUntil.set(state.flowerId, battleNow(this.scene) + Math.max(0, state.cooldownUntil - Date.now()));
        this.flowerSkills.set(state.flowerId, state.skill);
        this.flowerCooldownDuration.set(state.flowerId, state.skill.cooldownSeconds * 1000);
        const formationIndex = this.formation.indexOf(state.flowerId);
        const flower = testData.characters.find(character => character.id === state.flowerId);
        if (formationIndex >= 0 && flower) this.updateFlowerMp(formationIndex, flower);
      });
      this.updateSkillLabel();
      if (import.meta.env.DEV && isBattlePreview && this.player) {
        const { attachPreviewControls } = await import('./SkillPreview');
        if (!this.disposed) attachPreviewControls(this.scene, this.player, this.flowerSkills, this.enemies);
      }
    } catch (error) {
      if (this.disposed) return;
      const message = error instanceof Error ? error.message : 'スキルデータを読み込めませんでした。';
      this.skillLoadError = message;
      this.skillNameText?.setText(message);
      console.error('Flower skill state loading failed:', error);
    }
  }

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

  private panel(x: number, y: number, w: number, h: number, radius: number, alpha = 0.94, highlight = false): void {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth);
    g.fillStyle(0x06121f, 0.36).fillRoundedRect(x, y + 4, w, h, radius);
    g.fillStyle(0x14283e, alpha).fillRoundedRect(x, y, w, h, radius);
    g.lineStyle(highlight ? 2 : 1, highlight ? 0xffc968 : 0xd5c3a8, highlight ? 0.95 : 0.65)
      .strokeRoundedRect(x, y, w, h, radius);
  }

  private text(x: number, y: number, value: string, size: number, color: string, fontStyle?: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, value, getTextStyle(size, {
      color, fontStyle,
      fontFamily: 'Yu Mincho, YuMincho, serif',
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    })).setScrollFactor(0).setDepth(this.depth + 1);
  }

  private bar(x: number, y: number, w: number, h: number, value: number, max: number, color: number): Phaser.GameObjects.Rectangle | undefined {
    this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x091521, 0.95).setScrollFactor(0).setDepth(this.depth + 1);
    const fill = w * Phaser.Math.Clamp(max > 0 ? value / max : 0, 0, 1);
    if (fill <= 0) return undefined;
    return this.scene.add.rectangle(x + fill / 2, y + h / 2, fill, h, color)
      .setScrollFactor(0)
      .setDepth(this.depth + 2);
  }

  private openInventory(): void {
    if (isBattlePreview) return;
    if (this.scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;
    this.scene.scene.launch(SCENE_KEYS.INVENTORY, { returnScene: SCENE_KEYS.STAGE });
    this.scene.scene.bringToTop(SCENE_KEYS.INVENTORY);
    this.scene.scene.pause(SCENE_KEYS.STAGE);
  }
}
