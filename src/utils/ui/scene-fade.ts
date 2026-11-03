import Phaser from 'phaser';

// CanvasとHTMLフォームを同時に覆う。カメラのフェードだけではDOMは暗転しない。
export function createSceneFade(scene: Phaser.Scene): (destination: string) => void {
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgb(15,24,36);opacity:1;pointer-events:auto;';
  document.body.append(overlay);
  const state = { alpha: 1 };
  let leaving = false;
  let active = true;
  const update = (): void => { overlay.style.opacity = String(state.alpha); };
  scene.tweens.add({
    targets: state, alpha: 0, duration: 280, ease: 'Sine.easeOut', onUpdate: update,
    onComplete: () => { if (!leaving) overlay.style.pointerEvents = 'none'; },
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    active = false;
    overlay.remove();
  });
  return destination => {
    if (!active || leaving || !scene.scene.isActive()) return;
    leaving = true;
    scene.input.enabled = false;
    overlay.style.pointerEvents = 'auto';
    scene.tweens.killTweensOf(state);
    scene.tweens.add({
      targets: state, alpha: 1, duration: 240, ease: 'Sine.easeIn', onUpdate: update,
      onComplete: () => { if (active) scene.scene.start(destination); },
    });
  };
}
