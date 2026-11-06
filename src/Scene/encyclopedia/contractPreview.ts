import catalogSkills from '../../../php/flower/catalog-skills.json'
import imagePaths from '../../../php/flower/path.json'
import type { Season } from '../test_data'

export type CatalogSkill = { name: string; description: string; descriptionLevel1?: string; mp: number | null; cooldown: number | null; element: string; category: string; icon: string }
export type FlowerImageVariant = { name: string; url: string; hanakotoba: string[] }
export type PrototypeFlower = { imageVariants?: FlowerImageVariant[]; id: number; code: string; name: string; season: Season; url: string; key: string; element: string | null; skillId?: number; skill: CatalogSkill | null; statusBonus?: Record<string, number>; hanakotoba: string[]; origin?: string; habitat?: string; features?: string }
const images = import.meta.glob('../../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
type FlowerEntry = { image_variants?: Array<{name: string; path: string; hanakotoba: string[]}>; id: number; eng: string; name: string; path: string; element: number | null; season: Season; catalog_order?: number; skill_ref?: string; status_bonus: Record<string, number>; hanakotoba: string[]; origin?: string; habitat?: string; features?: string; description?: string; skill_id: number | null }
const files = import.meta.glob('../../../php/flower/[0-9][0-9][0-9].json', { eager: true, import: 'default' }) as Record<string, FlowerEntry>
const catalog = Object.values(files)
const elementNames: Record<number, string> = { 1: '熱', 2: '水', 3: '風', 4: '光', 5: '土', 6: '無' }
const assetPath = (base: string, file: string): string => `${base}${file}`.replace('src/assets/', '../../assets/')
const entries = new Map(catalog.map(entry => [entry.id, entry]))
if (entries.size !== catalog.length) throw new Error('花データのIDが重複しています')
const codes = new Set<string>()
for (const entry of catalog) {
 if (!Number.isInteger(entry.id) || entry.id < 1 || codes.has(entry.eng) || !entry.name || !['春','夏','秋','冬'].includes(entry.season) || (entry.element !== null && !elementNames[entry.element]) || !Array.isArray(entry.hanakotoba) || !entry.hanakotoba.every(word => typeof word === 'string') || !entry.status_bonus || !Object.values(entry.status_bonus).every(value => typeof value === 'number' && Number.isFinite(value))) throw new Error('花データが正しくありません: '+entry.id)
 codes.add(entry.eng)
 if (!images[assetPath(imagePaths.game, entry.path)]) throw new Error('花画像が見つかりません: '+entry.id)
 for (const variant of entry.image_variants ?? []) {
  if (!images[assetPath(imagePaths.game, variant.path)]) throw new Error('花の画像が見つかりません: '+entry.id)
 }
}
const skillCodes: Record<number,string> = {1:'zinia',2:'suiren',3:'sunflower',4:'sarusuberi',5:'mukuge',6:'kochia',7:'hasu',8:'rurimatsuri',9:'ajisai',10:'hangesho',13:'sakura'}
const skills = catalogSkills as Record<string, CatalogSkill | null>
export const prototypeFlowers: PrototypeFlower[] = catalog.sort((a,b)=>(a.catalog_order ?? a.id+1000)-(b.catalog_order ?? b.id+1000)).map(entry => ({
 id:entry.id,code:entry.eng,name:entry.name,season:entry.season,
 url:images[assetPath(imagePaths.game,entry.path)],key:'contract-preview-'+entry.id,
 element:entry.element === null ? null : elementNames[entry.element],skillId:entry.skill_id ?? undefined,
 skill:skills[entry.skill_id === null ? entry.skill_ref ?? '' : skillCodes[entry.skill_id]] ?? null,
 statusBonus:entry.status_bonus,hanakotoba:entry.hanakotoba,
 origin:entry.origin,habitat:entry.habitat,features:entry.features ?? entry.description,
 imageVariants:entry.image_variants?.map(variant => ({name:variant.name,url:images[assetPath(imagePaths.game,variant.path)],hanakotoba:variant.hanakotoba}))
}))
// Prototype-only ownership. Never writes to accounts, the DB, or real party data.
export class ContractPreviewState {
 readonly owned = new Set<number>()
 contract(id: number): void { if (prototypeFlowers.some(f => f.id===id)) this.owned.add(id) }

 reset(): void { this.owned.clear() }
}
export const contractPreview = new ContractPreviewState()