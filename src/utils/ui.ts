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

export type MapSelectionButtonOptions = {
  radius?: number;
  selectedColor?: number;
  defaultColor?: number;
  lockedColor?: number;
  selectedRingColor?: number;
  defaultRingColor?: number;
  lockedRingColor?: number;
  textColor?: string;
  fontSize?: number;
  depth?: number;
};

export const createMapSelectionButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  id: string,
  selected: boolean,
  unlocked: boolean,
  onSelect: () => void,
  options: MapSelectionButtonOptions = {}
): Phaser.GameObjects.Container => {
  const radius = options.radius ?? 26;
  const selectedColor = options.selectedColor ?? 0x6fc7a8;
  const defaultColor = options.defaultColor ?? 0x8ed3b2;
  const lockedColor = options.lockedColor ?? 0xbebebe;
  const selectedRingColor = options.selectedRingColor ?? 0x1e5e49;
  const defaultRingColor = options.defaultRingColor ?? 0x2c4f65;
  const lockedRingColor = options.lockedRingColor ?? 0x777777;
  const textColor = options.textColor ?? '#ffffff';
  const fontSize = options.fontSize ?? 18;
  const depth = options.depth ?? 5;

  const fillColor = unlocked ? (selected ? selectedColor : defaultColor) : lockedColor;
  const ringColor = unlocked ? (selected ? selectedRingColor : defaultRingColor) : lockedRingColor;

  const button = scene.add.circle(0, 0, radius, fillColor)
    .setStrokeStyle(4, ringColor)
    .setDepth(depth)
    .setInteractive({ useHandCursor: unlocked });

  const label = scene.add.text(0, 0, id, getTextStyle(fontSize, {
    color: textColor,
    stroke: '#000000',
    strokeThickness: 2,
    fontStyle: 'bold'
  }))
    .setOrigin(0.5)
    .setDepth(depth + 1);

  const container = scene.add.container(x, y, [button, label]).setDepth(depth);

  if (unlocked) {
    button.on('pointerover', () => {
      container.setScale(1.08);
    });

    button.on('pointerout', () => {
      container.setScale(1);
    });

    button.on('pointerdown', () => {
      onSelect();
    });
  }

  return container;
};

export type SelectionDetailPanelOptions = {
  title?: string;
  width?: number;
  height?: number;
  panelColor?: number;
  borderColor?: number;
  titleColor?: string;
  nameColor?: string;
  descriptionColor?: string;
  buttonLabel?: string;
  buttonBgColor?: string;
  buttonHoverColor?: string;
  buttonDownColor?: string;
  titleFontSize?: number;
  nameFontSize?: number;
  descriptionFontSize?: number;
  buttonFontSize?: number;
};

export const createSelectionDetailPanel = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  onConfirm: () => void,
  options: SelectionDetailPanelOptions = {}
): {
  container: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  name: Phaser.GameObjects.Text;
  description: Phaser.GameObjects.Text;
  marker: Phaser.GameObjects.Arc;
  button: Phaser.GameObjects.Text;
} => {
  const width = options.width ?? 360;
  const height = options.height ?? 170;
  const panelColor = options.panelColor ?? 0xfafdfb;
  const borderColor = options.borderColor ?? 0xc8d9d3;
  const titleColor = options.titleColor ?? '#1f3340';
  const nameColor = options.nameColor ?? '#162b2f';
  const descriptionColor = options.descriptionColor ?? '#4a585d';
  const buttonLabel = options.buttonLabel ?? 'このエリアで選択';

  const container = scene.add.container(x, y); 

  const panel = scene.add.rectangle(0, 0, width, height, panelColor)
    .setStrokeStyle(3, borderColor)
    .setDepth(10);

  const title = scene.add.text(0, -54, options.title ?? '選択中のエリア', getTextStyle(options.titleFontSize ?? 24, {
    color: titleColor,
    fontStyle: 'bold'
  }))
    .setOrigin(0.5)
    .setDepth(11);

  const marker = scene.add.arc(0, -72, 102, 0, 360, false, 0x7dd3b5, 0.25)
    .setDepth(9);

  const name = scene.add.text(0, -18, '', getTextStyle(options.nameFontSize ?? 30, {
    color: nameColor,
    fontStyle: 'bold'
  }))
    .setOrigin(0.5)
    .setDepth(11);

  const description = scene.add.text(0, 28, '', getTextStyle(options.descriptionFontSize ?? 18, {
    color: descriptionColor,
    wordWrap: { width: 260 }
  }))
    .setOrigin(0.5)
    .setDepth(11);

  const button = createTextButton(scene, 0, 60, buttonLabel, onConfirm, {
    fontSize: options.buttonFontSize ?? 20,
    bgColor: options.buttonBgColor ?? '#4c7f9a',
    hoverColor: options.buttonHoverColor ?? '#3d6d87',
    downColor: options.buttonDownColor ?? '#2e5c74',
    padding: { top: 12, bottom: 12, left: 24, right: 24 }
  });
  button.setStyle({ color: '#ffffff' });
  button.setDepth(11);

  container.add([panel, marker, title, name, description, button]);

  return { container, title, name, description, marker, button };
};