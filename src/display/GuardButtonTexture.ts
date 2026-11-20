import Phaser from 'phaser';

// 戦闘画面と配置調整画面で同じ盾アイコンを使う。
export function ensureGuardButtonTexture(scene: Phaser.Scene): string {
  const key = 'stage-guard';
    if (!scene.textures.exists(key)) {
      const art = scene.make.graphics({ x: 0, y: 0 }, false);
      art.fillStyle(0x202a37).fillCircle(60, 60, 55);
      art.lineStyle(2, 0xe5d4a5).strokeCircle(60, 60, 54);
      art.lineStyle(1, 0xbca780).strokeCircle(60, 60, 50);
      for (const [px, py] of [[60, 9], [111, 60], [60, 111], [9, 60]]) {
        art.strokePoints([{ x: px, y: py - 4 }, { x: px + 4, y: py },
          { x: px, y: py + 4 }, { x: px - 4, y: py }], true);
      }
      art.fillStyle(0xf4dfb8).fillPoints([{ x: 39, y: 31 }, { x: 60, y: 24 },
        { x: 81, y: 31 }, { x: 78, y: 53 }, { x: 60, y: 69 }, { x: 42, y: 53 }], true);
      art.lineStyle(2, 0x8b7458).lineBetween(60, 32, 60, 60).lineBetween(47, 43, 73, 43);
      art.generateTexture(key, 120, 120);
      art.destroy();
    }

  return key;
}
