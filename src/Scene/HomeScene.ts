import Phaser from 'phaser'

// アセットのインポート（実際のファイルパスに合わせて調整してください）
import bg1Img from '../assets/background/home.png'
import btn1Img from '../assets/ui/button1.png'
import bg2Img from '../assets/images/home2.png'
import flower1Img from '../assets/images/f1.png'
import flower2Img from '../assets/images/f2.png'
import flower3Img from '../assets/images/f3.png'

import { createButton, createCircleButton, createMenuButton } from './HomeScene/buttons'

export class HomeScene extends Phaser.Scene {
  private flowerKeys: string[] = ['flower1', 'flower2', 'flower3']

  constructor() {
    super('HomeScene')
  }

  preload(): void {
    // 背景画像（2種類）
    this.load.image('bg1', bg1Img)
    this.load.image('bg2', bg2Img)

    // 花の画像リスト
    this.load.image('flower1', flower1Img)
    this.load.image('flower2', flower2Img)
    this.load.image('flower3', flower3Img)

    // ボタン画像
    this.load.image('button1', btn1Img)
  }

  create(): void {
    const width = this.scale.width
    const height = this.scale.height

    // 1. 背景の交互切り替え処理
    let bgIndex = this.registry.get('bgIndex') ?? 0
    const bgKey = bgIndex % 2 === 0 ? 'bg1' : 'bg2'
    
    // 背景画像を追加して画面サイズに合わせる
    const bg = this.add.image(width / 2, height / 2, bgKey)
    bg.setDisplaySize(width, height)

    // 次回戻ってきたとき用にインデックスを更新
    this.registry.set('bgIndex', bgIndex + 1)

    // UI用のコンテナ
    const ui = this.add.container(-40, 0)

    // 2. 中央にランダムな花を表示（枠は削除）
    const randomFlowerKey = Phaser.Utils.Array.GetRandom(this.flowerKeys)
    // 画像の表示位置は元の四角の領域の中央付近（例: x=380, y=320）に調整
    const flower = this.add.image(400, 320, randomFlowerKey)
    flower.setScale(1.2) // 必要に応じて拡大・縮小
    ui.add(flower)

    // 3. ナビゲーションボタンの配置
    this.createNavigationButtons(ui)
  }

  private createNavigationButtons(ui: Phaser.GameObjects.Container): void {

    ui.add(createButton(
      this,
      970,
      480,
      200,
      'ステージ\n選択',
      () => {
        this.scene.start('AreaSelectScene')
      },
      {
        key: 'button1',
        width: 250,
        height: 100
      }
    ))


    ui.add(createCircleButton(this, 1240, 90, 95, '設定', () => {
      this.scene.start('SettingsScene')
    }))

    ui.add(createMenuButton(this, 600, 630, '育成', () => {
      this.scene.start('TrainingScene')
    }))

    ui.add(createMenuButton(this, 800, 630, '編成', () => {
      this.scene.start('FormScene')
    }))

    ui.add(createMenuButton(this, 1000, 630, '図鑑', () => {
      this.scene.start('EncyclopediaScene')
    }))

    ui.add(createMenuButton(this, 1200, 630, 'ショップ', () => {
      this.scene.start('ShopScene')
    }))
  }
}