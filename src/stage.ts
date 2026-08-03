import Phaser from 'phaser'
import mapJson from './assets/test_map.json'
import grassImg from './assets/grass.png'

export class StageScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageScene' })
  }
  preload() {
    this.load.image('tiles', grassImg)
    this.load.tilemapTiledJSON('map', mapJson)
  }
  create() {
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('grass', 'tiles')
    if (!tileset) {
    console.error('tileset が見つかりませんでした')
    return
    }
    map.createLayer('タイルレイヤー1', tileset, 0, 0)
  }
}