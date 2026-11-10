import Phaser from 'phaser'

export function navigateToTownMap(scene: Phaser.Scene): void {
  scene.registry.set('home-open-town-map', true)
  scene.scene.start('HomeScene')
}
