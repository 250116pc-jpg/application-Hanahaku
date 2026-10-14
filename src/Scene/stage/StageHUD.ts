import Phaser from 'phaser';
import { getTextStyle, showRetreatDialog } from '../../utils/ui/index.ts';
import testData from '../test_data.ts';
import { SCENE_KEYS } from '../sceneKeys';

export class StageHUD {
  private readonly HUD_DEPTH = 2000;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(stageId?: number): void {
    this.createStatusPanel();
    this.createStageLabel(stageId);
    this.createUtilityButtons();
    this.createPartyHud();
  }

  private createStatusPanel(): void {
    const panel = { x: 24, y: 20, width: 310, height: 112 };
    const leader = testData.characters.find(character => character.id === testData.formation[0]);
    if (!leader) return;

    this.drawPanel(panel.x, panel.y, panel.width, panel.height);

    this.addText(panel.x + 18, panel.y + 13, `${leader.name}  Lv.${leader.level}`, 17, '#ffffff', 'bold');
    this.addText(panel.x + panel.width - 16, panel.y + 16, 'LEADER', 10, '#a8c7d3', 'bold')
      .setOrigin(1, 0);

    this.addText(panel.x + 18, panel.y + 44, 'HP', 12, '#f2c5bd', 'bold');
    this.createProgressBar(panel.x + 54, panel.y + 47, 166, 8, leader.stats.hp, leader.stats.hp, 0xff786b);
    this.addText(panel.x + panel.width - 16, panel.y + 41, `${leader.stats.hp}/${leader.stats.hp}`, 11, '#eaf3f5')
      .setOrigin(1, 0);

    this.addText(panel.x + 18, panel.y + 75, 'MP', 12, '#b9e6ee', 'bold');
    this.createProgressBar(panel.x + 54, panel.y + 78, 166, 8, leader.stats.mp, leader.stats.mp, 0x57c9d5);
    this.addText(panel.x + panel.width - 16, panel.y + 72, `${leader.stats.mp}/${leader.stats.mp}`, 11, '#eaf3f5')
      .setOrigin(1, 0);
  }

  private createStageLabel(stageId?: number): void {
    const stage = testData.stages.find(item => item.id === stageId);
    const label = stage ? `STAGE  ${stage.name}` : 'STAGE';
    const x = this.scene.scale.width / 2;
    const y = 34;

    this.drawPanel(x - 112, y - 17, 224, 42, 18, 0.88);
    this.addText(x, y - 10, label, 15, '#f7fbf7', 'bold')
      .setOrigin(0.5, 0);
  }

  private createUtilityButtons(): void {
    const width = this.scene.scale.width;

    this.createIconButton(width - 156, 50, 'バッグ', 'stage-bag', () => this.openInventory());
    this.createIconButton(width - 68, 50, '撤退', 'stage-retreat', () => {
      showRetreatDialog(this.scene, () => this.scene.scene.start(SCENE_KEYS.SELECT_STAGE));
    });
  }

