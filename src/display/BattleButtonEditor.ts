import retreat from '../assets/ui/button/retreat_button.png';
import { ensureGuardButtonTexture } from './GuardButtonTexture';
import Phaser from 'phaser';
import bag from '../assets/ui/button/bag_button.png';
import attack from '../assets/ui/button/attack_button.png';
import jump from '../assets/ui/button/jump_button.png';
import settings from '../assets/ui/button/setting_button.png';

type Position = { x: number; y: number; size: number };
type Layout = Record<string, Position>;
const KEY = 'flowerLinkBattleLayout';
const buttons = [
  { key: 'stage-bag', name: 'バッグ', image: bag, x: .056, y: .255, size: 74 },
  { key: 'stage-settings-ui', name: '設定', image: settings, x: .056, y: .422, size: 74 },
  { key: 'stage-attack', name: '攻撃', image: attack, x: (1280 - 226) / 1280, y: (720 - 94) / 720, size: 130 },
  { key: 'stage-jump', name: 'ジャンプ', image: jump, x: (1280 - 112) / 1280, y: (720 - 64) / 720, size: 130 },
  { key: 'stage-retreat', name: '撤退', image: retreat, x: 1212 / 1280, y: 282 / 720, size: 76 },
  { key: 'stage-guard', name: '防御', image: '', x: (1280 - 162) / 1280, y: (720 - 199) / 720, size: 106 },
];
export function loadBattleLayout(): Layout {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const layout: Layout = {};
    for (const button of buttons) {
      const p = value?.[button.key];
      if (p && [p.x, p.y, p.size].every(Number.isFinite)) {
        layout[button.key] = { x: Phaser.Math.Clamp(p.x, 0, 1), y: Phaser.Math.Clamp(p.y, 0, 1), size: Phaser.Math.Clamp(p.size, 50, 180) };
      }
    }
    return layout;
  } catch { return {}; }
}

