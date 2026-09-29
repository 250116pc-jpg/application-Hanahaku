import Phaser from 'phaser';
import { getTextStyle, createTextButton, showRetreatDialog } from '../../utils/ui/index.ts';
import testData from '../test_data.ts';

export class StageHUD {
  private scene: Phaser.Scene;
  private readonly HUD_DEPTH = 2000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // UIの生成処理をまとめたエントリーポイント
  public create(): void {
    this.createStageHud();
    this.createPartyHud();
  }

  // =========================
  // ステージHUD
  // =========================
  private createStageHud(): void {
    const width = this.scene.scale.width;

    // HP
    this.scene.add.text(20, 16, 'HP:', getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.scene.add.rectangle(245, 32, 330, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.scene.add.rectangle(245, 32, 330, 20, 0x16a526).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1);

    // MP
    this.scene.add.text(20, 50, 'MP:', getTextStyle(22)).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.scene.add.rectangle(180, 66, 200, 20, 0x555555).setScrollFactor(0).setDepth(this.HUD_DEPTH);
    this.scene.add.rectangle(180, 66, 200, 20, 0x16a9b5).setScrollFactor(0).setDepth(this.HUD_DEPTH + 1);

    // バッグ：画面に固定した画像ボタン
    const bag = this.scene.add.image(72, 126, 'stage-bag')
      .setDisplaySize(88, 88)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH)
      .setInteractive({ useHandCursor: true });
    bag.on('pointerover', () => bag.setTint(0xffe6af));
    bag.on('pointerout', () => bag.clearTint());
    bag.on('pointerdown', () => bag.setTint(0xd6bb85));
    bag.on('pointerup', () => {
      bag.clearTint();
      this.openInventory();
    });
    this.scene.add.text(72, 178, 'バッグ', getTextStyle(18, {
      color: '#ffffff', stroke: '#172333', strokeThickness: 3
    })).setOrigin(0.5).setScrollFactor(0).setDepth(this.HUD_DEPTH);

    // 撤退
    createTextButton(
      this.scene, width - 95, 65, '撤退',
      () => {
        // シーン遷移は this.scene.scene.start になる点に注意
        showRetreatDialog(this.scene, () => this.scene.scene.start('SelectStageScene'));
      },
      { fontSize: 22 }
    ).setDepth(this.HUD_DEPTH);
  }

  // =========================
  // パーティHUD
  // =========================
  private createPartyHud(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const formation = testData.formation;

    for (let i = 0; i < 4; i++) {
      const characterId = formation[i];

      // 4人を横一列に配置
      const x = width / 2 - 450 + i * 300;
      const y = height - 75;

      // 枠
      this.scene.add.rectangle(x, y, 200, 110, 0xffffff, 0.9)
        .setStrokeStyle(2, 0x536878)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH);

      // キャラクター検索
      const character = testData.characters.find(c => c.id === characterId);

      // 空き枠
      if (!character) {
        this.scene.add.text(x, y, '空き', getTextStyle(20, { color: '#777777' }))
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(this.HUD_DEPTH + 1);
        continue;
      }

      // 名前
      this.scene.add.text(x, y - 40, character.name, getTextStyle(20, { fontStyle: 'bold' }))
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH + 1);

      // HPバー & 数値
      this.createProgressBar(x - 100, y - 100, 200, 16, character.stats.hp, character.stats.hp, 0xff2026);
      this.scene.add.text(x, y - 8, `HP ${character.stats.hp}/${character.stats.hp}`, getTextStyle(13, { color: '#ffffff' }))
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH + 2);

      // MPバー & 数値
      this.createProgressBar(x - 100, y - 82, 200, 16, character.stats.mp, character.stats.mp, 0x16a9b5);
      this.scene.add.text(x, y + 20, `MP ${character.stats.mp}/${character.stats.mp}`, getTextStyle(13, { color: '#ffffff' }))
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.HUD_DEPTH + 2);
    }
  }

  // =========================
  // プログレスバー作成
  // =========================
  private createProgressBar(
    x: number, y: number, width: number, height: number,
    value: number, maxValue: number, color: number
  ): void {
    // 背景
    this.scene.add.rectangle(x + width / 2, y + height / 2, width + 5, height + 5, 0x555555)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH + 1);

    // 現在値
    const percent = Phaser.Math.Clamp(value / maxValue, 0, 1);
    const currentWidth = width * percent;

    if (currentWidth <= 0) return;

    this.scene.add.rectangle(x + currentWidth / 2, y + height / 2, currentWidth, height, color)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this.HUD_DEPTH + 2);
  }

  // =========================
  // バッグ
  // =========================
  private openInventory(): void {
    // this.scene.scene を介して ScenePlugin にアクセスします
    if (this.scene.scene.isActive('InventoryScene')) return;

    this.scene.scene.launch('InventoryScene', { returnScene: 'StageScene' });
    this.scene.scene.bringToTop('InventoryScene');
    this.scene.scene.pause('StageScene');
  }
}