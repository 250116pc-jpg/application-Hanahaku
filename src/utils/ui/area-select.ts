/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜共通UI・area-select
import Phaser from 'phaser';
import { getTextStyle } from './styles';
import { createTextButton } from './buttons';

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

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : エリアの選択・未選択・ロック状態に応じた丸いマーカーを生成し、選択操作を通知する。
 * ================================== */
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

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 選択したエリアの見出し・名称・説明・確定ボタンをまとめた詳細パネルを生成する。
 * ================================== */
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