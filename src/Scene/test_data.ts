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
  createCharacter(1, 'ひまわり', 'サンフラワー', 3, 20, '火', '攻撃', 820, 230, 156, 102, 98),
  createCharacter(2, 'バラ', 'ローズ', 2, 18, '火', '攻撃', 650, 180, 142, 80, 105),
  createCharacter(3, 'ユリ', 'リリー', 2, 15, '水', '回復', 590, 310, 82, 88, 91),
  createCharacter(4, 'アジサイ', 'ハイドランジア', 2, 12, '水', '防御', 900, 160, 75, 140, 70),
  createCharacter(5, 'チューリップ', 'チューリップ', 1, 10, '風', '補助', 540, 210, 90, 74, 120),
  createCharacter(6, 'マーガレット', 'デイジー', 2, 8, '光', '回復', 560, 260, 80, 76, 112),
  createCharacter(7, 'ラベンダー', 'ラベンダー', 1, 6, '風', '補助', 500, 240, 72, 68, 130),
  createCharacter(8, 'ベルフラワー', 'ベルフラワー', 1, 5, '水', '補助', 520, 220, 78, 70, 118),
  createCharacter(9, 'コスモス', 'コスモス', 2, 14, '光', '攻撃', 610, 190, 128, 76, 108),
  createCharacter(10, 'サクラ', 'チェリーブロッサム', 3, 19, '光', '攻撃', 700, 240, 148, 90, 116),
  createCharacter(11, 'ダリア', 'ダリア', 2, 16, '火', '防御', 860, 150, 96, 136, 78),
  createCharacter(12, 'スミレ', 'バイオレット', 1, 9, '闇', '補助', 510, 260, 86, 72, 125),
  createCharacter(13, 'ツバキ', 'カメリア', 2, 13, '土', '防御', 880, 170, 92, 132, 74),
  createCharacter(14, 'ポピー', 'ポピー', 1, 7, '火', '攻撃', 530, 160, 118, 64, 121),
  createCharacter(15, 'アイリス', 'アイリス', 3, 21, '水', '攻撃', 760, 250, 150, 94, 110),
  createCharacter(16, 'ミモザ', 'ミモザ', 2, 11, '風', '回復', 580, 290, 84, 82, 115)
]

const formation: Array<number | null> = [1, 3, 10, null]
const stages = [
  {
    id: 1,
    name: '1-1',
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
  },

  {
    id: 2,
    name: '1-2',
    map: 'nil',
    enemies: [
      {
        id: 1,
        num: 4,
        level: 2
      }
    ],
    boss: {
      id: 2,
      num: 1,
      level: 2
    }
  },

  {
    id: 3,
    name: '1-3',
    map: 'nil',
    enemies: [
      {
        id: 2,
        num: 3,
        level: 3
      }
    ],
    boss: {
      id: 3,
      num: 1,
      level: 3
    }
  },
  {
    id: 4,
    name: '1-4',
    map: 'nil',
    enemies: [
      {
        id: 2,
        num: 3,
        level: 3
      }
    ],
    boss: {
      id: 3,
      num: 1,
      level: 3
    }
  },
  {
    id: 5,
    name: '1-5',
    map: 'nil',
    enemies: [
      {
        id: 2,
        num: 3,
        level: 3
      }
    ],
    boss: {
      id: 3,
      num: 1,
      level: 3
    }
  }
]
function createCharacter(
  id: number,
  name: string,
  species: string,
  rarity: number,
  level: number,
  element: string,
  role: string,
  hp: number,
  mp: number,
  atk: number,
  def: number,
  speed: number
): CharacterData {
  return {
    id,
    name,
    species,
    rarity,
    level,
    maxLevel: rarity >= 3 ? 40 : rarity >= 2 ? 30 : 20,
    element,
    role,
    description: `${name}は${role}が得意な花です。編成に入れるとパーティの幅が広がります。`,
    stats: {
      hp,
      mp,
      atk,
      def,
      speed
    },
    skills: [`${name}アタック`, `${element}の花びら`]
  }
}

export default {
  shopItems,
  characters,
  formation,
  stages
}
