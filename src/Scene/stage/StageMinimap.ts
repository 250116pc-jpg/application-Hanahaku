import Phaser from 'phaser';
import type { Player } from './Player';
import type { Enemy } from './Enemy';

/** Screen-fixed overview; terrain is drawn once and only markers move each frame. */
export function createStageMinimap(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  player: Player,
  enemies: readonly Enemy[],
  rescuePoint?: { x: number; y: number }
): void {
  const width = 300;
  const height = 156;
  const inset = 14;
  const mapTop = 30;
  const mapWidth = width - inset * 2;
  const mapHeight = 98;
  const scale = Math.min(mapWidth / map.widthInPixels, mapHeight / map.heightInPixels);
  const drawnWidth = map.widthInPixels * scale;
  const drawnHeight = map.heightInPixels * scale;
  const left = inset + (mapWidth - drawnWidth) / 2;
  const top = mapTop + (mapHeight - drawnHeight) / 2;
  const pointX = (x: number): number => left + Phaser.Math.Clamp(x, 0, map.widthInPixels) * scale;
  const pointY = (y: number): number => top + Phaser.Math.Clamp(y, 0, map.heightInPixels) * scale;
  const root = scene.add.container(scene.scale.width - width - 22, 82)
    .setName('stage-minimap').setScrollFactor(0).setDepth(2001);
  const terrain = scene.add.graphics();
  terrain.fillStyle(0x101d2c, 0.9).fillRoundedRect(0, 0, width, height, 10);
  terrain.lineStyle(1, 0xbda780, 0.9).strokeRoundedRect(0, 0, width, height, 10);
  terrain.fillStyle(0x091522, 0.9).fillRect(left, top, drawnWidth, drawnHeight);
  terrain.fillStyle(0x809686, 0.9);
  map.getLayer('地形')?.data.forEach(row => row.forEach(tile => {
    if (tile.index < 0 || !tile.collides) return;
    terrain.fillRect(pointX(tile.pixelX), pointY(tile.pixelY), tile.width * scale, tile.height * scale);
  }));
  root.add(terrain);
  const text = (x: number, y: number, value: string, color: string): Phaser.GameObjects.Text => {
    const label = scene.add.text(x, y, value, { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: '12px', color });
    root.add(label);
    return label;
  };
  text(14, 8, 'ミニマップ', '#fff4df');
  text(14, 135, '● 自分', '#8eeaff');
  text(80, 135, '◆ 敵', '#ff9387');
  if (rescuePoint) {
    const goal = scene.add.star(pointX(rescuePoint.x), pointY(rescuePoint.y), 4, 3, 6, 0xffdc86);
    root.add(goal);
    text(140, 135, '✦ 救出地点', '#ffdc86');
  }
  const viewport = scene.add.graphics().setName('minimap-viewport');
  root.add(viewport);
  const enemyMarkers = enemies.map(enemy => {
    const marker = scene.add.rectangle(0, 0, 5, 5, 0xff9387).setAngle(45);
    root.add(marker);
    return { enemy, marker };
  });
  const playerMarker = scene.add.circle(0, 0, 4, 0x8eeaff)
    .setStrokeStyle(1, 0xffffff).setName('minimap-player');
  root.add(playerMarker);
  const update = (): void => {
    playerMarker.setPosition(pointX(player.x), pointY(player.y));
    for (const { enemy, marker } of enemyMarkers) {
      marker.setVisible(enemy.active && !enemy.isDefeated);
      if (marker.visible) marker.setPosition(pointX(enemy.x), pointY(enemy.y));
    }
    const view = scene.cameras.main.worldView;
    const x1 = pointX(view.left);
    const y1 = pointY(view.top);
    const x2 = pointX(view.right);
    const y2 = pointY(view.bottom);
    viewport.clear().lineStyle(1, 0xd7e9f4, 0.65).strokeRect(x1, y1, x2 - x1, y2 - y1);
  };
  update();
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, update);
  });
}
