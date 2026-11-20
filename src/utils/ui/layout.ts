import Phaser from 'phaser';
import { getUiLayoutSettings, getButtonLayout, onUiLayoutChanged } from '../../display/UiLayoutSettings';

type UiObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform &
  Phaser.GameObjects.Components.Depth;
type Binding = { object: UiObject; kind: 'gui' | 'button' | 'fixed'; id?: string; anchor?: { x: number; y: number }; wrapper?: Phaser.GameObjects.Container };
const managers = new WeakMap<Phaser.Scene, SceneUiLayout>();
const wrappers = new WeakSet<Phaser.GameObjects.Container>();

function isUiObject(object: Phaser.GameObjects.GameObject): object is UiObject {
  return 'getLocalTransformMatrix' in object && 'setDepth' in object;
}

/** UI用の親だけを除いた本来の座標変換。マップ・キャラクターは登録しない。 */
function baseParentMatrix(object: UiObject): Phaser.GameObjects.Components.TransformMatrix {
  const parents: Phaser.GameObjects.Container[] = [];
  for (let parent = object.parentContainer; parent; parent = parent.parentContainer) parents.unshift(parent);
  const matrix = new Phaser.GameObjects.Components.TransformMatrix();
  for (const parent of parents) {
    if (!wrappers.has(parent)) matrix.multiply(parent.getLocalTransformMatrix());
  }
  return matrix;
}

class SceneUiLayout {
  private scene: Phaser.Scene;
  private bindings = new Map<UiObject, Binding>();
  private retired = new Set<Phaser.GameObjects.Container>();
  private applying = false;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.refresh, this);
    const unsubscribe = onUiLayoutChanged(() => this.refresh());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.refresh, this);
      unsubscribe(); managers.delete(scene);
    });
  }

  register(object: UiObject, kind: Binding['kind'], id?: string, anchor?: Binding['anchor']): void {
    const binding = this.bindings.get(object);
    if (binding) { if (kind !== 'gui') Object.assign(binding, { kind, id, anchor }); return; }
    this.bindings.set(object, { object, kind, id, anchor });
    object.once(Phaser.GameObjects.Events.DESTROY, () => {
      const wrapper = this.bindings.get(object)?.wrapper;
      this.bindings.delete(object);
      // 子のdestroy中には親を再帰的にdestroyしない。
      if (wrapper) this.retired.add(wrapper);
    });
  }

  buttonIds(): string[] {
    return [...new Set([...this.bindings.values()].filter(binding => binding.kind === 'button').map(binding => binding.id!))].sort();
  }

  refresh(): void {
    if (this.applying) return;
    this.applying = true;
    try {
      for (const wrapper of this.retired) if (wrapper.scene) wrapper.destroy();
      this.retired.clear();
      // 呼び出し元がContainerに追加し終わってから包む。返したオブジェクトの座標・Tweenは維持する。
      for (const binding of this.bindings.values()) {
        const { object } = binding;
        if (!object.scene || binding.wrapper) continue;
        if (binding.kind === 'gui') {
          let covered = false;
          for (let parent = object.parentContainer; parent; parent = parent.parentContainer) {
            if (this.bindings.has(parent)) { covered = true; break; }
          }
          if (covered) continue;
        }
        const parent = object.parentContainer;
        const wrapper = new Phaser.GameObjects.Container(this.scene, 0, 0);
        wrapper.setName(`ui-layout:${binding.id ?? 'gui'}`);
        wrappers.add(wrapper);
        this.scene.add.existing(wrapper);
        if (parent) { const index = parent.getIndex(object); parent.addAt(wrapper, index); }
        wrapper.add(object);
        binding.wrapper = wrapper;
      }
      const depth = (object: UiObject): number => {
        let count = 0;
        for (let parent = object.parentContainer; parent; parent = parent.parentContainer) count++;
        return count;
      };
      const gui = getUiLayoutSettings().gui;
      const sx = this.scene.scale.width / 1280, sy = this.scene.scale.height / 720;
      for (const binding of [...this.bindings.values()].sort((a, b) => depth(a.object) - depth(b.object))) {
        const { object, wrapper } = binding;
        if (!object.scene || !wrapper?.scene) continue;
        wrapper.setDepth(object.depth);
        // 非表示の親を通してボタンが表示されることはない。入力もPhaserの親変換に追従する。
        const parent = wrapper.parentContainer;
        const actualParent = parent?.getWorldTransformMatrix() ?? new Phaser.GameObjects.Components.TransformMatrix();
        const baseParent = baseParentMatrix(wrapper);
        const target = new Phaser.GameObjects.Components.TransformMatrix();
        if (binding.kind === 'gui') {
          const cx = this.scene.scale.width / 2, cy = this.scene.scale.height / 2;
          target.applyITRS(cx * (1 - gui.scale) + gui.offsetX * sx, cy * (1 - gui.scale) + gui.offsetY * sy, 0, gui.scale, gui.scale);
        } else if (binding.kind === 'button') {
          const settings = getButtonLayout(binding.id!);
          const anchor = binding.anchor ?? { x: object.x, y: object.y };
          const center = baseParent.transformPoint(anchor.x, anchor.y);
          target.applyITRS(center.x * (1 - settings.scale) + settings.offsetX * sx, center.y * (1 - settings.scale) + settings.offsetY * sy, 0, settings.scale, settings.scale);
        }
        target.multiply(baseParent);
        actualParent.invert().multiply(target);
        const transform = actualParent.decomposeMatrix();
        wrapper.setPosition(transform.translateX, transform.translateY).setRotation(transform.rotation).setScale(transform.scaleX, transform.scaleY);
      }
    } finally { this.applying = false; }
  }
}

