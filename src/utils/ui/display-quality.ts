/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
import Phaser from 'phaser';

// 滑らかに描く文字の解像度とフィルターを共通化する。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 文字の表示を滑らかにする
 * ================================== */
export function smoothText(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  text.setResolution(Math.max(2, window.devicePixelRatio || 1));
  text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return text;
}

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 描画品質共通を定義する
 * ================================== */
const activeScenes = new WeakSet<Phaser.Scene>();
const canvasSettings = new WeakMap<HTMLCanvasElement, { previous: string; scenes: Set<Phaser.Scene> }>();

// create()から呼び出す。画像キーは各画面が指定し、プレイヤー等は対象に含めない。
// 重なって起動した画面にも対応し、最後の対象画面を閉じたらCanvasの設定を戻す。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 画像と文字の表示品質を調整する
 * ================================== */
export function applySmoothDisplay(
  scene: Phaser.Scene,
  imageKeys: readonly string[],
  objects: readonly Phaser.GameObjects.GameObject[] = []
): void {
  imageKeys.forEach(key => scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR));
  const smoothObject = (object: Phaser.GameObjects.GameObject): void => {
    if (object instanceof Phaser.GameObjects.Text) smoothText(object);
    else if (object instanceof Phaser.GameObjects.Container) object.list.forEach(smoothObject);
  };
  objects.forEach(smoothObject);
  if (activeScenes.has(scene)) return;
  const canvas = scene.game.canvas;
  let settings = canvasSettings.get(canvas);
  if (!settings) {
    settings = { previous: canvas.style.imageRendering, scenes: new Set() };
    canvasSettings.set(canvas, settings);
  }
  settings.scenes.add(scene);
  activeScenes.add(scene);
  canvas.style.imageRendering = 'auto';
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    activeScenes.delete(scene);
    settings.scenes.delete(scene);
    if (settings.scenes.size === 0) {
      canvas.style.imageRendering = settings.previous;
      canvasSettings.delete(canvas);
    }
  });
}
