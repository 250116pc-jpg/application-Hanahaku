import Phaser from 'phaser'

import backImg from '../assets/background/story/1.jpg'
import { createBackground } from '../../background';

export class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene')
  }

  preload(): void {
    this.load.image('Background', backImg)
  }

  create(): void {
    createBackground(this, 'Background');
    

    this.cameras.main.setBackgroundColor('#cfe3f5')

    const ui = this.add.container(-40, 0)


    
    const skipButton = this.add.text(940, 320, 'SKIP', { fontSize: '24px', color: '#000' }).setOrigin(0.5).setInteractive();
    const logButton = this.add.text(940, 320, 'LOG', { fontSize: '24px', color: '#000' }).setOrigin(0.5).setInteractive();
    const exitButton = this.add.text(940, 320, 'EXIT', { fontSize: '24px', color: '#000' }).setOrigin(0.5).setInteractive();
    const autoButton = this.add.text(940, 320, 'AUTO', { fontSize: '24px', color: '#000' }).setOrigin(0.5).setInteractive();

    skipButton.on('pointerdown', () => {
        this.openPopup(this);
    });


  }
  openPopup(scene: Phaser.Scene): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const popupWidth = width * 0.7;
    const popupHeight = height * 0.7;
    const container = this.add.container(0, 0).setDepth(3000);

    const darkBackground = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setScrollFactor(0)
      .setInteractive();

    const popup = this.add.rectangle(width / 2, height / 2, popupWidth, popupHeight, 0xffffff)
      .setStrokeStyle(3, 0x000000)
      .setScrollFactor(0);

    container.add([
      darkBackground,
      popup
    ]);
  }
}
