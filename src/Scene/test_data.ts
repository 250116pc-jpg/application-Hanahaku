import formationData from '../../php/flower/formation.json'
import skillData from '../../php/skill/skills.json'

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

const characters = formationData.characters as CharacterData[]
const formation: Array<number | null> = [...formationData.formation]

export function getFlowerSkill(flowerId: number): FlowerSkill | undefined {
  const skill = skillData.skills.find(skill => skill.id === flowerId)
  return skill ? {type: skill.type as FlowerSkillType, name: skill.name, description: skill.description, mpCost: skill.mpCost} : undefined
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
    name: '1-1',
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
    name: '1-2',
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
export default {
  shopItems,
  characters,
  formation,
  stages
}
