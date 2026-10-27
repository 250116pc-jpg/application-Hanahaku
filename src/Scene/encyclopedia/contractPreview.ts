import detailData from './flowerDetails.json'
import imagePaths from '../../../php/flower/path.json'
import type { Season } from '../test_data'

export type PrototypeFlower = { id: number; code: string; name: string; season: Season; url: string; key: string; element: string | null; skillId?: number; statusBonus?: Record<string, number>; hanakotoba: string[]; origin?: string; habitat?: string; features?: string; realUrl?: string; realKey: string }
const definitions: Array<[number, string, string, Season]> = [
 [9,'ajisai','アジサイ','夏'], [11,'asagao','アサガオ','夏'], [12,'blue_rose','青いバラ','春'],
 [13,'cosmos','コスモス','秋'], [14,'fuji','フジ','春'], [15,'gerbera','ガーベラ','春'],
 [10,'hangesho','ハンゲショウ','夏'], [7,'hasu','ハス','夏'], [17,'hibiscus','ハイビスカス','夏'],
 [18,'higanbana','ヒガンバナ','秋'], [19,'kiku','キク','秋'], [6,'kochia','コキア','秋'],
 [20,'lavender','ラベンダー','夏'], [21,'marguerite','マーガレット','春'], [22,'marigold','マリーゴールド','夏'],
 [5,'mukuge','ムクゲ','夏'], [23,'nanohana','菜の花','春'], [24,'nemunoki','ネムノキ','夏'],
 [25,'poppy','ポピー','春'], [26,'red_rose','赤いバラ','春'], [8,'rurimatsuri','ルリマツリ','夏'],
 [16,'sakura','サクラ','春'], [4,'sarusuberi','サルスベリ','夏'], [27,'shakuyaku','シャクヤク','春'],
 [2,'suiren','スイレン','夏'], [28,'suisen','スイセン','冬'], [3,'sunflower','ひまわり','夏'],
 [29,'suzuran','スズラン','春'], [30,'tanpopo','タンポポ','春'], [31,'tsubaki','ツバキ','冬'],
 [32,'tsutsuji','ツツジ','春'], [33,'tulip','チューリップ','春'], [34,'ume','ウメ','冬'],
 [35,'yuri','ユリ','夏'], [1,'zinia','ジニア','夏']
]
const images = import.meta.glob('../../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
type FlowerEntry = { id: number; eng: string; name: string; path: string; real_path?: string; element: number; status_bonus: Record<string, number>; hanakotoba: string[]; origin?: string; habitat?: string; features?: string; description?: string; skill_id: number }
const files = import.meta.glob('../../../php/flower/[0-9][0-9][0-9].json', { eager: true, import: 'default' }) as Record<string, FlowerEntry>
const catalog = Object.values(files)
const elementNames: Record<number, string> = { 1: '熱', 2: '水', 3: '風', 4: '光', 5: '土', 6: '無' }
const assetPath = (base: string, file: string): string => `${base}${file}`.replace('src/assets/', '../../assets/')
const realImages = import.meta.glob('../../assets/images/real_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const realFileNames: Record<string, string> = {"ajisai": "azisai", "asagao": "asagao", "blue_rose": "aobara", "cosmos": "kosumosu", "fuji": "huzi", "gerbera": "ga-bera", "hangesho": "hangesyou", "hasu": "hasu", "hibiscus": "haibisukasu", "higanbana": "higanbana", "kiku": "kiku", "kochia": "kokia", "lavender": "rabenda-", "marguerite": "ma-garetto", "marigold": "mari-go-dorudo", "mukuge": "mukuge", "nanohana": "nanohana", "nemunoki": "nemunoki", "poppy": "popi-", "red_rose": "akabara", "rurimatsuri": "rurimaturi", "sakura": "sakura", "sarusuberi": "sarusuberi", "shakuyaku": "syakuyaku", "suiren": "suiren", "suisen": "suisen", "sunflower": "himawari", "suzuran": "suzuran", "tanpopo": "tanpopo", "tsubaki": "tubaki", "tsutsuji": "tutuzi", "tulip": "cyu-rippu", "ume": "ume", "yuri": "yuri", "zinia": "zinia"}
const wordsByCode = detailData as Record<string, { words?: string[] }>
const entries = new Map(catalog.map(entry => [entry.id, entry]))
if (entries.size !== catalog.length) throw new Error('花データのIDが重複しています')
for (const entry of catalog) {
 const definition = definitions.find(([id]) => id === entry.id)
 if (!definition || definition[1] !== entry.eng || definition[2] !== entry.name || !elementNames[entry.element] || !Array.isArray(entry.hanakotoba) || !entry.hanakotoba.every(word => typeof word === 'string') || !entry.status_bonus || !Object.values(entry.status_bonus).every(value => typeof value === 'number' && Number.isFinite(value))) throw new Error(`花データのID・名前・内容が正しくありません: ${entry.id}`)
 if (!images[assetPath(imagePaths.game, entry.path)] || !realImages[assetPath(imagePaths.real, entry.real_path ?? entry.path)]) throw new Error(`花画像が見つかりません: ${entry.id}`)
}
export const prototypeFlowers: PrototypeFlower[] = definitions.map(([id,code,name,season]) => {
 const entry=entries.get(id)
 const url=images[entry ? assetPath(imagePaths.game, entry.path) : `../../assets/images/pixel_flowers/${code}.png`]
 if (!url) throw new Error(`花画像が見つかりません: ${id}`)
 return {id,code,name:entry?.name ?? name,season,url,key:`contract-preview-${id}`,element:entry ? elementNames[entry.element] : null,skillId:entry?.skill_id,statusBonus:entry?.status_bonus,hanakotoba:entry?.hanakotoba ?? wordsByCode[code]?.words ?? [],origin:entry?.origin,habitat:entry?.habitat,features:entry?.features ?? entry?.description,realUrl:entry ? realImages[assetPath(imagePaths.real, entry.real_path ?? entry.path)] : realImages[`../../assets/images/real_flowers/${realFileNames[code]}.png`],realKey:`flower-real-${id}`}
})
// Prototype-only ownership. Never writes to accounts, the DB, or real party data.
export class ContractPreviewState {
 readonly owned = new Set<number>()
 contract(id: number): void { if (prototypeFlowers.some(f => f.id===id)) this.owned.add(id) }

 reset(): void { this.owned.clear() }
}
export const contractPreview = new ContractPreviewState()