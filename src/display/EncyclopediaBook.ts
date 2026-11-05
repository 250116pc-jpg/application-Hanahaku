import { readFlowerContracts } from '../Scene/stage/flowerContracts'
import type { Season } from '../Scene/test_data'
import { prototypeFlowers, contractPreview, type PrototypeFlower } from '../Scene/encyclopedia/contractPreview'
import './EncyclopediaBook.css'
const images = import.meta.glob('../assets/settings-book/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string,string>
const asset = (name: string): string => images['../assets/settings-book/'+name]!
export function mountEncyclopediaBook(options: {
 season: Season; page: number; animate: boolean; turn?: number;
 unknown: Record<Season,{url:string}>;
 onSeason: (season: Season) => void; onPage: (page:number) => void;
 onSelect: (flower:PrototypeFlower) => void; onHome: () => void; onReset: () => void
}): () => void {
 const root=document.createElement('section'); root.className='encyclopedia-book-screen'
 root.setAttribute('role','dialog');root.setAttribute('aria-label','花の図鑑');root.setAttribute('aria-modal','true')
 const book=document.createElement('div');book.className='encyclopedia-book';root.append(book)
 const art=document.createElement('img');art.className='encyclopedia-book-art';art.alt='花の図鑑';art.src=asset(options.animate?'opening_00.png':'open.png');book.append(art)
 const ui=document.createElement('div');ui.className='encyclopedia-book-ui';ui.hidden=true;book.append(ui)
 const tabs=document.createElement('nav');tabs.className='encyclopedia-book-tabs';tabs.setAttribute('aria-label','季節');tabs.hidden=true;book.append(tabs)
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
 const turn=(direction:number,targetSeason:Season,targetPage:number,change:()=>void):void=>{
  if(busy)return
  busy=true;tabs.hidden=true;root.setAttribute('aria-busy','true')
  if(reduced()){change();return}
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
   // Outer paper edges in the original 384px-wide Gridwright frames.
   const edges=[341,317,292,264,219,167,115,67,28]
   const percent=(x:number):number=>Math.max(0,Math.min(100,(x/384-0.09)/0.82*100))
   let frame=direction<0?8:0,stepNumber=0
   const step=():void=>{
    if(disposed)return
    art.src=asset(`turn_next_${String(frame).padStart(2,'0')}.png`)
    const edge=edges[frame]!,leftEdge=Math.min(192,edge),rightEdge=Math.max(192,edge)
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
    if(stepNumber===8){timer=setTimeout(()=>{if(!disposed)change()},55);return}
    frame+=direction<0?-1:1;stepNumber++
    timer=setTimeout(step,55)
   }
   step()
  })
 }
 const close=():void=>{if(busy)return;animate(true,options.onHome)}
 const title=document.createElement('h1');title.textContent='花の図鑑';ui.append(title)
 const progress=document.createElement('p');progress.className='encyclopedia-book-progress';progress.textContent=`花契済み ${new Set([...contractPreview.owned, ...Object.keys(readFlowerContracts()).map(Number)]).size} / ${prototypeFlowers.length}`;ui.append(progress)
 const grid=document.createElement('div');grid.className='encyclopedia-book-grid';ui.append(grid)
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
 const footer=document.createElement('footer');ui.append(footer)
 const leftFooter=document.createElement('div');leftFooter.className='encyclopedia-footer-page';const rightFooter=document.createElement('div');rightFooter.className='encyclopedia-footer-page';footer.append(leftFooter,rightFooter)
 button(leftFooter,'← ホーム',close)
 const seasonIndex=seasons.indexOf(options.season)
 const previousSeason=seasons[Math.max(0,seasonIndex-1)]!
 const prev=button(leftFooter,'← 前',()=>page>0?turn(-1,options.season,page-1,()=>options.onPage(page-1)):turn(-1,previousSeason,0,()=>options.onSeason(previousSeason)));prev.disabled=page===0&&seasonIndex===0
 const count=document.createElement('span');count.textContent=`${page+1} / ${pages}`;leftFooter.append(count)
 const next=button(rightFooter,'次 →',()=>turn(1,options.season,page+1,()=>options.onPage(page+1)));next.disabled=page===pages-1
 button(rightFooter,'テストを初期化',options.onReset)
 ;seasons.forEach((season,i)=>{const tab=button(tabs,season,()=>{if(season!==options.season)turn(i-seasonIndex,season,0,()=>options.onSeason(season))});tab.style.setProperty('--tab-color',['#e6b5bf','#b7cfaa','#d5b075','#b8cadd'][i]!);tab.setAttribute('aria-pressed',String(season===options.season));tab.style.visibility=i<seasonIndex?'hidden':'visible';tab.disabled=i<seasonIndex;tab.setAttribute('aria-hidden',String(i<seasonIndex))})
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='Tab'){const list=[...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b=>b.getClientRects().length);const first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}})
 document.body.append(root)
 const ready=():void=>{ui.hidden=false;tabs.hidden=false;tabs.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()}
 const preload=['open.png',...Array.from({length:8},(_,i)=>`opening_${String(i).padStart(2,'0')}.png`),...Array.from({length:9},(_,i)=>`turn_next_${String(i).padStart(2,'0')}.png`)].map(name=>{const img=new Image();img.src=asset(name);return img.decode().catch(()=>undefined)})
 void Promise.all(preload).then(()=>{if(disposed)return;if(options.animate)animate(false,ready);else{art.src=asset('open.png');busy=false;ready()}})
 return ()=>{disposed=true;clearTimeout(timer);root.remove();previous?.focus()}
}
