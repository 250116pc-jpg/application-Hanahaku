import Phaser from 'phaser'
import type { Season } from './test_data'
import { createTextButton, getTextStyle } from '../utils/ui'
import { prototypeFlowers, contractPreview } from './encyclopedia/contractPreview'
import type { PrototypeFlower } from './encyclopedia/contractPreview'
import { characterAnimations } from '../animation/animationData'

export class EncyclopediaScene extends Phaser.Scene {
 private season: Season = '夏'
 private page = 0
 constructor() { super('EncyclopediaScene') }
 preload(): void {
  for (const flower of prototypeFlowers) if (!this.textures.exists(flower.key)) this.load.image(flower.key,flower.url)
  const player=characterAnimations.player.idle
  this.load.spritesheet('contract-preview-player',player.image,{frameWidth:player.frameWidth,frameHeight:player.frameHeight})
 }
 create(): void { this.list() }
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
  this.text(270,75,'花契テスト：季節・能力値は仮設定。再読み込みでリセットされます。',17)
  this.button(120,45,'← ホーム',()=>this.scene.start('HomeScene'))
  this.button(1110,45,'キャラ詳細',()=>this.character())
 }
 private art(flower:PrototypeFlower,x:number,y:number,size:number,locked=false): void {
  const image=this.add.image(x,y,flower.key)
  image.setScale(size/Math.max(image.width,image.height))
  if(locked) image.setTint(0x31433b).setAlpha(0.45)
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
   this.text(x-110,y+35,flower.name,20)
   createTextButton(this,x,y+78,(contractPreview.equipped===flower.id?'編成中':owned?'花契済み':'未契約')+'・詳細',()=>this.detail(flower),{fontSize:16,padding:{top:3,bottom:3,left:10,right:10}})
  })
  if(this.page>0)this.button(420,650,'← 前のページ',()=>{this.page--;this.list()})
  this.text(600,635,`${this.page+1} / ${pages}`,20)
  if(this.page<pages-1)this.button(830,650,'次のページ →',()=>{this.page++;this.list()})
  this.button(1100,650,'テストを初期化',()=>this.confirmReset())
 }
 private detail(flower:PrototypeFlower): void {
  this.frame('花詳細')
  const owned=contractPreview.owned.has(flower.id)
  this.button(130,130,'← 花一覧',()=>this.list())
  this.add.rectangle(300,370,400,410,0xffffff).setStrokeStyle(2,0x81a18e)
  this.art(flower,300,330,310,!owned)
  this.text(170,530,flower.name,28)
  this.text(570,175,`${flower.name}　／　${flower.season}`,30)
  this.text(570,240,owned?'花契済み：編成できます':'未契約：花契すると入手できます',24)
  this.text(570,305,'MP：30\nATKボーナス：5\nスキル：試作スキル（効果は未実装）\n消費MP：プレイヤー5 ／ 花3',22)
  this.text(570,470,'上記は表示確認用の共通値です。\n花自体にHPはありません。',18)
  if(!owned)this.button(810,585,'花契する（テスト）',()=>{contractPreview.contract(flower.id);this.detail(flower)})
  else if(contractPreview.equipped===flower.id)this.button(810,585,'編成から外す',()=>{contractPreview.equipped=null;this.detail(flower)})
  else this.button(810,585,'この花を編成する',()=>{contractPreview.equip(flower.id);this.detail(flower)})
 }
 private character(): void {
  this.frame('キャラ詳細（テスト）')
  this.button(130,130,'← 花一覧',()=>this.list())
  this.add.rectangle(300,350,400,350,0xffffff).setStrokeStyle(2,0x81a18e)
  this.add.sprite(300,335,'contract-preview-player',0).setScale(3)
  this.text(160,550,'プレイヤー Lv.1',28)
  const flower=prototypeFlowers.find(f=>f.id===contractPreview.equipped)
  this.text(570,175,'HP：100 ／ 100\nMP：50 ／ 50\nATK：'+(flower?'15（基本10 ＋ 花5）':'10'),26)
  this.text(570,340,flower?`編成中の花：${flower.name}`:'編成中の花：なし',24)
  if(flower){this.art(flower,710,455,155);this.button(960,455,'花詳細へ',()=>this.detail(flower))}
  else this.text(570,405,'花一覧から花契し、花詳細で編成してください。',20)
  this.text(570,575,'試作では花を1つ編成できます。\n本番の編成・所持データには保存されません。',18)
 }
 private confirmReset(): void {
  this.frame('テスト状態を初期化')
  this.text(300,260,'テストの花契状況と編成をすべて解除します。',26)
  this.button(440,430,'戻る',()=>this.list())
  this.button(800,430,'初期化する',()=>{contractPreview.reset();this.list()})
 }
}