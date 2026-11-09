/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜所持品機能・InventoryData
export type ItemCategory = 'heal' | 'material' | 'important'
export type InventoryFilter = 'all' | ItemCategory

export interface InventoryItem {
  id: number
  name: string
  category: ItemCategory
  effect: string
  count: number
  usable: boolean
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 所持品画面を確認するための仮アイテム一覧を生成する。
 * ================================== */
export function createMockItems(): InventoryItem[] {
  return [
    { id: 1, name: '栄養剤', category: 'heal', effect: 'HPを50回復する。', count: 3, usable: true },
    { id: 2, name: '花のしずく', category: 'heal', effect: 'HPを100回復する。', count: 2, usable: true },
    {
      id: 3,
      name: '太陽の花びら',
      category: 'material',
      effect: 'キャラクターの強化に使用する素材。',
      count: 8,
      usable: false
    },
    {
      id: 4,
      name: '謎の種',
      category: 'important',
      effect: '物語に関係する重要なアイテム。',
      count: 1,
      usable: false
    }
  ]
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 内部カテゴリ値を画面表示用の日本語名へ変換する。
 * ================================== */
export function getCategoryName(category: ItemCategory): string {
  if (category === 'heal') return '回復'
  if (category === 'material') return '強化素材'
  return '重要'
}
