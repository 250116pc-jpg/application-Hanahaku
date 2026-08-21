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
  container: Phaser.GameObjects.Container
  show: (item: ShopItem) => void
}
