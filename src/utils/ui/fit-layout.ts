import Phaser from 'phaser';

/** 基準サイズの縦横比を維持し、画面内で中央に収める倍率と位置を求める。 */
export function getFittedLayout(viewportWidth: number, viewportHeight: number, baseWidth = 1280, baseHeight = 720) {
  if (![viewportWidth, viewportHeight, baseWidth, baseHeight].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error('画面と基準サイズには0より大きい数値を指定してください。');
  }
  const scale = Math.min(viewportWidth / baseWidth, viewportHeight / baseHeight);
  return { x: (viewportWidth - baseWidth * scale) / 2, y: (viewportHeight - baseHeight * scale) / 2, scale };
}

/** 画面サイズへのフィットのみを担当する。ユーザーのGUI倍率はlayout.tsが別に適用する。 */
export function createFittedContainer(scene: Phaser.Scene, baseWidth = 1280, baseHeight = 720): Phaser.GameObjects.Container {
  const { x, y, scale } = getFittedLayout(scene.scale.width, scene.scale.height, baseWidth, baseHeight);
  return scene.add.container(x, y).setScale(scale);
}
