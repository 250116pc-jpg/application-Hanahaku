import { getPhpBaseUrl } from '../../auth/PhpBaseUrl';
import rawCatalog from '../../../php/shop/items.json?raw'
import type { ShopItem } from './types'
import type { ItemCategory } from '../inventory/InventoryData'
export const shopCatalog = JSON.parse(rawCatalog) as Array<ShopItem & { category: ItemCategory }>
export type ShopState = { coin: number; items: Record<string, number> }
export async function requestShop(action: 'state' | 'buy' | 'consume' = 'state', itemId?: number, quantity = 1): Promise<ShopState> {
 if (import.meta.env.DEV && new URLSearchParams(location.search).get('shop-test') === '1') {
  const key='hanahaku-shop-preview-v1'
  let state: ShopState
  try { state=JSON.parse(sessionStorage.getItem(key) ?? 'null') ?? {coin:10000,items:{}} }
  catch { state={coin:10000,items:{}} }
  if (!document.getElementById('shop-test-notice')) {
   const notice=document.createElement('div')
   notice.id='shop-test-notice'
   notice.textContent='ショップテスト：仮のG・所持品（DB保存なし）'
   notice.style.cssText='position:fixed;bottom:0;left:0;z-index:20000;background:#132638;color:#ffe0a0;padding:3px 8px;font-size:12px;pointer-events:none'
   document.body.append(notice)
  }
  if(action==='buy') {
   const product=shopCatalog.find(item=>item.id===itemId)
   if(!product || !Number.isInteger(quantity) || quantity<1 || quantity>99) throw new Error('購入内容を確認してください。')
   const total=product.price*quantity
   if(state.coin<total) throw new Error('コインが足りません。')
   const count=state.items[String(itemId)] ?? 0
   if(count>2147483647-quantity) throw new Error('所持数の上限です。')
   state={coin:state.coin-total,items:{...state.items,[String(itemId)]:count+quantity}}
  }
  if(action==='consume') {
   if(![13,14,15].includes(itemId ?? 0) || quantity!==1) throw new Error('使用できないアイテムです。')
   const count=state.items[String(itemId)] ?? 0
   if(count<1) throw new Error('回復薬を所持していません。')
   state={...state,items:{...state.items,[String(itemId)]:count-1}}
  }
  sessionStorage.setItem(key,JSON.stringify(state))
  return state
 }
 const base=getPhpBaseUrl()
 const response=await fetch(`${base}/shop/state.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,itemId,quantity})})
 const result=await response.json()
 if(!response.ok || !result.ok) throw new Error(result.error ?? '所持品を読み込めませんでした。')
 return result as ShopState
}
