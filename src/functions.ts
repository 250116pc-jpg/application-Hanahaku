import Phaser from 'phaser'

// テキスト表示の関数
function text(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    text: string
) {
    return scene.add.text(x, y, text, {
        fontSize: `${size}px`,
        color: '#ffffff'
    }).setOrigin(0.5)
}

// ボタン表示の関数
function image(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    image: string
) {
    return scene.add.image(x, y, image).setScale(size).setInteractive()
}

export default {
    text,
    image
}