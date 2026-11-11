/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { openPeopleJournal } from './PeopleJournal'
import { readFlowerContracts } from '../Scene/stage/flowerContracts'
import type { Season } from '../Scene/test_data'
import { prototypeFlowers, contractPreview, type PrototypeFlower } from '../Scene/encyclopedia/contractPreview'
import './EncyclopediaBook.css'
import bookmarkImage from '../assets/ui/encyclopedia_bookmark.png'
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 本・ページ・しおりの表示と演出を定義する
 * ================================== */
const images = import.meta.glob('../assets/settings-book/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string,string>
const asset = (name: string): string => images['../assets/settings-book/'+name]!
export function mountEncyclopediaBook(options: {
 season: Season; page: number; animate: boolean; turn?: number;
 unknown: Record<Season,{url:string}>;
 onTurn: () => void; onSeason: (season: Season, page?: number) => void; onPage: (page:number) => void;
 onReady?: () => void; beforeOpen?: () => Promise<void>;
 onSelect: (flower:PrototypeFlower) => void; onHome: () => void; onReset: () => void
}): () => void {
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
  * 処理内容 : 本型図鑑のダイアログと背景画像の領域を作る
  * ================================== */
 const root=document.createElement('section'); root.className='encyclopedia-book-screen'
 root.setAttribute('role','dialog');root.setAttribute('aria-label','花の図鑑');root.setAttribute('aria-modal','true')
 const book=document.createElement('div');book.className='encyclopedia-book';root.append(book)
 const art=document.createElement('img');
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
  * 処理内容 : 開閉用の本の画像と紙面レイヤーを準備する
  * ================================== */
 art.className='encyclopedia-book-art';art.alt='花の図鑑';art.src=asset(options.animate?'opening_00.png':'open.png');book.append(art)
 // 表紙と開いた紙を別の層にして、その間にしおりを挟む。
 const paper=art.cloneNode() as HTMLImageElement;paper.className='encyclopedia-book-paper';paper.alt='';paper.setAttribute('aria-hidden','true');
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
  * 処理内容 : 画像・文字・パネルを配置する
  * ================================== */
 book.append(paper)
 const paperSync=new MutationObserver(()=>{paper.src=art.src});paperSync.observe(art,{attributes:true,attributeFilter:['src']})
 const ui=document.createElement('div');ui.className='encyclopedia-book-ui';ui.hidden=true;book.append(ui)
 const tabs=document.createElement('nav');
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 季節タブ・操作制御と本を開閉する演出を用意する
  * ================================== */
 tabs.className='encyclopedia-book-tabs';tabs.setAttribute('aria-label','季節');tabs.hidden=true;book.append(tabs)
 const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
 let disposed=false,busy=true,timer:ReturnType<typeof setTimeout>|undefined
 const button=(parent:HTMLElement,label:string,action:()=>void):HTMLButtonElement=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{if(!busy)action()};parent.append(b);return b}
 const animate=(reverse:boolean,done:()=>void):void=>{
  busy=true;ui.hidden=true;tabs.hidden=true
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){art.src=asset('open.png');busy=false;done();return}
  let n=reverse?7:0
  const step=():void=>{if(disposed)return;art.src=asset(`opening_${String(n).padStart(2,'0')}.png`);if(n===(reverse?0:7)){if(!reverse)art.src=asset('open.png');busy=false;done();return}n+=reverse?-1:1;timer=setTimeout(step,65)};step()
 }
 const reduced=():boolean=>matchMedia('(prefers-reduced-motion: reduce)').matches
 const seasons: Season[]=['春','夏','秋','冬']
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
  * 処理内容 : 移動先の紙面を準備し、ページとしおりを連動してめくる
  * ================================== */
 const turn=(direction:number,targetSeason:Season,targetPage:number,change:()=>void):void=>{
  if(busy)return
  busy=true;root.setAttribute('aria-busy','true')
  if(reduced()){options.onTurn();change();return}
  const preview=ui.cloneNode(true) as HTMLElement
  preview.classList.add('encyclopedia-page-preview');preview.inert=true;preview.setAttribute('aria-hidden','true')
  const previewGrid=preview.querySelector<HTMLElement>('.encyclopedia-book-grid')!
  previewGrid.replaceChildren()
  drawCards(previewGrid,targetSeason,targetPage)
  const targetPages=Math.max(1,Math.ceil(prototypeFlowers.filter(f=>f.season===targetSeason).length/8))
  const folio=preview.querySelector<HTMLElement>('.encyclopedia-footer-page span')
  if(folio)folio.textContent=`${targetPage+1} / ${targetPages}`
  preview.hidden=true;book.append(preview)
  // Decode the destination's pictures before turning, rather than exposing a blank spread.
  void Promise.all([...preview.querySelectorAll<HTMLImageElement>('img')].map(img=>img.decode().catch(()=>undefined))).then(()=>{
   if(disposed)return
   const moving=(direction<0?ui:preview).cloneNode(true) as HTMLElement
   moving.classList.add('encyclopedia-turn-content');moving.inert=true;moving.setAttribute('aria-hidden','true')
   book.append(moving)
   preview.hidden=false
   options.onTurn()
   // Outer paper edges in the original 384px-wide Gridwright frames.
   const edges=[341,317,292,264,219,167,115,67,28]
   const percent=(x:number):number=>Math.max(0,Math.min(100,(x/384-0.09)/0.82*100))
   // しおりは幅を変えずにページへ追従させる。完成後の配置を基準に移動する。
   const from=seasons.indexOf(options.season),to=seasons.indexOf(targetSeason)
   const seasonTabs=Array.from(tabs.querySelectorAll('button'))
   const starts=seasonTabs.map(tab=>tab.getBoundingClientRect())
   const startLabels=seasonTabs.map(tab=>tab.firstElementChild!.getBoundingClientRect())
   seasonTabs.forEach((tab,index)=>{
    tab.classList.toggle('season-past',index<to)
    tab.setAttribute('aria-pressed',String(index===to));tab.style.gridColumn=index<to?'1':'2'
   })
   const ends=seasonTabs.map(tab=>tab.getBoundingClientRect())
   const endLabels=seasonTabs.map(tab=>tab.firstElementChild!.getBoundingClientRect())
   const ribbons=seasonTabs.flatMap((tab,index)=>{
    if((index<from)===(index<to)) return []
    tab.classList.add('season-turning')
    return [{tab,index,start:starts[index]!,end:ends[index]!,startLabel:startLabels[index]!,endLabel:endLabels[index]!}]
   })
   // 戻るときは元の季節を手前に残し、右へ閉じる紙で徐々に覆う。
   const retiring=direction<0 && from!==to ? seasonTabs[from] : undefined
   const paperBounds=book.getBoundingClientRect()
   const retiringBounds=retiring?.getBoundingClientRect()
   const retiringCover=retiringBounds ? Math.max(0,Math.min(100,(paperBounds.right-paperBounds.width*.035-retiringBounds.left)/retiringBounds.width*100)) : 0
   retiring?.classList.add('season-retiring')
   const ribbonEdges=[341,317,291,264,235,166,115,67,30]
   let frame=direction<0?8:0,stepNumber=0
   const step=():void=>{
    if(disposed)return
    art.src=asset(`turn_next_${String(frame).padStart(2,'0')}.png`)
    const edge=edges[frame]!,leftEdge=Math.min(192,edge),rightEdge=Math.max(192,edge)
    const paperX=ribbonEdges[frame]!
    const fraction=direction>0 ? (ribbonEdges[0]!-paperX)/(ribbonEdges[0]!-ribbonEdges[8]!) : (paperX-ribbonEdges[8]!)/(ribbonEdges[0]!-ribbonEdges[8]!)
    if(retiring){
     const coverage=Math.max(0,Math.min(1,(fraction-.65)/.35))
     retiring.style.clipPath=`inset(0 0 0 ${retiringCover*coverage}%)`
    }
    for(const {tab,index,start,end,startLabel,endLabel} of ribbons){
     const remaining=1-fraction
     const dx=(start.left-end.left)*remaining,dy=(start.top-end.top)*remaining
     tab.style.transform=`translate(${dx}px,${dy}px)`
     const label=tab.firstElementChild as HTMLElement
     label.style.transform=`translate(${((startLabel.left-start.left)-(endLabel.left-end.left))*remaining}px,${((startLabel.top-start.top)-(endLabel.top-end.top))*remaining}px)`
     const ribbon=tab.querySelector<HTMLImageElement>('.encyclopedia-season-ribbon')!
     ribbon.style.transform=(fraction<.5 ? index<from : index<to)?'scaleX(-1)':'none'
    }
    // Stationary pages are occluded by the turning sheet, never swapped at the spine.
    ui.style.clipPath=direction<0?`inset(0 0 0 ${percent(rightEdge)}%)`:`inset(0 ${100-percent(leftEdge)}% 0 0)`
    preview.style.clipPath=direction<0?`inset(0 ${100-percent(leftEdge)}% 0 0)`:`inset(0 0 0 ${percent(rightEdge)}%)`
    // Draw the appropriate printed face on the moving paper, pivoting at the binding.
    const rightFace=frame<=4
    const source=(direction>0?rightFace:!rightFace)?ui:preview
    moving.replaceChildren(...[...source.children].map(child=>child.cloneNode(true)))
    moving.style.clipPath=rightFace?'inset(0 0 0 50%)':'inset(0 50% 0 0)'
    moving.style.transformOrigin='50% 50%'
    moving.style.transform=`scaleX(${Math.min(1,Math.abs(edge-192)/(384*0.41))})`
    moving.hidden=false
    if(stepNumber===8){
     ribbons.forEach(({tab})=>{
      tab.classList.remove('season-turning');tab.style.removeProperty('transform')
      ;(tab.firstElementChild as HTMLElement).style.removeProperty('transform')
      tab.querySelector<HTMLElement>('.encyclopedia-season-ribbon')?.style.removeProperty('transform')
     })
     retiring?.classList.remove('season-retiring');retiring?.style.removeProperty('clip-path')
     art.src=asset('open.png');moving.hidden=true;ui.hidden=true;preview.style.clipPath='none'
     timer=setTimeout(()=>{if(!disposed)change()},55);return
    }
    frame+=direction<0?-1:1;stepNumber++
    timer=setTimeout(step,55)
   }
   step()
  })
 }
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 画像・文字・パネルを配置する
  * ================================== */
 const close=():void=>{if(busy)return;animate(true,options.onHome)}
 const title=document.createElement('h1');title.textContent='花の図鑑';ui.append(title)
 const peopleLink=button(title,'キャラ',()=>openPeopleJournal(root))
 peopleLink.className='people-journal-link'
 if(new URLSearchParams(location.search).get('people-ui')==='portrait') {
  peopleLink.classList.add('with-portrait')
 } else {
  const paper=document.createElement('span')
  paper.className='people-note-paper'
  paper.setAttribute('aria-hidden','true')
  for(let i=1;i<=9;i++) {
   const tile=document.createElement('img')
   tile.alt=''
   tile.src=new URL(`../assets/people-journal/paper-${i}.png`,import.meta.url).href
   paper.append(tile)
  }
  peopleLink.prepend(paper)
 }
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 花契済みの件数と花一覧の領域を表示する
  * ================================== */
 const progress=document.createElement('p');progress.className='encyclopedia-book-progress';progress.textContent=`花契済み ${new Set([...contractPreview.owned, ...Object.keys(readFlowerContracts()).map(Number)]).size} / ${prototypeFlowers.length}`;ui.append(progress)
 const grid=document.createElement('div');grid.className='encyclopedia-book-grid';ui.append(grid)
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 季節とページで花を抽出し、契約状況に応じたカードを表示する
  * ================================== */
 const flowers=prototypeFlowers.filter(f=>f.season===options.season)
 const pages=Math.max(1,Math.ceil(flowers.length/8)),page=Math.min(options.page,pages-1)
 function drawCards(parent:HTMLElement,season:Season,targetPage:number):void {
  const entries=prototypeFlowers.filter(f=>f.season===season)
  entries.slice(targetPage*8,targetPage*8+8).forEach(f=>{
  const owned=contractPreview.owned.has(f.id) || !!readFlowerContracts()[f.id],card=button(parent,'',()=>options.onSelect(f));card.className='encyclopedia-book-card'
  const image=document.createElement('img');image.src=owned?f.url:options.unknown[f.season].url;image.alt=owned?f.name:'未契約の花'
  const label=document.createElement('span');label.textContent=owned?f.name:'？？？';const picture=document.createElement('span');picture.className='encyclopedia-book-picture';picture.append(image);card.append(picture,label)
 })
 }
 drawCards(grid,options.season,page)
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 画像・文字・パネルを配置する
  * ================================== */
 const footer=document.createElement('footer');ui.append(footer)
 const leftFooter=document.createElement('div');leftFooter.className='encyclopedia-footer-page';const rightFooter=document.createElement('div');rightFooter.className='encyclopedia-footer-page';footer.append(leftFooter,rightFooter)
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 / 250116 中村伊安 ] ===
  * 処理内容 : 町マップへ戻る操作と前のページ・季節への移動を設定する
  * ================================== */
 const back=button(root,'‹  町マップへ',close);back.className='encyclopedia-book-back';root.prepend(back)
 const seasonIndex=seasons.indexOf(options.season)
 const previousSeason=seasons[Math.max(0,seasonIndex-1)]!
 const previousLastPage=Math.max(0,Math.ceil(prototypeFlowers.filter(f=>f.season===previousSeason).length/8)-1)
 const nextSeason=seasons[Math.min(seasons.length-1,seasonIndex+1)]!
 const prev=button(leftFooter,'‹',()=>page>0?turn(-1,options.season,page-1,()=>options.onPage(page-1)):turn(-1,previousSeason,previousLastPage,()=>options.onSeason(previousSeason,previousLastPage)));prev.className='encyclopedia-page-prev';prev.setAttribute('aria-label','前のページ');prev.disabled=page===0&&seasonIndex===0
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
  * 処理内容 : ページ番号・テスト初期化・次のページへの操作を作る
  * ================================== */
 const count=document.createElement('span');count.textContent=`${page+1} / ${pages}`;leftFooter.append(count)
 button(rightFooter,'テストを初期化',options.onReset)
 const next=button(rightFooter,'›',()=>page<pages-1?turn(1,options.season,page+1,()=>options.onPage(page+1)):turn(1,nextSeason,0,()=>options.onSeason(nextSeason,0)));next.className='encyclopedia-page-next';next.setAttribute('aria-label','次のページ');
 /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
  * 処理内容 : 季節しおり・キー操作・素材の先読みと初期表示を設定する
  * ================================== */
 next.disabled=page===pages-1&&seasonIndex===seasons.length-1
 ;seasons.forEach((season,i)=>{const tab=button(tabs,season,()=>{if(season!==options.season)turn(i-seasonIndex,season,0,()=>options.onSeason(season))});const label=document.createElement('span');label.textContent=season;label.style.display='inline-block';const ribbon=document.createElement('img');ribbon.src=bookmarkImage;ribbon.alt='';ribbon.className='encyclopedia-season-ribbon';ribbon.setAttribute('aria-hidden','true');tab.replaceChildren(label,ribbon);tab.style.setProperty('--tab-color',['#e6b5bf','#b7cfaa','#d5b075','#b8cadd'][i]!);tab.setAttribute('aria-pressed',String(season===options.season));tab.classList.toggle('season-past',i<seasonIndex);tab.style.gridRow=String(i+1);tab.style.gridColumn=i<seasonIndex?'1':'2'})
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='Tab'){const list=[...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b=>b.getClientRects().length);const first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}})
 document.body.append(root)
 const ready=():void=>{ui.hidden=false;tabs.hidden=false;tabs.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus()}
 const preload=['open.png',...Array.from({length:8},(_,i)=>`opening_${String(i).padStart(2,'0')}.png`),...Array.from({length:9},(_,i)=>`turn_next_${String(i).padStart(2,'0')}.png`)].map(name=>{const img=new Image();img.src=asset(name);return img.decode().catch(()=>undefined)})
 // 画像準備だけをロード待機に含め、本を開く演出は画面が見えてから始める。
 void Promise.all(preload).then(async()=>{
  if(disposed)return
  options.onReady?.()
  await options.beforeOpen?.()
  if(disposed)return
  if(options.animate)animate(false,ready)
  else {busy=false;ready()}
 })
 return ()=>{disposed=true;clearTimeout(timer);paperSync.disconnect();root.remove();previous?.focus()}
}
