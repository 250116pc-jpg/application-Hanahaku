import Phaser from 'phaser';
import testData, { getFlowerSkill } from './test_data';
import type { CharacterData } from './test_data';
import { SCENE_KEYS } from './sceneKeys';
import { applySmoothDisplay, BACK_BUTTON_POSITION } from '../utils/ui';
import background from '../assets/ui/training_background.png';
import parchment from '../assets/ui/training_panel.png';
import buttonArtwork from '../assets/ui/button1.png';
import selectedTabArtwork from '../assets/ui/training_tab_selected.png';
import titleOrnament from '../assets/ui/training_title_ornament.png';
import compactButtonArtwork from '../assets/ui/training_button_square.png';
import skillDefinitions from '../../php/skill/skills.json';
import { requestShop, shopCatalog } from './shop/ShopApi';
import { getShopItemImageUrl } from './shop/assets';
import { getPhpBaseUrl } from '../auth/PhpBaseUrl';
import { MAX_FLOWER_LEVEL, experienceThresholds, flowerStats, levelPreview } from './training/trainingRules';

const flowerImages = import.meta.glob('../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const skillImages = import.meta.glob('../assets/system/skill/icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
type Tab = 'status' | 'level' | 'skill';
// 花の共通定義を変更せず、ログインユーザーのDB保存値を重ねて使う。
type TrainingFlower = CharacterData & { exp: string; skillLevel: number };
const TABS: Array<[Tab, string]> = [['status', 'ステータス'], ['level', 'レベル強化'], ['skill', 'スキル強化']];
const C = { ink: '#17243d', muted: '#79694f', gold: '#d9b579', green: '#315b57', cream: 0xf8f4e8, line: 0xc5aa76, navy: 0x102d45 };
const CONTENT_OFFSET_Y = 20;
const nutrients = shopCatalog.filter(item => item.category === 'material' && item.name.startsWith('栄養剤'));

export class TrainingScene extends Phaser.Scene {
  private selectedId = testData.characters.find(flower => flower.code === 'sunflower')?.id ?? testData.characters[0].id;
  private tab: Tab = 'status';
  private page = 0;
  private quantity = 1;
  private material: number | null = null;
  private inventory: Record<string, number> = {};
  private inventoryStatus: 'loading' | 'ready' | 'error' = 'loading';
  private inventoryError = '';
  private inventoryRequest = 0;
  private ownedFlowers: TrainingFlower[] = [];
  private flowersStatus: 'loading' | 'ready' | 'error' = 'loading';
  private flowersError = '';
  private flowersRequest = 0;
  private upgrading = false;
  private upgradeMessage = '';
  private lifecycle = 0;
  private layout!: Phaser.GameObjects.Container;
  private content!: Phaser.GameObjects.Container;
  private idle?: Phaser.Tweens.Tween;
  private portrait!: Phaser.GameObjects.Container;
  private effects!: Phaser.GameObjects.Container;
  private portraitId = -1;
  private portraitLevel?: Phaser.GameObjects.Text;
  private upgradeButtonLabel?: Phaser.GameObjects.Text;
  private upgradeStatusText?: Phaser.GameObjects.Text;
  private expText?: Phaser.GameObjects.Text;
  private expFill?: Phaser.GameObjects.Rectangle;
  private finishEffect?: () => void;

  constructor() { super(SCENE_KEYS.TRAINING); }
  init(data: { characterId?: number } = {}): void {
    if (testData.characters.some(flower => flower.id === data.characterId)) this.selectedId = data.characterId!;
    this.page = Math.floor(testData.characters.findIndex(flower => flower.id === this.selectedId) / 6);
    this.quantity = 1;
  }
  preload(): void {
    this.load.image('training-garden', background);
    this.load.image('training-parchment', parchment);
    this.load.image('training-button', buttonArtwork);
    this.load.image('training-tab', selectedTabArtwork);
    this.load.image('training-compact-button', compactButtonArtwork);
    this.load.image('training-title-ornament', titleOrnament);
    // ショップと同じ画像対応を使い、栄養剤の画像だけ読み込む。
    nutrients.forEach(item => this.load.image(`training-nutrient-${item.id}`, getShopItemImageUrl(item.id)));
    testData.characters.forEach(flower => {
      const url = flowerImages[`../assets/images/pixel_flowers/${flower.code}.png`];
      if (url) this.load.image(`training-flower-${flower.id}`, url);
    });
    skillDefinitions.skills.forEach(skill => {
      const url = skillImages[`../assets/system/skill/icons/${skill.icon}.png`];
      if (url) this.load.image(`training-skill-${skill.id}`, url);
    });
  }
  create(): void {
    this.lifecycle++;
    this.upgrading = false;
    this.upgradeMessage = '';
    // 四角いタブ画像の外側の透明な余白を除き、未選択時と同じ寸法にする。
    const tabTexture = this.textures.get('training-tab');
    if (!tabTexture.has('rect')) tabTexture.add('rect', 0, 8, 160, 1936, 460);
    this.input.enabled = true;
    this.cameras.main.setScroll(0, 0).setRoundPixels(false);
    // 高解像度の装飾を小さなUI部品用に描画し直し、金縁の太さを画面内で統一する。
    if (!this.textures.exists('training-panel-ui')) {
      const texture = this.textures.createCanvas('training-panel-ui', 384, 256);
      if (texture) {
        texture.context.drawImage(this.textures.get('training-parchment').getSourceImage() as HTMLImageElement, 0, 0, 384, 256);
        texture.refresh();
        texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
    // Use a texture frame to omit the transparent padding around the generated divider.
    const ornament = this.textures.get('training-title-ornament');
    if (!ornament.has('divider')) ornament.add('divider', 0, 0, 260, 2172, 200);
    const scale = Math.min(this.scale.width / 1280, this.scale.height / 720);
    this.layout = this.add.container((this.scale.width - 1280 * scale) / 2, (this.scale.height - 720 * scale) / 2).setScale(scale);
    this.layout.add(this.add.image(640, 360, 'training-garden').setDisplaySize(1280, 720));
    this.layout.add(this.add.rectangle(640, 360, 1280, 720, 0x20120a, .14));
    this.portraitId = -1;
    this.portrait = this.add.container(0, CONTENT_OFFSET_Y); this.layout.add(this.portrait);
    this.content = this.add.container(0, CONTENT_OFFSET_Y); this.layout.add(this.content);
    this.effects = this.add.container(0, CONTENT_OFFSET_Y); this.layout.add(this.effects);
    this.createHeader();
    this.inventory = {};
    this.inventoryStatus = 'loading';
    this.ownedFlowers = [];
    this.flowersStatus = 'loading';
    this.render();
    void this.loadInventory();
    void this.loadOwnedFlowers();
    applySmoothDisplay(this, ['training-garden', 'training-parchment', 'training-button', 'training-tab', 'training-compact-button', 'training-title-ornament']);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inventoryRequest++; // 終了後や再入場前の通信結果を描画しない。
      this.flowersRequest++;
      this.lifecycle++;
      this.finishEffect?.(); this.finishEffect = undefined;
      this.idle?.remove(); this.idle = undefined;
    });
  }

  // 描画部品。配置は1280×720で統一し、見た目の変更はこのファイルで完結する。
  private text(x: number, y: number, value: string, size = 20, color = C.ink): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, value, { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: size, color, fontStyle: 'bold', resolution: 2 });
    this.content.add(text); return text;
  }
  private box(x: number, y: number, w: number, h: number, color = C.cream, radius = 16, border = C.line): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().fillStyle(color).fillRoundedRect(x, y, w, h, radius).lineStyle(1, border).strokeRoundedRect(x, y, w, h, radius);
    this.content.add(g); return g;
  }
  // 花飾りの四隅を保ち、中央だけ伸ばせる共通パネル。
  private panel(x: number, y: number, w: number, h: number): void {
    const corner = Math.min(68, h / 3);
    this.content.add(this.add.nineslice(x + w / 2, y + h / 2, 'training-panel-ui', undefined, w, h, corner, corner, corner, corner));
  }
  private button(x: number, y: number, w: number, h: number, label: string, action: () => void, selected = false, enabled = true): Phaser.GameObjects.Text {
    const isTab = h === 58;
    const isCompact = w <= 54;
    const useNavy = selected || !isTab;
    const g = useNavy
      ? this.add.image(x + w / 2, y + h / 2, isCompact ? 'training-compact-button' : isTab ? 'training-tab' : 'training-button', isTab ? 'rect' : undefined)
        // 小ボタンは縦横とも46px。横長の画像を細く潰さず、専用の正方形を使う。
        .setDisplaySize(isCompact ? 46 : isTab ? w : w + 8, isCompact ? 46 : isTab ? h : h + 7)
      : this.box(x, y, w, h, 0xf7ecd4, 6, 0xb79553);
    if (useNavy) this.content.add(g);
    if (selected) this.content.add(this.add.graphics().lineStyle(1, 0xffdc8e, .9).strokeRoundedRect(x + 8, y + 5, w - 16, h - 10, 5));
    const caption = this.text(x + w / 2, y + h / 2, label, isCompact ? 24 : 18, useNavy ? '#fff5df' : C.ink).setOrigin(.5);
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h);
    if (enabled) hit.setInteractive({ useHandCursor: true });
    else g.setAlpha(.4);
    this.content.add(hit);
    hit.on('pointerover', () => g.setAlpha(.8)); hit.on('pointerout', () => g.setAlpha(1));
    hit.on('pointerup', action);
    return caption;
  }
  private flowerImage(flower: CharacterData, x: number, y: number, size: number): Phaser.GameObjects.Image | undefined {
    const key = `training-flower-${flower.id}`;
    if (!this.textures.exists(key)) return undefined;
    const image = this.add.image(x, y, key).setScale(size / Math.max(this.textures.get(key).getSourceImage().width, this.textures.get(key).getSourceImage().height));
    this.content.add(image); return image;
  }
  private wrapped(value: string, columns = 28): string {
    return value.split('\n').map(line => Array.from(line).reduce((result, char, index) => result + (index && index % columns === 0 ? '\n' : '') + char, '')).join('\n');
  }

  // タイトルと戻るボタンは固定し、本文・花・強化演出だけを同じ量だけ下げる。
  private createHeader(): void {
    const content = this.content;
    this.content = this.add.container(0, 0);
    this.layout.add(this.content);
    this.text(640, 43, '育成', 40, '#fff4dc')
      .setFontFamily('"Yu Mincho", "MS PMincho", serif').setFontStyle('normal')
      .setOrigin(.5).setShadow(0, 2, '#241008', 3, true, true);
    this.content.add(this.add.image(640, 74, 'training-title-ornament', 'divider').setScale(300 / 2172));
    this.button(BACK_BUTTON_POSITION.x - 70, BACK_BUTTON_POSITION.y - 18, 140, 36, '‹  ホームへ', () => this.scene.start(SCENE_KEYS.HOME));
    this.content = content;
  }

  private render(): void {
    this.content.removeAll(true);
    this.upgradeButtonLabel = undefined;
    this.upgradeStatusText = undefined;
    this.expText = undefined;
    this.expFill = undefined;
    const flower = this.ownedFlowers.find(item => item.id === this.selectedId);

    // 同じ花を表示している間は、花・左パネル・待機アニメーションを作り直さない。
    if (this.portraitId !== (flower?.id ?? 0)) {
      this.idle?.remove();
      this.portrait.removeAll(true);
      const content = this.content;
      this.content = this.portrait;
      if (flower) this.renderPortrait(flower);
      else {
        this.panel(36, 88, 400, 410);
        this.text(236, 290, '✿', 64, '#c6b58b').setOrigin(.5);
      }
      this.content = content;
      this.portraitId = flower?.id ?? 0;
    }
    if (flower) this.portraitLevel?.setText(`Lv.${flower.level}`);
    TABS.forEach(([tab, label], index) => {
      const x = 460 + index * 264;
      this.button(x, 88, 256, 58, label, () => { this.tab = tab; this.render(); }, this.tab === tab);
    });
    this.panel(460, 160, 784, 338);
    if (!flower) {
      const message = this.flowersStatus === 'loading' ? '契約済みの花を読み込み中…'
        : this.flowersStatus === 'error' ? this.flowersError : '育成できる契約済みの花がありません。';
      this.text(852, 292, this.wrapped(message, 32), 20, C.muted).setAlign('center').setOrigin(.5);
      if (this.flowersStatus === 'error') this.button(752, 350, 200, 46, '再読み込み', () => { void this.loadOwnedFlowers(); });
    } else if (this.tab === 'status') this.renderStatus(flower);
    else if (this.tab === 'level') this.renderLevel(flower);
    else this.renderSkill(flower);
    this.renderRoster();

  }
  private renderPortrait(flower: CharacterData): void {
    this.panel(36, 88, 400, 410);
    this.text(236, 177, '★'.repeat(flower.rarity), 16, '#b78028').setOrigin(.5, 0);
    this.text(236, 153, flower.name, 32).setOrigin(.5).setFontFamily('"Yu Mincho", "MS PMincho", serif');
    const halo = this.add.graphics();
    for (let r = 148; r > 0; r -= 8) halo.fillStyle(0xffe3a3, .035).fillCircle(236, 305, r);
    halo.lineStyle(1, 0xb7995b, .4).strokeCircle(236, 305, 126).strokeCircle(236, 305, 138);
    halo.fillStyle(0x9c7545, .2).fillEllipse(236, 394, 160, 23);
    this.content.add(halo);
    const image = this.flowerImage(flower, 236, 301, 223);
    if (image) this.idle = this.tweens.add({ targets: image, y: 296, duration: 2300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.text(236, 415, `${flower.element}属性   ·   ${flower.role}   ·   ${flower.season}の花`, 16, C.muted).setOrigin(.5);
    this.portraitLevel = this.text(62, 459, `Lv.${flower.level}`, 24);
    this.text(129, 466, `/ ${flower.maxLevel}`, 16, C.muted);
    this.button(276, 449, 133, 35, '花の詳細  ›', () => {
      this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { characterId: flower.id, returnScene: SCENE_KEYS.TRAINING, returnLabel: '育成へ' });
    });
  }
  private renderStatus(flower: TrainingFlower): void {
    this.text(488, 184, 'ステータス', 23);
    const rows = [['HP', 'hp', 0x72a478], ['MP', 'mp', 0x689fb0], ['ATK', 'atk', 0xc18b6c], ['DEF', 'def', 0xb4a36c]] as const;
    rows.forEach(([label, key, color], index) => {
      const x = 488 + index % 2 * 372, y = 231 + Math.floor(index / 2) * 70;
      this.box(x, y, 352, 58, 0xeeeadd, 9, 0xe3ddcd);
      this.text(x + 16, y + 10, label, 17, C.muted);
      this.text(x + 330, y + 8, String(flower.stats[key]), 24).setOrigin(1, 0);
      this.content.add(this.add.rectangle(x + 16, y + 45, 320, 3, 0xdad8ca).setOrigin(0, .5));
      const ratio = flower.stats[key] / Math.max(1, ...this.ownedFlowers.map(item => item.stats[key]));
      this.content.add(this.add.rectangle(x + 16, y + 45, 320 * ratio, 3, color).setOrigin(0, .5));
    });
    this.text(488, 383, `SPD  ${flowerStats(flower.id, flower.level)?.spd ?? '—'}`, 17);
    const skill = getFlowerSkill(flower.id);
    this.text(488, 422, 'この花のスキル', 14, C.muted);
    this.text(1215, 422, `Lv.${flower.skillLevel}`, 17, C.green).setOrigin(1, 0);
    this.text(488, 448, this.wrapped(skill?.name ?? 'スキル未設定', 35), 18);
  }
  private renderLevel(flower: TrainingFlower): void {
    const count = this.inventory[String(this.material)] ?? 0;
    const limit = levelPreview(flower.id, flower.level, flower.exp, this.material, count, this.quantity);
    this.quantity = Math.min(Math.max(1, this.quantity), limit.maxQuantity);
    const preview = levelPreview(flower.id, flower.level, flower.exp, this.material, count, this.quantity);
    this.text(488, 183, 'レベル強化', 23);
    this.text(488, 226, preview.used ? `Lv.${flower.level}  →  Lv.${preview.afterLevel}` : `Lv.${flower.level} / ${MAX_FLOWER_LEVEL}`, 29, C.green);
    if (preview.used) this.text(851, 225, `HP  ${flower.stats.hp} → ${preview.stats?.hp ?? flower.stats.hp}\nATK  ${flower.stats.atk} → ${preview.stats?.atk ?? flower.stats.atk}`, 16, C.green).setLineSpacing(5);
    this.expText = this.text(488, 275, `累計EXP  ${BigInt(flower.exp).toLocaleString('ja-JP')}${preview.used ? `  →  ${preview.afterExp.toLocaleString('ja-JP')}` : ''}`, 16, C.muted);
    this.content.add(this.add.rectangle(488, 297, 728, 3, 0xd8ceb4).setOrigin(0, .5));
    this.expFill = this.add.rectangle(488, 297, 0, 3, 0xa99150).setOrigin(0, .5);
    this.content.add(this.expFill);
    this.updateExperienceGauge(Number(BigInt(flower.exp) > BigInt(experienceThresholds[MAX_FLOWER_LEVEL - 1]) ? experienceThresholds[MAX_FLOWER_LEVEL - 1] : BigInt(flower.exp)));
    if (this.inventoryStatus === 'loading') {
      this.text(488, 305, '所持している栄養剤を読み込み中…', 18, C.muted);
    } else if (this.inventoryStatus === 'error') {
      this.text(488, 288, this.wrapped(this.inventoryError, 36), 17, '#9b4739').setLineSpacing(4);
      this.button(1040, 363, 176, 40, '再読み込み', () => { void this.loadInventory(); });
    } else {
      const owned = nutrients.filter(item => (this.inventory[String(item.id)] ?? 0) > 0);
      if (owned.length === 0) this.text(488, 305, '栄養剤を所持していません。', 19, C.muted);
      else {
        // 最大5種類を同時表示。0個の栄養剤と栄養剤以外は表示しない。
        const gap = 10, width = Math.min(232, (728 - gap * (owned.length - 1)) / owned.length);
        owned.forEach((item, index) => {
          const x = 488 + index * (width + gap), selected = this.material === item.id;
          this.box(x, 302, width, 72, selected ? 0xffeac1 : 0xf1e6cf, 6, selected ? 0xcf943b : 0xd6c29b);
          const image = this.add.image(x + 27, 338, `training-nutrient-${item.id}`);
          image.setScale(40 / Math.max(image.width, image.height)); this.content.add(image);
          this.text(x + 51, 314, item.name, 13);
          this.text(x + 51, 341, `所持 ${this.inventory[String(item.id)]}個`, 13, C.muted);
          if (selected) this.text(x + width - 6, 305, '✓', 12, C.green).setOrigin(1, 0);
          const hit = this.add.zone(x + width / 2, 338, width, 72).setInteractive({ useHandCursor: true });
          this.content.add(hit);
          hit.on('pointerup', () => { this.material = item.id; this.quantity = 1; this.render(); });
        });
        this.text(488, 391, '使用数', 17);
        this.button(590, 383, 42, 38, '−', () => { this.quantity = Math.max(1, this.quantity - 1); this.render(); }, false, this.quantity > 1);
        this.text(668, 402, String(this.quantity), 24).setOrigin(.5);
        this.button(703, 383, 42, 38, '＋', () => { this.quantity = Math.min(preview.maxQuantity, this.quantity + 1); this.render(); }, false, this.quantity < preview.maxQuantity);
        this.text(780, 393, `/ 所持 ${count}個`, 16, C.muted);
      }
    }
    const message = this.upgrading ? '強化しています…' : this.upgradeMessage || preview.reason ||
      (preview.discarded ? `Lv.50到達時、余剰${preview.discarded}EXPは切り捨てます。` : `獲得EXP  +${preview.gain}　／　追加コインなし`);
    this.upgradeStatusText = this.text(488, 447, this.wrapped(message, 30), 13, C.muted).setLineSpacing(3);
    this.upgradeButtonLabel = this.button(986, 430, 230, 46, this.upgrading ? '強化中…' : '強化する', () => { void this.upgradeLevel(flower); }, true,
      !this.upgrading && this.inventoryStatus === 'ready' && !preview.reason && preview.used > 0);
    // TODO: プレイヤーレベルが実装されたら、育成上限をmin(50, プレイヤーレベル)にする。
    // 回復力の基本値・成長反映とスキル強化は別途決定する。
  }
  private async loadInventory(silent = false): Promise<void> {
    const request = ++this.inventoryRequest;
    this.inventoryStatus = 'loading';
    if (!silent && this.tab === 'level') this.render();
    try {
      // ログインユーザーのusers.itemsを読む既存API。購入・消費は行わない。
      const state = await requestShop('state');
      if (request !== this.inventoryRequest || !this.sys.isActive()) return;
      if (!state.items || typeof state.items !== 'object' || Array.isArray(state.items) ||
          Object.values(state.items).some(count => !Number.isSafeInteger(count) || count < 0)) {
        throw new Error('所持品データの形式を確認してください。');
      }
      this.inventory = state.items;
      const owned = nutrients.filter(item => (this.inventory[String(item.id)] ?? 0) > 0);
      if (!owned.some(item => item.id === this.material)) this.material = owned[0]?.id ?? null;
      this.quantity = Math.min(Math.max(1, this.quantity), this.inventory[String(this.material)] ?? 0);
      this.inventoryStatus = 'ready';
    } catch (error) {
      if (request !== this.inventoryRequest || !this.sys.isActive()) return;
      this.inventoryStatus = 'error';
      this.inventoryError = error instanceof Error ? error.message : '所持品を読み込めませんでした。';
    }
    if (!silent && this.tab === 'level') this.render();
  }
  private async loadOwnedFlowers(silent = false): Promise<void> {
    const request = ++this.flowersRequest;
    this.flowersStatus = 'loading';
    if (!silent) { this.ownedFlowers = []; this.render(); }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const abort = (): void => controller.abort();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, abort);
    try {
      const response = await fetch(`${getPhpBaseUrl()}/flower/owned.php`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: '{}', cache: 'no-store', signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.error ?? '契約済みの花を読み込めませんでした。');
      if (!Array.isArray(result.flowers)) {
        throw new Error('契約済みの花のデータが正しくありません。');
      }
      const progress = new Map<number, { level: number; exp: string; skillLevel: number }>();
      for (const row of result.flowers) {
        if (!row || !Number.isSafeInteger(row.flowerId) || row.flowerId < 1 || progress.has(row.flowerId) ||
            !Number.isSafeInteger(row.level) || row.level < 1 || !Number.isSafeInteger(row.skillLevel) || row.skillLevel < 1 ||
            typeof row.exp !== 'string' || !/^[0-9]+$/.test(row.exp)) {
          throw new Error('花の育成データが正しくありません。');
        }
        progress.set(row.flowerId, { level: row.level, exp: row.exp, skillLevel: row.skillLevel });
      }
      if (request !== this.flowersRequest || !this.sys.isActive()) return;
      this.ownedFlowers = testData.characters.flatMap(flower => {
        const saved = progress.get(flower.id);
        if (!saved) return [];
        const stats = flowerStats(flower.id, saved.level);
        return [{ ...flower, ...saved, maxLevel: MAX_FLOWER_LEVEL, stats: {
          ...flower.stats, hp: stats?.hp ?? 0, mp: stats?.mp ?? 0, atk: stats?.atk ?? 0, def: stats?.def ?? 0,
        } }];
      });
      if (progress.size > 0 && this.ownedFlowers.length === 0) {
        throw new Error('所持している花の育成用データが未登録です。');
      }
      if (!this.ownedFlowers.some(flower => flower.id === this.selectedId)) this.selectedId = this.ownedFlowers[0]?.id ?? 0;
      this.page = Math.max(0, Math.floor(this.ownedFlowers.findIndex(flower => flower.id === this.selectedId) / 6));
      this.flowersStatus = 'ready';
    } catch (error) {
      if (request !== this.flowersRequest || !this.sys.isActive()) return;
      this.flowersStatus = 'error';
      this.ownedFlowers = [];
      this.flowersError = error instanceof Error && error.name !== 'AbortError' ? error.message : '通信に時間がかかっています。再度お試しください。';
    } finally {
      window.clearTimeout(timer);
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, abort);
    }
    if (!silent && request === this.flowersRequest && this.sys.isActive()) this.render();
  }
  private async upgradeLevel(flower: TrainingFlower): Promise<void> {
    if (this.upgrading || this.inventoryStatus !== 'ready' || this.flowersStatus !== 'ready') return;
    const preview = levelPreview(flower.id, flower.level, flower.exp, this.material, this.inventory[String(this.material)] ?? 0, this.quantity);
    if (preview.reason || preview.used < 1 || preview.used !== this.quantity) return;
    const lifecycle = this.lifecycle;
    const body = { flowerId: flower.id, itemId: this.material, quantity: preview.used, expectedLevel: flower.level, expectedExp: flower.exp };
    this.upgrading = true;
    this.upgradeMessage = '';
    this.input.enabled = false;
    // 保存中はラベルだけ変更し、画面を消したり読み込み表示へ戻したりしない。
    this.upgradeButtonLabel?.setText('保存中…');
    this.upgradeStatusText?.setText('強化しています…');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${getPhpBaseUrl()}/flower/upgrade.php`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.error ?? '強化を完了できませんでした。');
      if (lifecycle !== this.lifecycle || !this.sys.isActive()) return;
      if (result.flowerId !== flower.id || !Number.isSafeInteger(result.level) || result.level < flower.level || result.level > MAX_FLOWER_LEVEL ||
          typeof result.exp !== 'string' || !/^[0-9]+$/.test(result.exp) || BigInt(result.exp) > BigInt(experienceThresholds[MAX_FLOWER_LEVEL - 1]) ||
          BigInt(result.exp) < BigInt(flower.exp) || !Number.isSafeInteger(result.skillLevel) || result.skillLevel < 1 ||
          !result.items || typeof result.items !== 'object' || Array.isArray(result.items) || Object.values(result.items).some(count => !Number.isSafeInteger(count) || Number(count) < 0)) {
        throw new Error('強化結果を確認できませんでした。最新の状態を取得します。');
      }
      // サーバーが保存に成功した結果を受け取ってから、成功演出を開始する。
      await this.playUpgradeEffect(flower, result.level, Number(result.exp));
      if (lifecycle !== this.lifecycle || !this.sys.isActive()) return;
      const stats = flowerStats(flower.id, result.level);
      this.ownedFlowers = this.ownedFlowers.map(item => item.id === flower.id ? {
        ...item, level: result.level, exp: result.exp, skillLevel: result.skillLevel,
        stats: { ...item.stats, hp: stats?.hp ?? 0, mp: stats?.mp ?? 0, atk: stats?.atk ?? 0, def: stats?.def ?? 0 },
      } : item);
      this.inventory = { ...result.items };
      const owned = nutrients.filter(item => (this.inventory[String(item.id)] ?? 0) > 0);
      if (!owned.some(item => item.id === this.material)) this.material = owned[0]?.id ?? null;
      this.upgradeMessage = '強化しました。';
    } catch (error) {
      if (lifecycle !== this.lifecycle || !this.sys.isActive()) return;
      this.upgradeMessage = error instanceof Error && error.name !== 'AbortError' ? error.message : '通信結果を確認できませんでした。最新の状態を取得します。';
      // 応答消失で保存済みの可能性もある。成功演出は出さず、裏で最新値を確認する。
      await Promise.all([this.loadOwnedFlowers(true), this.loadInventory(true)]);
    } finally {
      window.clearTimeout(timer);
      if (lifecycle === this.lifecycle && this.sys.isActive()) {
        if (lifecycle === this.lifecycle && this.sys.isActive()) {
          this.quantity = 1;
          this.upgrading = false;
          this.input.enabled = true;
          this.render();
        }
      }
    }
  }
  private updateExperienceGauge(exp: number): number {
    let level = 1;
    while (level < MAX_FLOWER_LEVEL && exp >= experienceThresholds[level]) level++;
    const start = experienceThresholds[level - 1];
    const end = experienceThresholds[level] ?? start;
    const ratio = level === MAX_FLOWER_LEVEL ? 1 : Phaser.Math.Clamp((exp - start) / (end - start), 0, 1);
    this.expFill?.setSize(728 * ratio, 3);
    return level;
  }
  private playUpgradeEffect(before: TrainingFlower, afterLevel: number, afterExp: number): Promise<void> {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 300 : 1100;
    this.upgradeButtonLabel?.setText('強化中…');
    this.upgradeStatusText?.setText(afterLevel > before.level ? '花のレベルが上がりました！' : '経験値を獲得しました。');
    const glow = this.add.graphics().setPosition(236, 301);
    for (let radius = 136; radius > 0; radius -= 8) glow.fillStyle(0xffda7c, .025).fillCircle(0, 0, radius);
    glow.lineStyle(2, 0xffdf9b, .8).strokeCircle(0, 0, 97);
    this.effects.add(glow);
    this.tweens.add({ targets: glow, alpha: 0, scaleX: 1.35, scaleY: 1.35, duration, ease: 'Sine.easeOut' });
    if (!reducedMotion) {
      for (let index = 0; index < 24; index++) {
        const angle = Math.PI * 2 * index / 24;
        const star = this.add.star(236 + Math.cos(angle) * 35, 301 + Math.sin(angle) * 45, 4, 1.5, 4, 0xffe5a3);
        this.effects.add(star);
        this.tweens.add({ targets: star, x: 236 + Math.cos(angle) * 145, y: 281 + Math.sin(angle) * 135,
          alpha: 0, angle: 90, duration: duration * .9, ease: 'Cubic.easeOut' });
      }
    }
    const title = this.add.text(236, 237, afterLevel > before.level ? 'LEVEL UP!' : 'EXP UP!', {
      fontFamily: 'Georgia, serif', fontSize: 30, fontStyle: 'bold', color: '#fff1b8', stroke: '#75502a', strokeThickness: 3, resolution: 2,
    }).setOrigin(.5).setAlpha(0);
    this.effects.add(title);
    this.tweens.add({ targets: title, alpha: 1, y: 221, duration: duration * .25, yoyo: true, hold: duration * .35 });
    const counter = { exp: Number(before.exp) };
    return new Promise(resolve => {
      this.finishEffect = resolve;
      this.tweens.add({ targets: counter, exp: afterExp, duration, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const exp = Math.floor(counter.exp);
          const level = this.updateExperienceGauge(exp);
          this.expText?.setText(`累計EXP  ${exp.toLocaleString('ja-JP')}`);
          this.portraitLevel?.setText(`Lv.${Math.max(before.level, level)}`);
        },
        onComplete: () => {
          this.effects.removeAll(true);
          this.finishEffect = undefined;
          resolve();
        },
      });
    });
  }
  private renderSkill(flower: TrainingFlower): void {
    const skill = getFlowerSkill(flower.id);
    const definition = skillDefinitions.skills.find(item => item.id === flower.id);
    this.text(488, 183, 'スキル強化', 23);
    this.text(1215, 194, `Lv.${flower.skillLevel}`, 22, C.green).setOrigin(1, 0);
    this.box(488, 230, 88, 88, 0x1d3b3d, 12, 0xb19d6c);
    if (this.textures.exists(`training-skill-${flower.id}`)) {
      this.content.add(this.add.image(532, 274, `training-skill-${flower.id}`).setDisplaySize(72, 72));
    }
    this.text(598, 234, this.wrapped(skill?.name ?? 'スキル未設定', 24), 21).setLineSpacing(4);
    this.text(598, 299, `消費MP  ${skill?.mpCost ?? '—'}    /    クールダウン  ${definition?.cooldownSeconds ?? '—'}秒`, 15, C.muted);
    this.text(488, 343, this.wrapped(skill?.description ?? 'スキルの説明は準備中です。', 38), 17).setLineSpacing(5);
    this.pendingAction('スキル強化');
    // TODO: 所有スキルの現在レベル・次の効果・必要素材を取得してプレビューを表示する。
    // TODO: スキル強化APIを呼び、素材消費とレベル更新をサーバー側で確定する。
  }
  private pendingAction(name: string): void {
    this.text(488, 453, '強化機能は準備中です。', 13, C.muted);
    this.box(986, 430, 230, 46, 0xe4e6da, 9, 0xd0d5c5);
    this.text(1101, 453, `${name}する（準備中）`, 16, '#8a9587').setOrigin(.5);
  }
  private renderRoster(): void {
    this.panel(36, 514, 1208, 144);
    const centerY = 514 + 144 / 2;
    const cardTop = centerY - 77 / 2;
    const pages = Math.ceil(this.ownedFlowers.length / 6);
    this.text(1208, centerY - 43, `${pages ? this.page + 1 : 0}/${pages}`, 13, C.muted).setOrigin(.5, 1);
    const maxPage = Math.max(0, pages - 1);
    this.button(51, centerY - 53 / 2, 42, 53, '‹', () => { this.page = Math.max(0, this.page - 1); this.render(); }, false, this.page > 0);
    this.button(1187, centerY - 53 / 2, 42, 53, '›', () => { this.page = Math.min(maxPage, this.page + 1); this.render(); }, false, this.page < maxPage);
    this.ownedFlowers.slice(this.page * 6, this.page * 6 + 6).forEach((flower, index) => {
      const x = 107 + index * 178, selected = flower.id === this.selectedId;
      this.box(x, cardTop, 167, 77, selected ? 0xffeac1 : 0xf1e6cf, 6, selected ? 0xcf943b : 0xd6c29b);
      this.flowerImage(flower, x + 34, centerY - 3, 62);
      this.text(x + 72, centerY - 20, flower.name, 15);
      this.text(x + 72, centerY + 7, `Lv.${flower.level}`, 13, C.muted);
      if (selected) this.text(x + 153, cardTop + 4, '✓', 15, C.green).setOrigin(1, 0);
      const hit = this.add.zone(x + 83, centerY, 167, 77).setInteractive({ useHandCursor: true });
      this.content.add(hit);
      hit.on('pointerup', () => { this.selectedId = flower.id; this.quantity = 1; this.render(); });
    });
    // 契約の登録は別の処理で行い、この画面はplayer_flowersの取得結果だけを表示する。
  }
}





