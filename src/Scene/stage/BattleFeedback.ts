import Phaser from 'phaser';
const activeNumbers = new WeakMap<Phaser.Scene, Set<Phaser.GameObjects.Text>>();
export function showBattleNumber(scene: Phaser.Scene, x: number, y: number, amount: number, kind: 'physical' | 'magical' | 'heal'): void {
  if (amount <= 0) return;
  let numbers = activeNumbers.get(scene);
  if (!numbers) { numbers = new Set(); activeNumbers.set(scene, numbers); }
  if (numbers.size >= 24) return;
  const value = scene.add.text(x + Phaser.Math.Between(-12, 12), y - 65, `${kind === 'heal' ? '+' : ''}${amount}`, {
    fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold',
    color: kind === 'heal' ? '#baffcf' : kind === 'magical' ? '#ffdda0' : '#fff4e2',
    stroke: '#111924', strokeThickness: 4,
  }).setOrigin(.5).setDepth(80).setScale(1.2);
  numbers.add(value);
  value.once(Phaser.GameObjects.Events.DESTROY, () => numbers!.delete(value));
  scene.tweens.add({ targets: value, y: value.y - 36, scale: 1, duration: 240, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: value, alpha: 0, delay: 430, duration: 240, onComplete: () => value.destroy() });
}
