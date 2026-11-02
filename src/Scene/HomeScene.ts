import { createSceneFade } from '../utils/ui/scene-fade'
import Phaser from 'phaser'

// アセットのインポート（実際のファイルパスに合わせて調整してください）
import bg1Img from '../assets/images/background/home_image1.png'
import bg2Img from '../assets/images/background/home_image2.png'
import bg3Img from '../assets/images/background/home_image3.png'
import bg4Img from '../assets/images/background/home_image4.png'
import btn1Img from '../assets/ui/button1.png'
import { loadCharacterAnimation, createCharacterSprite } from '../animation/animation'
import { homeAnimationData, homeAttackCombos, homeAnimationNames, homeClickActions, type HomeAttackName } from '../animation/homeAnimationData'

import { createButton } from './HomeScene/buttons'
import { preloadTitlePetals, createTitlePetals } from './title/TitlePetals'
//debug機能
import { showDebugSceneName } from '../debug';

//--------------------------------------------------------------



export class HomeScene extends Phaser.Scene {
  private navigate!: (destination: string) => void
  private readonly backgroundKeys = ['bg1', 'bg2', 'bg3', 'bg4']

  constructor() {
    super('HomeScene')
  }

  preload(): void {
    preloadTitlePetals(this)
    // 背景画像（表示順に4種類）
    this.load.image('bg1', bg1Img)
    this.load.image('bg2', bg2Img)
    this.load.image('bg3', bg3Img)
    this.load.image('bg4', bg4Img)

    // ホーム専用データに登録された画像を読み込む（共通の戦闘データは変更しない）。
    homeAnimationNames.forEach(action => {
      loadCharacterAnimation(this, 'home-player-' + action, homeAnimationData[action])
    })

    // ボタン画像
    this.load.image('button1', btn1Img)
  }

