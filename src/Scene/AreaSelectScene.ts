import Phaser from 'phaser';

import mapImg from '../assets/images/map.png';
import { specialText } from '../functions';
import { createTextButton } from '../utils/ui';

type AreaInfo = {
  id: number;
  name: string;
  description: string;
  x: number;
  y: number;
  unlocked: boolean;
  difficulty: string;
};

export class AreaSelectScene extends Phaser.Scene {
  private readonly areas: AreaInfo[] = [
    { id: 1, name: 'Village 1', description: '開けた花畑の入り口。', x: 210, y: 280, unlocked: true, difficulty: 'Easy' },
    { id: 2, name: 'Village 2', description: '小さな広場と整備された道。', x: 520, y: 360, unlocked: true, difficulty: 'Easy' },
    { id: 3, name: 'Village 3', description: '南側の静かなエリア。', x: 860, y: 430, unlocked: true, difficulty: 'Normal' },
    { id: 4, name: 'Village 4', description: '森の中の連戦区域。', x: 700, y: 500, unlocked: true, difficulty: 'Normal' },
    { id: 5, name: 'Village 5', description: '奥地に広がる危険域。', x: 560, y: 590, unlocked: false, difficulty: 'Hard' },
    { id: 6, name: 'Village 6', description: '最終防衛地点。', x: 900, y: 320, unlocked: false, difficulty: 'Hard' }
  ];

  private selectedAreaId = 1;
  private infoPanel!: Phaser.GameObjects.Container;
  private areaNameText!: Phaser.GameObjects.Text;
  private areaDescText!: Phaser.GameObjects.Text;
  private selectedMarker!: Phaser.GameObjects.Arc;

  constructor() {
    super('AreaSelectScene');
  }

  preload(): void {
    this.load.image('areaMap', mapImg);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0xeef3ea);

    const backButton = createTextButton(this, 130, 60, '← 戻る', () => {
      this.scene.start('HomeScene');
    }, {
      fontSize: 22,
      bgColor: '#ffffff',
      hoverColor: '#f2f2f2',
      downColor: '#dfe3e6',
      padding: { top: 10, bottom: 10, left: 18, right: 18 }
    });
    backButton.setDepth(10);

    const header = specialText(this, width / 2, 70, 32, 4, '拝啓：エリア選択', '#20313d', '#ffffff');
    header.setDepth(10);

    this.add.text(width / 2, 118, '地図上のエリアを選んで出撃先を決めてください。', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '20px',
      color: '#404f59',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const searchButton = createTextButton(this, width - 230, 130, '位置情報を使用してエリア検索', () => {
      this.searchNearestArea();
    }, {
      fontSize: 18,
      bgColor: '#dfeef7',
      hoverColor: '#cfe4f4',
      downColor: '#bed8ef',
      padding: { top: 12, bottom: 12, left: 20, right: 20 }
    });
    searchButton.setDepth(10);

    this.drawMap(width, height);
    this.createInfoPanel(width, height);
    this.createAreaButtons();
    this.selectArea(this.selectedAreaId, false);
  }

  private drawMap(width: number, height: number): void {
    const map = this.add.image(width / 2, height / 2 + 30, 'areaMap')
      .setDisplaySize(width * 0.9, height * 0.68)
      .setDepth(0);

    map.setAlpha(0.97);

    const mapFrame = this.add.rectangle(width / 2, height / 2 + 30, width * 0.9, height * 0.68, 0x000000, 0)
      .setStrokeStyle(4, 0x7a968f, 1)
      .setDepth(1);

    this.add.container(0, 0, [map, mapFrame]);
  }

