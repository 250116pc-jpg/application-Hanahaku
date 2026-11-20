import Phaser from 'phaser';
import { registerButton } from './layout';
import { FONT_FAMILY } from './styles';

export interface ImageButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  texture: string;
  frame?: string | number;
  label: string;
  layoutId: string;
  parent?: Phaser.GameObjects.Container;
  /** 画像だけに余白を持たせる場合も、クリック範囲はwidth/heightを使う。 */
  imageWidth?: number;
  imageHeight?: number;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  hitTarget?: 'zone' | 'image' | 'label' | 'parent';
  enabled?: boolean;
  disabledAlpha?: number;
  hoverAlpha?: number;
  hoverTint?: number;
  trigger?: 'pointerup' | 'pointerdown';
  canActivate?: () => boolean;
  onClick?: () => void;
}

/** 画像・文字・入力・レイアウト登録を一か所で作り、各パーツの参照を返す。 */
export function createImageButton(scene: Phaser.Scene, options: ImageButtonOptions) {
  const { x, y, width, height, parent } = options;
  if (options.hitTarget === 'parent' && !parent) throw new Error('parentをクリック対象にするにはContainerが必要です。');
  const image = scene.add.image(x, y, options.texture, options.frame)
    .setDisplaySize(options.imageWidth ?? width, options.imageHeight ?? height);
  parent?.add(image);
  const label = scene.add.text(x, y, options.label, {
    fontFamily: FONT_FAMILY, fontSize: 20, color: '#fff5df', fontStyle: 'bold',
    ...options.textStyle,
  }).setOrigin(0.5);
  parent?.add(label);
  const hit = options.hitTarget === 'image' ? image
    : options.hitTarget === 'label' ? label
    : options.hitTarget === 'parent' ? parent!
    : scene.add.zone(x, y, width, height);
  if (hit instanceof Phaser.GameObjects.Zone) parent?.add(hit);
  if (hit === parent) parent.setSize(width, height);
  if (options.enabled !== false) hit.setInteractive({ useHandCursor: true });
  else image.setAlpha(options.disabledAlpha ?? 0.4);
  hit.on('pointerover', () => {
    if (options.enabled === false) return;
    if (options.hoverAlpha !== undefined) image.setAlpha(options.hoverAlpha);
    if (options.hoverTint !== undefined) image.setTint(options.hoverTint);
  });
  hit.on('pointerout', () => {
    if (options.enabled === false) return;
    if (options.hoverAlpha !== undefined) image.setAlpha(1);
    if (options.hoverTint !== undefined) image.clearTint();
  });
  if (options.onClick) hit.on(options.trigger ?? 'pointerup', () => {
    if (options.enabled !== false && (options.canActivate?.() ?? true)) options.onClick!();
  });
  if (hit === parent) registerButton(scene, options.layoutId, [parent]);
  else registerButton(scene, options.layoutId, [image, label, hit], { x, y });
  image.setData('label', label);
  return { image, label, hit };
}
