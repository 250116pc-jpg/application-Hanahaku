import Phaser from 'phaser';
import backImage from '../../assets/ui/button1.png';
import { getBodyTextStyle } from './styles';
import { smoothText } from './display-quality';

const BACK_TEXTURE = 'ui-back-button';
export const BACK_BUTTON_POSITION = { x: 120, y: 45 } as const;

// 各Sceneのpreload()から呼ぶ。ログイン画面と同じ画像を使う。
export function preloadBackButton(scene: Phaser.Scene): void {
  if (!scene.textures.exists(BACK_TEXTURE)) scene.load.image(BACK_TEXTURE, backImage);
}

export type BackButtonOptions = {
  width: number;
  height: number;
  fontSize: number;
  depth?: number;
};

// 画面左上に置き、サイズと戻り先は画面側で指定する。
export function createBackButton(
  scene: Phaser.Scene, options: BackButtonOptions, onBack: () => void
): Phaser.GameObjects.Container {
  const { width, height, fontSize, depth = 0 } = options;
  const { x, y } = BACK_BUTTON_POSITION;
  const image = scene.add.image(0, 0, BACK_TEXTURE).setDisplaySize(width, height);
  image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  const text = smoothText(scene.add.text(0, 0, '‹ もどる', getBodyTextStyle(fontSize, {
    color: '#fff3d5', shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
  })).setOrigin(0.5));
  const button = scene.add.container(x, y, [image, text]).setDepth(depth)
    .setSize(width, height).setInteractive({ useHandCursor: true });
  button.on('pointerover', () => image.setTint(0xffe4b5));
  button.on('pointerout', () => image.clearTint());
  button.on('pointerup', onBack);
  return button;
}
