import Phaser from 'phaser';
import { getTextStyle } from './styles';

// 撤退確認ポップアップ共通化 (TestScene と StageScene で共通)
export const showRetreatDialog = (
  scene: Phaser.Scene,
  onRetreat: () => void
): Phaser.GameObjects.Container => {
  const width = scene.scale.width;
  const height = scene.scale.height;

  // 深度を上げて最前面に表示
  const container = scene.add.container(0, 0).setDepth(4000).setScrollFactor(0);

  const darkBg = scene.add.rectangle(width / 2, height / 2, width + 500, height + 500, 0x000000, 0.55)
    .setInteractive().setScrollFactor(0);

  const popup = scene.add.rectangle(width / 2, height / 2, 650, 330, 0xffffff)
    .setStrokeStyle(3, 0x536878).setScrollFactor(0);

  const title = scene.add.text(width / 2, height / 2 - 90, 'ステージから撤退しますか？', getTextStyle(32))
    .setOrigin(0.5).setScrollFactor(0);

  const warning = scene.add.text(width / 2, height / 2 - 20, '進行状況が失われます。', getTextStyle(24, { color: '#444444' }))
    .setOrigin(0.5).setScrollFactor(0);

  const createDialogButton = (x: number, label: string, onClick: () => void): void => {
    const bg = scene.add.rectangle(x, height / 2 + 90, 210, 70, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(x, height / 2 + 90, label, getTextStyle(24, { color: '#000000' }))
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0xeaf4fb));
    bg.on('pointerout', () => bg.setFillStyle(0xffffff));
    bg.on('pointerdown', () => bg.setFillStyle(0xd5e8f5));
    bg.on('pointerup', () => onClick());
    container.add([bg, text]);
  };

  // Add the dimmer and popup first so the two buttons remain the topmost hit areas.
  container.add([darkBg, popup, title, warning]);
  createDialogButton(width / 2 - 150, 'キャンセル', () => container.destroy());
  createDialogButton(width / 2 + 150, '撤退する', () => {
    container.destroy();
    onRetreat();
  });
  
  return container;
};
