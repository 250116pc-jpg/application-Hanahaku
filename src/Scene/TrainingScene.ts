import Phaser from 'phaser';
import testData, { getFlowerSkill } from './test_data';
import type { CharacterData } from './test_data';
import { SCENE_KEYS } from './sceneKeys';
import { applySmoothDisplay } from '../utils/ui';
import background from '../assets/ui/training_background.png';
import parchment from '../assets/ui/training_panel.png';
import buttonArtwork from '../assets/ui/button1.png';
import selectedTabArtwork from '../assets/ui/training_tab_selected.png';
import compactButtonArtwork from '../assets/ui/training_button_square.png';
import skillDefinitions from '../../php/skill/skills.json';
import { requestShop, shopCatalog } from './shop/ShopApi';
import { getShopItemImageUrl } from './shop/assets';

const flowerImages = import.meta.glob('../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const skillImages = import.meta.glob('../assets/system/skill/icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
type Tab = 'status' | 'level' | 'skill';
const TABS: Array<[Tab, string]> = [['status', 'ステータス'], ['level', 'レベル強化'], ['skill', 'スキル強化']];
const C = { ink: '#17243d', muted: '#79694f', gold: '#d9b579', green: '#315b57', cream: 0xf8f4e8, line: 0xc5aa76, navy: 0x102d45 };
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
  private layout!: Phaser.GameObjects.Container;
  private content!: Phaser.GameObjects.Container;
  private idle?: Phaser.Tweens.Tween;

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
    const scale = Math.min(this.scale.width / 1280, this.scale.height / 720);
    this.layout = this.add.container((this.scale.width - 1280 * scale) / 2, (this.scale.height - 720 * scale) / 2).setScale(scale);
    this.layout.add(this.add.image(640, 360, 'training-garden').setDisplaySize(1280, 720));
    this.layout.add(this.add.rectangle(640, 360, 1280, 720, 0x20120a, .14));
    this.content = this.add.container(0, 0); this.layout.add(this.content);
    this.inventory = {};
    this.inventoryStatus = 'loading';
    this.render();
    void this.loadInventory();
    applySmoothDisplay(this, ['training-garden', 'training-parchment', 'training-button', 'training-tab', 'training-compact-button']);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inventoryRequest++; // 終了後や再入場前の通信結果を描画しない。
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
  private button(x: number, y: number, w: number, h: number, label: string, action: () => void, selected = false, enabled = true): void {
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
    this.text(x + w / 2, y + h / 2, label, isCompact ? 24 : 18, useNavy ? '#fff5df' : C.ink).setOrigin(.5);
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h);
    if (enabled) hit.setInteractive({ useHandCursor: true });
    else g.setAlpha(.4);
    this.content.add(hit);
    hit.on('pointerover', () => g.setAlpha(.8)); hit.on('pointerout', () => g.setAlpha(1));
    hit.on('pointerup', action);
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

  private render(): void {
    this.idle?.remove();
    this.content.removeAll(true);
    const flower = testData.characters.find(item => item.id === this.selectedId)!;
    this.content.add(this.add.image(126, 43, 'training-button').setDisplaySize(218, 68));
    this.text(50, 25, '✿', 30, C.gold);
    this.text(90, 25, '育成', 32, '#fff9e9').setFontFamily('"Yu Mincho", "MS PMincho", serif');
    this.renderPortrait(flower);
    TABS.forEach(([tab, label], index) => {
      const x = 460 + index * 264;
      this.button(x, 88, 256, 58, label, () => { this.tab = tab; this.render(); }, this.tab === tab);
    });
    this.panel(460, 160, 784, 338);
    if (this.tab === 'status') this.renderStatus(flower);
    else if (this.tab === 'level') this.renderLevel(flower);
    else this.renderSkill(flower);
    this.renderRoster();
    this.button(36, 673, 140, 36, '‹  ホームへ', () => this.scene.start(SCENE_KEYS.HOME));
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
    this.text(62, 459, `Lv.${flower.level}`, 24);
    this.text(129, 466, `/ ${flower.maxLevel}`, 16, C.muted);
    this.button(276, 449, 133, 35, '花の詳細  ›', () => {
      this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { characterId: flower.id, returnScene: SCENE_KEYS.TRAINING, returnLabel: '育成へ' });
    });
  }
  private renderStatus(flower: CharacterData): void {
    this.text(488, 184, 'ステータス', 23);
    const rows = [['HP', 'hp', 0x72a478], ['MP', 'mp', 0x689fb0], ['ATK', 'atk', 0xc18b6c], ['DEF', 'def', 0xb4a36c]] as const;
    rows.forEach(([label, key, color], index) => {
      const x = 488 + index % 2 * 372, y = 231 + Math.floor(index / 2) * 70;
      this.box(x, y, 352, 58, 0xeeeadd, 9, 0xe3ddcd);
      this.text(x + 16, y + 10, label, 17, C.muted);
      this.text(x + 330, y + 8, String(flower.stats[key]), 24).setOrigin(1, 0);
      this.content.add(this.add.rectangle(x + 16, y + 45, 320, 3, 0xdad8ca).setOrigin(0, .5));
      const ratio = flower.stats[key] / Math.max(1, ...testData.characters.map(item => item.stats[key]));
      this.content.add(this.add.rectangle(x + 16, y + 45, 320 * ratio, 3, color).setOrigin(0, .5));
    });
    this.text(488, 383, `SPD  ${flower.stats.speed}`, 17);
    const skill = getFlowerSkill(flower.id);
    this.text(488, 422, 'この花のスキル', 14, C.muted);
    this.text(488, 448, this.wrapped(skill?.name ?? 'スキル未設定', 35), 18);
  }
  private renderLevel(flower: CharacterData): void {
    this.text(488, 183, 'レベル強化', 23);
    this.text(488, 226, `Lv.${flower.level}  →  ${flower.level < flower.maxLevel ? `Lv.${flower.level + 1}` : '上限に到達'}`, 29, C.green);
    this.text(851, 239, `レベル上限  ${flower.maxLevel}`, 16, C.muted);
    if (this.inventoryStatus === 'loading') {
      this.text(488, 305, '所持している栄養剤を読み込み中…', 18, C.muted);
    } else if (this.inventoryStatus === 'error') {
      this.text(488, 288, this.wrapped(this.inventoryError, 36), 17, '#9b4739').setLineSpacing(4);
      this.button(1040, 363, 176, 40, '再読み込み', () => { void this.loadInventory(); });
    } else {
      const owned = nutrients.filter(item => (this.inventory[String(item.id)] ?? 0) > 0);
      if (owned.length === 0) this.text(488, 305, '栄養剤を所持していません。', 19, C.muted);
      else {
        this.text(488, 275, '栄養剤', 16);
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
        const count = this.inventory[String(this.material)] ?? 0;
        this.text(488, 391, '使用数', 17);
        this.button(590, 383, 42, 38, '−', () => { this.quantity = Math.max(1, this.quantity - 1); this.render(); }, false, this.quantity > 1);
        this.text(668, 402, String(this.quantity), 24).setOrigin(.5);
        this.button(703, 383, 42, 38, '＋', () => { this.quantity = Math.min(count, this.quantity + 1); this.render(); }, false, this.quantity < count);
        this.text(780, 393, `/ 所持 ${count}個`, 16, C.muted);
      }
    }
    this.pendingAction('レベル強化');
    // TODO: 契約済みの花を取得し、育成可否を検証する。
    // TODO: 成長テーブルから獲得経験値・次の能力・必要コインを算出し、ここに表示する。
    // TODO: 強化APIで花ID・素材ID・使用数を送信し、成功後の花と所持品を再取得する。
    // 選択中の数量や素材は表示用の状態。共有の花データや所持品は変更しない。
  }
  private async loadInventory(): Promise<void> {
    const request = ++this.inventoryRequest;
    this.inventoryStatus = 'loading';
    if (this.tab === 'level') this.render();
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
    if (this.tab === 'level') this.render();
  }
  private renderSkill(flower: CharacterData): void {
    const skill = getFlowerSkill(flower.id);
    const definition = skillDefinitions.skills.find(item => item.id === flower.id);
    this.text(488, 183, 'スキル強化', 23);
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
    this.text(1208, centerY - 43, `${this.page + 1}/${Math.ceil(testData.characters.length / 6)}`, 13, C.muted).setOrigin(.5, 1);
    const maxPage = Math.ceil(testData.characters.length / 6) - 1;
    this.button(51, centerY - 53 / 2, 42, 53, '‹', () => { this.page = Math.max(0, this.page - 1); this.render(); });
    this.button(1187, centerY - 53 / 2, 42, 53, '›', () => { this.page = Math.min(maxPage, this.page + 1); this.render(); });
    testData.characters.slice(this.page * 6, this.page * 6 + 6).forEach((flower, index) => {
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
    // TODO: 所有・契約状態のAPIを接続し、育成可能な花だけを一覧に表示する。
  }
}





