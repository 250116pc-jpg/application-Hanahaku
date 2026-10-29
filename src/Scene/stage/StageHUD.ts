import Phaser from 'phaser';
import { getTextStyle } from '../../utils/ui/index.ts';
import testData, { getFlowerSkill } from '../test_data.ts';
import type { CharacterData } from '../test_data.ts';
import { SCENE_KEYS } from '../sceneKeys';
import type { CombatTarget, Player } from './Player';
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
  private skillNameText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player?: Player, enemies: readonly CombatTarget[] = []) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
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
    this.createRetreatDomButton(x, 150, 76);
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
      zIndex: '10000',
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

    button.addEventListener('click', () => {
      if (this.retreatDialog) return;
      this.retreatDialog = this.createRetreatDialog();
    });

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
      minHeight: '300px',
      padding: '42px 28px',
      border: '3px solid #536878',
      borderRadius: '12px',
      background: '#fff',
      color: '#17212a',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px'
    });
    const title = document.createElement('div');
    title.textContent = 'ステージから撤退しますか？';
    Object.assign(title.style, { fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 'bold' });
    const warning = document.createElement('div');
    warning.textContent = '進行状況が失われます。';
    Object.assign(warning.style, { fontSize: 'clamp(16px, 2vw, 24px)', color: '#444' });
    const actions = document.createElement('div');
    Object.assign(actions.style, { display: 'flex', gap: '18px', justifyContent: 'center', flexWrap: 'wrap' });
    const makeAction = (label: string, onClick: () => void): HTMLButtonElement => {
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = label;
      Object.assign(action.style, {
        minWidth: '180px',
        minHeight: '58px',
        padding: '8px 18px',
        border: '2px solid #333',
        borderRadius: '8px',
        background: '#fff',
        color: '#111',
        font: 'bold 20px Yu Mincho, YuMincho, serif',
        cursor: 'pointer'
      });
      action.addEventListener('click', onClick);
      action.addEventListener('pointerenter', () => { action.style.background = '#eaf4fb'; });
      action.addEventListener('pointerleave', () => { action.style.background = '#fff'; });
      return action;
    };
    actions.append(
      makeAction('キャンセル', () => { dialog.remove(); this.retreatDialog = null; }),
      makeAction('撤退する', () => {
        dialog.remove();
        this.retreatDialog = null;
        this.scene.scene.start(SCENE_KEYS.SELECT_STAGE);
      })
    );
    panel.append(title, warning, actions);
    dialog.append(panel);
    document.body.append(dialog);
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
    statusIds.forEach(statusId => untilByStatus.set(statusId, Date.now() + durationMs));
    this.renderPartyStatuses(index);
    this.scene.time.delayedCall(durationMs + 30, () => this.renderPartyStatuses(index));
  }

  private renderPartyStatuses(index: number): void {
    const container = this.partyStatusContainers[index];
    const untilByStatus = this.partyStatusUntil[index];
    if (!container) return;
    container.removeAll(true);
    for (const [statusId, until] of untilByStatus) {
      if (until <= Date.now()) untilByStatus.delete(statusId);
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
    //攻撃
    this.imageButton(baseX - 154, h - 94, 130, '', 'stage-attack', () => this.player?.attack(this.enemies));
    // Flower cards are the skill buttons; this label reports the selected flower's skill state.
    this.skillNameText = this.text(baseX + 28, h - 230, '', 14, '#fff4e8', 'bold').setOrigin(0.5);
    this.updateSkillLabel();
    this.scene.time.addEvent({ delay: 50, loop: true, callback: () => this.updateSkillLabel() });
    //ジャンプ
    this.imageButton(baseX - 40, h - 64, 130, '', 'stage-jump', () => this.player?.jump());
  }

  private imageButton(x: number, y: number, size: number, label: string, texture: string, onClick: () => void): void {
    const image = this.scene.add.image(x, y, texture).setDisplaySize(size, size)
      .setScrollFactor(0).setDepth(this.depth + 3);
    // Use a screen-fixed rectangular target independent of the PNG's transparent pixels.
    // Phaser skips fully transparent objects during input hit testing, so keep a tiny alpha.
    const hitArea = this.scene.add.rectangle(x, y, size, size, 0xffffff, 0.01)
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
  }

  private useSelectedFlowerSkill(index = this.selectedFlower): void {
    const formationId = this.formation[index];
    const flower = testData.characters.find(character => character.id === formationId);
    if (!flower || !this.player) return;
    const cooldownUntil = this.flowerCooldownUntil.get(flower.id) ?? 0;
    if (cooldownUntil > Date.now()) {
      this.skillNameText?.setText(`再使用まで${Math.ceil((cooldownUntil - Date.now()) / 1000)}秒`);
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
      this.skillNameText?.setText('MPが足りません');
      return;
    }
    if (!this.player.reserveSkill()) return;

    this.flowerMp.set(flower.id, currentMp - skill.mpCost);
    this.flowerCooldownUntil.set(flower.id, Date.now() + skill.cooldownSeconds * 1000);
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
    this.playSkillEffect(skill);
    const duration = skill.durationMs || 1500;
    const appliedStatuses = skillStatusIds.get(flower.id) ?? [];
    this.setPartyStatuses(index, appliedStatuses, duration);
    this.updateSkillLabel();
  }

  private playSkillEffect(skill: FlowerSkillState['skill']): void {
    if (!this.player) return;
    const sheetByType: Record<string, string> = {
      multiHit: '01_fire_slash', defensiveRecovery: '02_guard_buff', charge: '03_sun_beam',
      balanced: '04_homing_orb', continuous: '05_water_burst', maple: '06a_leaf_green',
      fortify: '07_fortify', slowAttack: '08_debuff', heal: '09_heal', evasion: '10_stealth',
    };
    const sheet = sheetByType[skill.type];
    const animationKey = sheet ? `skill-effect-${sheet}` : '';
    if (!sheet || !this.scene.anims.exists(animationKey)) return;

    const selfCast = ['defensiveRecovery', 'fortify', 'heal', 'evasion', 'balanced', 'continuous'].includes(skill.type);
    // Skill 8 targets every visible enemy; the others show their impact on the front target.
    const targets = skill.type === 'slowAttack'
      ? this.enemies.map(enemy => ({ x: enemy.x, y: enemy.y }))
      : selfCast
        ? [
          { x: this.player.x, y: this.player.y },
          ...(skill.type === 'evasion' && this.enemies[0]
            ? [{ x: this.enemies[0].x, y: this.enemies[0].y }]
            : []),
        ]
        : this.enemies.length > 0
          ? [{ x: this.enemies[0].x, y: this.enemies[0].y }]
          : [{ x: this.player.x, y: this.player.y }];
    const size = skill.type === 'slowAttack' ? 240 : skill.type === 'charge' ? 250 : 208;
    targets.forEach((target, index) => {
      const spawn = (): void => {
        const effect = this.scene.add.sprite(target.x, target.y - 22, `skill-effect-${sheet}`)
          .setOrigin(0.5)
          .setDisplaySize(size, size)
          .setScrollFactor(1)
          .setDepth(20)
          .play(animationKey);
        effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => effect.destroy());
      };
      if (skill.type === 'multiHit') {
        Array.from({ length: Math.max(1, skill.hitCount) }, (_, hit) => hit * 160)
          .forEach(delay => this.scene.time.delayedCall(delay, spawn));
      } else if (skill.type === 'slowAttack') {
        this.scene.time.delayedCall(index * 45, spawn);
      } else {
        spawn();
      }
    });
  }

  private updateSkillLabel(): void {
    if (!this.skillNameText) return;
    const formationId = this.formation[this.selectedFlower];
    const flower = testData.characters.find(character => character.id === formationId);
    const skill = flower
      ? this.flowerSkills.get(flower.id) ?? getFlowerSkill(flower.id)
      : undefined;
    this.skillNameText.setText(skill?.name ?? '花を選択');
    this.updateCooldownOverlays();
    const cooldownUntil = flower ? this.flowerCooldownUntil.get(flower.id) ?? 0 : 0;
    if (cooldownUntil > Date.now()) {
      this.skillNameText.setText(`${skill?.name ?? 'スキル'} ${Math.ceil((cooldownUntil - Date.now()) / 1000)}秒`);
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
      states.forEach(state => {
        this.flowerMp.set(state.flowerId, state.mp);
        this.flowerMaxMp.set(state.flowerId, state.maxMp);
        this.flowerCooldownUntil.set(state.flowerId, state.cooldownUntil);
        this.flowerSkills.set(state.flowerId, state.skill);
        this.flowerCooldownDuration.set(state.flowerId, state.skill.cooldownSeconds * 1000);
        const formationIndex = this.formation.indexOf(state.flowerId);
        const flower = testData.characters.find(character => character.id === state.flowerId);
        if (formationIndex >= 0 && flower) this.updateFlowerMp(formationIndex, flower);
      });
      this.updateSkillLabel();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'スキルデータを読み込めませんでした。';
      this.skillNameText?.setText(message);
      console.error('Flower skill state loading failed:', error);
    }
  }

  private updateCooldownOverlays(): void {
    const now = Date.now();
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
    if (this.scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;
    this.scene.scene.launch(SCENE_KEYS.INVENTORY, { returnScene: SCENE_KEYS.STAGE });
    this.scene.scene.bringToTop(SCENE_KEYS.INVENTORY);
    this.scene.scene.pause(SCENE_KEYS.STAGE);
  }
}
