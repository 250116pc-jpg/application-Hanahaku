/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜ショップ機能・types
export type ShopItem = {
  id: number
  name: string
  price: number
  frame: number
  image?: string
  description?: string
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : ショップ説明とは別に、所持品画面で表示する効果説明を任意指定できるようにする。
   * ================================== */
  inventoryDescription?: string
  count?: number
}

export type ItemDetailView = {
  show: (item: ShopItem) => void
}
