import Phaser from 'phaser'
import heroImg from './assets/hero.png'

class MainScene extends Phaser.Scene {
  preload() {
    // ここで画像を読み込む
    this.load.image('hero', heroImg)
  }

  create() {
    // 画面中央に画像を表示する
    this.add.image(400, 300, 'hero').setScale(0.8)

    // 補助テキストを表示する
    this.add
      .text(400, 560, '画像が表示されました', {
        fontSize: '24px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  scene: MainScene,
  backgroundColor: '#000000'
}

new Phaser.Game(config)

