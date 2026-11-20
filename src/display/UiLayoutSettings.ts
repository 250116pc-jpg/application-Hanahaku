/** 設定画面からも使用する共通レイアウト設定。座標は1280×720基準。 */
export interface GuiLayout { scale: number; offsetX: number; offsetY: number }
export interface ButtonLayout { scale: number; offsetX: number; offsetY: number }
export interface UiLayoutSettings {
  gui: GuiLayout;
  buttons: Record<string, ButtonLayout>;
}
export type UiLayoutPatch = {
  gui?: Partial<GuiLayout>;
  buttons?: Record<string, Partial<ButtonLayout> | null>;
};

export const DEFAULT_GUI_LAYOUT: Readonly<GuiLayout> = { scale: 1, offsetX: 0, offsetY: 0 };
export const DEFAULT_BUTTON_LAYOUT: Readonly<ButtonLayout> = { scale: 1, offsetX: 0, offsetY: 0 };
const KEY = 'flowerLinkUiLayoutSettings';
const listeners = new Set<() => void>();
const finite = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function normalize(value: Partial<GuiLayout> = {}): GuiLayout {
  return {
    scale: Math.min(2, Math.max(0.5, finite(value?.scale, 1))),
    offsetX: Math.min(1280, Math.max(-1280, finite(value?.offsetX, 0))),
    offsetY: Math.min(720, Math.max(-720, finite(value?.offsetY, 0))),
  };
}

export function loadUiLayoutSettings(): UiLayoutSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const buttons: Record<string, ButtonLayout> = Object.create(null);
    if (saved?.buttons && typeof saved.buttons === 'object' && !Array.isArray(saved.buttons)) {
      for (const [id, value] of Object.entries(saved.buttons)) {
        if (value && typeof value === 'object') buttons[id] = normalize(value);
      }
    }
    return { gui: normalize(saved?.gui), buttons };
  } catch { return { gui: { ...DEFAULT_GUI_LAYOUT }, buttons: {} }; }
}

let current = loadUiLayoutSettings();

/** コピーを返す。直接変更せず updateUiLayoutSettings() を使用する。 */
export function getUiLayoutSettings(): UiLayoutSettings {
  return structuredClone(current);
}

/** 保存失敗時も現在のゲームには反映する。戻り値はブラウザへの保存結果。 */
export function updateUiLayoutSettings(patch: UiLayoutPatch): boolean {
  const buttons = { ...current.buttons };
  for (const [id, value] of Object.entries(patch.buttons ?? {})) {
    if (value === null) delete buttons[id];
    else buttons[id] = normalize({ ...buttons[id], ...value });
  }
  current = { gui: normalize({ ...current.gui, ...patch.gui }), buttons };
  let saved = true;
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { saved = false; }
  listeners.forEach(listener => listener());
  return saved;
}

export function resetUiLayoutSettings(): boolean {
  current = { gui: { ...DEFAULT_GUI_LAYOUT }, buttons: {} };
  let saved = true;
  try { localStorage.removeItem(KEY); } catch { saved = false; }
  listeners.forEach(listener => listener());
  return saved;
}

export function onUiLayoutChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getButtonLayout(id: string): ButtonLayout {
  return { ...DEFAULT_BUTTON_LAYOUT, ...current.buttons[id] };
}
