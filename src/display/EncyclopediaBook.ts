import { readFlowerContracts } from '../Scene/stage/flowerContracts'
import type { Season } from '../Scene/test_data'
import { prototypeFlowers, contractPreview, type PrototypeFlower } from '../Scene/encyclopedia/contractPreview'
import './EncyclopediaBook.css'
const images = import.meta.glob('../assets/settings-book/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string,string>
const asset = (name: string): string => images['../assets/settings-book/'+name]!
export function mountEncyclopediaBook(options: {
 season: Season; page: number; animate: boolean;
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
 const close=():void=>{if(busy)return;animate(true,options.onHome)}
 const title=document.createElement('h1');title.textContent='花の図鑑';ui.append(title)
 const progress=document.createElement('p');progress.className='encyclopedia-book-progress';progress.textContent=`花契済み ${new Set([...contractPreview.owned, ...Object.keys(readFlowerContracts()).map(Number)]).size} / ${prototypeFlowers.length}`;ui.append(progress)
 const grid=document.createElement('div');grid.className='encyclopedia-book-grid';ui.append(grid)
 const flowers=prototypeFlowers.filter(f=>f.season===options.season)
 const pages=Math.max(1,Math.ceil(flowers.length/8)),page=Math.min(options.page,pages-1)
 flowers.slice(page*8,page*8+8).forEach(f=>{
  const owned=contractPreview.owned.has(f.id) || !!readFlowerContracts()[f.id],card=button(grid,'',()=>options.onSelect(f));card.className='encyclopedia-book-card'
  const image=document.createElement('img');image.src=owned?f.url:options.unknown[f.season].url;image.alt=owned?f.name:'未契約の花'
  const label=document.createElement('span');label.textContent=owned?f.name:'？？？';const picture=document.createElement('span');picture.className='encyclopedia-book-picture';picture.append(image);card.append(picture,label)
 })
 const footer=document.createElement('footer');ui.append(footer)
 const leftFooter=document.createElement('div');leftFooter.className='encyclopedia-footer-page';const rightFooter=document.createElement('div');rightFooter.className='encyclopedia-footer-page';footer.append(leftFooter,rightFooter)
 button(leftFooter,'← ホーム',close)
 const prev=button(leftFooter,'← 前',()=>options.onPage(page-1));prev.disabled=page===0
 const count=document.createElement('span');count.textContent=`${page+1} / ${pages}`;leftFooter.append(count)
 const next=button(rightFooter,'次 →',()=>options.onPage(page+1));next.disabled=page===pages-1
 button(rightFooter,'テストを初期化',options.onReset)
 ;(['春','夏','秋','冬'] as Season[]).forEach((season,i)=>{const tab=button(tabs,season,()=>options.onSeason(season));tab.style.setProperty('--tab-color',['#e6b5bf','#b7cfaa','#d5b075','#b8cadd'][i]!);tab.setAttribute('aria-pressed',String(season===options.season))})
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='Tab'){const list=[...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b=>b.getClientRects().length);const first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}})
 document.body.append(root)
 const ready=():void=>{ui.hidden=false;tabs.hidden=false;tabs.querySelector('button')?.focus()}
 const preload=['open.png',...Array.from({length:8},(_,i)=>`opening_${String(i).padStart(2,'0')}.png`)].map(name=>{const img=new Image();img.src=asset(name);return img.decode().catch(()=>undefined)})
 void Promise.all(preload).then(()=>{if(disposed)return;if(options.animate)animate(false,ready);else{art.src=asset('open.png');busy=false;ready()}})
 return ()=>{disposed=true;clearTimeout(timer);root.remove();previous?.focus()}
}
