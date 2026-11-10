import Phaser from 'phaser'
import { townAreas, townRoads, type TownAreaId, type TownMapDestination } from './townAreas'

// 街マップは同じシーン上のモーダル。閉じると元の位置・カメラへ戻る。
export function createTownMap(
  scene: Phaser.Scene, current: TownAreaId,
  travel: (area: TownAreaId, destination: TownMapDestination) => void, onClose: () => void,
): () => void {
  const root = scene.add.container(0, 0).setScale(scene.scale.width / 1280, scene.scale.height / 720).setScrollFactor(0).setDepth(1000)
  const add = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(object: T): T => {
    root.add(object)
    // Phaser hit-tests each child with its own scroll factor, not the container's.
    object.setScrollFactor(0)
    return object
  }
  const text = (x: number, y: number, value: string, size = 20, color = '#463d2d'): Phaser.GameObjects.Text => add(scene.add.text(x, y, value, { fontFamily: 'sans-serif', fontSize: size + 'px', color }))
  const mapX = (area: TownAreaId): number => 100 + townAreas[area].mapX * .66
  // 全画面の入力面で下の建物・道にタッチを通さない。
  add(scene.add.rectangle(640, 360, 1280, 720, 0x142720, .8)).setInteractive()
  add(scene.add.rectangle(640, 360, 1160, 634, 0xe7d8b2).setStrokeStyle(4, 0x94764b))
  add(scene.add.rectangle(640, 360, 1138, 612).setStrokeStyle(1, 0xb59a6d))
  text(106, 77, '花咲く街の地図', 30)
  text(108, 120, 'エリアを選び、施設を選択', 16, '#78694f')
  text(118, 620, '現在地：' + townAreas[current].name, 17)
  text(520, 620, 'M / Esc で閉じる', 16, '#78694f')
  const ink = scene.add.graphics()
  root.add(ink)
  // 公園の緑と水路。地図として道のつながりが読めるようにする。
  ink.fillStyle(0xa9b99b, .65).fillRoundedRect(330, 290, 250, 150, 65)
  ink.lineStyle(26, 0x9bb8b0, .7).beginPath().moveTo(110, 555).lineTo(330, 575).lineTo(580, 550).lineTo(830, 570).strokePath()
  for (const [from, to] of townRoads) {
    const a = townAreas[from], b = townAreas[to]
    ink.lineStyle(16, 0xb99e70).lineBetween(mapX(from), a.mapY, mapX(to), b.mapY)
    ink.lineStyle(10, 0xf7edcf).lineBetween(mapX(from), a.mapY, mapX(to), b.mapY)
  }
  const cards: { area: TownAreaId; card: Phaser.GameObjects.Rectangle; title: Phaser.GameObjects.Text; caption: Phaser.GameObjects.Text }[] = []
  let selectedArea = current
  const details = add(scene.add.container(0, 0))
  for (const area of Object.values(townAreas)) {
    const here = area.id === current
    const card = add(scene.add.rectangle(mapX(area.id), area.mapY, 180, 90))
    card.setInteractive({ useHandCursor: true })
    card.setName('town-map-' + area.id)
    const title = text(mapX(area.id), area.mapY - 17, area.name, 18).setOrigin(.5)
    const caption = text(mapX(area.id), area.mapY + 16, here ? '● 現在地' : '行き先を見る', 14, '#78694f').setOrigin(.5)
    cards.push({ area: area.id, card, title, caption })
    card.on('pointerover', () => card.setStrokeStyle(3, 0x6d8e71))
    card.on('pointerout', () => card.setStrokeStyle(2, 0x94764b))
    card.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() >= 10) return
      selectedArea = area.id
      renderDestinations()
    })
  }
  const button = add(scene.add.rectangle(1110, 100, 116, 44, 0x594e3c))
  button.setInteractive({ useHandCursor: true })
  text(1110, 100, '閉じる ×', 18, '#fff0ce').setOrigin(.5)
  let closed = false
  const close = (): void => {
    if (closed) return
    closed = true
    root.destroy(true)
    onClose()
  }
  function renderDestinations(): void {
    cards.forEach(({ area, card, title, caption }) => {
      const selected = area === selectedArea
      card.setFillStyle(selected ? 0x3c6558 : 0xf8efd8)
      card.setStrokeStyle(2, selected ? 0x294c41 : 0x94764b)
      title.setColor(selected ? '#fff0c8' : '#443c2f')
      caption.setColor(selected ? '#e0d8b6' : '#78694f')
    })
    details.removeAll(true)
    const area = townAreas[selectedArea]
    details.add(scene.add.rectangle(1035, 360, 330, 476, 0xf8efd8).setStrokeStyle(3, 0x94764b))
    details.add(scene.add.text(1035, 158, area.name, { fontFamily: 'sans-serif', fontSize: '22px', color: '#443c2f' }).setOrigin(.5))
    details.add(scene.add.text(1035, 190, area.id === current ? '現在地から利用できる施設' : 'このエリアで利用できる施設', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#78694f',
    }).setOrigin(.5))
    const destinations = area.mapDestinations
    destinations.forEach((destination, index) => {
      const y = 244 + index * 62
      const available = !destination.notice
      const row = scene.add.rectangle(1035, y, 286, 54, available ? 0xe7d8b2 : 0xd7d0c2)
        .setStrokeStyle(2, available ? 0xb59a6d : 0xb8b1a3)
        .setScrollFactor(0)
      details.add(row)
      if (available) {
        row.setInteractive({ useHandCursor: true })
        row.on('pointerover', () => row.setFillStyle(0xf0dfbb))
        row.on('pointerout', () => row.setFillStyle(0xe7d8b2))
        row.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          if (pointer.getDistance() < 10) {
            close()
            travel(area.id, destination)
          }
        })
      }
      details.add(scene.add.text(1035, y - 6, destination.label, {
        fontFamily: 'sans-serif', fontSize: '16px', color: available ? '#443c2f' : '#827b70',
      }).setOrigin(.5))
      const action = destination.notice ? 'ロック中'
        : destination.scene === 'AreaSelectScene' ? 'エリア選択へ'
          : destination.kind === 'outdoor' ? 'このエリアへ移動' : '施設へ移動'
      details.add(scene.add.text(1035, y + 14, action, {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#78694f',
      }).setOrigin(.5))
    })
  }
  renderDestinations()
  button.on('pointerup', close)
  return close
}
