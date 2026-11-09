/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜共通UI・buttons
import Phaser from 'phaser';
import { getTextStyle } from './styles';

// 共通テキストボタン（戻るボタン、タブ、ヘッダーボタンなどに使用）
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 文字ボタンを生成し、ホバー・押下時の色変更とクリック通知を設定する。
 * ================================== */
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
  .setScrollFactor(0)
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
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 枠付き矩形とラベルをまとめ、押下状態の色とクリック処理を設定する。
 * ================================== */
export const createRectButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  options: { fontSize?: number; fillColor?: number; hoverColor?: number; downColor?: number; textColor?: string } = {}
): Phaser.GameObjects.Container => {
  const fillColor = options.fillColor ?? 0xffffff;
  const hoverColor = options.hoverColor ?? 0xeaf4fb;
  const downColor = options.downColor ?? 0xd5e8f5;

  const bg = scene.add.rectangle(0, 0, width, height, fillColor)
    .setStrokeStyle(2, 0x333333)
    .setInteractive({ useHandCursor: true });

  const text = scene.add.text(0, 0, label, getTextStyle(options.fontSize ?? 24, {
    color: options.textColor ?? '#000000'
  })).setOrigin(0.5);
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

// 画像または矩形背景付きの共通ボタン
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 画像または矩形を背景にしたボタンを生成し、指定寸法・ラベル・操作時の反応を設定する。
 * ================================== */
export const createTextImageButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  onClick: () => void,
  image?: string | {
    key: string;
    width?: number;
    height?: number;
  }
): Phaser.GameObjects.Container => {
  const height = 65;

  const imageConfig = typeof image === 'string'
    ? { key: image, width, height }
    : image ?? null;

  const background = imageConfig
    ? scene.add.image(0, 0, imageConfig.key)
        .setDisplaySize(
          imageConfig.width ?? width,
          imageConfig.height ?? height
        )
    : scene.add.rectangle(0, 0, width, height, 0x7fa2c4);

  const text = scene.add.text(0, 0, label, getTextStyle(24, {
    color: '#ffffff',
    fontStyle: 'bold',
    align: 'center'
  })).setOrigin(0.5);

  const container = scene.add.container(x, y, [background, text])
    .setSize(width, height)
    .setInteractive({ useHandCursor: true });

  container.on('pointerover', () => background.setAlpha(0.8));
  container.on('pointerout', () => background.setAlpha(1));
  container.on('pointerdown', onClick);

  return container;
};