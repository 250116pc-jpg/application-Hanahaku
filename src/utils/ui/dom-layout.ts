import { getUiLayoutSettings, getButtonLayout, onUiLayoutChanged } from '../../display/UiLayoutSettings';

/** HTMLのパネルにも同じ設定を適用する。背景・暗幕ではなく本文の要素を指定する。 */
export function bindDomGui(root: HTMLElement, namespace: string): () => void {
  const originals = new Map<HTMLElement, { scale: string; translate: string }>();
  const ids = new WeakMap<HTMLElement, string>();
  let frame = 0, disposed = false;
  const remember = (element: HTMLElement): void => {
    if (!originals.has(element)) originals.set(element, { scale: element.style.scale, translate: element.style.translate });
  };
  remember(root);
  const refresh = (): void => {
    frame = 0;
    if (disposed || !root.isConnected) return;
    for (const element of originals.keys()) if (!element.isConnected) originals.delete(element);
    const gui = getUiLayoutSettings().gui;
    const canvas = document.querySelector('canvas');
    const viewport = canvas?.getBoundingClientRect();
    const sx = (viewport?.width ?? window.innerWidth) / 1280;
    const sy = (viewport?.height ?? window.innerHeight) / 720;
    const originalRoot = originals.get(root)!;
    root.style.scale = originalRoot.scale;
    root.style.translate = originalRoot.translate;
    const originalBounds = root.getBoundingClientRect();
    const screenX = viewport ? viewport.left + viewport.width / 2 : window.innerWidth / 2;
    const screenY = viewport ? viewport.top + viewport.height / 2 : window.innerHeight / 2;
    const rootScale = getComputedStyle(root).scale.split(' ').map(Number);
    const rx = Number.isFinite(rootScale[0]) ? rootScale[0] : 1, ry = Number.isFinite(rootScale[1]) ? rootScale[1] : rx;
    root.style.scale = `${rx * gui.scale} ${ry * gui.scale}`;
    root.style.translate = `${(gui.scale - 1) * (originalBounds.left + originalBounds.width / 2 - screenX) + gui.offsetX * sx}px ${(gui.scale - 1) * (originalBounds.top + originalBounds.height / 2 - screenY) + gui.offsetY * sy}px`;
    const cx = screenX + gui.offsetX * sx, cy = screenY + gui.offsetY * sy;
    root.querySelectorAll<HTMLElement>('button, [role="button"], summary').forEach((button, index) => {
      if (originals.has(button) && !button.isConnected) return;
      remember(button);
      if (!ids.has(button)) ids.set(button, `${namespace}.${button.dataset.uiId ?? button.getAttribute('aria-label') ?? button.textContent?.trim() ?? index}`);
      const original = originals.get(button)!;
      button.style.scale = original.scale;
      button.style.translate = original.translate;
      const baseScale = getComputedStyle(button).scale.split(' ').map(Number);
      const bx = Number.isFinite(baseScale[0]) ? baseScale[0] : 1, by = Number.isFinite(baseScale[1]) ? baseScale[1] : bx;
      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height || !button.offsetWidth || !button.offsetHeight) return;
      const settings = getButtonLayout(ids.get(button)!);
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      const targetX = cx - gui.offsetX * sx + (x - cx) / gui.scale + settings.offsetX * sx;
      const targetY = cy - gui.offsetY * sy + (y - cy) / gui.scale + settings.offsetY * sy;
      // 個別scale/translateを使い、既存CSSのtransform（本の開閉など）は維持する。
      button.style.scale = `${bx * settings.scale / gui.scale} ${by * settings.scale / gui.scale}`;
      button.style.translate = `${(targetX - x) / (rect.width / (button.offsetWidth * bx))}px ${(targetY - y) / (rect.height / (button.offsetHeight * by))}px`;
      button.dataset.uiLayoutId = ids.get(button)!;
    });
  };
  const schedule = (): void => { if (!frame && !disposed) frame = requestAnimationFrame(refresh); };
  const unsubscribe = onUiLayoutChanged(schedule);
  const resize = new ResizeObserver(schedule);
  resize.observe(root);
  // タブ切替や再描画で増えたボタンも対象にする。自分のstyle変更では再実行しない。
  const mutation = new MutationObserver(schedule);
  mutation.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'aria-pressed'] });
  window.addEventListener('resize', schedule);
  root.addEventListener('animationend', schedule);
  root.addEventListener('transitionend', schedule);
  schedule();
  const removed = new MutationObserver(() => { if (!root.isConnected) dispose(); });
  removed.observe(document.body, { childList: true, subtree: true });
  const dispose = (): void => {
    if (disposed) return;
    removed.disconnect();
    disposed = true; cancelAnimationFrame(frame); unsubscribe(); resize.disconnect(); mutation.disconnect();
    window.removeEventListener('resize', schedule);
    root.removeEventListener('animationend', schedule); root.removeEventListener('transitionend', schedule);
    originals.forEach((style, element) => { element.style.scale = style.scale; element.style.translate = style.translate; });
  };
  return dispose;
}

/** Canvasと同じ座標を使う単独のHTMLボタン（撤退など）。 */
export function placeDomButton(button: HTMLElement, canvas: HTMLCanvasElement, logicalSize: { width: number; height: number }, id: string, x: number, y: number, size: number): void {
  const rect = canvas.getBoundingClientRect(), settings = getButtonLayout(id);
  const sx = rect.width / logicalSize.width, sy = rect.height / logicalSize.height;
  button.style.left = `${rect.left + (x + settings.offsetX - size * settings.scale / 2) * sx}px`;
  button.style.top = `${rect.top + (y + settings.offsetY - size * settings.scale / 2) * sy}px`;
  button.style.width = `${size * settings.scale * sx}px`;
  button.style.height = `${size * settings.scale * sy}px`;
}
