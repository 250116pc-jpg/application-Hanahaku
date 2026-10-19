import Phaser from 'phaser';
import { getTextStyle, showRetreatDialog } from '../../utils/ui/index.ts';
import testData from '../test_data.ts';
import { SCENE_KEYS } from '../sceneKeys';
import type { Player } from './Player';

/** Screen-fixed controls and status display for the side-scrolling stage. */
export class StageHUD {
  private readonly depth = 2000;
  private readonly scene: Phaser.Scene;
  private readonly player?: Player;
  private selectedFlower = 0;
  private readonly partySelectionBorders: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, player?: Player) {
    this.scene = scene;
    this.player = player;
  }

  public create(stageId?: number): void {
    this.createStatusPanel();
    this.createStageLabel(stageId);
    this.createUtilityButtons();
    this.createPartyHud();
    this.createMovementPad();
    this.createActionButtons();
  }

  private createStatusPanel(): void {
    const leader = testData.characters.find(c => c.id === testData.formation[0]);
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
    this.bar(x + 50, y + 40, panelW - (compact ? 66 : 88), 9, leader.stats.hp, leader.stats.hp, 0xf05b86);
    this.text(x + 16, y + 59, 'MP', 12, '#7ee6fa', 'bold');
    this.bar(x + 50, y + 62, panelW - (compact ? 66 : 88), 9, leader.stats.mp, leader.stats.mp, 0x32bddb);
  }

  private createStageLabel(stageId?: number): void {
    const stage = testData.stages.find(item => item.id === stageId);
    const label = stage ? `花の遺跡　•　${stage.name}` : '花の遺跡　•　戦闘中';
    const w = this.scene.scale.width;
    const boxW = Math.min(300, w * 0.38);
    const x = w - boxW - 22;
    this.panel(x, 20, boxW, 48, 18, 0.9);
    this.text(x + boxW / 2, 44, label, Math.min(17, boxW / 16), '#fff4e8', 'bold').setOrigin(0.5);
  }

  private createUtilityButtons(): void {
    this.imageButton(72, 170, 74, '', 'stage-bag', () => this.openInventory());
    const x = this.scene.scale.width - 68;
    this.imageButton(x, 150, 76, '', 'stage-retreat', () => {
      showRetreatDialog(this.scene, () => this.scene.scene.start(SCENE_KEYS.SELECT_STAGE));
    });
  }

  private createPartyHud(): void {
    const formation = testData.formation;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const gap = 10;
    const totalW = Math.min(width * 0.48, 620);
    const cardW = (totalW - gap * 3) / 4;
    const cardH = Math.min(130, Math.max(92, height * 0.145));
    const left = (width - totalW) / 2;
    const top = height - cardH - 18;

    for (let i = 0; i < 4; i++) {
      const x = left + i * (cardW + gap);
      const character = testData.characters.find(c => c.id === formation[i]);
      this.panel(x, top, cardW, cardH, 11, 0.92);
      const border = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth + 2);
      this.partySelectionBorders.push(border);
      this.drawPartySelection(border, x, top, cardW, cardH, i === this.selectedFlower);
      if (!character) {
        this.text(x + cardW / 2, top + cardH / 2, '＋ 空き枠', 13, '#d4dce5', 'bold').setOrigin(0.5);
        continue;
      }
      this.scene.add.zone(x + cardW / 2, top + cardH / 2, cardW, cardH)
        .setScrollFactor(0).setDepth(this.depth + 10).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectFlower(i, cardH));
      this.scene.add.image(x + 27, top + 29, 'stage-flower')
        .setDisplaySize(36, 36).setScrollFactor(0).setDepth(this.depth + 1);
      this.text(x + 52, top + 18, character.name, Math.min(14, cardW / 7), '#fff', 'bold');
      this.text(x + 10, top + 54, 'MP', 10, '#b9e6ee', 'bold');
      this.text(x + cardW - 10, top + 53, `${character.stats.mp}/${character.stats.mp}`, 10, '#f5f0e8')
        .setOrigin(1, 0);
      this.bar(x + 10, top + cardH - 24, cardW - 20, 8, character.stats.mp, character.stats.mp, 0x38c4dc);
    }
  }

  private selectFlower(index: number, height: number): void {
    this.selectedFlower = index;
    this.partySelectionBorders.forEach((border, i) => {
      // Card positions are evenly spaced; derive each border rectangle from its index.
      const gap = 10;
      const totalW = Math.min(this.scene.scale.width * 0.48, 620);
      const cardW = (totalW - gap * 3) / 4;
      const left = (this.scene.scale.width - totalW) / 2;
      const top = this.scene.scale.height - height - 18;
      this.drawPartySelection(border, left + i * (cardW + gap), top, cardW, height, i === index);
    });
  }

  private drawPartySelection(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, selected: boolean): void {
    graphics.clear();
    if (selected) graphics.lineStyle(2, 0xffc968, 0.98).strokeRoundedRect(x, y, width, height, 11);
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
    this.imageButton(baseX, h - 132, 90, '', 'stage-attack', () => this.player?.attack());
    this.imageButton(baseX - 104, h - 94, 82, '', 'stage-skill', () => {});
    this.imageButton(baseX + 2, h - 34, 78, '', 'stage-jump', () => this.player?.jump());
  }

  private imageButton(x: number, y: number, size: number, label: string, texture: string, onClick: () => void): void {
    const image = this.scene.add.image(x, y, texture).setDisplaySize(size, size)
      .setScrollFactor(0).setDepth(this.depth + 3).setInteractive({ useHandCursor: true });
    this.text(x, y + size * 0.34, label, Math.max(10, size * 0.15), '#fff4e8', 'bold')
      .setOrigin(0.5).setDepth(this.depth + 4);
    // setDisplaySize changes displayWidth/Height; preserve that base scale for hover feedback.
    const baseScale = image.scale;
    image.on('pointerover', () => this.scene.tweens.add({ targets: image, scale: baseScale * 1.04, duration: 90 }));
    image.on('pointerout', () => this.scene.tweens.add({ targets: image, scale: baseScale, duration: 90 }));
    image.on('pointerdown', onClick);
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

  private bar(x: number, y: number, w: number, h: number, value: number, max: number, color: number): void {
    this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x091521, 0.95).setScrollFactor(0).setDepth(this.depth + 1);
    const fill = w * Phaser.Math.Clamp(max > 0 ? value / max : 0, 0, 1);
    if (fill > 0) this.scene.add.rectangle(x + fill / 2, y + h / 2, fill, h, color).setScrollFactor(0).setDepth(this.depth + 2);
  }

  private openInventory(): void {
    if (this.scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;
    this.scene.scene.launch(SCENE_KEYS.INVENTORY, { returnScene: SCENE_KEYS.STAGE });
    this.scene.scene.bringToTop(SCENE_KEYS.INVENTORY);
    this.scene.scene.pause(SCENE_KEYS.STAGE);
  }
}
