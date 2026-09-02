import Phaser from 'phaser';

export class SelectStageScene extends Phaser.Scene {

  constructor() {
    super('SelectStageScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setScroll(40, 0);
    this.cameras.main.setBackgroundColor('#cfe3f5');

    this.add.rectangle(width / 2, height / 2, width + 300, height + 300, 0xcfe3f5, 1)
      .setScrollFactor(0)
      .setDepth(-100);

    this.add.text(width / 2, 70, 'ステージ選択画面', this.getTextStyle(34)).setOrigin(0.5);


    this.createBackButton();

    this.add.rectangle(260, 500, 120, 100, 0xffffff).setStrokeStyle(2, 0x333333);
    this.add.text(260, 500, 'キャラ', this.getTextStyle(22)).setOrigin(0.5);

    const x_1_1 = 150;
    const y_1_1 = 200;

    const x_1_2 = 230;
    const y_1_2 = 460;

    const x_1_3 = 600;
    const y_1_3 = 260;

    const x_1_4 = 740;
    const y_1_4 = 530;

    const x_1_5 = 1060;
    const y_1_5 = 520;

    
    this.createLine(x_1_2, y_1_2, x_1_1, y_1_1, 25, 0x000000);
    this.createLine(x_1_3, y_1_3, x_1_2, y_1_2, 25, 0x000000);
    this.createLine(x_1_4, y_1_4, x_1_3, y_1_3, 25, 0x000000);
    this.createLine(x_1_5, y_1_5, x_1_4, y_1_4, 25, 0x000000);
    this.createLine(x_1_2, y_1_2, x_1_1, y_1_1, 25, 0x000000);
    
    this.createLine(x_1_2, y_1_2, x_1_1, y_1_1, 20, 0xdddddd);
    this.createLine(x_1_3, y_1_3, x_1_2, y_1_2, 20, 0xdddddd);
    this.createLine(x_1_4, y_1_4, x_1_3, y_1_3, 20, 0xdddddd);
    this.createLine(x_1_5, y_1_5, x_1_4, y_1_4, 20, 0xdddddd);
    this.createLine(x_1_2, y_1_2, x_1_1, y_1_1, 20, 0xdddddd);

    this.createActionCircle(x_1_1, y_1_1, 100, '1-1');
    this.createActionCircle(x_1_2, y_1_2, 100, '1-2');
    this.createActionCircle(x_1_3, y_1_3, 100, '1-3');
    this.createActionCircle(x_1_4, y_1_4, 100, '1-4');
    this.createActionCircle(x_1_5, y_1_5, 100, '1-5');

    
    
  }

  private createBackButton(): void {
    const button = this.add.text(100, 80, '← 戻る', {
      ...this.getTextStyle(25),
      backgroundColor: '#ffffff',
      padding: { top: 12, bottom: 12, left: 20, right: 20 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#eeeeee'));
    button.on('pointerout', () => button.setBackgroundColor('#ffffff'));
    button.on('pointerup', () => this.scene.start('HomeScene'));
  }


  private createActionCircle(x: number, y: number, diameter: number, label: string): void {
    this.add.circle(x, y, diameter / 2, 0xffffff).setStrokeStyle(2, 0x333333);
    this.add.text(x, y+70, label, { ...this.getTextStyle(36), align: 'center' }).setOrigin(0.5);
  }

  private getTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: { top: 7, bottom: 7, left: 6, right: 6 },
    };
  }
  private createLine(x1: number, y1: number, x2: number, y2: number, width: number, color: number): void {
    const line = this.add.line(10, 10, x1, y1, x2, y2, color).setOrigin(0, 0);
    line.setLineWidth(width);
  }
}