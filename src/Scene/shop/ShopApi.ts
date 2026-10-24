import { getPhpBaseUrl } from '../../auth/PhpBaseUrl';
import rawCatalog from '../../../php/shop/items.json?raw'
import type { ShopItem } from './types'
import type { ItemCategory } from '../inventory/InventoryData'
export const shopCatalog = JSON.parse(rawCatalog) as Array<ShopItem & { category: ItemCategory }>
export type ShopState = { coin: number; items: Record<string, number> }
export async function requestShop(action: 'state' | 'buy' = 'state', itemId?: number): Promise<ShopState> {
 const base=getPhpBaseUrl()
 const response=await fetch(`${base}/shop/state.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,itemId})})
 const result=await response.json()
 if(!response.ok || !result.ok) throw new Error(result.error ?? '所持品を読み込めませんでした。')
 return result as ShopState
}
