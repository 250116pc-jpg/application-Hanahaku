import Phaser from 'phaser'
import sunflower from '../assets/flowers/sunflower-v2.png'

// Prototype character 1 uses the new sunflower art. Other flowers keep their placeholder.
export function preloadCharacterImages(scene: Phaser.Scene): void {
  if (!scene.textures.exists('character-sunflower')) {
    scene.load.image('character-sunflower', sunflower)
  }
}

export function addCharacterImage(
  scene: Phaser.Scene, x: number, y: number, characterId: number,
  fallback: string, fallbackScale: number, size: number
): Phaser.GameObjects.Image {
  const isSunflower = characterId === 1 && scene.textures.exists('character-sunflower')
  const image = scene.add.image(x, y, isSunflower ? 'character-sunflower' : fallback)
  if (isSunflower) image.setScale(size / Math.max(image.width, image.height))
  else image.setScale(fallbackScale)
  return image
}
