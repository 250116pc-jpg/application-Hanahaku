import Phaser from 'phaser'

import flowerImg from '../assets/flower.png'
import { createCircleButton, createMenuButton } from './HomeScene/buttons'
import {
  createFlowerPanel,
  createHomeFrame,
  createHomeTitle
} from './HomeScene/layout'

export class HomeScene extends Phaser.Scene {
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

  }

  private createNavigationButtons(ui: Phaser.GameObjects.Container): void {
    ui.add(createCircleButton(this, 940, 320, 150, 'ステージ\n選択', () => {
      this.scene.start('SelectStageScene')
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
      this.scene.start('EncyclopediaScene')
    }))

    ui.add(createMenuButton(this, 900, 590, 'ショップ', () => {
      this.scene.start('ShopScene')
    }))
  }

}
