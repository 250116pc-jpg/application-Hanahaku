export type CharacterData = {
  id: number
  name: string
  species: string
  rarity: number
  level: number
  maxLevel: number
  element: string
  role: string
  description: string
  stats: {
    hp: number
    mp: number
    atk: number
    def: number
    speed: number
  }
  skills: string[]
}

const shopItems = [
  {
    id: 1,
    name: '栄養剤 Lv.1',
    price: 100,
    frame: 9,
    image: 'red_flower.png',
    description: '花の育成に使う基本素材です。'
  },
  {
    id: 2,
    name: '栄養剤 Lv.2',
    price: 200,
    image: 'blue_flower.png',
    frame: 9,
    description: '花の育成に使う少し良い素材です。'
  },
  {
    id: 3,
    name: '栄養剤 Lv.3',
    price: 400,
    image: 'yellow_flower.png',
    frame: 9,
    description: '花の育成に使う良い素材です。'
  },
  {
    id: 4,
    name: '栄養剤 Lv.4',
    price: 800,
    image: 'yellow_flower.png',
    frame: 9,
    description: '花の育成に使う上級素材です。'
  },
  {
    id: 5,
    name: '栄養剤 Lv.5',
    price: 1600,
    frame: 9,
    image: 'red_flower.png',
    description: '花の育成に使う高級素材です。'
  },
  {
    id: 6,
    name: '火の種',
    price: 300,
    image: 'blue_flower.png',
    frame: 9,
    description: 'スキルの強化に必要な素材です。'
  },
  {
    id: 7,
    name: '水の種',
    price: 300,
    image: 'yellow_flower.png',
    frame: 9,
    description: 'スキルの強化に必要な素材です。'
  },
  {
    id: 8,
    name: '風の種',
    price: 300,
    image: 'yellow_flower.png',
    frame: 9,
    description: 'スキルの強化に必要な素材です。'
  },
  {
    id: 9,
    name: '光の種',
    price: 300,
    image: 'yellow_flower.png',
    frame: 9,
    description: 'スキルの強化に必要な素材です。'
  },
  {
    id: 10,
    name: '土の種',
    price: 300,
    image: 'yellow_flower.png',
    frame: 9,
    description: 'スキルの強化に必要な素材です。'
  },
  {
    id: 11,
    name: '結晶',
    price: 2000,
    image: 'yellow_flower.png',
    frame: 9,
    description: 'レア度の強化に必要な素材です。'
  },
  {
    id: 12,
    name: '治療薬',
    price: 1000,
    image: 'yellow_flower.png',
    frame: 9,
    description: '戦闘中の回復に使うアイテムです。'
  }
]

const characters: CharacterData[] = [
  {
    id: 1,
    name: 'ひまわり',
    species: 'サンフラワー',
    rarity: 3,
    level: 20,
    maxLevel: 40,
    element: '火',
    role: '攻撃',
    description: '攻撃力が高い前衛向けの花です。',
    stats: {
      hp: 820,
      mp: 230,
      atk: 156,
      def: 102,
      speed: 98
    },
    skills: ['サンライトブレード', 'フレイムブルーム']
  },
  {
    id: 2,
    name: 'バラ',
    species: 'ローズ',
    rarity: 2,
    level: 18,
    maxLevel: 30,
    element: '火',
    role: '攻撃',
    description: '単体攻撃が得意な花です。',
    stats: {
      hp: 650,
      mp: 180,
      atk: 142,
      def: 80,
      speed: 105
    },
    skills: ['ローズスラッシュ', 'トゲの守り']
  },
  {
    id: 3,
    name: 'ユリ',
    species: 'リリー',
    rarity: 2,
    level: 15,
    maxLevel: 30,
    element: '水',
    role: '回復',
    description: '味方の回復ができるサポート役です。',
    stats: {
      hp: 590,
      mp: 310,
      atk: 82,
      def: 88,
      speed: 91
    },
    skills: ['ヒールウォーター', 'リリーバリア']
  },
  {
    id: 4,
    name: 'アジサイ',
    species: 'ハイドランジア',
    rarity: 2,
    level: 12,
    maxLevel: 30,
    element: '水',
    role: '防御',
    description: '防御力が高く、編成の安定感を上げます。',
    stats: {
      hp: 900,
      mp: 160,
      atk: 75,
      def: 140,
      speed: 70
    },
    skills: ['レインガード', 'ウォールブルーム']
  },
  {
    id: 5,
    name: 'チューリップ',
    species: 'チューリップ',
    rarity: 1,
    level: 10,
    maxLevel: 20,
    element: '風',
    role: '補助',
    description: '味方の行動を助ける補助役です。',
    stats: {
      hp: 540,
      mp: 210,
      atk: 90,
      def: 74,
      speed: 120
    },
    skills: ['ブリーズステップ', '応援の花粉']
  }
]

const formation: Array<number | null> = [1, 3, null, null]

const stages = [
  {
    id: 1,
    name: '1章',
    map: 'nil',
    enemies: [
      {
        id: 1,
        num: 3,
        level: 1
      },
      {
        id: 2,
        num: 2,
        level: 2
      }
    ],
    boss: {
      id: 1,
      num: 1,
      level: 1
    }
  }
]

export default {
  shopItems,
  characters,
  formation,
  stages
}
