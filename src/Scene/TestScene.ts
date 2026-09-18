import Phaser from 'phaser';
import { getTextStyle, createTextButton, showRetreatDialog } from '../utils/ui/index.ts';

export class TestScene extends Phaser.Scene {
  constructor() {
    super('TestScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setScroll(40, 0);
    this.cameras.main.setBackgroundColor('#cfe3f5');

    this.add.rectangle(width / 2, height / 2, width + 300, height + 300, 0xcfe3f5, 1)
      .setScrollFactor(0).setDepth(-100);

    this.add.text(width / 2, 70, 'ステージ画面', getTextStyle(34)).setOrigin(0.5);

    // ゲージ類
    this.add.text(40, 30, 'HP:', getTextStyle(24));
    this.add.rectangle(260, 45, 330, 22, 0x555555);
    this.add.rectangle(260, 45, 330, 22, 0x16a526);

    this.add.text(40, 65, 'MP:', getTextStyle(24));
    this.add.rectangle(195, 80, 200, 22, 0x555555);
    this.add.rectangle(195, 80, 200, 22, 0x16a9b5);

    // === ui.ts を使ったボタン生成（大幅削減） ===
    createTextButton(this, 100, 130, '← 戻る', () => this.scene.start('HomeScene'), { fontSize: 25 });
    createTextButton(this, 100, 220, 'バッグ', () => console.log('インベントリは後で実装します'), { fontSize: 25 });
    createTextButton(this, width - 120, 100, '撤退', () => {
      showRetreatDialog(this, () => this.scene.start('HomeScene'));
    }, { fontSize: 25 });

    // アクションサークル
    this.add.rectangle(260, 500, 120, 100, 0xffffff).setStrokeStyle(2, 0x333333);
    this.add.text(260, 500, 'キャラ', getTextStyle(22)).setOrigin(0.5);

    this.createActionCircle(1070, 600, 120, '通常攻撃');
    this.createActionCircle(940, 620, 100, 'ジャンプ');
    this.createActionCircle(990, 510, 100, 'スキル\n1');
    this.createActionCircle(1110, 470, 100, 'スキル\n2');
  }

  // 残すのは固有のアクションサークル作成ロジックだけ
  private createActionCircle(x: number, y: number, diameter: number, label: string): void {
    this.add.circle(x, y, diameter / 2, 0xffffff).setStrokeStyle(2, 0x333333);
    this.add.text(x, y, label, { ...getTextStyle(18), align: 'center' }).setOrigin(0.5);
  }
}