  create(): void {
    this.input.enabled = true
    this.navigate = createSceneFade(this)
    showDebugSceneName(this);

    const width = this.scale.width
    const height = this.scale.height
    const scaleX = width / 1280
    const scaleY = height / 720

    // 1. ホームに戻るたびに背景を1→2→3→4→1の順で切り替える
    const bgIndex = this.registry.get('bgIndex') ?? 0
    const bgKey = this.backgroundKeys[bgIndex % this.backgroundKeys.length]
    
    // 背景画像を追加して画面サイズに合わせる
    const bg = this.add.image(width / 2, height / 2, bgKey)
    bg.setDisplaySize(width, height)

    // タイトルと同じ花びらを、背景の上・主人公とボタンの後ろに表示する。
    createTitlePetals(this, { night: bgKey === 'bg4' })

    // 次回戻ってきたとき用にインデックスを更新
    this.registry.set('bgIndex', (bgIndex + 1) % this.backgroundKeys.length)

    // UI用のコンテナ
    const ui = this.add.container(-40, 0)

    // 2. 左側の主人公。速度と繰り返し回数はhomeAnimationData.tsで設定する。
    homeAnimationNames.forEach(action => {
      const key = 'home-player-' + action
      const data = homeAnimationData[action]
      // 共通定義に余分なコマ数があっても、実画像の範囲内に収める。
      const frameCount = Math.min(data.frameCount, this.textures.get(key).frameTotal - 1)
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: frameCount - 1 }),
          frameRate: data.frameRate,
          repeat: data.repeat,
          yoyo: 'yoyo' in data && data.yoyo === true
        })
      }
    })
    const player = createCharacterSprite(this, 420 * scaleX, 390 * scaleY, 'home-player-idle', 'home-player-idle')
    player.setScale(2.25)
    ui.add(player)
    player.setInteractive({ useHandCursor: true })
    // 動作中は連打を受け付けず、完了後に位置・向き・待機を復元する。
    let isActing = false
    // 何も押されていない待機が8〜15秒続いたらピースする。クリック動作中は割り込まない。
    let nextPeaceAt = 0
    const resetIdleTime = (): void => {
      nextPeaceAt = this.time.now + Phaser.Math.Between(8000, 15000)
    }
    resetIdleTime()
    this.input.on('pointerdown', resetIdleTime)
    const peaceTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (isActing || document.hidden || this.time.now < nextPeaceAt) return
        if (player.anims.currentAnim?.key !== 'home-player-idle') return
        isActing = true
        const originalFlipX = player.flipX
        player.setFlipX(false)
        player.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'home-player-win', () => {
          player.setFlipX(originalFlipX).play('home-player-idle')
          isActing = false
          resetIdleTime()
        })
        player.play('home-player-win')
      }
    })
    // ホームを離れたらタイマーと入力監視を解除する。
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      peaceTimer.remove(false)
      this.input.off('pointerdown', resetIdleTime)
    })
    player.on('pointerdown', () => {
      if (isActing) return
      isActing = true
      const action = Phaser.Utils.Array.GetRandom([...homeClickActions])
      const startX = player.x
      const startY = player.y
      const startFlipX = player.flipX
      const finish = (): void => {
        player.setPosition(startX, startY).setFlipX(startFlipX)
        player.play('home-player-idle')
        isActing = false
        resetIdleTime()
      }
      if (action.kind === 'move') {
        player.setFlipX(false).play('home-player-run')
        this.tweens.add({
          targets: player, x: startX + 120, duration: 900, ease: 'Linear', yoyo: true,
          onYoyo: () => player.setFlipX(true), onComplete: finish
        })
      } else if (action.kind === 'jump') {
        player.play('home-player-jump')
        this.tweens.add({
          targets: player, y: startY - 80, duration: 400, ease: 'Quad.easeOut',
          onComplete: () => {
            player.play('home-player-fall')
            this.tweens.add({
              targets: player, y: startY, duration: 400, ease: 'Quad.easeIn',
              onComplete: () => {
                player.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'home-player-land', finish)
                player.play('home-player-land')
              }
            })
          }
        })
      } else {
        if (action.kind === 'attack') {
          this.playHomeAttack(player, action.attack, finish)
        } else {
          // 回転攻撃の着地を待ってから、コンボの次の攻撃へ進む。
          const combo = homeAttackCombos.find(item => item.key === action.comboKey)!
          let step = 0
          const playNext = (): void => {
            if (step >= combo.attacks.length) {
              finish()
              return
            }
            this.playHomeAttack(player, combo.attacks[step++], playNext, combo.frameRate)
          }
          playNext()
        }
      }
    })

    // 3. ナビゲーションボタンの配置
    this.createNavigationButtons(ui, scaleX, scaleY)
  }

  // 単発・コンボ共通。回転攻撃だけ上昇→落下→着地を追加する。
  private playHomeAttack(
    player: Phaser.GameObjects.Sprite,
    attack: HomeAttackName,
    onComplete: () => void,
    frameRate = homeAnimationData[attack].frameRate
  ): void {
    const key = 'home-player-' + attack
    player.anims.timeScale = frameRate / homeAnimationData[attack].frameRate
    if (attack !== 'spinAttack') {
      player.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + key, () => {
        player.anims.timeScale = 1
        onComplete()
      })
      player.play(key)
      return
    }
    const groundY = player.y
    const spinHeight = 60 // 回転中に上がる高さ（px）
    const fallDuration = 700 // 回転後にゆっくり落ちる時間（ms）
    const frames = Math.min(homeAnimationData.spinAttack.frameCount, this.textures.get(key).frameTotal - 1)
    const rise = this.tweens.add({
      targets: player, y: groundY - spinHeight,
      duration: frames / frameRate * 1000, ease: 'Sine.easeOut'
    })
    player.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + key, () => {
      rise.stop()
      player.setY(groundY - spinHeight)
      player.anims.timeScale = 1
      player.play('home-player-fall')
      this.tweens.add({
        targets: player, y: groundY, duration: fallDuration, ease: 'Quad.easeIn',
        onComplete: () => {
          player.setY(groundY)
          player.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'home-player-land', onComplete)
          player.play('home-player-land')
        }
      })
    })
    player.play(key)
  }

  private createNavigationButtons(ui: Phaser.GameObjects.Container, scaleX: number, scaleY: number): void {

    ui.add(createButton(this,1080 * scaleX,450 * scaleY,220,'エリア\n選択',() => {
        this.navigate('AreaSelectScene')},{  key: 'button1',  width: 260,  height: 110

        }
    ))
    ui.add(createButton(this, 510 * scaleX, 630 * scaleY, 200, '育成',() => {
        this.navigate('TrainingScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))
    ui.add(createButton(this, 740 * scaleX, 630 * scaleY, 200, '編成',() => {
        this.navigate('FormScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))
    ui.add(createButton(this, 970 * scaleX, 630 * scaleY, 200, '図鑑',() => {
        this.navigate('EncyclopediaScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))

    ui.add(createButton(this, 1200 * scaleX, 630 * scaleY, 200, 'ショップ',() => {
        this.navigate('ShopScene')},{  key: 'button1',  width: 200,  height: 100

        }
    ))
    ui.add(createButton(this, 1220 * scaleX, 70 * scaleY, 180, '設定',() => {
        this.navigate('SettingsScene')},{  key: 'button1',  width: 150,  height: 80

        }
    ))
  }
}



