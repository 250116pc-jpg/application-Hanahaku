import flowerJson from '../../../php/flower/flower.json?raw'
import type { Season } from '../test_data'

export type PrototypeFlower = { id: number; name: string; season: Season; url: string; key: string; element: string | null; hanakotoba: string[]; realUrl?: string; realKey: string }
const definitions: Array<[number, string, string, Season]> = [
 [10,'ajisai','アジサイ','夏'], [11,'asagao','アサガオ','夏'], [12,'blue_rose','青いバラ','春'],
 [13,'cosmos','コスモス','秋'], [14,'fuji','フジ','春'], [15,'gerbera','ガーベラ','春'],
 [16,'hangesho','ハンゲショウ','夏'], [8,'hasu','ハス','夏'], [17,'hibiscus','ハイビスカス','夏'],
 [18,'higanbana','ヒガンバナ','秋'], [19,'kiku','キク','秋'], [7,'kochia','コキア','秋'],
 [20,'lavender','ラベンダー','夏'], [21,'marguerite','マーガレット','春'], [22,'marigold','マリーゴールド','夏'],
 [6,'mukuge','ムクゲ','夏'], [23,'nanohana','菜の花','春'], [24,'nemunoki','ネムノキ','夏'],
 [25,'poppy','ポピー','春'], [26,'red_rose','赤いバラ','春'], [9,'rurimatsuri','ルリマツリ','夏'],
 [3,'sakura','サクラ','春'], [5,'sarusuberi','サルスベリ','夏'], [27,'shakuyaku','シャクヤク','春'],
 [2,'suiren','スイレン','夏'], [28,'suisen','スイセン','冬'], [4,'sunflower','ひまわり','夏'],
 [29,'suzuran','スズラン','春'], [30,'tanpopo','タンポポ','春'], [31,'tsubaki','ツバキ','冬'],
 [32,'tsutsuji','ツツジ','春'], [33,'tulip','チューリップ','春'], [34,'ume','ウメ','冬'],
 [35,'yuri','ユリ','夏'], [1,'zinia','ジニア','夏']
]
const images = import.meta.glob('../../assets/flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
type FlowerEntry = { id: number; code: string; name: string; Game_image: string; Real_image: string; element: string | null; hanakotoba: string[] }
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
export const prototypeFlowers: PrototypeFlower[] = definitions.map(([id,code,name,season]) => {
 const entry=entries.get(id)
 const url=images[entry ? entry.Game_image.replace('src/assets/', '../../assets/') : `../../assets/flowers/${code}.png`]
 if (!url) throw new Error(`花画像が見つかりません: ${id}`)
 return {id,name:entry?.name ?? name,season,url,key:`contract-preview-${id}`,element:entry?.element ?? null,hanakotoba:entry?.hanakotoba ?? [],realUrl:entry ? realImages[entry.Real_image.replace('src/assets/', '../../assets/')] : undefined,realKey:`flower-real-${id}`}
})
// Prototype-only ownership. Never writes to accounts, the DB, or real party data.
export class ContractPreviewState {
 readonly owned = new Set<number>()
 equipped: number | null = null
 contract(id: number): void { if (prototypeFlowers.some(f => f.id===id)) this.owned.add(id) }
 equip(id: number): boolean {
  if (!this.owned.has(id)) return false
  this.equipped=id
  return true
 }
 reset(): void { this.owned.clear(); this.equipped=null }
}
export const contractPreview = new ContractPreviewState()