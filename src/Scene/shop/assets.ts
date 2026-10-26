import backgroundImage from '../../assets/images/background/2.png';
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
};

export function preloadShopAssets(scene: Phaser.Scene): void {
  scene.load.image(SHOP_BACKGROUND_KEY, backgroundImage);
  scene.load.image('shopkeeper', shopkeeperImage);
  for (const [key, image] of Object.entries(itemImages)) {
    scene.load.image(key, image);
  }
}

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
  ];

  return imageKeys[itemId - 1] ?? 'shop-flower';
}
