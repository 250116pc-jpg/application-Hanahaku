import Phaser from 'phaser';

export const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif';

// 共通テキストスタイル
export const getTextStyle = (fontSize: number, extraOptions = {}): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontSize: `${fontSize}px`,
  color: '#000000',
  padding: { top: 8, bottom: 8, left: 8, right: 8 },
  ...extraOptions
});

// 共通テキストボタン（戻るボタン、タブ、ヘッダーボタンなどに使用）
export const createTextButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: { fontSize?: number; bgColor?: string; hoverColor?: string; downColor?: string; padding?: any } = {}
): Phaser.GameObjects.Text => {
  const bgColor = options.bgColor ?? '#ffffff';
  const hoverColor = options.hoverColor ?? '#eaf4fb';
  const downColor = options.downColor ?? '#d5e8f5';

  const button = scene.add.text(x, y, label, getTextStyle(options.fontSize ?? 24, {
    backgroundColor: bgColor,
    padding: options.padding ?? { top: 12, bottom: 12, left: 18, right: 18 }
  }))
  .setOrigin(0.5)
  .setScrollFactor(0) // UI用なので基本はスクロール追従しない
  .setInteractive({ useHandCursor: true });

  button.on('pointerover', () => button.setBackgroundColor(hoverColor));
  button.on('pointerout', () => button.setBackgroundColor(bgColor));
  button.on('pointerdown', () => button.setBackgroundColor(downColor));
  button.on('pointerup', () => {
    button.setBackgroundColor(hoverColor);
    onClick();
  });

  return button;
};

// 共通枠付き矩形ボタン（ポップアップのボタンや「キャラ詳細を見る」などの大型ボタン）
export const createRectButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  options: { fontSize?: number; fillColor?: number; hoverColor?: number; downColor?: number } = {}
): Phaser.GameObjects.Container => {
  const fillColor = options.fillColor ?? 0xffffff;
  const hoverColor = options.hoverColor ?? 0xeaf4fb;
  const downColor = options.downColor ?? 0xd5e8f5;

  const bg = scene.add.rectangle(0, 0, width, height, fillColor)
    .setStrokeStyle(2, 0x333333)
    .setInteractive({ useHandCursor: true });

  const text = scene.add.text(0, 0, label, getTextStyle(options.fontSize ?? 24)).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]).setScrollFactor(0);

  bg.on('pointerover', () => bg.setFillStyle(hoverColor));
  bg.on('pointerout', () => bg.setFillStyle(fillColor));
  bg.on('pointerdown', () => bg.setFillStyle(downColor));
  bg.on('pointerup', () => {
    bg.setFillStyle(hoverColor);
    onClick();
  });

  return container;
};

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