// 担当：250056 斎藤永聖。ドラッグした配置を完了時に保存する。
export function openBattleButtonEditor(scene: Phaser.Scene): void {
  if (document.querySelector('[data-battle-button-editor]')) return;
  const inputWasEnabled = scene.input.enabled;
  scene.input.enabled = false;
  const root = document.createElement('div');
  root.dataset.battleButtonEditor = '';
  for (const eventName of ['pointerdown', 'pointerup', 'pointermove', 'click', 'keydown', 'keyup']) {
    root.addEventListener(eventName, event => event.stopPropagation());
  }
  Object.assign(root.style, { position: 'fixed', inset: '0', zIndex: '10000', background: '#000b', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif', color: '#fff2d5' });
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '戦闘ボタン調整');
  const panel = document.createElement('section');
  Object.assign(panel.style, { width: 'min(960px,96vw)', maxHeight: '96dvh', overflow: 'auto', background: '#182b35', padding: '12px', boxSizing: 'border-box', border: '2px solid #c9ac72' });
  root.append(panel);
  const title = document.createElement('div');
  title.textContent = '戦闘ボタン調整　ボタンを選んでドラッグ';
  panel.append(title);
  const field = document.createElement('div');
  Object.assign(field.style, { position: 'relative', width: '100%', aspectRatio: '16 / 9', maxHeight: '65dvh', background: '#314c50', overflow: 'hidden', touchAction: 'none', margin: '8px 0' });
  panel.append(field);
  const defaults: Layout = Object.fromEntries(buttons.map(b => [b.key, { x: b.x, y: b.y, size: b.size }]));
  const draft: Layout = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, { ...value }]));
  Object.assign(draft, loadBattleLayout());
  let selected = buttons[0].key;
  const nodes = new Map<string, HTMLButtonElement>();
  const label = document.createElement('label');
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '50'; slider.max = '180'; slider.setAttribute('aria-label', '選択したボタンの大きさ');
  const draw = (): void => {
    const rect = field.getBoundingClientRect();
    const unit = rect.width / scene.scale.width;
    for (const b of buttons) {
      const p = draft[b.key];
      const radiusX = p.size * unit / 2 / rect.width;
      const radiusY = p.size * unit / 2 / rect.height;
      p.x = Phaser.Math.Clamp(p.x, radiusX, 1 - radiusX);
      p.y = Phaser.Math.Clamp(p.y, radiusY, 1 - radiusY);
      const overlap = buttons.some(other => other.key !== b.key && Math.hypot((draft[other.key].x - p.x) * rect.width, (draft[other.key].y - p.y) * rect.height) < (draft[other.key].size + p.size) * unit / 2);
      Object.assign(nodes.get(b.key)!.style, { left: p.x * 100 + '%', top: p.y * 100 + '%', width: p.size * unit + 'px', height: p.size * unit + 'px', fontSize: p.size * unit + 'px', outline: overlap ? '2px solid #ff7979' : b.key === selected ? '2px solid #8ce4ff' : 'none' });
    }
    label.textContent = buttons.find(b => b.key === selected)!.name + ' の大きさ　';
    slider.value = String(draft[selected].size);
  };
  for (const b of buttons) {
    const node = document.createElement('button');
    node.type = 'button'; node.setAttribute('aria-label', b.name);
    Object.assign(node.style, { position: 'absolute', transform: 'translate(-50%,-50%)', borderRadius: '50%', padding: '0', border: '1px solid #e3cf9f', background: b.image ? 'url("' + b.image + '") center / contain no-repeat' : '#202a37', color: '#fff2d5', touchAction: 'none', cursor: 'grab' });
    if (!b.image) {
      const key = ensureGuardButtonTexture(scene);
      node.style.background = 'url("' + scene.textures.getBase64(key) + '") center / contain no-repeat';
      const caption = document.createElement('span');
      caption.textContent = '防御';
      Object.assign(caption.style, { position: 'absolute', left: '0', right: '0', top: '62%', fontSize: '0.18em', pointerEvents: 'none', color: '#f4dfb8', fontFamily: 'serif' });
      node.append(caption);
    }
    let pointer: number | null = null;
    let offsetX = 0, offsetY = 0;
    node.onpointerdown = event => {
      selected = b.key; pointer = event.pointerId;
      const r = field.getBoundingClientRect();
      offsetX = (event.clientX - r.left) / r.width - draft[b.key].x;
      offsetY = (event.clientY - r.top) / r.height - draft[b.key].y;
      node.setPointerCapture(event.pointerId); draw();
    };
    node.onpointermove = event => {
      if (event.pointerId !== pointer) return;
      const r = field.getBoundingClientRect();
      draft[b.key].x = (event.clientX - r.left) / r.width - offsetX;
      draft[b.key].y = (event.clientY - r.top) / r.height - offsetY;
      draw();
    };
    node.onpointerup = node.onpointercancel = () => { pointer = null; };
    field.append(node); nodes.set(b.key, node);
  }
  slider.oninput = () => { draft[selected].size = Number(slider.value); draw(); };
  panel.append(label, slider);
  const status = document.createElement('div');
  status.textContent = '赤い枠はボタン同士の重なりを示します。';
  panel.append(status);
  const cleanup = (): void => { scene.input.enabled = inputWasEnabled; root.remove(); observer.disconnect(); scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup); };
  for (const name of ['初期位置に戻す', 'キャンセル', '完了']) {
    const action = document.createElement('button'); action.textContent = name;
    Object.assign(action.style, { margin: '8px', padding: '8px 14px', fontSize: '16px' });
    action.onclick = () => {
      if (name === '初期位置に戻す') { for (const b of buttons) draft[b.key] = { ...defaults[b.key] }; draw(); }
      else if (name === '完了') {
        try { localStorage.setItem(KEY, JSON.stringify(draft)); cleanup(); } catch { status.textContent = '保存できませんでした。もう一度お試しください。'; }
      } else cleanup();
    };
    panel.append(action);
  }
  document.body.append(root);
  const observer = new ResizeObserver(draw); observer.observe(field);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  draw();
}
