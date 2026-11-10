/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜花の図鑑画面
import trainingButton from '../assets/ui/training_button_wood.png'
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
import { BACK_BUTTON_POSITION, getTextStyle } from '../utils/ui'
import { prototypeFlowers, contractPreview } from './encyclopedia/contractPreview'
import type { PrototypeFlower } from './encyclopedia/contractPreview'
import { mountFlowerDetail } from './encyclopedia/FlowerDetailView'
import { navigateToTownMap } from './HomeScene/townMapNavigation'
import '../display/encyclopedia-buttons.css'

const unknownFlowers: Record<Season, { key: string; url: string }> = {
 '春': { key: 'flower-unknown-spring', url: questionSpring },
 '夏': { key: 'flower-unknown-summer', url: questionSummer },
 '秋': { key: 'flower-unknown-fall', url: questionFall },
 '冬': { key: 'flower-unknown-winter', url: questionWinter },
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 花図鑑の一覧・詳細画面と本の表示を切り替え、表示終了時の後片付けやテスト状態の初期化を行う。
 * ================================== */
export class EncyclopediaScene extends Phaser.Scene {
 private bookCleanup: (() => void) | null = null
 private bookTurn = 0
 private bookOpened = false
 private season: Season = '春'
 private page = 0
 private detailCleanup: (() => void) | null = null
 constructor() { super('EncyclopediaScene') }
 preload(): void {
  this.load.image('encyclopedia-wood-button', trainingButton)
  if (!this.cache.audio.exists('encyclopedia-page-turn')) this.load.audio('encyclopedia-page-turn',pageTurnSound)
  for (const {key,url} of Object.values(unknownFlowers)) if (!this.textures.exists(key)) this.load.image(key,url)
  for (const flower of prototypeFlowers) if (!this.textures.exists(flower.key)) this.load.image(flower.key,flower.url)
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
  const texture = this.textures.get('encyclopedia-wood-button')
  if (!texture.has('button')) texture.add('button',0,25,122,2122,459)
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
  const image = this.add.image(x,y,'encyclopedia-wood-button','button').setDisplaySize(160,46).setInteractive({useHandCursor:true})
  this.add.text(x,y,label,{...getTextStyle(18),backgroundColor:undefined,color:'#fff5df'}).setOrigin(.5)
  image.on('pointerover',()=>image.setAlpha(.8)).on('pointerout',()=>image.setAlpha(1))
  image.on('pointerdown',()=>image.setAlpha(.65)).on('pointerup',action)
 }
 private frame(title:string): void {
  this.children.each(child => { if (child.input) child.disableInteractive(true) })
  this.children.removeAll(true)
  this.cameras.main.setBackgroundColor('#edf4ec')
  this.text(420,25,title,30)
  this.text(270,75,'花を選ぶと詳細を表示します。テストの花契状態は再読み込みでリセットされます。',17)
  this.button(BACK_BUTTON_POSITION.x,BACK_BUTTON_POSITION.y,'← 町マップ',()=>navigateToTownMap(this))
 }
 private closeBook(): void { this.bookCleanup?.(); this.bookCleanup=null }
 private list(): void {
  this.closeBook()
  this.children.removeAll(true)
  this.bookCleanup=mountEncyclopediaBook({
   season:this.season,page:this.page,animate:!this.bookOpened,turn:this.bookTurn,unknown:unknownFlowers,
   onTurn:()=>playSe(this,'encyclopedia-page-turn'),
   onSeason:(season,page=0)=>{this.bookTurn=(['春','夏','秋','冬'].indexOf(season)-['春','夏','秋','冬'].indexOf(this.season));this.season=season;this.page=page;this.list()},
   onPage:page=>{this.bookTurn=page-this.page;this.page=page;this.list()},
   onSelect:flower=>{this.closeBook();this.detail(flower)},
   onHome:()=>navigateToTownMap(this),
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
   onHome: () => { this.closeDetail(); navigateToTownMap(this) },
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
