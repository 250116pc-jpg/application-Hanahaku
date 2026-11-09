// 担当：たまおちゃん｜戦闘背景の演出
import Phaser from 'phaser';
import type { Player } from './Player';
import type { Enemy } from './Enemy';

/** Small shared, renderer-independent light textures; generated once per game. */
export function ensureBattleTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('battle-glow')) {
    const texture = scene.textures.createCanvas('battle-glow', 128, 128)!;
    const ctx = texture.context;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.12, 'rgba(255,255,255,.8)');
    gradient.addColorStop(.4, 'rgba(255,255,255,.22)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    texture.refresh();
  }
  if (!scene.textures.exists('battle-spark')) {
    const art = scene.make.graphics({ x: 0, y: 0 }, false);
    art.fillStyle(0xffffff).fillPoints([{ x: 8, y: 0 }, { x: 10, y: 6 }, { x: 16, y: 8 }, { x: 10, y: 10 }, { x: 8, y: 16 }, { x: 6, y: 10 }, { x: 0, y: 8 }, { x: 6, y: 6 }], true);
    art.generateTexture('battle-spark', 16, 16);
    art.destroy();
  }
  if (!scene.textures.exists('battle-vignette')) {
    const texture = scene.textures.createCanvas('battle-vignette', 512, 288)!;
    const ctx = texture.context;
    const gradient = ctx.createRadialGradient(256, 130, 95, 256, 144, 300);
    gradient.addColorStop(0, 'rgba(4,9,18,0)');
    gradient.addColorStop(.6, 'rgba(4,9,18,.08)');
    gradient.addColorStop(1, 'rgba(4,9,18,.62)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 288);
    texture.refresh();
  }
}

/** Warm pools of light against cool ruins, with depth below the unfiltered UI. */
export function createStageAtmosphere(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, player: Player, enemies: Enemy[]): void {
  ensureBattleTextures(scene);
  const width = map.widthInPixels;
  const height = Math.max(scene.scale.height, map.heightInPixels);
  const ground = map.getLayer('地形')?.tilemapLayer;
  ground?.setTint(0x9baebc);
  const shafts = scene.add.graphics().setDepth(-10).setScrollFactor(.65, 1).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < 7; i++) {
    const x = 180 + i * 340;
    shafts.fillStyle(i % 2 ? 0xb6c9e7 : 0xffdca3, .018);
    shafts.fillPoints([{ x, y: 0 }, { x: x + 32, y: 0 }, { x: x - 140, y: 540 }, { x: x - 260, y: 540 }], true);
    shafts.fillStyle(0xffedc2, .025);
    shafts.fillPoints([{ x: x - 12, y: 0 }, { x: x + 60, y: 0 }, { x: x - 100, y: 540 }, { x: x - 300, y: 540 }], true);
  }
  scene.tweens.add({ targets: shafts, alpha: .45, x: 25, duration: 7800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

  // Place lanterns on actual solid surfaces, not a hard-coded horizon.
  for (let x = 420; x < width - 80; x += 510) {
    const tiles = ground?.getTilesWithin(Math.floor(x / map.tileWidth), 0, 1, map.height) ?? [];
    const tile = tiles.find(tile => tile.collides);
    if (!tile) continue;
    const floor = tile.pixelY;
    const lantern = scene.add.graphics({ x, y: floor }).setDepth(1);
    lantern.fillStyle(0x1d2630).fillRect(-3, -76, 6, 76).fillRect(-15, -85, 30, 5);
    lantern.fillStyle(0x8f7758).fillRect(-11, -80, 22, 24);
    lantern.fillStyle(0xffcb80).fillRect(-7, -77, 14, 18);
    lantern.fillStyle(0xfff2ba).fillRect(-3, -75, 5, 14);
    lantern.lineStyle(2, 0x3b3440).lineBetween(0, -80, 0, -56);
    const light = scene.add.image(x, floor - 68, 'battle-glow').setTint(0xffb668).setDisplaySize(250, 230)
      .setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setAlpha(.45);
    scene.add.image(x, floor - 2, 'battle-glow').setTint(0xffca80).setDisplaySize(210, 35)
      .setDepth(2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(.2);
    scene.tweens.add({ targets: light, alpha: .32, duration: 1700 + (x % 3) * 180, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  for (let i = 0; i < 10; i++) {
    const fog = scene.add.image(i * width / 8, 400 + (i % 3) * 55, 'battle-glow')
      .setTint(0x90b6c8).setDisplaySize(650, 95).setAlpha(.07).setDepth(12).setScrollFactor(.8, 1);
    scene.tweens.add({ targets: fog, x: fog.x + 100, alpha: .03, duration: 10000 + i * 600, repeat: -1, yoyo: true, ease: 'Sine.InOut' });
  }
  for (let i = 0; i < 32; i++) {
    const x = (i * 193 + 71) % width;
    const y = 120 + (i * 67) % 380;
    const mote = scene.add.image(x, y, 'battle-glow').setTint(i % 3 ? 0xffdc9e : 0x9be4ef)
      .setDisplaySize(i % 4 ? 7 : 12, i % 4 ? 7 : 12).setAlpha(.45).setDepth(16).setScrollFactor(.9, 1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: mote, y: y - 45, x: x + 18, alpha: .08, duration: 2400 + i * 110, delay: i * 70, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  const actors = [player, ...enemies];
  const shadows = actors.map(actor => scene.add.ellipse(actor.x, actor.y - 2, actor === player ? 45 : 55, 10, 0x030710, .4).setDepth(3));
  const update = (): void => {
    actors.forEach((actor, index) => {
      const shadow = shadows[index];
      if (!actor.active || (actor === player ? player.health <= 0 : (actor as Enemy).isDefeated)) { shadow.setVisible(false); return; }
      const col = Math.floor(actor.x / map.tileWidth);
      const row = Math.max(0, Math.floor(actor.y / map.tileHeight));
      const tile = ground?.getTilesWithin(col, row, 1, map.height - row).find(tile => tile.collides);
      if (!tile) { shadow.setVisible(false); return; }
      const distance = Math.max(0, tile.pixelY - actor.y);
      shadow.setVisible(true).setPosition(actor.x, tile.pixelY + 2).setScale(Math.max(.35, 1 - distance / 300)).setAlpha(Math.max(.1, .4 - distance / 600));
    });
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, update));
  scene.add.image(0, 0, 'battle-vignette').setOrigin(0).setDisplaySize(scene.scale.width, height).setScrollFactor(0).setDepth(1800);
}
