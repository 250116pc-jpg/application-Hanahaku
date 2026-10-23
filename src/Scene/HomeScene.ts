import Phaser from 'phaser'

// アセットのインポート（実際のファイルパスに合わせて調整してください）
import bg1Img from '../assets/background/home_image1.png'
import bg2Img from '../assets/background/home_image2.png'
import bg3Img from '../assets/background/home_image3.png'
import bg4Img from '../assets/background/home_image4.png'
import btn1Img from '../assets/ui/button1.png'
import { loadCharacterAnimation, createCharacterAnimation, createCharacterSprite } from '../animation/animation'
import { characterAnimations } from '../animation/animationData'

import { createButton } from './HomeScene/buttons'
//debug機能
import { showDebugSceneName } from '../debug';

//--------------------------------------------------------------



export class HomeScene extends Phaser.Scene {
  private readonly backgroundKeys = ['bg1', 'bg2', 'bg3', 'bg4']

  constructor() {
    super('HomeScene')
  }

  preload(): void {
    // 背景画像（表示順に4種類）
    this.load.image('bg1', bg1Img)
    this.load.image('bg2', bg2Img)
    this.load.image('bg3', bg3Img)
    this.load.image('bg4', bg4Img)

    // ホーム表示用のプレイヤー待機アニメーション
    loadCharacterAnimation(this, 'home-player-idle', characterAnimations.player.idle)
    loadCharacterAnimation(this, 'home-player-run', characterAnimations.player.run)

    // ボタン画像
    this.load.image('button1', btn1Img)
  }

  create(): void {
    showDebugSceneName(this);

    const width = this.scale.width
    const height = this.scale.height

    // 1. ホームに戻るたびに背景を1→2→3→4→1の順で切り替える
    const bgIndex = this.registry.get('bgIndex') ?? 0
    const bgKey = this.backgroundKeys[bgIndex % this.backgroundKeys.length]
    
    // 背景画像を追加して画面サイズに合わせる
    const bg = this.add.image(width / 2, height / 2, bgKey)
    bg.setDisplaySize(width, height)

    // 次回戻ってきたとき用にインデックスを更新
    this.registry.set('bgIndex', (bgIndex + 1) % this.backgroundKeys.length)

    // UI用のコンテナ
    const ui = this.add.container(-40, 0)

    // 2. 左側にプレイヤーを表示（物理・移動操作なしで待機をループ再生）
    const idle = characterAnimations.player.idle
    // 共通定義は変更せず、ホームでは画像に存在するコマ数に収める
    const idleFrameCount = Math.min(idle.frameCount, this.textures.get('home-player-idle').frameTotal - 1)
    createCharacterAnimation(this, 'home-player-idle', 'home-player-idle', idleFrameCount, idle.frameRate)
    const player = createCharacterSprite(this, 420, 390, 'home-player-idle', 'home-player-idle')
    player.setScale(2.25)
    ui.add(player)
    const run = characterAnimations.player.run
    createCharacterAnimation(this, 'home-player-run', 'home-player-run', run.frameCount, run.frameRate)
    player.setInteractive({ useHandCursor: true })
    player.on('pointerdown', () => {
      // 往復中の連打による移動の重複を防ぐ
      if (player.anims.currentAnim?.key !== 'home-player-idle') return
      const startX = player.x
      const startFlipX = player.flipX
      player.setFlipX(false)
      player.play('home-player-run')
      this.tweens.add({
        targets: player,
        x: startX + 120,
        duration: 900,
        ease: 'Linear',
        yoyo: true,
        onYoyo: () => player.setFlipX(true),
        onComplete: () => {
          player.setX(startX)
          player.setFlipX(startFlipX)
          player.play('home-player-idle')
        }
      })
    })

    // 3. ナビゲーションボタンの配置
    this.createNavigationButtons(ui)
  }

  private createNavigationButtons(ui: Phaser.GameObjects.Container): void {

    ui.add(createButton(this,1080,450,220,'エリア\n選択',() => {
        this.scene.start('AreaSelectScene')},{  key: 'button1',  width: 260,  height: 110

        }
    ))
    ui.add(createButton(this, 510, 630, 200, '育成',() => {
        this.scene.start('TrainingScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))
    ui.add(createButton(this, 740, 630, 200, '編成',() => {
        this.scene.start('FormScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))
    ui.add(createButton(this, 970, 630, 200, '図鑑',() => {
        this.scene.start('EncyclopediaScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))

    ui.add(createButton(this, 1200, 630, 200, 'ショップ',() => {
        this.scene.start('ShopScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))
    ui.add(createButton(this, 1220, 70, 180, '設定',() => {
        this.scene.start('SettingsScene')},{  key: 'button1',  width: 150,  height: 80

        }
    ))
  }
}
