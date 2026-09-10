import Phaser from 'phaser';

import mapImg from '../assets/images/map.png';
import { specialText } from '../functions';
import {
  createMapSelectionButton,
  createSelectionDetailPanel,
  createTextButton
} from '../utils/ui';

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
  private areaNameText!: Phaser.GameObjects.Text;
  private areaDescText!: Phaser.GameObjects.Text;
  private selectedMarker!: Phaser.GameObjects.Arc;
  private buttons: Phaser.GameObjects.Container[] = [];

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

    createTextButton(this, 130, 60, '← 戻る', () => {
      this.scene.start('HomeScene');
    }, {
      fontSize: 22,
      bgColor: '#ffffff',
      hoverColor: '#f2f2f2',
      downColor: '#dfe3e6',
      padding: { top: 10, bottom: 10, left: 18, right: 18 }
    });

    const header = specialText(this, width / 2, 70, 32, 4, '背景：エリア選択', '#20313d', '#ffffff');
    header.setDepth(10);

    this.add.text(width / 2, 118, '地図上のエリアを選んで出撃先を決めてください。', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '20px',
      color: '#404f59',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    createTextButton(this, width - 230, 130, '位置情報を使用してエリア検索', () => {
      this.searchNearestArea();
    }, {
      fontSize: 18,
      bgColor: '#dfeef7',
      hoverColor: '#cfe4f4',
      downColor: '#bed8ef',
      padding: { top: 12, bottom: 12, left: 20, right: 20 }
    });

    this.drawMap(width, height);
    this.createAreaButtons();
    const panel = createSelectionDetailPanel(this, width * 0.79, height * 0.74, () => {
      const area = this.areas.find((item) => item.id === this.selectedAreaId);
      if (area) {
        this.scene.start('SelectStageScene', {
          areaId: area.id,
          areaName: area.name
        });
      }
    });

    this.areaNameText = panel.name;
    this.areaDescText = panel.description;
    this.selectedMarker = panel.marker;
    this.selectArea(this.selectedAreaId, false);
  }

  private drawMap(width: number, height: number): void {
    const map = this.add.image(width / 2, height / 2 + 30, 'areaMap')
      .setDisplaySize(width * 0.9, height * 0.68)
      .setDepth(0);

    map.setAlpha(0.97);

    this.add.rectangle(width / 2, height / 2 + 30, width * 0.9, height * 0.68, 0x000000, 0)
      .setStrokeStyle(4, 0x7a968f, 1)
      .setDepth(1);
  }

  private createAreaButtons(): void {
    this.buttons = this.areas.map((area) => {
      const isSelected = area.id === this.selectedAreaId;
      const button = createMapSelectionButton(this, area.x, area.y, String(area.id), isSelected, area.unlocked, () => {
        this.selectArea(area.id, true);
      });

      return button;
    });
  }

  private updateButtonStyles(): void {
    this.buttons.forEach((container) => {
      const circle = container.list[0] as Phaser.GameObjects.Arc;
      const label = container.list[1] as Phaser.GameObjects.Text;
      const area = this.areas.find((item) => item.id === Number(label.text));

      if (!area) return;

      const isSelected = area.id === this.selectedAreaId;
      const fillColor = area.unlocked ? (isSelected ? 0x6fc7a8 : 0x8ed3b2) : 0xbebebe;
      const ringColor = area.unlocked ? (isSelected ? 0x1e5e49 : 0x2c4f65) : 0x777777;

      circle.setFillStyle(fillColor);
      circle.setStrokeStyle(4, ringColor);
      label.setColor(area.unlocked ? '#ffffff' : '#f0f0f0');
      container.setScale(isSelected ? 1.08 : 1);
    });
  }

  private searchNearestArea(): void {
    const pointerX = this.input.activePointer.x;
    const pointerY = this.input.activePointer.y;
    const unlockedAreas = this.areas.filter((area) => area.unlocked);

    if (unlockedAreas.length === 0) return;

    let nearestArea = unlockedAreas[0];
    let minDistance = Number.MAX_SAFE_INTEGER;

    unlockedAreas.forEach((area) => {
      const distance = Math.hypot(area.x - pointerX, area.y - pointerY);
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
    this.updateButtonStyles();

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
