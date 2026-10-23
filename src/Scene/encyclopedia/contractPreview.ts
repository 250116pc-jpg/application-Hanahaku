import flowerJson from '../../../php/flower/flower.json?raw'
import type { Season } from '../test_data'

export type PrototypeFlower = { id: string; name: string; season: Season; url: string; key: string; element: string | null; hanakotoba: string[]; realUrl?: string; realKey: string }
const definitions: Array<[string, string, Season]> = [
 ['ajisai','アジサイ','夏'], ['asagao','アサガオ','夏'], ['blue_rose','青いバラ','春'],
 ['cosmos','コスモス','秋'], ['fuji','フジ','春'], ['gerbera','ガーベラ','春'],
 ['hangesho','ハンゲショウ','夏'], ['hasu','ハス','夏'], ['hibiscus','ハイビスカス','夏'],
 ['higanbana','ヒガンバナ','秋'], ['kiku','キク','秋'], ['kochia','コキア','秋'],
 ['lavender','ラベンダー','夏'], ['marguerite','マーガレット','春'], ['marigold','マリーゴールド','夏'],
 ['mukuge','ムクゲ','夏'], ['nanohana','菜の花','春'], ['nemunoki','ネムノキ','夏'],
 ['poppy','ポピー','春'], ['red_rose','赤いバラ','春'], ['rurimatsuri','ルリマツリ','夏'],
 ['sakura','サクラ','春'], ['sarusuberi','サルスベリ','夏'], ['shakuyaku','シャクヤク','春'],
 ['suiren','スイレン','夏'], ['suisen','スイセン','冬'], ['sunflower','ひまわり','夏'],
 ['suzuran','スズラン','春'], ['tanpopo','タンポポ','春'], ['tsubaki','ツバキ','冬'],
 ['tsutsuji','ツツジ','春'], ['tulip','チューリップ','春'], ['ume','ウメ','冬'],
 ['yuri','ユリ','夏'], ['zinia','ジニア','夏']
]
const images = import.meta.glob('../../assets/flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
type FlowerEntry = { id: string; name: string; Game_image: string; Real_image: string; element: string | null; hanakotoba: string[] }
const catalog: FlowerEntry[] = JSON.parse(flowerJson)
const realImages = import.meta.glob('../../assets/realflowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const databaseFlowerIds: Record<string, string> = {
 '1':'zinia','2':'suiren','3':'sakura','4':'sunflower','5':'sarusuberi',
 '6':'mukuge','7':'kochia','8':'hasu','9':'rurimatsuri','10':'ajisai'
}
const catalogId = (id: string): string => databaseFlowerIds[id] ?? id
const entries = new Map(catalog.map(entry => [catalogId(entry.id), entry]))
if (entries.size !== catalog.length) throw new Error('花データのIDが重複しています')
for (const entry of catalog) {
 if (!definitions.some(([id]) => id === catalogId(entry.id)) || !Array.isArray(entry.hanakotoba) || !entry.hanakotoba.every(word => typeof word === 'string')) throw new Error(`花データが正しくありません: ${entry.id}`)
 if (!images[entry.Game_image.replace('src/assets/', '../../assets/')] || !realImages[entry.Real_image.replace('src/assets/', '../../assets/')]) throw new Error(`花画像が見つかりません: ${entry.id}`)
}
export const prototypeFlowers: PrototypeFlower[] = definitions.map(([id,name,season]) => {
 const entry=entries.get(id)
 const url=images[entry ? entry.Game_image.replace('src/assets/', '../../assets/') : `../../assets/flowers/${id}.png`]
 if (!url) throw new Error(`花画像が見つかりません: ${id}`)
 return {id,name:entry?.name ?? name,season,url,key:`contract-preview-${id}`,element:entry?.element ?? null,hanakotoba:entry?.hanakotoba ?? [],realUrl:entry ? realImages[entry.Real_image.replace('src/assets/', '../../assets/')] : undefined,realKey:`flower-real-${id}`}
})
// Prototype-only ownership. Never writes to accounts, the DB, or real party data.
export class ContractPreviewState {
 readonly owned = new Set<string>()
 equipped: string | null = null
 contract(id: string): void { if (prototypeFlowers.some(f => f.id===id)) this.owned.add(id) }
 equip(id: string): boolean {
  if (!this.owned.has(id)) return false
  this.equipped=id
  return true
 }
 reset(): void { this.owned.clear(); this.equipped=null }
}
export const contractPreview = new ContractPreviewState()