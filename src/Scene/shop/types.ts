/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
export type ShopItem = {
  id: number
  name: string
  price: number
  frame: number
  image?: string
  description?: string
  inventoryDescription?: string
  count?: number
}

export type ItemDetailView = {
  show: (item: ShopItem) => void
}
