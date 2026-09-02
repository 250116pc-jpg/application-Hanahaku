import Phaser from 'phaser';
import testData from './test_data'

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

    

    const stagePositions = [
        { x: 150, y: 200 },
        { x: 230, y: 460 },
        { x: 600, y: 260 },
        { x: 740, y: 530 },
        { x: 1060, y: 520 }
    ];

    


    stagePositions.forEach((position, index) => {
        const stage = testData.stages[index];
        const nextStage = testData.stages[index + 1];
        if (!stage) return;

        this.createLine(
            nextStage ? stagePositions[index + 1].x : position.x,
            nextStage ? stagePositions[index + 1].y : position.y,
            position.x,
            position.y,
            25,
            0x000000
        );
        this.createLine(
            nextStage ? stagePositions[index + 1].x : position.x,
            nextStage ? stagePositions[index + 1].y : position.y,
            position.x,
            position.y,
            20,
            0xdddddd
        );
        this.createActionCircle(
            position.x,
            position.y,
            100,
            stage.name
        );
        
    });
    
    
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

  const container = scene.add.container(0, 0).setDepth(3000);

  // 背景を暗くする
  const darkBackground = scene.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    0x000000,
    0.55
  )
    .setScrollFactor(0)
    .setInteractive();

  // ポップアップ
  const popupWidth = width * 0.7;
  const popupHeight = height * 0.7;

  const popup = scene.add.rectangle(
    width / 2,
    height / 2,
    popupWidth,
    popupHeight,
    0xffffff
  )
    .setStrokeStyle(3, 0x536878)
    .setScrollFactor(0);

  // ステージデータ取得
  const stage = testData.stages.find(
    stage => stage.name === stageLabel
  );

  if (!stage) {
    console.error(`ステージが見つかりません: ${stageLabel}`);
    return;
  }

  // ステージ名
  const title = scene.add.text(
    width / 2,
    height / 2 - 190,
    stage.name,
    this.getTextStyle(32)
  )
    .setOrigin(0.5)
    .setScrollFactor(0);

  // 敵情報
  const enemyText = stage.enemies
    .map(enemy =>
      `敵ID: ${enemy.id}　${enemy.num}体　Lv.${enemy.level}`
    )
    .join('\n');

  const bossText =
    `ボス\n敵ID: ${stage.boss.id}　${stage.boss.num}体　Lv.${stage.boss.level}`;

  const stageInfo = scene.add.text(
    width / 2,
    height / 2 - 70,
    `敵情報\n${enemyText}\n\n${bossText}`,
    this.getTextStyle(20)
  )
    .setOrigin(0.5)
    .setScrollFactor(0);

  // 警告
  const warning = scene.add.text(
    width / 2,
    height / 2 + 80,
    '編成を変更してから出撃できます。',
    {
      ...this.getTextStyle(18),
      color: '#888888'
    }
  )
    .setOrigin(0.5)
    .setScrollFactor(0);

  // 閉じるボタン
  const closeButton = scene.add.text(
    width / 2 + 250,
    height / 2 - 190,
    '×',
    {
      ...this.getTextStyle(32),
      color: '#888888'
    }
  )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(0);

  // 編成ボタン
  const formationButton = scene.add.text(
    width / 2 - 150,
    height / 2 + 150,
    '編成',
    {
      ...this.getTextStyle(22),
      color: '#ffffff',
      backgroundColor: '#536878',
      padding: {
        left: 35,
        right: 35,
        top: 15,
        bottom: 15
      }
    }
  )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(0);

  // 出撃ボタン
  const startButton = scene.add.text(
    width / 2 + 150,
    height / 2 + 150,
    '出撃',
    {
      ...this.getTextStyle(22),
      color: '#ffffff',
      backgroundColor: '#4c8c5a',
      padding: {
        left: 35,
        right: 35,
        top: 15,
        bottom: 15
      }
    }
  )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(0);

  // コンテナに追加
  container.add([
    darkBackground,
    popup,
    title,
    stageInfo,
    warning,
    formationButton,
    startButton,
    closeButton
  ]);

  // 編成画面
  formationButton.on('pointerdown', () => {
    container.destroy();
    scene.scene.start('FormScene');
  });

  // ステージ画面
  startButton.on('pointerdown', () => {
    container.destroy();
    scene.scene.start('StageScene', {
      stageId: stage.id
    });
  });

  // 閉じる
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