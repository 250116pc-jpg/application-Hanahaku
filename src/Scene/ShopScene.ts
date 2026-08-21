import Phaser from 'phaser';

import { shopItems, type ShopItem } from '../data/shopItems';

export class ShopScene extends Phaser.Scene {
  private selectedNameText!: Phaser.GameObjects.Text;
  private selectedPriceText!: Phaser.GameObjects.Text;
  private selectedDescriptionText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor('#cfe3f5');

    this.add
      .rectangle(width / 2, height / 2, 1180, 650, 0xcfe3f5)
      .setStrokeStyle(3, 0x536878);

    this.add
      .text(width / 2, 55, 'ショップ', this.getTextStyle(34))
      .setOrigin(0.5);

    this.createBackButton();
    this.createItemList();
    this.createDetailPanel();

    this.selectItem(shopItems[0]);
  }

  private createBackButton(): void {
    const button = this.add
      .text(125, 65, '← ホームへ', {
        ...this.getTextStyle(25),
        backgroundColor: '#ffffff',
        padding: {
          top: 10,
          bottom: 12,
          left: 18,
          right: 18,
        },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#eaf4fb'));
    button.on('pointerout', () => button.setBackgroundColor('#ffffff'));
    button.on('pointerdown', () => button.setBackgroundColor('#d5e8f5'));
    button.on('pointerup', () => this.scene.start('HomeScene'));
  }

  private createItemList(): void {
    this.add
      .rectangle(350, 360, 500, 480, 0xffffff)
      .setStrokeStyle(2, 0x536878);

    this.add.text(120, 135, '商品一覧', this.getTextStyle(28));

    shopItems.forEach((item, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 220 + column * 260;
      const y = 245 + row * 170;
      this.createItemCard(x, y, item);
    });
  }

  private createItemCard(
    x: number,
    y: number,
    item: ShopItem
  ): void {
    const background = this.add
      .rectangle(0, 0, 220, 135, 0xffffff)
      .setStrokeStyle(2, 0x536878)
      .setInteractive({ useHandCursor: true });

    const flower = this.add
      .circle(-72, -3, 29, item.color)
      .setStrokeStyle(2, 0x536878);

    const name = this.add
      .text(-30, -27, item.name, this.getTextStyle(22));

    const price = this.add
      .text(-30, 20, `${item.price} コイン`, {
        ...this.getTextStyle(18),
        color: '#555555',
      });

    const card = this.add.container(x, y, [background, flower, name, price]);

    background.on('pointerover', () => background.setFillStyle(0xeaf4fb));
    background.on('pointerout', () => background.setFillStyle(0xffffff));
    background.on('pointerdown', () => background.setFillStyle(0xd5e8f5));
    background.on('pointerup', () => {
      background.setFillStyle(0xeaf4fb);
      this.selectItem(item);
    });

    card.setSize(220, 135);
  }

  private createDetailPanel(): void {
    this.add
      .rectangle(925, 360, 390, 480, 0xffffff)
      .setStrokeStyle(2, 0x536878);

    this.add.text(760, 135, '商品詳細', this.getTextStyle(28));

    this.selectedNameText = this.add
      .text(925, 235, '', this.getTextStyle(30))
      .setOrigin(0.5);

    this.selectedPriceText = this.add
      .text(925, 300, '', this.getTextStyle(24))
      .setOrigin(0.5);

    this.selectedDescriptionText = this.add
      .text(760, 370, '', {
        ...this.getTextStyle(22),
        wordWrap: { width: 325 },
        lineSpacing: 8,
      });

    const buyButton = this.add
      .text(925, 560, '購入する（準備中）', {
        ...this.getTextStyle(24),
        backgroundColor: '#ffffff',
        padding: {
          top: 12,
          bottom: 12,
          left: 24,
          right: 24,
        },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    buyButton.on('pointerover', () => buyButton.setBackgroundColor('#eaf4fb'));
    buyButton.on('pointerout', () => buyButton.setBackgroundColor('#ffffff'));
    buyButton.on('pointerdown', () => buyButton.setBackgroundColor('#d5e8f5'));
    buyButton.on('pointerup', () => {
      buyButton.setBackgroundColor('#eaf4fb');
      this.showMessage('購入機能は準備中です');
    });

    this.messageText = this.add
      .text(925, 640, '', {
        ...this.getTextStyle(20),
        color: '#444444',
      })
      .setOrigin(0.5);
  }

  private selectItem(item: ShopItem): void {
    this.selectedNameText.setText(item.name);
    this.selectedPriceText.setText(`${item.price} コイン`);
    this.selectedDescriptionText.setText(item.description);
  }

  private showMessage(message: string): void {
    this.messageText.setText(message);

    this.time.delayedCall(1800, () => {
      this.messageText.setText('');
    });
  }

  private getTextStyle(
    fontSize: number
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000000',
      padding: {
        top: 7,
        bottom: 7,
        left: 6,
        right: 6,
      },
    };
  }
}
