/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import Phaser from 'phaser'
import { townAreas, type TownAreaId, type TownMapDestination } from './townAreas'

import townArt from '../../assets/ui/town-map/pixel-town-overview.png'
import homeArt from '../../assets/ui/town-map/pixel-home.png'
import gateArt from '../../assets/ui/town-map/pixel-gate.png'
import marketArt from '../../assets/ui/town-map/pixel-market.png'
import avenueArt from '../../assets/ui/town-map/pixel-avenue.png'
import plazaArt from '../../assets/ui/town-map/pixel-plaza.png'
import { trimFrame } from './village'

const mapArt: Record<TownAreaId, string> = {
  atelier: homeArt,
  gate: gateArt,
  market: marketArt,
  avenue: avenueArt,
  plaza: plazaArt,
}
const areaLabelColors: Record<TownAreaId, string> = {
  atelier: '#69474b',
  plaza: '#3a5547',
  market: '#6b513a',
  avenue: '#3e5363',
  gate: '#514658',
}

const fontFamily = '"Yu Gothic", "Meiryo", sans-serif'

export function preloadTownMap(scene: Phaser.Scene): void {
  if (!scene.textures.exists('town-map-overview')) scene.load.image('town-map-overview', townArt)
  for (const [area, url] of Object.entries(mapArt)) {
    const key = 'town-map-art-' + area
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  }
}

export function createTownMap(
  scene: Phaser.Scene, current: TownAreaId,
  travel: (area: TownAreaId, destination: TownMapDestination) => void, onClose: () => void,
): () => void {
  const root = scene.add.container(0, 0).setScale(scene.scale.width / 1280, scene.scale.height / 720)
    .setScrollFactor(0).setDepth(1000)
  const add = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(object: T): T => {
    root.add(object)
    object.setScrollFactor(0)
    return object
  }
  const label = (x: number, y: number, value: string, size: number): Phaser.GameObjects.Text =>
    scene.add.text(x, y, value, { fontFamily, fontSize: size + 'px', color: '#243d30' }).setOrigin(.5)

  add(scene.add.rectangle(640, 360, 1280, 720, 0x172e24, .82)).setInteractive()
  add(scene.add.rectangle(640, 360, 1192, 672, 0x4a3426)).setStrokeStyle(2, 0xb9945c)
  scene.textures.get('town-map-overview').setFilter(Phaser.Textures.FilterMode.NEAREST)
  add(scene.add.image(640, 360, 'town-map-overview')).setDisplaySize(1172, 652)
  add(scene.add.rectangle(640, 360, 1160, 640)).setStrokeStyle(1, 0x3e7250, .65)

  add(scene.add.rectangle(235, 69, 290, 51, 0xf2f8e8, .97)).setStrokeStyle(1, 0x61916a)
  add(label(235, 69, '花咲く街の地図', 26))
  const closeButton = add(scene.add.rectangle(1151, 69, 100, 42, 0x315942)).setInteractive({ useHandCursor: true })
  add(label(1151, 69, '閉じる ×', 17)).setColor('#fffdf1')
  add(label(640, 666, '建物を選んで移動', 16)).setBackgroundColor('#f2f8e8').setPadding(12, 4)

  const landmarks: { id: TownAreaId; name: Phaser.GameObjects.Text; halo: Phaser.GameObjects.Ellipse }[] = []
  let selected: TownAreaId | null = null
  for (const area of Object.values(townAreas)) {
    const { mapX: x, mapY: y } = area
    const key = 'town-map-art-' + area.id
    trimFrame(scene, key, 'landmark', 24)
    const halo = add(scene.add.ellipse(x, y + 18, 190, 78, 0xe9d3a4, .78)).setStrokeStyle(2, 0xfff5d3).setVisible(false)
    const art = add(scene.add.image(x, y + 36, key, 'landmark')).setOrigin(.5, 1)
    art.setScale(Math.min(194 / art.width, 118 / art.height))
    const name = add(label(x, y + 53, area.name, 18)).setColor('#ffffff')
      .setBackgroundColor(areaLabelColors[area.id]).setPadding(10, 4)
    if (area.id === current) {
      add(label(x, y + 84, '● 現在地', 14)).setBackgroundColor('#284f38').setColor('#fffdf1').setPadding(7, 3)
    }
    landmarks.push({ id: area.id, name, halo })
    const hit = add(scene.add.zone(x, y, 198, 147)).setName('town-map-' + area.id)
      .setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => halo.setVisible(true))
    hit.on('pointerout', () => halo.setVisible(selected === area.id))
    hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() >= 10) return
      selected = selected === area.id ? null : area.id
      renderDestinations()
    })
  }

  const details = add(scene.add.container(0, 0))
  let closed = false
  const close = (): void => {
    if (closed) return
    closed = true
    root.destroy(true)
    onClose()
  }

  function renderDestinations(): void {
    for (const landmark of landmarks) {
      const active = landmark.id === selected
      landmark.halo.setVisible(active)
      landmark.name.setColor(active ? '#fff0ab' : '#ffffff')
    }
    details.removeAll(true)
    if (!selected) return

    const area = townAreas[selected]
    const width = 218
    const height = 44 + area.mapDestinations.length * 42
    const x = area.mapX + (area.mapX < 640 ? 210 : -210)
    const top = Phaser.Math.Clamp(area.mapY - height / 2, 103, 620 - height)
    details.add(scene.add.rectangle(x, top + height / 2, width, height, 0xf5faee)
      .setStrokeStyle(2, 0x416d4e).setScrollFactor(0).setInteractive())
    details.add(label(x, top + 19, area.name, 18))
    for (const [index, destination] of area.mapDestinations.entries()) {
      const y = top + 56 + index * 42
      const available = !destination.notice
      const row = scene.add.rectangle(x, y, 196, 34, available ? 0xffffff : 0xe3e9df)
        .setStrokeStyle(1, 0x87a987).setScrollFactor(0).setName('town-destination-' + index)
      details.add(row)
      details.add(label(x, y, available ? destination.label + ' ›' : destination.label + '（未実装）', 16))
      if (!available) continue
      row.setInteractive({ useHandCursor: true })
      row.on('pointerover', () => row.setFillStyle(0xd9edc9))
      row.on('pointerout', () => row.setFillStyle(0xffffff))
      row.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.getDistance() >= 10) return
        close()
        travel(area.id, destination)
      })
    }
  }

  closeButton.on('pointerup', close)
  return close
}
