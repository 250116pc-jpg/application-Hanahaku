import Phaser from 'phaser'
import { transitionWithLoading } from '../../utils/ui/scene-loading'

export function navigateToTownMap(scene: Phaser.Scene): void {
  scene.registry.set('home-open-town-map', true)
  transitionWithLoading(scene, 'HomeScene')
}
