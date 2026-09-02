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

    private openStageInfo(scene: Phaser.Scene, stageLabel: string): void {
  const width = this.scale.width;
  const height = this.scale.height;

  // ポップアップ全体
  const container = scene.add.container(0, 0).setDepth(3000);

  // 背景を暗くする
  const darkBackground = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
    .setScrollFactor(0)
    .setInteractive();

  // ポップアップ
  const popupWidth = width * 0.7;
  const popupHeight = height * 0.7;
  const popup = scene.add.rectangle(width / 2, height / 2, popupWidth, popupHeight, 0xffffff)
    .setStrokeStyle(3, 0x536878)
    .setScrollFactor(0);

  // ステージ名
  const title = scene.add.text(width / 2, height / 2 - 190, stageLabel, this.getTextStyle(32))
    .setOrigin(0.5)
    .setScrollFactor(0);

  // ステージ情報
  const stageInfo = scene.add.text(width / 2, height / 2 - 110, [
    '推奨レベル：Lv.10',
    '消費スタミナ：10',
    '出現する敵：3体',
    '',
    'クリアすると報酬を獲得できます。'
  ], {
    ...this.getTextStyle(20),
    color: '#444444',
    align: 'center',
    lineSpacing: 8
  })
  .setOrigin(0.5)
  .setScrollFactor(0);

  // 進行状況の警告
  const warning = scene.add.text(width / 2, height / 2 + 10, '編成を変更してから出撃できます。', {
    ...this.getTextStyle(18),
    color: '#888888'
  })
  .setOrigin(0.5)
  .setScrollFactor(0);

  //閉じるボタン
  const closeButton = scene.add.text(width / 2 + 250, height / 2 - 190, '×', {
    ...this.getTextStyle(32),
    color: '#888888'
  })
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true })
  .setScrollFactor(0);

  // 編成ボタン
  const formationButton = scene.add.text(width / 2 - 150, height / 2 + 120, '編成', {
    ...this.getTextStyle(22),
    color: '#ffffff',
    backgroundColor: '#536878',
    padding: { left: 35, right: 35, top: 15, bottom: 15 }
  })
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true })
  .setScrollFactor(0);

  // 出撃ボタン
  const startButton = scene.add.text(width / 2 + 150, height / 2 + 120, '出撃', {
    ...this.getTextStyle(22),
    color: '#ffffff',
    backgroundColor: '#4c8c5a',
    padding: { left: 35, right: 35, top: 15, bottom: 15 }
  })
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true })
  .setScrollFactor(0);

  // コンテナに追加
  container.add([darkBackground, popup, title, stageInfo, warning, formationButton, startButton, closeButton]);

  // --- イベントリスナー ---

  // 編成画面へ
  formationButton.on('pointerdown', () => {
    container.destroy();
    scene.scene.start('FormScene');
  });

  // ステージ画面へ
  startButton.on('pointerdown', () => {
    container.destroy();
    scene.scene.start('StageScene', { stageLabel: stageLabel });
  });

  // 背景クリックで閉じる
  closeButton.on('pointerdown', () => {
    container.destroy();
  });
}
  private createActionCircle(x: number, y: number, diameter: number, label: string): void {
    const circle = this.add.ellipse(x, y, diameter, diameter / 1.8, 0xffffff).setStrokeStyle(2, 0x333333);
    this.add.text(x, y+70, label, { ...this.getTextStyle(36), align: 'center' }).setOrigin(0.5);
    
    circle.on('pointerover', () => circle.setFillStyle(0xeeeeee));
    circle.on('pointerout', () => circle.setFillStyle(0xffffff));
    circle.setInteractive({ useHandCursor: true });
    circle.on('pointerup', () => this.openStageInfo(this, label));
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
    const line = this.add.line(0, 0, x1, y1+5, x2, y2+5, color).setOrigin(0, 0);
    line.setLineWidth(width);
  }
  
}