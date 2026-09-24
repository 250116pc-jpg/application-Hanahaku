export const debug = true;

export function showDebugSceneName(scene: Phaser.Scene): void {
  if (!debug) return;

  scene.add.text(0, 0, scene.scene.key, {
    fontSize: '20px',
    color: '#ff0000',
    backgroundColor: '#ffffff',
    padding: {
      x: 0,
      y: 0
    }
  })
  .setScrollFactor(0)
  .setDepth(9999);
}