function manager(scene: Phaser.Scene): SceneUiLayout {
  let value = managers.get(scene);
  if (!value) { value = new SceneUiLayout(scene); managers.set(scene, value); }
  return value;
}

export function registerGui<T extends Phaser.GameObjects.GameObject>(scene: Phaser.Scene, object: T): T {
  if (isUiObject(object)) manager(scene).register(object, 'gui');
  return object;
}

/** 画像・文字・当たり判定を同じIDと基準点でまとめる。IDはシーンを含む固定名を推奨。 */
export function registerButton(scene: Phaser.Scene, id: string, objects: Phaser.GameObjects.GameObject[], anchor?: { x: number; y: number }): void {
  for (const object of objects) if (isUiObject(object)) manager(scene).register(object, 'button', id, anchor);
}

export function listSceneUiButtonIds(scene: Phaser.Scene): string[] {
  return managers.get(scene)?.buttonIds() ?? [];
}

/** UI専用シーンの表示要素を登録する。背景などの除外対象は指定する。 */
export function enableSceneUiLayout(scene: Phaser.Scene, exclude: (object: Phaser.GameObjects.GameObject) => boolean = object => {
  const texture = (object as Phaser.GameObjects.Image).texture?.key ?? '';
  return /background|garden/i.test(texture) ||
    (object.type === 'Rectangle' && (object as Phaser.GameObjects.Rectangle).width >= scene.scale.width);
}): void {
  const add = (object: Phaser.GameObjects.GameObject): void => {
    if (wrappers.has(object as Phaser.GameObjects.Container)) return;
    if (exclude(object)) {
      if (isUiObject(object)) manager(scene).register(object, 'fixed');
    } else registerGui(scene, object);
  };
  scene.children.getChildren().forEach(add);
  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, add);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, add));
}

/** 既存の部品生成処理から増えた表示要素をまとめて登録する。 */
export function captureGui(scene: Phaser.Scene, create: () => void): void {
  const previous = new Set(scene.children.getChildren());
  create();
  for (const object of scene.children.getChildren()) {
    if (!previous.has(object)) registerGui(scene, object);
  }
}

/** 入力をGUIの元座標へ戻す（独自のホイール判定など）。 */
export function guiPoint(scene: Phaser.Scene, x: number, y: number): { x: number; y: number } {
  const gui = getUiLayoutSettings().gui;
  const cx = scene.scale.width / 2, cy = scene.scale.height / 2;
  return { x: cx + (x - cx - gui.offsetX * scene.scale.width / 1280) / gui.scale,
    y: cy + (y - cy - gui.offsetY * scene.scale.height / 720) / gui.scale };
}

/** GeometryMaskは親Containerの変換を参照しないため、描画用Graphicsを直接変換する。 */
export function syncGuiMask(scene: Phaser.Scene, graphics: Phaser.GameObjects.Graphics): void {
  const update = (): void => {
    if (!graphics.scene) return;
    const gui = getUiLayoutSettings().gui;
    graphics.setPosition(scene.scale.width / 2 * (1 - gui.scale) + gui.offsetX * scene.scale.width / 1280,
      scene.scale.height / 2 * (1 - gui.scale) + gui.offsetY * scene.scale.height / 720).setScale(gui.scale);
  };
  update();
  const stop = onUiLayoutChanged(update);
  graphics.once(Phaser.GameObjects.Events.DESTROY, () => { stop(); scene.events.off(Phaser.Scenes.Events.SHUTDOWN, stop); });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
}
