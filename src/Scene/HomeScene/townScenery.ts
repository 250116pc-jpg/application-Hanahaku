import Phaser from 'phaser'
import type { TownArea, VillageStop } from './townAreas'

type World = Phaser.GameObjects.Container
const wood = 0x684936
const gold = 0xb99460
function rect(scene: Phaser.Scene, world: World, x: number, y: number, w: number, h: number, color: number, alpha = 1): Phaser.GameObjects.Rectangle {
  const object = scene.add.rectangle(x, y, w, h, color, alpha)
  world.add(object)
  return object
}
export function addTownProp(scene: Phaser.Scene, world: World, frame: string, x: number, y: number, scale = 3): void {
  world.add(scene.add.image(x, y, 'home-props', frame).setOrigin(.5, 1).setScale(scale))
}
export function prepareTownProps(scene: Phaser.Scene): void {
  const texture = scene.textures.get('home-props')
  const frames: [string, number, number, number, number][] = [
    ['table', 314, 168, 78, 58], ['bench', 451, 88, 89, 42], ['well', 41, 162, 81, 97],
    ['flowers', 870, 257, 90, 66], ['barrel', 194, 28, 29, 38], ['tree', 840, 447, 143, 164],
    ['market', 386, 318, 94, 100],
  ]
  frames.forEach(([name, x, y, w, h]) => { if (!texture.has(name)) texture.add(name, 0, x, y, w, h) })
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
}
export function drawTownGround(scene: Phaser.Scene, world: World, area: TownArea): void {
  const indoor = area.id === 'atelier'
  rect(scene, world, area.width / 2, 640, area.width, 164, indoor ? 0x584033 : 0x514f45)
  if (indoor) {
    for (let y = 574; y < 720; y += 32) {
      rect(scene, world, 640, y, 1280, 2, 0x38291f)
      for (let x = (y % 64 ? 0 : 90); x < 1280; x += 180) rect(scene, world, x, y + 16, 2, 30, 0x38291f)
    }
  } else {
    rect(scene, world, area.width / 2, 569, area.width, 24, 0xc5b9a0)
    rect(scene, world, area.width / 2, 583, area.width, 4, 0xe0d3b5)
    for (let y = 598; y < 646; y += 24) for (let x = y % 48 ? 0 : 40; x < area.width; x += 80) {
      rect(scene, world, x + 39, y, 76, 20, y % 48 ? 0x817b69 : 0x918976)
    }
  }
}
export function drawAtelier(scene: Phaser.Scene, world: World): void {
  rect(scene, world, 640, 279, 1280, 558, 0xceb98e)
  rect(scene, world, 640, 390, 1280, 336, 0xc1aa7f)
  for (let x = 20; x < 1280; x += 245) {
    rect(scene, world, x, 295, 24, 526, wood)
    rect(scene, world, x + 5, 295, 5, 526, 0x8c684a)
  }
  rect(scene, world, 640, 115, 1280, 26, wood)
  rect(scene, world, 640, 545, 1280, 26, wood)
  // 窓から差す光と、木の桟。
  rect(scene, world, 365, 267, 230, 224, wood)
  rect(scene, world, 365, 267, 208, 202, 0x9dc4b3)
  rect(scene, world, 365, 298, 206, 128, 0xc6dfca)
  rect(scene, world, 365, 267, 9, 206, wood)
  rect(scene, world, 365, 259, 208, 9, wood)
  rect(scene, world, 365, 382, 246, 14, gold)
  const light = scene.add.graphics().fillStyle(0xffefba, .12)
  light.fillTriangle(260, 380, 470, 380, 650, 558)
  world.add(light)
  // 暖炉。炎はシンプルなドット形状で表現。
  rect(scene, world, 115, 440, 140, 230, 0x8c8271)
  rect(scene, world, 115, 474, 100, 160, 0x342b27)
  rect(scene, world, 115, 548, 155, 18, 0xaaa08b)
  rect(scene, world, 112, 521, 67, 14, 0xad642d)
  rect(scene, world, 104, 502, 18, 32, 0xe2a543)
  rect(scene, world, 124, 491, 14, 42, 0xf5ca68)
  addTownProp(scene, world, 'barrel', 955, 558, 2.5)
  // 上段の瓶棚。
  rect(scene, world, 790, 275, 230, 12, wood)
  for (let i = 0; i < 6; i++) {
    const color = [0x69957b, 0xb98775, 0x7d94a5][i % 3]
    rect(scene, world, 705 + i * 34, 249, 20, 38, color)
    rect(scene, world, 705 + i * 34, 225, 10, 12, gold)
    rect(scene, world, 705 + i * 34, 251, 16, 11, 0xe4d8b5)
  }
}
export function drawTownFeature(scene: Phaser.Scene, world: World, area: TownArea): void {
  if (area.id === 'atelier') { drawAtelier(scene, world); return }
  if (area.id === 'plaza') {
    addTownProp(scene, world, 'tree', 1420, 558, 2.8)
    addTownProp(scene, world, 'bench', 1050, 558, 2)
    const fountain = scene.add.graphics()
    fountain.fillStyle(0x526d68).fillEllipse(790, 540, 290, 42)
    fountain.fillStyle(0xaaa997).fillEllipse(790, 526, 290, 60)
    fountain.fillStyle(0x7db8ba).fillEllipse(790, 519, 254, 34)
    fountain.fillStyle(0x9c9c8d).fillRect(770, 390, 40, 128)
    fountain.fillStyle(0xbdb8a1).fillEllipse(790, 395, 150, 34)
    fountain.fillStyle(0x9ed5d4).fillEllipse(790, 389, 128, 20)
    fountain.lineStyle(4, 0xb9e3da, .8).lineBetween(737, 398, 730, 512).lineBetween(843, 398, 850, 512)
    fountain.fillStyle(0xc7c5a6).fillCircle(790, 360, 18)
    world.add(fountain)
    addTownProp(scene, world, 'flowers', 580, 558, 1.5)
  } else if (area.id === 'market') {
    addTownProp(scene, world, 'market', 1130, 558, 2)
    addTownProp(scene, world, 'barrel', 470, 558, 2)
    addTownProp(scene, world, 'flowers', 1660, 558, 1.5)
  } else if (area.id === 'avenue') {
    addTownProp(scene, world, 'tree', 1160, 558, 2.8)
    addTownProp(scene, world, 'bench', 1600, 558, 2.5)
    addTownProp(scene, world, 'flowers', 1800, 558, 1.6)
  } else {
    rect(scene, world, 1200, 427, 1272, 262, 0x626d62)
    for (let x = 600; x < 1800; x += 72) for (let y = 300; y < 558; y += 36) {
      rect(scene, world, x, y, 68, 32, y % 72 ? 0x8a8b7e : 0x9b9d8c)
    }
    addTownProp(scene, world, 'tree', 390, 558, 2.2)
  }
}
export function drawInteractiveProp(scene: Phaser.Scene, world: World, stop: VillageStop): void {
  if (stop.prop === 'workbench') {
    addTownProp(scene, world, 'table', stop.x, 558, 3.2)
    addTownProp(scene, world, 'flowers', stop.x + 38, 452, 1.2)
    for (const offset of [1, 37, 75]) {
      rect(scene, world, stop.x + offset, 452, 22, 25, 0x9e6547)
      rect(scene, world, stop.x + offset, 440, 27, 7, 0xc18a5a)
    }
  } else if (stop.prop === 'bookshelf') {
    rect(scene, world, stop.x, 440, 180, 232, wood)
    rect(scene, world, stop.x, 440, 156, 208, 0x40362c)
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 7; i++) {
        const x = stop.x - 64 + i * 21, y = 370 + row * 66
        rect(scene, world, x, y, 15, 42 + (i % 3) * 5, [0x7b947b, 0xa5745d, 0xa9925e, 0x6e8791][i % 4])
        rect(scene, world, x, y + 12, 11, 3, 0xd7c59a)
      }
      rect(scene, world, stop.x, 402 + row * 66, 168, 10, gold)
    }
  } else if (stop.prop === 'exit') {
    rect(scene, world, stop.x, 425, 142, 266, wood)
    rect(scene, world, stop.x, 425, 118, 242, 0x9b7b52)
    for (let x = -40; x <= 40; x += 20) rect(scene, world, stop.x + x, 425, 2, 240, wood)
    rect(scene, world, stop.x, 345, 86, 70, 0xc8dfca)
    rect(scene, world, stop.x, 345, 5, 70, wood)
    rect(scene, world, stop.x + 38, 459, 9, 9, 0xe7c77f)
  } else if (stop.prop === 'gate') {
    rect(scene, world, stop.x, 380, 300, 356, 0x3c5048)
    rect(scene, world, stop.x, 435, 216, 246, 0x9ab49b)
    for (const offset of [-198, 198]) {
      rect(scene, world, stop.x + offset, 340, 128, 436, 0x858c80)
      for (let y = 138; y < 558; y += 34) rect(scene, world, stop.x + offset, y, 126, 3, 0x606d65)
      for (let x = -48; x <= 48; x += 48) rect(scene, world, stop.x + offset + x, 109, 32, 40, 0x9da18e)
      rect(scene, world, stop.x + offset, 290, 48, 110, 0x6a8190)
      rect(scene, world, stop.x + offset, 290, 8, 74, 0xd0c497)
    }
    rect(scene, world, stop.x, 195, 296, 122, 0x9c9f8d)
    rect(scene, world, stop.x, 254, 310, 14, 0x626d62)
    for (let x = -120; x <= 120; x += 30) rect(scene, world, stop.x + x, 290, 9, 64, wood)
  }
}
