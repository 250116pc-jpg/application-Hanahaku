/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜共通ユーティリティ・characterImage
import Phaser from 'phaser'
import sunflower from '../assets/images/pixel_flowers/sunflower.png'

// Prototype character 1 uses the new sunflower art. Other flowers keep their placeholder.
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : キャラクターIDに対応した画像を読み込む。
 * ================================== */
export function preloadCharacterImages(scene: Phaser.Scene): void {
  if (!scene.textures.exists('character-sunflower')) {
    scene.load.image('character-sunflower', sunflower)
  }
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : キャラクター画像を縦横比を保って指定範囲に収めて配置する。
 * ================================== */
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
