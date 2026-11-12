/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import Phaser from 'phaser';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 戦闘時間を定義する
 * ================================== */
const clocks = new WeakMap<Phaser.Scene, { elapsed: number }>();
/** Elapsed battle time; unlike Clock.now this excludes time spent in paused scenes. */
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 戦闘中の演出・再使用時間に使う現在時刻を返す
 * ================================== */
export function battleNow(scene: Phaser.Scene): number {
  let state = clocks.get(scene);
  if (!state) {
    state = { elapsed: 0 };
    clocks.set(scene, state);
    const current = state;
    const tick = (_time: number, delta: number): void => {
      if (!scene.time.paused) current.elapsed += delta * scene.time.timeScale;
    };
    scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, tick);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, tick);
      clocks.delete(scene);
    });
  }
  return state.elapsed;
}
