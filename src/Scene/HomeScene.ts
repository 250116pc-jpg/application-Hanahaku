import Phaser from 'phaser'

import flowerImg from '../assets/flower.png'
import { createCircleButton, createMenuButton } from './HomeScene/buttons'
import {
  createFlowerPanel,
  createHomeFrame,
  createHomeTitle,
  createMessageText
} from './HomeScene/layout'
import { showTemporaryMessage } from './HomeScene/messages'

export class HomeScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text

  constructor() {
    super('HomeScene')
  }

  preload(): void {
    this.load.image('homeFlower', flowerImg)
  }

  create(): void {
    const width = this.scale.width
    const height = this.scale.height

    this.cameras.main.setBackgroundColor('#cfe3f5')

    const ui = this.add.container(-40, 0)

    createHomeFrame(this, ui, width, height)
    createHomeTitle(this, ui, width / 2, 'ホーム画面')
    createFlowerPanel(this, ui)
    this.createNavigationButtons(ui)

    this.messageText = createMessageText(this, ui, width / 2, 665)
  }

  private createNavigationButtons(ui: Phaser.GameObjects.Container): void {
    ui.add(createCircleButton(this, 940, 320, 150, 'ステージ\n選択', () => {
      this.scene.start('TestScene')
    }))

    ui.add(createCircleButton(this, 1130, 115, 95, '設定', () => {
      this.scene.start('SettingsScene')
    }))

    ui.add(createMenuButton(this, 300, 590, '育成', () => {
      this.scene.start('TrainingScene')
    }))

    ui.add(createMenuButton(this, 500, 590, '編成', () => {
      this.scene.start('FormScene')
    }))

    ui.add(createMenuButton(this, 700, 590, '図鑑', () => {
      this.showMessage('図鑑画面は準備中です')
    }))

    ui.add(createMenuButton(this, 900, 590, 'ショップ', () => {
      this.scene.start('ShopScene')
    }))
  }

  private showMessage(message: string): void {
    showTemporaryMessage(this, this.messageText, message)
  }
}
