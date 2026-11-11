/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import Phaser from 'phaser'
import house1 from '../../assets/stage/MedievalHousesFree/MedievalHousesFree/House_1.png'
import house2 from '../../assets/stage/MedievalHousesFree/MedievalHousesFree/House_2.png'
import tavern from '../../assets/stage/MedievalShopsFree/MedievalShopsFree/Tavern.png'
import props from '../../assets/stage/Cainos/Pixel Art Platformer - Village Props/Texture/TX Village Props.png'
import type { TownArea, VillageStop } from './townAreas'
import { prepareTownProps, drawTownGround, drawTownFeature, drawInteractiveProp } from './townScenery'

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 村の表示部品を定義する
 * ================================== */
export const villageAssets = { 'home-house1': house1, 'home-house2': house2, 'home-tavern': tavern, 'home-props': props }

// 素材の透明な余白を除いたフレーム。元の画像ファイルは変更しない。
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 建物画像の余白を除いた表示領域を用意する
 * ================================== */
function trimFrame(scene: Phaser.Scene, key: string): void {
  const texture = scene.textures.get(key)
  if (texture.has('building')) return
  const source = texture.getSourceImage() as HTMLImageElement
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const context = canvas.getContext('2d')!
  context.drawImage(source, 0, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let left = canvas.width, top = canvas.height, right = 0, bottom = 0
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (pixels[(y * canvas.width + x) * 4 + 3] === 0) continue
    left = Math.min(left, x); right = Math.max(right, x)
    top = Math.min(top, y); bottom = Math.max(bottom, y)
  }
  texture.add('building', 0, left, top, right - left + 1, bottom - top + 1)
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 村の画像と施設を配置する
 * ================================== */
export function createVillage(scene: Phaser.Scene, area: TownArea, select: (stop: VillageStop) => void): Phaser.GameObjects.Text {
  const sx = scene.scale.width / 1280, sy = scene.scale.height / 720
  const world = scene.add.container(0, 0).setScale(sx, sy)
  prepareTownProps(scene)
  drawTownFeature(scene, world, area)
  drawTownGround(scene, world, area)
  const textStyle = { fontFamily: 'sans-serif', fontSize: '22px', color: '#fff4d5', stroke: '#382a23', strokeThickness: 3 }
  for (const stop of area.stops) {
    if (stop.key) {
      trimFrame(scene, stop.key)
      const art = scene.add.image(stop.x, 558, stop.key, 'building').setOrigin(.5, 1)
      art.setScale(stop.width / art.width)
      world.add(art)
      // 建物全体をタッチ対象にする。透明部分の大きな元画像は判定に使わない。
      art.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => { if (pointer.getDistance() < 10) select(stop) })
      art.on('pointerover', () => art.setTint(0xffe5aa))
      art.on('pointerout', () => art.clearTint())
    } else if (stop.prop) {
      drawInteractiveProp(scene, world, stop)
      const zone = scene.add.zone(stop.x, 438, stop.width, 240).setInteractive({ useHandCursor: true })
      world.add(zone)
      zone.on('pointerup', (pointer: Phaser.Input.Pointer) => { if (pointer.getDistance() < 10) select(stop) })
    } else {
      world.add(scene.add.rectangle(stop.x, 485, 12, 146, 0x61452e))
      const sign = scene.add.rectangle(stop.x, 445, stop.width, 60, 0x4b6550).setStrokeStyle(3, 0xdcc18a)
      world.add(sign)
      world.add(scene.add.text(stop.x, 445, stop.area ? stop.label + ' →' : stop.label, { ...textStyle, fontSize: '18px' }).setOrigin(.5))
      sign.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => { if (pointer.getDistance() < 10) select(stop) })
    }
    if (stop.key || stop.prop) {
      // 建物を覆わない道端の木製看板。短い行き先だけを表示する。
      const signX = stop.x - stop.width / 2 - 64
      world.add(scene.add.rectangle(signX, 549, 7, 36, 0x65462f))
      const board = scene.add.rectangle(signX, 525, 126, 36, 0x6b4b32).setStrokeStyle(2, 0xa78351)
      world.add(board)
      world.add(scene.add.text(signX, 525, stop.label, { ...textStyle, fontSize: '17px', strokeThickness: 1 }).setOrigin(.5))
      board.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.getDistance() < 10) select(stop)
      })
    }
  }
  const hud = scene.add.container(0, 0).setScale(sx, sy).setScrollFactor(0).setDepth(30)
  hud.add(scene.add.text(32, 28, area.name, { ...textStyle, fontSize: '26px' }))
  hud.add(scene.add.text(34, 66, area.description, { fontFamily: 'sans-serif', fontSize: '14px', color: '#fff4d5', stroke: '#382a23', strokeThickness: 3 }))
  const status = scene.add.text(640, 668, '左右にスワイプで村を見渡す · 建物をタッチして移動', {
    fontFamily: 'sans-serif', fontSize: '17px', color: '#f6e8c6',
  }).setOrigin(.5)
  hud.add(status)
  return status
}

// スワイプとホイールで見渡し、移動中だけ主人公を追う。
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 村の表示範囲とスクロール操作を設定する
 * ================================== */
export function setupVillageScroll(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite, travelling: () => boolean, worldWidth: number, blocked: () => boolean): void {
  const camera = scene.cameras.main
  const sx = scene.scale.width / 1280
  camera.setBounds(0, 0, worldWidth * sx, scene.scale.height)
  const clamp = (x: number): number => Phaser.Math.Clamp(x, 0, worldWidth * sx - scene.scale.width)
  camera.scrollX = clamp(player.x - scene.scale.width / 2)
  let startScroll = camera.scrollX
  const down = (): void => { startScroll = camera.scrollX }
  const move = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.isDown && !blocked() && !travelling() && pointer.getDistance() >= 10) {
      camera.scrollX = clamp(startScroll + pointer.downX - pointer.x)
    }
  }
  const wheel = (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], dx: number, dy: number): void => {
    if (!blocked() && !travelling()) camera.scrollX = clamp(camera.scrollX + (dx || dy))
  }
  const update = (): void => {
    if (!blocked() && travelling()) camera.scrollX = clamp(Phaser.Math.Linear(camera.scrollX, player.x - scene.scale.width / 2, .12))
  }
  scene.input.on('pointerdown', down)
  scene.input.on('pointermove', move)
  scene.input.on('wheel', wheel)
  scene.events.on(Phaser.Scenes.Events.UPDATE, update)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerdown', down)
    scene.input.off('pointermove', move)
    scene.input.off('wheel', wheel)
    scene.events.off(Phaser.Scenes.Events.UPDATE, update)
  })
}
