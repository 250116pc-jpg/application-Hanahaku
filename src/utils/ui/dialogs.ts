import Phaser from 'phaser';
import { getTextStyle } from './styles';
import { createRectButton } from './buttons';

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

  // キャンセル時はコンテナごと破棄
  const btnCancel = createRectButton(scene, width / 2 - 150, height / 2 + 90, 210, 70, 'キャンセル', () => container.destroy());
  
  const btnRetreat = createRectButton(scene, width / 2 + 150, height / 2 + 90, 210, 70, '撤退する', () => {
    container.destroy();
    onRetreat();
  });

  container.add([darkBg, popup, title, warning, btnCancel, btnRetreat]);
  
  return container;
};