import questionSpring from '../assets/images/question spring.png'
import questionSummer from '../assets/images/question summer.png'
import questionFall from '../assets/images/question fall.png'
import questionWinter from '../assets/images/question winnter.png'
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
 private season: Season = '夏'
 private page = 0
 private detailCleanup: (() => void) | null = null
 constructor() { super('EncyclopediaScene') }
 preload(): void {
  for (const {key,url} of Object.values(unknownFlowers)) if (!this.textures.exists(key)) this.load.image(key,url)
  for (const flower of prototypeFlowers) if (!this.textures.exists(flower.key)) this.load.image(flower.key,flower.url)
  for (const flower of prototypeFlowers) if (flower.realUrl && !this.textures.exists(flower.realKey)) this.load.image(flower.realKey,flower.realUrl)
 }
 create(): void {
  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.closeDetail())
  // 春画像だけ横長なので、中央の正方形を使い左右の余白を除く。
  const spring = this.textures.get(unknownFlowers['春'].key)
  if (!spring.has('icon')) {
   const source = spring.getSourceImage()
   const side = Math.min(source.width, source.height)
   spring.add('icon', 0, Math.floor((source.width-side)/2), Math.floor((source.height-side)/2), side, side)
  }
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
 private art(flower:PrototypeFlower,x:number,y:number,size:number,locked=false): void {
  const image=this.add.image(x,y,locked?unknownFlowers[flower.season].key:flower.key,locked && flower.season==='春'?'icon':undefined)
  image.setScale(size/Math.max(image.width,image.height))
 }
 private list(): void {
  this.frame('季節の花図鑑')
  const seasons:Season[]=['春','夏','秋','冬']
  seasons.forEach((season,i)=>this.button(180+i*150,135,season===this.season?`【${season}】`:season,()=>{this.season=season;this.page=0;this.list()}))
  this.text(790,120,`花契済み ${contractPreview.owned.size} / ${prototypeFlowers.length}`,21)
  const flowers=prototypeFlowers.filter(f=>f.season===this.season)
  const pages=Math.max(1,Math.ceil(flowers.length/8))
  this.page=Math.min(this.page,pages-1)
  flowers.slice(this.page*8,this.page*8+8).forEach((flower,i)=>{
   const x=205+(i%4)*285, y=280+Math.floor(i/4)*215
   const owned=contractPreview.owned.has(flower.id)
   const card=this.add.rectangle(x,y,255,195,0xffffff).setStrokeStyle(2,owned?0x398363:0xaab5ae).setInteractive({useHandCursor:true})
   card.on('pointerup',()=>this.detail(flower))
   this.art(flower,x,y-18,125,!owned)
   this.text(x-110,y+35,owned?flower.name:'？？？',20)
   createTextButton(this,x,y+78,(owned?'花契済み':'未契約')+'・詳細',()=>this.detail(flower),{fontSize:16,padding:{top:3,bottom:3,left:10,right:10}})
  })
  if(this.page>0)this.button(420,650,'← 前のページ',()=>{this.page--;this.list()})
  this.text(600,635,`${this.page+1} / ${pages}`,20)
  if(this.page<pages-1)this.button(830,650,'次のページ →',()=>{this.page++;this.list()})
  this.button(1100,650,'テストを初期化',()=>this.confirmReset())
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
   owned: contractPreview.owned.has(flower.id),
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