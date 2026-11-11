/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
import recoveryImage from '../../assets/images/items/asset_110.png';
import powerImage from '../../assets/images/items/asset_090.png';
import guardImage from '../../assets/images/items/asset_105.png';
import backgroundImage from '../../assets/images/encyclopedia/encyclopedia-background.png';
import shopkeeperImage from '../../assets/characters/1003/1003_3.png';
import redPotionImage from '../../assets/images/items/asset_075.png';
import bluePotionImage from '../../assets/images/items/asset_076.png';
import greenPotionImage from '../../assets/images/items/asset_078.png';
import blueCrystalImage from '../../assets/images/items/asset_080.png';
import leafImage from '../../assets/images/items/asset_079.png';
import sproutImage from '../../assets/images/items/asset_077.png';
import flowerImage from '../../assets/images/items/asset_087.png';
import seedImage from '../../assets/images/items/asset_088.png';
import featherImage from '../../assets/images/items/asset_089.png';
import crystalImage from '../../assets/images/items/asset_091.png';

import frameImage from '../../assets/images/encyclopedia/journal-frame.png';
import buttonImage from '../../assets/images/encyclopedia/journal-button.png';

/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : ショップ画像の読込・参照を定義する
 * ================================== */
export const SHOP_BACKGROUND_KEY = 'shop-background';

const itemImages: Record<string, string> = {
  'shop-potion-red': redPotionImage,
  'shop-potion-blue': bluePotionImage,
  'shop-potion-green': greenPotionImage,
  'shop-crystal-blue': blueCrystalImage,
  'shop-leaf': leafImage,
  'shop-sprout': sproutImage,
  'shop-flower': flowerImage,
  'shop-seed': seedImage,
  'shop-feather': featherImage,
  'shop-crystal': crystalImage,
  'shop-recovery': recoveryImage,
  'shop-power': powerImage,
  'shop-guard': guardImage,
};

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : ショップの画像を読み込む
 * ================================== */
export function preloadShopAssets(scene: Phaser.Scene): void {
  scene.load.image(SHOP_BACKGROUND_KEY, backgroundImage);
  scene.load.image('shop-frame', frameImage);
  scene.load.image('shop-button', buttonImage);
  scene.load.image('shopkeeper', shopkeeperImage);
  for (const [key, image] of Object.entries(itemImages)) {
    scene.load.image(key, image);
  }
}

/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : アイテムに対応する画像キーを返す
 * ================================== */
export function getShopItemImageKey(itemId: number): string {
  const imageKeys = [
    'shop-potion-red',
    'shop-potion-blue',
    'shop-potion-green',
    'shop-crystal-blue',
    'shop-leaf',
    'shop-flower',
    'shop-seed',
    'shop-sprout',
    'shop-feather',
    'shop-crystal',
    'shop-crystal',
    'shop-potion-red',
    'shop-recovery',
    'shop-power',
    'shop-guard',
  ];

  return imageKeys[itemId - 1] ?? 'shop-flower';
}

// HTML images must use the original asset URL; Phaser revokes its loader blob URLs.
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : アイテムに対応する画像URLを返す
 * ================================== */
export function getShopItemImageUrl(itemId: number): string {
  return itemImages[getShopItemImageKey(itemId)] ?? flowerImage;
}
