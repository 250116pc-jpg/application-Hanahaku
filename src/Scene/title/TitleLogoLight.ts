// 担当：たまおちゃん｜タイトル演出・TitleLogoLight
import Phaser from 'phaser';

// ロゴの透明部分を利用した光。画像ファイルを書き換えず、文字の輪郭に沿ってにじませる。
export function createTitleLogoLight(
  scene: Phaser.Scene, x: number, y: number, displayWidth: number,
): void {
  const key = 'title-logo-backlight';
  const source = scene.textures.get('title-logo').getSourceImage() as HTMLImageElement;
  const logoHeight = displayWidth * source.height / source.width;
  const padding = 60;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, Math.ceil(displayWidth + padding * 2), Math.ceil(logoHeight + padding * 2));
    if (!texture) return;
    const context = texture.context;
    context.filter = 'blur(12px)';
    context.drawImage(source, padding, padding, displayWidth, logoHeight);
    context.filter = 'none';
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = '#ffe4a1';
    context.fillRect(0, 0, texture.width, texture.height);
    context.globalCompositeOperation = 'source-over';
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  // 大きな柔らかい光と、輪郭近くの光を分けて奥行きを出す。
  const halo = scene.add.image(x, y + 8, key)
    .setScale(1.09).setAlpha(.18).setBlendMode(Phaser.BlendModes.ADD);
  const rim = scene.add.image(x, y, key)
    .setAlpha(.42).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: halo, alpha: .36, scaleX: 1.13, scaleY: 1.13,
    duration: 3400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
  scene.tweens.add({
    targets: rim, alpha: .68,
    duration: 2700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
}
