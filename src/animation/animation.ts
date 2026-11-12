/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import Phaser from 'phaser';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
type AnimationData = {
  image: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
};


// 画像読み込み
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 表示に使う画像・アニメーションを用意する
 * ================================== */
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
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 表示に使う画像・アニメーションを用意する
 * ================================== */
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
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 指定した位置・画像・アニメーションでキャラクターを作る
 * ================================== */
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
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 表示に使う画像・アニメーションを用意する
 * ================================== */
export function changeCharacterAnimation(
  player: Phaser.GameObjects.Sprite,
  action: 'run' | 'idle' | 'jump' | 'fall' | 'land'
): void {
  const animationKey = `player-${action}`;

  if (player.anims.currentAnim?.key !== animationKey) {
    player.play(animationKey)
  }
}