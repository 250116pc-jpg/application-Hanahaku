import Phaser from 'phaser';
import petal1 from '../../assets/ui/title_f1.png';
import petal2 from '../../assets/ui/title_f2.png';
import petal3 from '../../assets/ui/title_f3.png';
import petal4 from '../../assets/ui/title_f4.png';

const PETAL_IMAGES = [petal1, petal2, petal3, petal4];
// 花びらの枚数。大きさや落下速度はreset内で調整する。
const PETAL_COUNT = 28;

export function preloadTitlePetals(scene: Phaser.Scene): void {
  PETAL_IMAGES.forEach((url, index) => {
    const key = `title-petal-${index}`;
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  });
}

export function createTitlePetals(scene: Phaser.Scene): void {
  // 花びらの低速移動を整数座標に丸めず、小数単位で描画する。
  scene.cameras.main.roundPixels = false;
  const width = scene.scale.width;
  const height = scene.scale.height;
  const petals = Array.from({ length: PETAL_COUNT }, () => ({
    image: scene.add.image(0, 0, 'title-petal-0'),
    x: 0, y: 0, phase: 0, speed: 0, drift: 0, sway: 0,
    spin: 0, scale: 0, opacity: 0,
  }));
  type Petal = typeof petals[number];
  const reset = (petal: Petal, initial = false): void => {
    petal.image.setTexture(`title-petal-${Phaser.Math.Between(0, 3)}`);
    petal.image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    petal.x = Phaser.Math.FloatBetween(-80, width + 60);
    petal.y = initial ? Phaser.Math.FloatBetween(-60, height) : -65;
    petal.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const size = Phaser.Math.FloatBetween(20, 48);
    petal.scale = size / Math.max(petal.image.width, petal.image.height);
    petal.speed = Phaser.Math.FloatBetween(22, 46);
    petal.drift = Phaser.Math.FloatBetween(8, 24);
    petal.sway = Phaser.Math.FloatBetween(15, 40);
    petal.spin = Phaser.Math.FloatBetween(-.65, .65);
    petal.opacity = Phaser.Math.FloatBetween(.8, 1);
    petal.image.setRotation(Phaser.Math.FloatBetween(-Math.PI, Math.PI));
  };
  petals.forEach(petal => reset(petal, true));
  let elapsed = 0;
  const update = (_time: number, delta: number): void => {
    // タブ復帰時の大きなdeltaで、一気に画面外へ飛ばないようにする。
    const seconds = Math.min(delta, 50) / 1000;
    elapsed += seconds;
    for (const petal of petals) {
      petal.x += petal.drift * seconds;
      petal.y += petal.speed * seconds;
      if (petal.y > height + 65 || petal.x > width + 100) reset(petal);
      const wave = elapsed * 1.1 + petal.phase;
      petal.image.setPosition(petal.x + Math.sin(wave) * petal.sway, petal.y);
      // 正弦波で横幅を変え、折り返しでも速度が滑らかにつながるようにする。
      petal.image.setScale(petal.scale * (.7 + .3 * Math.cos(wave * .7)), petal.scale);
      petal.image.rotation += petal.spin * seconds;
      const edgeFade = Math.min(1, (height + 45 - petal.y) / 90);
      petal.image.setAlpha(petal.opacity * Math.max(0, edgeFade));
    }
  };
  update(0, 0);
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    petals.forEach(petal => petal.image.destroy());
  });
}



