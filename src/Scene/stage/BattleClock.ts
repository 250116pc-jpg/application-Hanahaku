// 担当：たまおちゃん｜戦闘時間の管理
import Phaser from 'phaser';

const clocks = new WeakMap<Phaser.Scene, { elapsed: number }>();
/** Elapsed battle time; unlike Clock.now this excludes time spent in paused scenes. */
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
