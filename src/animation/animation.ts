import Phaser from 'phaser';

type AnimationData = {
  image: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
};


// 画像読み込み
export function loadCharacterAnimation(
  scene: Phaser.Scene,
  key: string,
  data: AnimationData
): void {

  scene.load.spritesheet(
    key,
    data.image,
    {
      frameWidth: data.frameWidth,
      frameHeight: data.frameHeight
    }
  );
}


// アニメーション作成
export function createCharacterAnimation(
  scene: Phaser.Scene,
  animationKey: string,
  textureKey: string,
  frameCount: number,
  frameRate: number
): void {

  // すでに存在する場合は作らない
  if (scene.anims.exists(animationKey)) {
    return;
  }

  scene.anims.create({
    key: animationKey,

    frames: scene.anims.generateFrameNumbers(
      textureKey,
      {
        start: 0,
        end: frameCount - 1
      }
    ),

    frameRate: frameRate,

    repeat: -1
  });
}


// キャラクター作成
export function createCharacterSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string,
  animationKey: string
): Phaser.GameObjects.Sprite {

  const sprite = scene.add.sprite(
    x,
    y,
    textureKey
  );

  sprite.play(animationKey);

  return sprite;
}


// アニメーション変更
export function changeCharacterAnimation(
  player: Phaser.GameObjects.Sprite,
  action: 'run' | 'idle'
): void {

  if (action === 'run') {

    player.play('player-run');

  } else {

    player.play('player-idle');
  }
}