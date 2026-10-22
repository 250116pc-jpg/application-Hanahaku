import type { Season } from '../test_data'

export type PrototypeFlower = { id: string; name: string; season: Season; url: string; key: string }
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
export const prototypeFlowers: PrototypeFlower[] = definitions.map(([id,name,season]) => {
 const url=images[`../../assets/flowers/${id}.png`]
 if (!url) throw new Error(`花画像が見つかりません: ${id}`)
 return {id,name,season,url,key:`contract-preview-${id}`}
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