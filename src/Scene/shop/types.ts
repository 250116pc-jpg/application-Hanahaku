export type ShopItem = {
  id: number
  name: string
  price: number
  frame: number
  image?: string
  description?: string
  count?: number
}

export type ItemDetailView = {
  show: (item: ShopItem) => void
}
