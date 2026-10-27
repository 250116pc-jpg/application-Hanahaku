export type Season = '春' | '夏' | '秋' | '冬'
export type CharacterRole = '攻撃' | '回復' | '防御' | '補助'
export type FlowerSkillType =
  | 'multiHit'
  | 'defensiveRecovery'
  | 'charge'
  | 'balanced'
  | 'continuous'
  | 'maple'
  | 'fortify'
  | 'slowAttack'
  | 'heal'
  | 'evasion'

export type FlowerSkill = {
  type: FlowerSkillType
  name: string
  description: string
  mpCost: number
}

export type CharacterData = {
  id: number
  code?: string
  name: string
  species: string
  rarity: number
  level: number
  maxLevel: number
  element: string
  role: string
  season: Season
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
  createCharacter(1, 'ジニア', 'ジニア', 3, 1, '熱', '攻撃', '夏', 820, 230, 156, 102, 98),
  createCharacter(2, 'スイレン', 'スイレン', 2, 1, '無', '防御', '夏', 900, 180, 75, 140, 70),
  createCharacter(3, '桜', 'サクラ', 2, 1, '熱', '攻撃', '春', 700, 310, 148, 90, 116),
  createCharacter(4, 'ひまわり', 'ヒマワリ', 3, 1, '熱', '補助', '夏', 650, 160, 142, 80, 105),
  createCharacter(5, 'サルスベリ', 'サルスベリ', 1, 1, '水', '攻撃', '夏', 540, 210, 90, 74, 120),
  createCharacter(6, 'ムクゲ', 'ムクゲ', 2, 1, '風', '補助', '夏', 560, 260, 80, 76, 112),
  createCharacter(7, 'コキア', 'コキア', 1, 1, '無', '防御', '秋', 500, 240, 72, 68, 130),
  createCharacter(8, 'ハス', 'ハス', 1, 1, '光', '補助', '夏', 520, 220, 78, 70, 118),
  createCharacter(9, 'ルリマツリ', 'ルリマツリ', 2, 1, '無', '回復', '夏', 590, 190, 82, 88, 91),
  createCharacter(10, 'アジサイ', 'アジサイ', 3, 1, '土', '補助', '夏', 880, 240, 128, 76, 108)
]

const formation: Array<number | null> = [1, 2, 3, 4]

export function getFlowerSkill(flowerId: number): FlowerSkill | undefined {
  const skills: Record<number, FlowerSkill> = {
    1: { type: 'multiHit', name: '軽い攻撃スキルを連打', description: '前方に連続攻撃する', mpCost: 20 },
    2: { type: 'defensiveRecovery', name: 'どっしり固いディフェンス', description: '防御力を上げ、定期的にHPを回復する', mpCost: 28 },
    3: { type: 'charge', name: '太陽の光線的な一発どかんタイプ', description: '3秒ためて強力な一撃を放つ', mpCost: 30 },
    4: { type: 'balanced', name: '扱いやすいバランス型', description: '攻防を強化し、追尾弾を放つ', mpCost: 34 },
    5: { type: 'continuous', name: '絶え間ない連続攻撃スキル', description: '攻撃速度を上げ、連続攻撃する', mpCost: 31 },
    6: { type: 'maple', name: '紅葉', description: '緑の強化形態と赤の三段攻撃を切り替える', mpCost: 33 },
    7: { type: 'fortify', name: 'トップクラスの耐久力', description: '最大HPと防御力を上げる', mpCost: 60 },
    8: { type: 'slowAttack', name: 'デバフ（被ダメアップや鈍足）とか', description: '敵全体を攻撃し、攻撃速度を下げる', mpCost: 36 },
    9: { type: 'heal', name: '回復。', description: 'HPを回復する', mpCost: 22 },
    10: { type: 'evasion', name: '隠密系', description: '攻撃後、一定時間回避率を上げる', mpCost: 35 }
  }
  return skills[flowerId]
}

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
  role: CharacterRole,
  season: Season,
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
    season,
    description: `${name}は${role}が得意な花です。編成に入れるとパーティの幅が広がります。`,
    stats: {
      hp,
      mp,
      atk,
      def,
      speed
    },
    skills: [getFlowerSkill(id)?.name ?? `${name}アタック`]
  }
}

export default {
  shopItems,
  characters,
  formation,
  stages
}
