/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
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
import { villageAssets, createVillage, setupVillageScroll } from './HomeScene/village'
import { getTownArea, townAreas, type TownAreaId, type TownMapDestination, type VillageStop } from './HomeScene/townAreas'
import { createTownMap } from './HomeScene/townMap'
import { preloadTitlePetals, createTitlePetals } from './title/TitlePetals'
//debug機能
import { showDebugSceneName } from '../debug';

//--------------------------------------------------------------



export class HomeScene extends Phaser.Scene {
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private navigate!: (destination: string) => void
  private readonly backgroundKeys = ['bg1', 'bg2', 'bg3', 'bg4']

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() {
    super('HomeScene')
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    preloadTitlePetals(this)
    Object.entries(villageAssets).forEach(([key, url]) => this.load.image(key, url))
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 入力を有効にし、町の現在エリアと位置の保存先を取得する
     * ================================== */
    this.input.enabled = true
    this.navigate = createSceneFade(this)
    showDebugSceneName(this);

    const area = getTownArea(this.registry.get('home-town-area'))
    this.registry.set('home-town-area', area.id)
    const positionKey = 'home-town-x-' + area.id
    let mapOpen = false
    /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 画面サイズから配置の拡大率を計算する
     * ================================== */
    const width = this.scale.width
    const height = this.scale.height
    const scaleX = width / 1280
    const scaleY = height / 720

    // 1. ホームに戻るたびに背景を1→2→3→4→1の順で切り替える
    const bgIndex = this.registry.get('bgIndex') ?? 0
    const bgKey = this.backgroundKeys[bgIndex % this.backgroundKeys.length]
    
    // 背景画像を追加して画面サイズに合わせる
    const bg = this.add.image(width / 2, height / 2, bgKey)
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 背景を画面に合わせ、次回の背景切り替えを記録する
     * ================================== */
    bg.setDisplaySize(width, height).setScrollFactor(0)

    // タイトルと同じ花びらを、背景の上・主人公とボタンの後ろに表示する。
    const beforePetals = new Set(this.children.list)
    if (area.id !== 'atelier') createTitlePetals(this, { night: bgKey === 'bg4' })
    this.children.list.forEach(child => {
      if (!beforePetals.has(child) && child instanceof Phaser.GameObjects.Image) child.setScrollFactor(0)
    })

    // 次回戻ってきたとき用にインデックスを更新
    this.registry.set('bgIndex', (bgIndex + 1) % this.backgroundKeys.length)

    // UI用のコンテナ
    const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(40)

    // 2. 左側の主人公。速度と繰り返し回数はhomeAnimationData.tsで設定する。
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : ホーム専用の主人公アニメーションを登録する
     * ================================== */
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 保存位置に主人公を配置し、タッチ範囲と待機動作を設定する
     * ================================== */
    const savedX = Phaser.Math.Clamp(this.registry.get(positionKey) ?? area.spawn, 32, area.width - 32)
    const player = createCharacterSprite(this, savedX * scaleX, 568 * scaleY, 'home-player-idle', 'home-player-idle')
    player.setOrigin(.5, 1).setScale(1.6 * scaleX, 1.6 * scaleY).setDepth(10)
    // 主人公は建物と道より手前に描画する。
    // スプライトシートの余白が、建物や看板のタッチを遮らないようにする。
    player.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(65, 27, 62, 101),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    // 動作中は連打を受け付けず、完了後に位置・向き・待機を復元する。
    let isActing = false
    let travelling = false
    // 何も押されていない待機が8〜15秒続いたらピースする。クリック動作中は割り込まない。
    let nextPeaceAt = 0
    const resetIdleTime = (): void => {
      nextPeaceAt = this.time.now + Phaser.Math.Between(8000, 15000)
    }
    resetIdleTime()
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 無操作時のピース動作と入力による待機時間リセットを設定する
     * ================================== */
    this.input.on('pointerdown', resetIdleTime)
    const peaceTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (mapOpen || travelling || isActing || document.hidden || this.time.now < nextPeaceAt) return
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
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 主人公タッチ時の移動・ジャンプ・攻撃演出と後片付けを設定する
     * ================================== */
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      peaceTimer.remove(false)
      this.input.off('pointerdown', resetIdleTime)
    })
    player.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (mapOpen || travelling || isActing || pointer.getDistance() >= 10) return
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

    // 自由移動と建物への移動を同じ更新処理で扱う。キー操作で目的地を変更できる。
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 移動先と到着先の施設を保持し、目的地の表示を解除できるようにする
     * ================================== */
    const help = '道をタッチ / ← →・A Dで移動 · 出入口をタッチ · Mで街マップ'
    let targetX: number | null = null
    let destination: VillageStop | null = null
    let entering = false
    let marker: Phaser.GameObjects.Ellipse | undefined
    const clampX = (x: number): number => Phaser.Math.Clamp(x, 32 * scaleX, (area.width - 32) * scaleX)
    const clearTarget = (): void => {
      targetX = null
      destination = null
      marker?.destroy()
      marker = undefined
    }
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 移動先を設定して施設への移動開始と案内を更新する
     * ================================== */
    const moveTo = (x: number, stop: VillageStop | null = null): void => {
      if (mapOpen || entering || isActing) return
      clearTarget()
      targetX = clampX(x)
      destination = stop
      travelling = true
      resetIdleTime()
      status.setText(stop ? stop.label + 'へ移動中…（方向キーで中断）' : help)
      marker = this.add.ellipse(targetX, 572 * scaleY, 28 * scaleX, 8 * scaleY, 0xffdf81, .65).setDepth(9)
    }
    const status = createVillage(this, area, (stop: VillageStop) => {
      if (mapOpen || entering || isActing) return
      if (stop.notice) {
        moveTo(stop.door * scaleX, stop)
        return
      }
      if (stop.area) {
        entering = true
        clearTarget()
        travelling = false
        visitArea(stop.area)
      } else if (stop.scene) {
        entering = true
        clearTarget()
        travelling = false
        this.navigate(stop.scene)
      }
    })
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 方向キー・地面タッチによる自由移動を受け付ける
     * ================================== */
    status.setText(help).setFontSize(15)
    const keys = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT, right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A, d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'left' | 'right' | 'a' | 'd', Phaser.Input.Keyboard.Key> | undefined
    const groundTap = (pointer: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]): void => {
      if (mapOpen || objects.length || pointer.getDistance() >= 10 || pointer.y < 558 * scaleY || pointer.y > 640 * scaleY) return
      moveTo(this.cameras.main.getWorldPoint(pointer.x, pointer.y).x)
    }
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 主人公を目的地へ移動し、到着・向き・歩行表示と位置保存を更新する
     * ================================== */
    const movePlayer = (_time: number, delta: number): void => {
      if (mapOpen || entering || isActing || !this.input.enabled || document.hidden) return
      const direction = Number(!!(keys?.right.isDown || keys?.d.isDown)) - Number(!!(keys?.left.isDown || keys?.a.isDown))
      const step = 310 * scaleX * Math.min(delta, 50) / 1000
      const oldX = player.x
      if (direction) {
        clearTarget()
        status.setText(help)
        player.x = clampX(player.x + direction * step)
      } else if (targetX !== null) {
        const distance = targetX - player.x
        player.x += Math.sign(distance) * Math.min(Math.abs(distance), step)
        if (Math.abs(targetX - player.x) < .01) {
          const arrived = destination
          clearTarget()
          if (arrived?.notice) {
            status.setText(arrived.notice)
          } else if (arrived) {
            entering = true
            status.setText(arrived.label + 'に到着しました')
            this.time.delayedCall(180, () => {
              if (arrived.area) visitArea(arrived.area)
              else if (arrived.scene) this.navigate(arrived.scene)
            })
          }
        }
      }
      travelling = player.x !== oldX || targetX !== null || entering
      if (player.x !== oldX) {
        player.setFlipX(player.x < oldX).play('home-player-run', true)
        this.registry.set(positionKey, player.x / scaleX)
        resetIdleTime()
      }
      if (!travelling || entering) player.play('home-player-idle', true)
    }
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 画面外へフォーカスが移ったときに移動を中断する
     * ================================== */
    const blur = (): void => {
      if (entering || isActing) return
      clearTarget()
      travelling = false
      Object.values(keys ?? {}).forEach(key => key.reset())
      player.play('home-player-idle', true)
    }
    this.input.on('pointerup', groundTap)
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 移動更新と入力監視を登録し、終了時に解除する
     * ================================== */
    this.events.on(Phaser.Scenes.Events.UPDATE, movePlayer)
    this.game.events.on(Phaser.Core.Events.BLUR, blur)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerup', groundTap)
      this.events.off(Phaser.Scenes.Events.UPDATE, movePlayer)
      this.game.events.off(Phaser.Core.Events.BLUR, blur)
      Object.values(keys ?? {}).forEach(key => this.input.keyboard?.removeKey(key, true))
    })
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 移動先エリアと出現位置を保存し、主人公を配置・画面を切り替える
     * ================================== */
    const visitArea = (id: TownAreaId, fromArea?: TownAreaId, position?: number): void => {
      const spawnX = position ?? (fromArea
        ? townAreas[id].stops.find(stop => stop.area === fromArea)?.door
        : undefined) ?? townAreas[id].spawn
      this.registry.set('home-town-area', id)
      this.registry.set('home-town-x-' + id, spawnX)
      if (id === area.id) {
        player.setPosition(spawnX * scaleX, 568 * scaleY).play('home-player-idle', true)
        this.cameras.main.scrollX = Phaser.Math.Clamp(
          player.x - width / 2,
          0,
          Math.max(0, area.width * scaleX - width)
        )
        return
      }
      this.navigate('HomeScene')
    }
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 町マップで選んだエリア・施設へ移動する
     * ================================== */
    const visitMapDestination = (id: TownAreaId, destination: TownMapDestination): void => {
      if (destination.area) visitArea(destination.area, id, destination.x)
      else if (destination.scene) {
        if (this.registry.get('home-town-area') !== id) {
          this.registry.set('home-town-x-' + id, townAreas[id].spawn)
        }
        this.registry.set('home-town-area', id)
        this.navigate(destination.scene)
      }
    }
    let closeMap: (() => void) | undefined
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : 主人公の動作を中断して町マップを開閉する
     * ================================== */
    const toggleMap = (): void => {
      if (mapOpen) { closeMap?.(); return }
      if (entering || !this.input.enabled) return
      clearTarget()
      travelling = false
      // アクション途中でもマップを開けるように元の足元へ戻す。
      this.tweens.killTweensOf(player)
      player.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE)
      homeAnimationNames.forEach(action => player.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'home-player-' + action))
      isActing = false
      player.setY(568 * scaleY)
      player.anims.timeScale = 1
      player.play('home-player-idle', true)
      Object.values(keys ?? {}).forEach(key => key.reset())
      mapOpen = true
      closeMap = createTownMap(this, area.id, visitMapDestination, () => {
        mapOpen = false
        closeMap = undefined
        Object.values(keys ?? {}).forEach(key => key.reset())
        resetIdleTime()
        status.setText(help)
      })
    }
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : M・Escキーと町マップボタンを接続する
     * ================================== */
    const escapeMap = (): void => { if (mapOpen) closeMap?.() }
    const mapKey = (event: KeyboardEvent): void => { if (!event.repeat) toggleMap() }
    this.input.keyboard?.on('keydown-M', mapKey)
    this.input.keyboard?.on('keydown-ESC', escapeMap)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-M', mapKey)
      this.input.keyboard?.off('keydown-ESC', escapeMap)
    })
    setupVillageScroll(this, player, () => travelling, area.width, () => mapOpen || entering)
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 街マップ・設定のボタンを配置し、指定時に街マップを開く
     * ================================== */
    ui.add(createButton(this, 990 * scaleX, 65 * scaleY, 175, '街マップ', toggleMap,
      { key: 'button1', width: 175, height: 64 }))
    ui.add(createButton(this, 1180 * scaleX, 65 * scaleY, 140, '設定', () => {
      if (!mapOpen && !entering) this.navigate('SettingsScene')
    }, { key: 'button1', width: 140, height: 64 }))
    ui.list.forEach(child => (child as Phaser.GameObjects.Container).setScrollFactor(0))
    if (this.registry.get('home-open-town-map') === true) {
      this.registry.set('home-open-town-map', false)
      toggleMap()
    }
  }

  // 単発・コンボ共通。回転攻撃だけ上昇→落下→着地を追加する。
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : ホーム専用の攻撃アニメーションを再生する
   * ================================== */
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

}
