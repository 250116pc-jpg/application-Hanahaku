// 担当：たまおちゃん｜ステージ敵データ
import type Phaser from 'phaser';

const actions = ['idle', 'run', 'attack', 'hurt', 'death'] as const;

// Draw original enemy frames on the same 30 px anchor as the existing collision sprite.
export function createGardenEnemyAnimations(scene: Phaser.Scene): void {
  for (const id of [2, 3]) {
    for (const action of actions) {
      const key = `enemy-${action}-${id}`;
      if (scene.anims.exists(key)) continue;
      const frames = Array.from({ length: 8 }, (_, frame) => {
        const textureKey = `${key}-${frame}`;
        const texture = scene.textures.createCanvas(textureKey, 30, 30)!;
        const ctx = texture.context;
        const phase = frame / 7;
        const bob = Math.round(Math.sin(frame * Math.PI / 4) * (action === 'run' ? 3 : 1));
        const lunge = action === 'attack' ? Math.round(Math.sin(phase * Math.PI) * 4) : 0;
        ctx.translate(14 + lunge, 26 - Math.abs(bob));
        if (action === 'death') {
          ctx.globalAlpha = 1 - phase;
          ctx.scale(1 + phase * 0.3, 1 - phase * 0.8);
        }
        const rect = (color: string, x: number, y: number, width: number, height: number) => {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, width, height);
        };
        if (id === 2) {
          rect('#173e37', -8, -14, 16, 13);
          rect('#347f5d', -7, -13, 14, 10);
          rect('#70c486', -5, -12, 9, 3);
          rect('#25493a', -6, -3, 4, 4);
          rect('#25493a', 3, -3, 4, 4);
          rect('#36785a', -2, -18, 3, 6);
          rect('#87c957', 0, -20, 7, 3);
        } else {
          rect('#392e55', -7, -13, 14, 14);
          rect('#815ba8', -6, -12, 12, 9);
          rect('#dca5e5', -9, -20, 18, 7);
          rect('#9c68bc', -11, -15, 22, 5);
          rect('#fff1ba', -6, -17, 3, 2);
          rect('#fff1ba', 3, -19, 3, 2);
        }
        rect('#fff3ba', 1, -8, 2, 3);
        rect('#fff3ba', 5, -8, 2, 3);
        if (action === 'hurt' && frame % 2 === 0) rect('#fff4d4aa', -7, -12, 14, 10);
        if (action === 'attack' && frame >= 2 && frame <= 5) rect('#f7e3a3', 7, -9, 5, 2);
        texture.refresh();
        return { key: textureKey };
      });
      scene.anims.create({ key, frames, frameRate: action === 'attack' ? 10 : 12, repeat: action === 'idle' || action === 'run' ? -1 : 0 });
    }
  }
}