  private createIconButton(
    x: number,
    y: number,
    label: string,
    texture: string,
    onClick: () => void
  ): void {
    const container = this.scene.add.container(x, y).setDepth(this.HUD_DEPTH).setScrollFactor(0);
    const background = this.scene.add.rectangle(0, 0, 76, 76, 0x173344, 0.94)
      .setStrokeStyle(2, 0x8eb5b8, 0.8);
    const icon = this.scene.add.image(0, -10, texture).setDisplaySize(38, 38);
    const text = this.scene.add.text(0, 22, label, getTextStyle(12, {
      color: '#f7fbf7',
      fontStyle: 'bold'
    })).setOrigin(0.5);

    container.add([background, icon, text]);
    container.setSize(76, 76).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      background.setFillStyle(0x2b5360, 1);
      this.scene.tweens.add({ targets: container, scale: 1.04, duration: 100, ease: 'Sine.Out' });
    });
    container.on('pointerout', () => {
      background.setFillStyle(0x173344, 0.94);
      this.scene.tweens.add({ targets: container, scale: 1, duration: 100, ease: 'Sine.Out' });
    });
    container.on('pointerdown', () => background.setFillStyle(0x102631, 1));
    container.on('pointerup', () => {
      background.setFillStyle(0x2b5360, 1);
      onClick();
    });
    container.on('pointerupoutside', () => background.setFillStyle(0x173344, 0.94));
  }

  private createPartyHud(): void {
    const formation = testData.formation;
    const cardWidth = 244;
    const cardHeight = 112;
    const gap = 16;
    const totalWidth = cardWidth * 4 + gap * 3;
    const firstCenter = (this.scene.scale.width - totalWidth) / 2 + cardWidth / 2;
    const centerY = this.scene.scale.height - cardHeight / 2 - 10;

    for (let i = 0; i < 4; i++) {
      const x = firstCenter + i * (cardWidth + gap);
      const y = centerY;
      const characterId = formation[i];
      const character = testData.characters.find(item => item.id === characterId);

      this.drawPanel(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 14, 0.94);

      if (!character) {
        this.addText(x, y - 6, '＋  空き枠', 17, '#b2c5c9', 'bold').setOrigin(0.5);
        this.addText(x, y + 18, '編成で仲間を追加', 11, '#829ba3').setOrigin(0.5);
        continue;
      }

      this.addText(x - 104, y - 47, character.name, 16, '#ffffff', 'bold');
      this.addText(x + 104, y - 45, `Lv.${character.level}  ${character.element}`, 10, '#a8c7d3')
        .setOrigin(1, 0);

      this.addText(x - 104, y - 20, 'HP', 10, '#f2c5bd', 'bold');
      this.addText(x + 104, y - 22, `${character.stats.hp}/${character.stats.hp}`, 10, '#dce8eb')
        .setOrigin(1, 0);
      this.createProgressBar(x - 104, y - 7, 208, 6, character.stats.hp, character.stats.hp, 0xff786b);

      this.addText(x - 104, y + 10, 'MP', 10, '#b9e6ee', 'bold');
      this.addText(x + 104, y + 8, `${character.stats.mp}/${character.stats.mp}`, 10, '#dce8eb')
        .setOrigin(1, 0);
      this.createProgressBar(x - 104, y + 23, 208, 6, character.stats.mp, character.stats.mp, 0x57c9d5);
    }
  }

  private drawPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 14,
    alpha: number = 0.96
  ): void {
    const panel = this.scene.add.graphics().setScrollFactor(0).setDepth(this.HUD_DEPTH);
    panel.fillStyle(0x06151d, 0.32).fillRoundedRect(x, y + 4, width, height, radius);
    panel.fillStyle(0x173344, alpha).fillRoundedRect(x, y, width, height, radius);
    panel.lineStyle(2, 0x8eb5b8, 0.72).strokeRoundedRect(x, y, width, height, radius);
  }

  private addText(
    x: number,
    y: number,
    text: string,
    fontSize: number,
    color: string,
    fontStyle?: string
  ): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, getTextStyle(fontSize, {
      color,
      fontStyle,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    })).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1);
  }

  private createProgressBar(
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
    maxValue: number,
    color: number
  ): void {
    this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x071820, 0.9)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH + 1);

    const percent = maxValue > 0 ? Phaser.Math.Clamp(value / maxValue, 0, 1) : 0;
    const currentWidth = width * percent;
    if (currentWidth === 0) return;

    this.scene.add.rectangle(x + currentWidth / 2, y + height / 2, currentWidth, height, color)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH + 2);
  }

  private openInventory(): void {
    if (this.scene.scene.isActive(SCENE_KEYS.INVENTORY)) return;

    this.scene.scene.launch(SCENE_KEYS.INVENTORY, { returnScene: SCENE_KEYS.STAGE });
    this.scene.scene.bringToTop(SCENE_KEYS.INVENTORY);
    this.scene.scene.pause(SCENE_KEYS.STAGE);
  }
}