  private createAreaButtons(): void {
    this.areas.forEach((area) => {
      const isSelected = area.id === this.selectedAreaId;
      const color = area.unlocked ? (isSelected ? 0x6fc7a8 : 0x8ed3b2) : 0xc8c8c8;
      const ringColor = isSelected ? 0x1e5e49 : (area.unlocked ? 0x2c4f65 : 0x7a7a7a);

      const button = this.add.circle(area.x, area.y, 26, color)
        .setStrokeStyle(4, ringColor)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      const label = this.add.text(area.x, area.y, String(area.id), {
        fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);

      button.on('pointerover', () => {
        if (area.unlocked) {
          button.setScale(1.08);
          label.setScale(1.08);
        }
      });

      button.on('pointerout', () => {
        button.setScale(1);
        label.setScale(1);
      });

      button.on('pointerdown', () => {
        if (area.unlocked) this.selectArea(area.id, true);
      });

      if (!area.unlocked) {
        button.disableInteractive();
        button.setFillStyle(0xbebebe);
        button.setStrokeStyle(4, 0x777777);
        label.setColor('#f0f0f0');
      }

      this.add.container(0, 0, [button, label]);
    });
  }

  private createInfoPanel(width: number, height: number): void {
    this.infoPanel = this.add.container(0, 0);

    const panelBg = this.add.rectangle(width * 0.79, height * 0.74, 360, 170, 0xfafdfb)
      .setStrokeStyle(3, 0xc8d9d3)
      .setDepth(10);

    const infoTitle = this.add.text(width * 0.79, height * 0.64, '選択中のエリア', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '24px',
      color: '#1f3340',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.areaNameText = this.add.text(width * 0.79, height * 0.71, '', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '30px',
      color: '#162b2f',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.areaDescText = this.add.text(width * 0.79, height * 0.78, '', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '18px',
      color: '#4a585d',
      wordWrap: { width: 260 }
    }).setOrigin(0.5).setDepth(11);

    const goButton = createTextButton(this, width * 0.79, height * 0.86, 'このエリアで選択', () => {
      const area = this.areas.find((item) => item.id === this.selectedAreaId);
      if (area) {
        this.scene.start('SelectStageScene', {
          areaId: area.id,
          areaName: area.name
        });
      }
    }, {
      fontSize: 20,
      bgColor: '#4c7f9a',
      hoverColor: '#3d6d87',
      downColor: '#2e5c74',
      padding: { top: 12, bottom: 12, left: 24, right: 24 }
    });
    goButton.setStyle({ color: '#ffffff' });
    goButton.setDepth(11);

    this.selectedMarker = this.add.arc(width * 0.79, height * 0.61, 150, 0, 360, false, 0x7dd3b5, 0.25)
      .setDepth(9);

    this.infoPanel.add([panelBg, this.selectedMarker, infoTitle, this.areaNameText, this.areaDescText, goButton]);
  }

  private searchNearestArea(): void {
    const pointerX = this.input.activePointer.x;
    const pointerY = this.input.activePointer.y;
    const unlockedAreas = this.areas.filter((area) => area.unlocked);

    if (unlockedAreas.length === 0) return;

    let nearestArea = unlockedAreas[0];
    let minDistance = Number.MAX_SAFE_INTEGER;

    unlockedAreas.forEach((area) => {
      const dx = area.x - pointerX;
      const dy = area.y - pointerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestArea = area;
      }
    });

    this.selectArea(nearestArea.id, true);
  }

  private selectArea(areaId: number, animate: boolean): void {
    const area = this.areas.find((item) => item.id === areaId);
    if (!area || !area.unlocked) return;

    this.selectedAreaId = areaId;
    this.areaNameText.setText(area.name);
    this.areaDescText.setText(`${area.description} / ${area.difficulty}`);

    this.areas.forEach((item) => {
      const circle = this.children.getChildren().find((child) => {
        return child instanceof Phaser.GameObjects.Arc && child.x === item.x && child.y === item.y;
      }) as Phaser.GameObjects.Arc | undefined;

      if (circle) {
        const isSelected = item.id === areaId;
        const color = item.unlocked ? (isSelected ? 0x6fc7a8 : 0x8ed3b2) : 0xbebebe;
        const ringColor = isSelected ? 0x1e5e49 : (item.unlocked ? 0x2c4f65 : 0x777777);
        circle.setFillStyle(color);
        circle.setStrokeStyle(4, ringColor);
      }
    });

    if (animate) {
      this.tweens.add({
        targets: this.selectedMarker,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 140,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
