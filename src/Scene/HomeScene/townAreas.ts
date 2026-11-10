export type TownAreaId = 'atelier' | 'plaza' | 'market' | 'avenue' | 'gate'
export interface VillageStop {
  x: number
  door: number
  key: string
  label: string
  width: number
  notice?: string
  scene?: string
  area?: TownAreaId
  prop?: 'workbench'
}
export interface TownArea {
  id: TownAreaId
  name: string
  description: string
  width: number
  spawn: number
  mapX: number
  mapY: number
  stops: VillageStop[]
}
export const townAreas: Record<TownAreaId, TownArea> = {
  atelier: {
    id: 'atelier', name: '家', description: '花を育て、旅の記録をひもとく、小さな拠点。',
    width: 1280, spawn: 650, mapX: 285, mapY: 225,
    stops: [
      { x: 355, door: 355, key: '', label: '育成', width: 230, scene: 'TrainingScene', prop: 'workbench' },
      { x: 790, door: 790, key: '', label: '図鑑', width: 180, scene: 'EncyclopediaScene' },
      { x: 1140, door: 1140, key: '', label: '外へ · 広場', width: 130, area: 'plaza' },
    ],
  },
  plaza: {
    id: 'plaza', name: '花時計の広場', description: '街の中心。クエスト掲示板はこちら。',
    width: 1800, spawn: 620, mapX: 610, mapY: 350,
    stops: [
      { x: 300, door: 300, key: 'home-house1', label: '家へ', width: 296, area: 'atelier' },
      { x: 550, door: 550, key: '', label: 'クエスト掲示板', width: 180, notice: 'クエストは未実装です。' },
      { x: 1180, door: 1180, key: '', label: '商店街へ', width: 150, area: 'market' },
      { x: 1640, door: 1640, key: '', label: '大通りへ', width: 150, area: 'avenue' },
    ],
  },
  market: {
    id: 'market', name: '木漏れ日の商店街', description: '道具や種をそろえて、冒険の支度を整えよう。',
    width: 2000, spawn: 350, mapX: 325, mapY: 495,
    stops: [
      { x: 135, door: 135, key: '', label: '広場へ', width: 140, area: 'plaza' },
      { x: 760, door: 896, key: 'home-tavern', label: 'ショップ', width: 400, scene: 'ShopScene' },
      { x: 1840, door: 1840, key: '', label: '大通りへ', width: 140, area: 'avenue' },
    ],
  },
  avenue: {
    id: 'avenue', name: '風の大通り', description: '仲間と合流し、城門へ向かう石畳の道。',
    width: 2200, spawn: 340, mapX: 945, mapY: 225,
    stops: [
      { x: 135, door: 135, key: '', label: '広場へ', width: 140, area: 'plaza' },
      { x: 760, door: 850, key: 'home-house2', label: '編成', width: 440, scene: 'FormScene' },
      { x: 1440, door: 1440, key: '', label: '商店街へ', width: 140, area: 'market' },
      { x: 2030, door: 2030, key: '', label: '城門へ', width: 140, area: 'gate' },
    ],
  },
  gate: {
    id: 'gate', name: '旅立ちの城門', description: '準備ができたら、門の向こうの冒険へ。',
    width: 1800, spawn: 450, mapX: 1000, mapY: 480,
    stops: [
      { x: 145, door: 145, key: '', label: '大通りへ', width: 140, area: 'avenue' },
      { x: 1240, door: 1240, key: '', label: '冒険へ', width: 150, scene: 'AreaSelectScene' },
    ],
  },
}
export function getTownArea(value: unknown): TownArea {
  return typeof value === 'string' && Object.hasOwn(townAreas, value) ? townAreas[value as TownAreaId] : townAreas.atelier
}
export const townRoads: [TownAreaId, TownAreaId][] = [
  ['atelier', 'plaza'], ['plaza', 'market'], ['plaza', 'avenue'], ['market', 'avenue'], ['avenue', 'gate'],
]
