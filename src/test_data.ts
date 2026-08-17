const shopItems = [
    {
        id: 1,
        name: '赤い花',
        price: 100,
        frame: 9,
        image: 'red_flower.png'
    },
    {
        id: 2,
        name: '青い花',
        price: 200,
        image: 'blue_flower.png',
        frame: 9
    },
    {
        id: 3,
        name: '黄色い花',
        price: 300,
        image: "yellow_flower.png",
        frame: 9
    },
    {
        id: 4,
        name: '黄色い花',
        price: 300,
        image: "yellow_flower.png",
        frame: 9
    }
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