import Phaser from 'phaser';

import mapImg from '../assets/images/map.png';
import { specialText } from '../functions';
import {
  createMapSelectionButton,
  createSelectionDetailPanel,
  createTextButton
} from '../utils/ui';
//debug機能
import { showDebugSceneName } from '../debug';

//--------------------------------------------------------------

// エリア情報
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
  // エリア一覧
  private readonly areas: AreaInfo[] = [
    { id: 1, name: 'Village 1', description: '開けた花畑の入り口。', x: 210, y: 280, unlocked: true, difficulty: 'Easy' },
    { id: 2, name: 'Village 2', description: '小さな広場と整備された道。', x: 520, y: 360, unlocked: true, difficulty: 'Easy' },
    { id: 3, name: 'Village 3', description: '南側の静かなエリア。', x: 360, y: 430, unlocked: true, difficulty: 'Normal' },
    { id: 4, name: 'Village 4', description: '森の中の連戦区域。', x: 400, y: 500, unlocked: true, difficulty: 'Normal' },
    { id: 5, name: 'Village 5', description: '奥地に広がる危険域。', x: 560, y: 590, unlocked: false, difficulty: 'Hard' },
    { id: 6, name: 'Village 6', description: '最終防衛地点。', x: 600, y: 320, unlocked: false, difficulty: 'Hard' }
  ];

  // 現在選択されているエリア
  private selectedAreaId = 1;

  // エリア詳細に表示するテキスト
  private areaNameText!: Phaser.GameObjects.Text;
  private areaDescText!: Phaser.GameObjects.Text;

  // 選択中エリアのマーカー
  private selectedMarker!: Phaser.GameObjects.Arc;

  // 地図上のエリアボタン
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('AreaSelectScene');
  }

  // 画像の読み込み
  preload(): void {
    this.load.image('areaMap', mapImg);
  }

  // 画面の作成
  create(): void {
    showDebugSceneName(this);
    
    const width = this.scale.width;
    const height = this.scale.height;

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0xeef3ea);

    // 戻るボタン
    createTextButton(this, 130, 60, '← 戻る', () => {
      this.scene.start('HomeScene');
    }, {
      fontSize: 22,
      bgColor: '#ffffff',
      hoverColor: '#f2f2f2',
      downColor: '#dfe3e6',
      padding: { top: 10, bottom: 10, left: 18, right: 18 }
    });

    // 画面タイトル
    const header = specialText(this, width / 2, 70, 32, 4, 'エリア選択画面', '#20313d', '#ffffff');
    header.setDepth(10);

    // 説明文
    this.add.text(width / 2, 118, '地図上のエリアを選んで出撃先を決めてください。', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '20px',
      color: '#404f59',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 位置情報を使ったエリア検索ボタン
    createTextButton(this, width - 230, 130, '位置情報を使用してエリア検索', () => {
      this.searchNearestArea();
    }, {
      fontSize: 18,
      bgColor: '#dfeef7',
      hoverColor: '#cfe4f4',
      downColor: '#bed8ef',
      padding: { top: 12, bottom: 12, left: 20, right: 20 }
    });

    // 地図を表示
    this.drawMap(width / 1.5, height);

    // 地図上にエリアボタンを作成
    this.createAreaButtons();

    // 選択中エリアの詳細パネルを作成
    const panel = createSelectionDetailPanel(this, width * 0.79, height * 0.74, () => {
      const area = this.areas.find((item) => item.id === this.selectedAreaId);

      if (area) {
        this.scene.start('SelectStageScene', {
          areaId: area.id,
          areaName: area.name
        });
      }
    });

    // 詳細パネルの各要素を保存
    this.areaNameText = panel.name;
    this.areaDescText = panel.description;
    this.selectedMarker = panel.marker;

    // 初期選択エリアを設定
    this.selectArea(this.selectedAreaId, false);
  }

  // 地図を表示する
  private drawMap(width: number, height: number): void {
    // 地図画像
    const map = this.add.image(width / 2, height / 2 + 30, 'areaMap')
      .setDisplaySize(width * 0.9, height * 0.68)
      .setDepth(0);

    map.setAlpha(0.97);

    // 地図の枠線
    this.add.rectangle(width / 2, height / 2 + 30, width * 0.9, height * 0.68, 0x000000, 0)
      .setStrokeStyle(4, 0x7a968f, 1)
      .setDepth(1);
  }

  // 地図上にエリア選択ボタンを作成する
  private createAreaButtons(): void {
    this.buttons = this.areas.map((area) => {
      const isSelected = area.id === this.selectedAreaId;

      const button = createMapSelectionButton(
        this,
        area.x,
        area.y,
        String(area.id),
        isSelected,
        area.unlocked,
        () => {
          this.selectArea(area.id, true);
        }
      );

      return button;
    });
  }

  // エリアボタンの見た目を更新する
  private updateButtonStyles(): void {
    this.buttons.forEach((container) => {
      // ボタン内の円と番号を取得
      const circle = container.list[0] as Phaser.GameObjects.Arc;
      const label = container.list[1] as Phaser.GameObjects.Text;

      // 番号から対応するエリアを取得
      const area = this.areas.find((item) => item.id === Number(label.text));

      if (!area) return;

      // 選択中かどうか
      const isSelected = area.id === this.selectedAreaId;

      // エリアの解放状態と選択状態によって色を変更
      const fillColor = area.unlocked ? (isSelected ? 0x6fc7a8 : 0x8ed3b2) : 0xbebebe;
      const ringColor = area.unlocked ? (isSelected ? 0x1e5e49 : 0x2c4f65) : 0x777777;

      circle.setFillStyle(fillColor);
      circle.setStrokeStyle(4, ringColor);

      // 未解放エリアは文字色を薄くする
      label.setColor(area.unlocked ? '#ffffff' : '#f0f0f0');

      // 選択中のボタンを少し大きくする
      container.setScale(isSelected ? 1.08 : 1);
    });
  }

  // 現在位置に最も近いエリアを検索する
  private searchNearestArea(): void {
    // まだ実装しないかなあ
  }

  // エリアを選択する
  private selectArea(areaId: number, animate: boolean): void {
    const area = this.areas.find((item) => item.id === areaId);

    // 存在しないエリア、または未解放エリアは選択できない
    if (!area || !area.unlocked) return;

    // 選択中エリアを更新
    this.selectedAreaId = areaId;

    // 詳細パネルを更新
    this.areaNameText.setText(area.name);
    this.areaDescText.setText(`${area.description} / ${area.difficulty}`);

    // 地図上のボタンの見た目を更新
    this.updateButtonStyles();

    // 選択時にマーカーを少し拡大する
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