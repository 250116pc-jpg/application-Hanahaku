const shopItems = [
    {
        id: 1,
        name: '栄養剤Lv.1',
        price: 100,
        frame: 9,
        image: 'red_flower.png',
        description: "植物の成長を促進するための基本的な栄養剤です。植物に必要な栄養素をバランスよく含んでおり、健康的な成長をサポートします。"
    },
    {
        id: 2,
        name: '栄養剤Lv.2',
        price: 200,
        image: 'blue_flower.png',
        frame: 9,
        description: "植物の成長を促進するための基本的な栄養剤です。植物に必要な栄養素をバランスよく含んでおり、健康的な成長をサポートします。"
    },
    {
        id: 3,
        name: '栄養剤Lv.3',
        price: 400,
        image: "yellow_flower.png",
        frame: 9,
        description: "植物の成長を促進するための基本的な栄養剤です。植物に必要な栄養素をバランスよく含んでおり、健康的な成長をサポートします。"
    },
    {
        id: 4,
        name: '栄養剤Lv.4',
        price: 800,
        image: "yellow_flower.png",
        frame: 9,
        description: "植物の成長を促進するための基本的な栄養剤です。植物に必要な栄養素をバランスよく含んでおり、健康的な成長をサポートします。"
    },
    {
        id: 5,
        name: '栄養剤Lv.5',
        price: 1600,
        frame: 9,
        image: 'red_flower.png',
        description: "植物の成長を促進するための基本的な栄養剤です。植物に必要な栄養素をバランスよく含んでおり、健康的な成長をサポートします。"
    },
    {
        id: 6,
        name: '熱の種',
        price: 300,
        image: 'blue_flower.png',
        frame: 9,
        description: "スキルの強化に必要な素材。"
    },
    {
        id: 7,
        name: '水の種',
        price: 300,
        image: "yellow_flower.png",
        frame: 9
    },
    {
        id: 8,
        name: '風の種',
        price: 300,
        image: "yellow_flower.png",
        frame: 9,
        description: "スキルの強化に必要な素材。"
    },
    {
        id: 9,
        name: '光の種',
        price: 300,
        image: "yellow_flower.png",
        frame: 9,
        description: "スキルの強化に必要な素材。"
    },
    {
        id: 10,
        name: '土の種',
        price: 300,
        image: "yellow_flower.png",
        frame: 9,
        description: "スキルの強化に必要な素材。"
    },
    {
        id: 11,
        name: '愛',
        price: 2000,
        image: "yellow_flower.png",
        frame: 9,
        description: "レア度の強化に必要な素材。"
    },
    {
        id: 12,
        name: '治療薬',
        price: 1000,
        image: "yellow_flower.png",
        frame: 9
    },
];
const stages = [
    {
        id: 1,
        name: "1－1",
        map: "nil",
        enemies : [
            {
                id : 1,
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
            level: 1,
        }
    },
    
]
export default {
    shopItems,
    stages,
}