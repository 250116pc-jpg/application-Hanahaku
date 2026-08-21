export interface ShopItem {
  id: number;
  name: string;
  price: number;
  description: string;
  color: number;
}

// 中村支店の仮ショップデータを、斎藤支店の画面で表示できる形に整えたもの。
export const shopItems: readonly ShopItem[] = [
  {
    id: 1,
    name: '赤い花',
    price: 100,
    description: '情熱を宿した赤い花。\n育成素材として使えます。',
    color: 0xe97878,
  },
  {
    id: 2,
    name: '青い花',
    price: 200,
    description: '涼やかな香りの青い花。\n育成素材として使えます。',
    color: 0x78a9e9,
  },
  {
    id: 3,
    name: '黄色い花',
    price: 300,
    description: '太陽の光を集めた黄色い花。\n育成素材として使えます。',
    color: 0xf3d35a,
  },
  {
    id: 4,
    name: '白い花',
    price: 400,
    description: 'やさしい光を放つ白い花。\n特別な育成素材です。',
    color: 0xf4f4ef,
  },
];
