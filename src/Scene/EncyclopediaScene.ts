import pageTurnSound from '../assets/audio/encyclopedia/page-turn-firefly.wav'
import { playSe } from '../audio/BgmManager'
import { readFlowerContracts } from './stage/flowerContracts'
import { mountEncyclopediaBook } from '../display/EncyclopediaBook'
import questionSpring from '../assets/images/encyclopedia/unknown-spring.png'
import questionSummer from '../assets/images/encyclopedia/unknown-summer.png'
import questionFall from '../assets/images/encyclopedia/unknown-autumn.png'
import questionWinter from '../assets/images/encyclopedia/unknown-winter.png'
import Phaser from 'phaser'
import type { Season } from './test_data'
import { createTextButton, getTextStyle } from '../utils/ui'
import { prototypeFlowers, contractPreview } from './encyclopedia/contractPreview'
import type { PrototypeFlower } from './encyclopedia/contractPreview'
import { mountFlowerDetail } from './encyclopedia/FlowerDetailView'

const unknownFlowers: Record<Season, { key: string; url: string }> = {
 '春': { key: 'flower-unknown-spring', url: questionSpring },
 '夏': { key: 'flower-unknown-summer', url: questionSummer },
 '秋': { key: 'flower-unknown-fall', url: questionFall },
 '冬': { key: 'flower-unknown-winter', url: questionWinter },
}

export class EncyclopediaScene extends Phaser.Scene {
 private bookCleanup: (() => void) | null = null
 private bookTurn = 0
 private bookOpened = false
 private season: Season = '春'
 private page = 0
 private detailCleanup: (() => void) | null = null
 constructor() { super('EncyclopediaScene') }
 preload(): void {
  if (!this.cache.audio.exists('encyclopedia-page-turn')) this.load.audio('encyclopedia-page-turn',pageTurnSound)
  for (const {key,url} of Object.values(unknownFlowers)) if (!this.textures.exists(key)) this.load.image(key,url)
  for (const flower of prototypeFlowers) if (!this.textures.exists(flower.key)) this.load.image(flower.key,flower.url)
  for (const flower of prototypeFlowers) if (flower.realUrl && !this.textures.exists(flower.realKey)) this.load.image(flower.realKey,flower.realUrl)
 }
 create(): void {
  this.bookOpened = false
  this.season = '春'
  this.page = 0
  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.closeDetail(); this.closeBook() })
  this.list()
 }
 private text(x:number,y:number,value:string,size=22): Phaser.GameObjects.Text {
  return this.add.text(x,y,value,{...getTextStyle(size),wordWrap:{width:620},lineSpacing:8})
 }
 private button(x:number,y:number,label:string,action:()=>void): void {
  createTextButton(this,x,y,label,action,{fontSize:20,padding:{top:10,bottom:10,left:16,right:16}})
 }
 private frame(title:string): void {
  this.children.each(child => { if (child.input) child.disableInteractive(true) })
  this.children.removeAll(true)
  this.cameras.main.setBackgroundColor('#edf4ec')
  this.text(420,25,title,30)
  this.text(270,75,'花を選ぶと詳細を表示します。テストの花契状態は再読み込みでリセットされます。',17)
  this.button(120,45,'← ホーム',()=>this.scene.start('HomeScene'))
 }
 private closeBook(): void { this.bookCleanup?.(); this.bookCleanup=null }
 private list(): void {
  this.closeBook()
  this.children.removeAll(true)
  this.bookCleanup=mountEncyclopediaBook({
   season:this.season,page:this.page,animate:!this.bookOpened,turn:this.bookTurn,unknown:unknownFlowers,
   onTurn:()=>playSe(this,'encyclopedia-page-turn'),
   onSeason:season=>{this.bookTurn=(['春','夏','秋','冬'].indexOf(season)-['春','夏','秋','冬'].indexOf(this.season));this.season=season;this.page=0;this.list()},
   onPage:page=>{this.bookTurn=page-this.page;this.page=page;this.list()},
   onSelect:flower=>{this.closeBook();this.detail(flower)},
   onHome:()=>this.scene.start('HomeScene'),
   onReset:()=>{this.closeBook();this.confirmReset()},
  })
  this.bookOpened=true
  this.bookTurn=0
 }
 private closeDetail(): void {
  this.detailCleanup?.()
  this.detailCleanup = null
  this.input.enabled = true
 }
 private detail(flower:PrototypeFlower): void {
  this.closeDetail()
  this.input.enabled = false
  this.detailCleanup = mountFlowerDetail(flower, {
   owned: contractPreview.owned.has(flower.id) || !!readFlowerContracts()[flower.id],
   unknownUrl: unknownFlowers[flower.season].url,
   onClose: () => { this.closeDetail(); this.list() },
   onHome: () => { this.closeDetail(); this.scene.start('HomeScene') },
   onContract: () => contractPreview.contract(flower.id),
  })
 }
 private confirmReset(): void {
  this.frame('テスト状態を初期化')
  this.text(300,260,'テストの花契状況をすべて解除します。',26)
  this.button(440,430,'戻る',()=>this.list())
  this.button(800,430,'初期化する',()=>{contractPreview.reset();this.list()})
 }
}