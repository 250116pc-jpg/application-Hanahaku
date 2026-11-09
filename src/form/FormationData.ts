import type { CharacterData } from '../Scene/test_data'

export type OwnedFormationFlower = CharacterData & { acquiredAt: string; skillLevel: number }
export type FormationSort = '戦力' | '入手' | 'レベル'
export type OwnedProgress = { flowerId: number; level: number; acquiredAt: string; skillLevel: number }

export function parseOwnedProgress(value: unknown): OwnedProgress[] {
  if (!Array.isArray(value)) throw new Error('所持花のデータが正しくありません。')
  const used = new Set<number>()
  return value.map(row => {
    if (!row || !Number.isSafeInteger(row.flowerId) || row.flowerId < 1 || used.has(row.flowerId) ||
        !Number.isSafeInteger(row.level) || row.level < 1 || !Number.isSafeInteger(row.skillLevel) || row.skillLevel < 1 ||
        typeof row.acquiredAt !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.acquiredAt)) {
      throw new Error('所持花のレベル・入手日時を読み込めません。')
    }
    used.add(row.flowerId)
    return { flowerId: row.flowerId, level: row.level, skillLevel: row.skillLevel, acquiredAt: row.acquiredAt }
  })
}

export function visibleFormationFlowers(
  flowers: readonly OwnedFormationFlower[], formation: readonly (number | null)[],
  element: string, partyOnly: boolean, sort: FormationSort, descending: boolean,
  power: (flower: CharacterData) => number
): OwnedFormationFlower[] {
  return flowers.filter(f => (element === 'すべて' || f.element === element) && (!partyOnly || formation.includes(f.id)))
    .sort((a, b) => {
      const diff = sort === '戦力' ? power(a) - power(b) : sort === 'レベル' ? a.level - b.level : a.acquiredAt.localeCompare(b.acquiredAt)
      return (descending ? -diff : diff) || a.id - b.id
    })
}
