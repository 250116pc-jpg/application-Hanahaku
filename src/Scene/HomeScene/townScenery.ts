import Phaser from 'phaser'
import type { TownArea, VillageStop } from './townAreas'

type World = Phaser.GameObjects.Container
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
    ['table', 314, 168, 78, 58], ['bench', 451, 88, 89, 42],
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
export function drawTownFeature(scene: Phaser.Scene, world: World, area: TownArea): void {
  if (area.id === 'atelier') {
    rect(scene, world, 640, 279, 1280, 558, 0x9e8768)
    addTownProp(scene, world, 'barrel', 955, 558, 2.5)
  } else if (area.id === 'plaza') {
    addTownProp(scene, world, 'tree', 1420, 558, 2.8)
    addTownProp(scene, world, 'bench', 1050, 558, 2)
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
    addTownProp(scene, world, 'tree', 390, 558, 2.2)
  }
}
export function drawInteractiveProp(scene: Phaser.Scene, world: World, stop: VillageStop): void {
  addTownProp(scene, world, 'table', stop.x, 558, 3.2)
}
