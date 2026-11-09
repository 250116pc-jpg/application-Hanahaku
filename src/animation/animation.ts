// 担当：たまおちゃん｜アニメーション・animation
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
  frameRate: number,
  repeat: number = -1
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

    repeat
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
  action: 'run' | 'idle' | 'jump' | 'fall' | 'land'
): void {
  const animationKey = `player-${action}`;

  if (player.anims.currentAnim?.key !== animationKey) {
    player.play(animationKey)
  }
}