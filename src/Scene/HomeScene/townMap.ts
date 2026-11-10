import Phaser from 'phaser'
import { townAreas, townRoads, type TownAreaId } from './townAreas'

// 街マップは同じシーン上のモーダル。閉じると元の位置・カメラへ戻る。
export function createTownMap(
  scene: Phaser.Scene, current: TownAreaId,
  travel: (area: TownAreaId) => void, onClose: () => void,
): () => void {
  const root = scene.add.container(0, 0).setScale(scene.scale.width / 1280, scene.scale.height / 720).setScrollFactor(0).setDepth(1000)
  const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => { root.add(object); return object }
  const text = (x: number, y: number, value: string, size = 20, color = '#463d2d'): Phaser.GameObjects.Text => add(scene.add.text(x, y, value, { fontFamily: 'sans-serif', fontSize: size + 'px', color }))
  // 全画面の入力面で下の建物・道にタッチを通さない。
  add(scene.add.rectangle(640, 360, 1280, 720, 0x142720, .8).setInteractive())
  add(scene.add.rectangle(640, 360, 1160, 634, 0xe7d8b2).setStrokeStyle(4, 0x94764b))
  add(scene.add.rectangle(640, 360, 1138, 612).setStrokeStyle(1, 0xb59a6d))
  text(106, 77, '花咲く街の地図', 30)
  text(108, 120, '行きたい場所を選んで移動', 16, '#78694f')
  text(118, 620, '現在地：' + townAreas[current].name, 17)
  text(865, 620, 'M / Esc で閉じる', 16, '#78694f')
  const ink = scene.add.graphics()
  root.add(ink)
  // 公園の緑と水路。地図として道のつながりが読めるようにする。
  ink.fillStyle(0xa9b99b, .65).fillRoundedRect(460, 280, 275, 160, 65)
  ink.lineStyle(26, 0x9bb8b0, .7).beginPath().moveTo(110, 555).lineTo(500, 575).lineTo(840, 550).lineTo(1160, 570).strokePath()
  for (const [from, to] of townRoads) {
    const a = townAreas[from], b = townAreas[to]
    ink.lineStyle(16, 0xb99e70).lineBetween(a.mapX, a.mapY, b.mapX, b.mapY)
    ink.lineStyle(10, 0xf7edcf).lineBetween(a.mapX, a.mapY, b.mapX, b.mapY)
  }
  for (const area of Object.values(townAreas)) {
    const here = area.id === current
    const card = add(scene.add.rectangle(area.mapX, area.mapY, 226, 102, here ? 0x3c6558 : 0xf8efd8).setStrokeStyle(2, here ? 0x294c41 : 0x94764b))
    card.setName('town-map-' + area.id).setInteractive({ useHandCursor: true })
    text(area.mapX, area.mapY - 20, area.name, 20, here ? '#fff0c8' : '#443c2f').setOrigin(.5)
    const purpose: Record<TownAreaId, string> = { atelier: '育成・図鑑', plaza: 'クエスト（未実装）', market: 'ショップ', avenue: '仲間の編成', gate: '外の世界へ・冒険' }
    text(area.mapX, area.mapY + 13, here ? '● 現在地' : purpose[area.id], 15, here ? '#e0d8b6' : '#78694f').setOrigin(.5)
    card.on('pointerover', () => card.setStrokeStyle(3, 0x6d8e71))
    card.on('pointerout', () => card.setStrokeStyle(2, here ? 0x294c41 : 0x94764b))
    card.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() >= 10) return
      close()
      if (area.id === 'gate' || !here) travel(area.id)
    })
  }
  const button = add(scene.add.rectangle(1110, 100, 116, 44, 0x594e3c).setInteractive({ useHandCursor: true }))
  text(1110, 100, '閉じる ×', 18, '#fff0ce').setOrigin(.5)
  let closed = false
  const close = (): void => {
    if (closed) return
    closed = true
    root.destroy(true)
    onClose()
  }
  button.on('pointerup', close)
  root.list.forEach(child => (child as Phaser.GameObjects.Rectangle).setScrollFactor(0))
  return close
}
