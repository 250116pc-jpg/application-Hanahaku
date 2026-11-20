/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250116
 * 氏名：武田優人、中村伊安
 * ================================== */
import Phaser from 'phaser';
import { createImageButton } from './image-button';
import backImage from '../../assets/ui/button1.png';
import { getBodyTextStyle } from './styles';
import { smoothText } from './display-quality';

/* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
 * 処理内容 : 戻るボタン共通を定義する
 * ================================== */
const BACK_TEXTURE = 'ui-back-button';
export const BACK_BUTTON_POSITION = { x: 120, y: 45 } as const;

// 各Sceneのpreload()から呼ぶ。ログイン画面と同じ画像を使う。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 戻るボタン画像を読み込む
 * ================================== */
export function preloadBackButton(scene: Phaser.Scene): void {
  if (!scene.textures.exists(BACK_TEXTURE)) scene.load.image(BACK_TEXTURE, backImage);
}

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
export type BackButtonOptions = {
  width: number;
  height: number;
  fontSize: number;
  depth?: number;
};

// 画面左上に置き、サイズと戻り先は画面側で指定する。
/* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
 * 処理内容 : 共通の戻るボタンを生成する
 * ================================== */
export function createBackButton(
  scene: Phaser.Scene, options: BackButtonOptions, onBack: () => void
): Phaser.GameObjects.Container {
  const { width, height, fontSize, depth = 0 } = options;
  const { x, y } = BACK_BUTTON_POSITION;
  const button = scene.add.container(x, y).setDepth(depth).setScrollFactor(0);
  const parts = createImageButton(scene, {
    parent: button, x: 0, y: 0, width, height, texture: BACK_TEXTURE,
    label: '‹ もどる', layoutId: `${scene.sys.settings.key}.back`, hitTarget: 'parent',
    textStyle: getBodyTextStyle(fontSize, {
      color: '#fff3d5', shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }),
    hoverTint: 0xffe4b5, onClick: onBack,
  });
  parts.image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  smoothText(parts.label);
  return button;
}
