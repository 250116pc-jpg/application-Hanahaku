import { createFittedContainer, createImageButton } from '../utils/ui';
import { enableSceneUiLayout } from '../utils/ui/layout';
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250116
 * 氏名：武田優人、中村伊安
 * ================================== */
import Phaser from 'phaser';
import { openSceneWithLoading, trackSceneLoading } from '../utils/ui/scene-loading';
import testData, { getFlowerSkill } from './test_data';
import type { CharacterData } from './test_data';
import { SCENE_KEYS } from './sceneKeys';
import { navigateToTownMap } from './HomeScene/townMapNavigation'
import { applySmoothDisplay, BACK_BUTTON_POSITION } from '../utils/ui';
import background from '../assets/ui/training_background.png';
import parchment from '../assets/ui/training_panel.png';
import buttonArtwork from '../assets/ui/training_button_wood.png';
import selectedTabArtwork from '../assets/ui/training_tab_wood_selected.png';
import titleOrnament from '../assets/ui/training_title_ornament.png';
import compactButtonArtwork from '../assets/ui/training_button_wood_square.png';
import skillDefinitions from '../../php/skill/skills.json';
import { getMenuButtonDimensions } from '../display/MenuButtonLayout';
import { requestShop, shopCatalog } from './shop/ShopApi';
import { getShopItemImageUrl } from './shop/assets';
import { getPhpBaseUrl } from '../auth/PhpBaseUrl';
import { playSe } from '../audio/BgmManager';
import trainingScrollPreview from '../assets/audio/training-scroll-preview.mp3';
import trainingLevelPreview from '../assets/audio/training-level-preview.mp3';
import { MAX_FLOWER_LEVEL, experienceThresholds, flowerStats, batchPreview, materialExperience, targetMaterials, skillThresholds } from './training/trainingRules';

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 花の表示・レベル強化・スキル強化を定義する
 * ================================== */
const flowerImages = import.meta.glob('../assets/images/pixel_flowers/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const skillImages = import.meta.glob('../assets/system/skill/icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
type Tab = 'status' | 'level' | 'skill';
// 花の共通定義を変更せず、ログインユーザーのDB保存値を重ねて使う。
type TrainingFlower = CharacterData & { exp: string; skillLevel: number; skillExp: string };
const TABS: Array<[Tab, string]> = [['status', 'ステータス'], ['level', 'レベル強化'], ['skill', 'スキル強化']];
const C = { ink: '#17243d', muted: '#79694f', gold: '#d9b579', green: '#315b57', cream: 0xf8f4e8, line: 0xc5aa76, navy: 0x102d45 };
const CONTENT_OFFSET_Y = 20;
const seeds = shopCatalog.filter(item => item.id >= 6 && item.id <= 10);
const nutrients = shopCatalog.filter(item => item.category === 'material' && item.name.startsWith('栄養剤'));

export class TrainingScene extends Phaser.Scene {
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private selectedId = testData.characters.find(flower => flower.code === 'sunflower')?.id ?? testData.characters[0].id;
  private tab: Tab = 'status';
  private page = 0;
  private targetLevel = 2;
  private targetPlan?: ReturnType<typeof targetMaterials>;
  private selectedMaterials: Record<string, number> = {};
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

  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() { super(SCENE_KEYS.TRAINING); }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 呼び出し元と表示対象を受け取る
   * ================================== */
  init(data: { characterId?: number } = {}): void {
    if (testData.characters.some(flower => flower.id === data.characterId)) this.selectedId = data.characterId!;
    this.page = Math.floor(testData.characters.findIndex(flower => flower.id === this.selectedId) / 6);
    this.selectedMaterials = {};
    this.targetLevel = 2;
    this.targetPlan = undefined;
  }
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    this.load.audio('training-scroll-preview', trainingScrollPreview);
    this.load.audio('training-level-preview', trainingLevelPreview);
    this.load.image('training-garden', background);
    this.load.image('training-parchment', parchment);
    this.load.image('training-button', buttonArtwork);
    this.load.image('training-tab', selectedTabArtwork);
    this.load.image('training-compact-button', compactButtonArtwork);
    this.load.image('training-title-ornament', titleOrnament);
    // 栄養剤と種はショップと同じ画像対応を使う。
    [...nutrients, ...seeds].forEach(item => this.load.image(`training-nutrient-${item.id}`, getShopItemImageUrl(item.id)));
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
    enableSceneUiLayout(this);
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : タブ・パネル用の画像と描画素材を準備する
     * ================================== */
    this.lifecycle++;
    this.upgrading = false;
    this.upgradeMessage = '';
    // 生成画像の透明余白だけを省き、配置とボタン寸法は従来のままにする。
    const buttonFrames: Array<[string, number, number, number, number]> = [
      ['training-button', 25, 122, 2122, 459],
      ['training-tab', 9, 102, 2154, 492],
      ['training-compact-button', 74, 81, 1106, 1098],
    ];
    buttonFrames.forEach(([key, x, y, width, height]) => {
      const texture = this.textures.get(key);
      if (!texture.has('rect')) texture.add('rect', 0, x, y, width, height);
    });
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : タブ・パネル用の画像と描画素材を準備する
     * ================================== */
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
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 画像・文字・パネルを配置する
     * ================================== */
    this.layout = createFittedContainer(this);
    this.layout.add(this.add.image(640, 360, 'training-garden').setDisplaySize(1280, 720));
    this.layout.add(this.add.rectangle(640, 360, 1280, 720, 0x20120a, .14));
    this.portraitId = -1;
    this.portrait = this.add.container(0, CONTENT_OFFSET_Y); this.layout.add(this.portrait);
    this.content = this.add.container(0, CONTENT_OFFSET_Y); this.layout.add(this.content);
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 演出レイヤーと見出しを配置し、読込状態を初期化する
     * ================================== */
    this.effects = this.add.container(0, CONTENT_OFFSET_Y); this.layout.add(this.effects);
    this.createHeader();
    this.inventory = {};
    this.inventoryStatus = 'loading';
    this.ownedFlowers = [];
    this.flowersStatus = 'loading';
    this.render();
    trackSceneLoading(this, this.loadInventory());
    trackSceneLoading(this, this.loadOwnedFlowers());
    applySmoothDisplay(this, ['training-garden', 'training-parchment', 'training-button', 'training-tab', 'training-compact-button', 'training-title-ornament']);
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 表示状態と操作フラグを初期化する
     * ================================== */
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.stopByKey('training-scroll-preview');
      this.sound.stopByKey('training-level-preview');
      this.inventoryRequest++; // 終了後や再入場前の通信結果を描画しない。
      this.flowersRequest++;
      this.lifecycle++;
      this.finishEffect?.(); this.finishEffect = undefined;
      this.idle?.remove(); this.idle = undefined;
    });
  }

  // 描画部品。配置は1280×720で統一し、見た目の変更はこのファイルで完結する。
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 位置・大きさ・色を指定して文字を生成する
   * ================================== */
  private text(x: number, y: number, value: string, size = 20, color = C.ink): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, value, { fontFamily: '"Yu Gothic", "Meiryo", sans-serif', fontSize: size, color, fontStyle: 'bold', resolution: 2 });
    this.content.add(text); return text;
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 指定した大きさと色で枠付きの背景を描く
   * ================================== */
  private box(x: number, y: number, w: number, h: number, color = C.cream, radius = 16, border = C.line): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().fillStyle(color).fillRoundedRect(x, y, w, h, radius).lineStyle(1, border).strokeRoundedRect(x, y, w, h, radius);
    this.content.add(g); return g;
  }
  // 花飾りの四隅を保ち、中央だけ伸ばせる共通パネル。
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 背景画像を使った表示用パネルを配置する
   * ================================== */
  private panel(x: number, y: number, w: number, h: number): void {
    const corner = Math.min(68, h / 3);
    this.content.add(this.add.nineslice(x + w / 2, y + h / 2, 'training-panel-ui', undefined, w, h, corner, corner, corner, corner));
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 操作可能なボタンとクリック時の処理を作る
   * ================================== */
  private button(x: number, y: number, w: number, h: number, label: string, action: () => void, selected = false, enabled = true): Phaser.GameObjects.Text {
    const dimensions = getMenuButtonDimensions(w, h);
    const centerX = x + w / 2, centerY = y + h / 2;
    const isTab = h === 58;
    const isCompact = w <= 54;
    const texture = isCompact ? 'training-compact-button' : isTab && selected ? 'training-tab' : 'training-button';
    const large = dimensions.fontScale > 1;
    return createImageButton(this, {
      parent: this.content, x: centerX, y: centerY, width: large ? dimensions.width : w, height: large ? dimensions.height : h,
      texture, frame: 'rect', label, layoutId: `TrainingScene.${label}`,
      imageWidth: large ? dimensions.width : isCompact ? Math.min(46, w + 8) : isTab ? w : w + 8,
      imageHeight: large ? dimensions.height : isCompact ? Math.min(46, h + 8) : isTab ? h : h + 7,
      textStyle: { fontSize: (isCompact ? (w < 32 ? 20 : 24) : 18) * dimensions.fontScale, resolution: 2 },
      enabled, hoverAlpha: .8, onClick: action,
    }).label;
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 表示に使う画像・アニメーションを用意する
   * ================================== */
  private flowerImage(flower: CharacterData, x: number, y: number, size: number): Phaser.GameObjects.Image | undefined {
    const key = `training-flower-${flower.id}`;
    if (!this.textures.exists(key)) return undefined;
    const image = this.add.image(x, y, key).setScale(size / Math.max(this.textures.get(key).getSourceImage().width, this.textures.get(key).getSourceImage().height));
    this.content.add(image); return image;
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 長い説明文を表示幅に合わせて改行する
   * ================================== */
  private wrapped(value: string, columns = 28): string {
    return value.split('\n').map(line => Array.from(line).reduce((result, char, index) => result + (index && index % columns === 0 ? '\n' : '') + char, '')).join('\n');
  }

  // タイトルと戻るボタンは固定し、本文・花・強化演出だけを同じ量だけ下げる。
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 見出しと戻るボタンを配置する
   * ================================== */
  private createHeader(): void {
    const content = this.content;
    this.content = this.add.container(0, 0);
    this.layout.add(this.content);
    this.text(640, 43, '育成', 40, '#fff4dc')
      .setFontFamily('"Yu Mincho", "MS PMincho", serif').setFontStyle('normal')
      .setOrigin(.5).setShadow(0, 2, '#241008', 3, true, true);
    this.content.add(this.add.image(640, 74, 'training-title-ornament', 'divider').setScale(300 / 2172));
    this.button(BACK_BUTTON_POSITION.x - 70, BACK_BUTTON_POSITION.y - 8, 140, 36, '‹  町マップへ', () => navigateToTownMap(this));
    this.content = content;
  }

  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 選択内容に合わせて表示を更新する
   * ================================== */
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
      this.button(x, 88, 256, 58, label, () => { this.tab = tab; this.resetTargetSelection(); this.upgradeMessage = ''; this.render(); }, this.tab === tab);
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
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 選択した花の画像と基本情報を表示する
   * ================================== */
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
      openSceneWithLoading(this, SCENE_KEYS.ENCYCLOPEDIA, { flowerId: flower.id, returnToTraining: true });
    });
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 花の能力値とスキルを表示する
   * ================================== */
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
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 選択した複数素材を送信用の一覧にし、成長結果をプレビューする
   * ================================== */
  private materials(): Array<{ itemId: number; quantity: number }> {
    return Object.entries(this.selectedMaterials).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ itemId: Number(id), quantity }));
  }
  private previewMaterials(flower: TrainingFlower, materials = this.materials()) {
    const skill = this.tab === 'skill';
    return batchPreview(flower.id, skill ? flower.skillLevel : flower.level, skill ? flower.skillExp : flower.exp, materials, this.inventory, skill);
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 目標を変更したときだけ素材を自動選択し、その後の個数の手動調整を保持する
   * ================================== */
  private chooseTarget(target: number, clearMessage = true): void {
    const flower = this.ownedFlowers.find(item => item.id === this.selectedId);
    if (!flower || this.tab === 'status') return;
    const skill = this.tab === 'skill', level = skill ? flower.skillLevel : flower.level;
    const maximum = skill ? skillThresholds.length : MAX_FLOWER_LEVEL;
    const availableLevel = this.maximumTarget(flower);
    this.targetLevel = Math.min(availableLevel, Math.max(level + 1, target));
    // 次のレベルに届かない場合も、所持素材でEXPだけを加算できるようにする。
    const planningLevel = this.targetLevel > level ? this.targetLevel : Math.min(maximum, level + 1);
    const plan = targetMaterials(flower.id, level, skill ? flower.skillExp : flower.exp, planningLevel, this.inventory, skill);
    this.targetPlan = { ...plan, targetLevel: this.targetLevel, missingExp: this.targetLevel > level ? plan.missingExp : 0 };
    this.selectedMaterials = Object.fromEntries(this.targetPlan.materials.map(item => [String(item.itemId), item.quantity]));
    if (clearMessage) this.upgradeMessage = '';
  }
  private resetTargetSelection(): void {
    this.selectedMaterials = {}; this.targetPlan = undefined;
    const flower = this.ownedFlowers.find(item => item.id === this.selectedId);
    if (flower) this.chooseTarget((this.tab === 'skill' ? flower.skillLevel : flower.level) + 1);
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 所持素材を使って到達できる最高レベルを求め、上限ボタンの目標にする
   * ================================== */
  private maximumTarget(flower: TrainingFlower): number {
    const skill = this.tab === 'skill', level = skill ? flower.skillLevel : flower.level;
    const maximum = skill ? skillThresholds.length : MAX_FLOWER_LEVEL;
    if (level >= maximum || this.inventoryStatus !== 'ready') return level;
    return targetMaterials(flower.id, level, skill ? flower.skillExp : flower.exp, maximum, this.inventory, skill).reachableLevel;
  }
  private renderLevel(flower: TrainingFlower): void {
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : レベル・スキル強化の素材と操作を表示する
     * ================================== */
    const isSkill = this.tab === 'skill';
    const materials = isSkill ? seeds : nutrients;
    const currentLevel = isSkill ? flower.skillLevel : flower.level;
    const currentExp = isSkill ? flower.skillExp : flower.exp;
    const maxLevel = isSkill ? skillThresholds.length : MAX_FLOWER_LEVEL;
    const preview = this.previewMaterials(flower);
    this.text(488, 183, isSkill ? 'スキル強化' : 'レベル強化', 23);
    if (isSkill) this.text(1216, 185, getFlowerSkill(flower.id)?.name ?? 'スキル未設定', 16, C.muted).setOrigin(1, 0);
    this.text(488, 226, preview.used ? `Lv.${currentLevel}  →  Lv.${preview.afterLevel}` : `Lv.${currentLevel} / ${maxLevel}`, 29, C.green);
    this.text(786, 226, '目標', 14);
    this.button(830, 218, 26, 24, '−', () => { this.chooseTarget(this.targetLevel - 1); this.render(); }, false, !this.upgrading && this.targetLevel > currentLevel + 1);
    this.text(892, 230, 'Lv.' + this.targetLevel, 19).setOrigin(.5);
    const availableLevel = this.maximumTarget(flower);
    this.button(930, 218, 26, 24, '＋', () => { this.chooseTarget(this.targetLevel + 1); this.render(); }, false,
      !this.upgrading && this.inventoryStatus === 'ready' && this.targetLevel < availableLevel);
    this.button(1122, 215, 90, 32, '上限', () => { this.chooseTarget(availableLevel); this.render(); }, false,
      !this.upgrading && this.inventoryStatus === 'ready' && availableLevel > currentLevel);
    if (!isSkill && preview.used) this.text(851, 258, 'HP ' + flower.stats.hp + ' → ' + preview.stats?.hp + ' ／ ATK ' + flower.stats.atk + ' → ' + preview.stats?.atk, 14, C.green);
    this.expText = this.text(488, 258, `累計EXP  ${BigInt(currentExp).toLocaleString('ja-JP')}${preview.used ? `  →  ${preview.afterExp.toLocaleString('ja-JP')}` : ''}`, 16, C.muted);
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 経験値ゲージと複数素材の個数選択・消費後の所持数を表示する
     * ================================== */
    this.content.add(this.add.rectangle(488, 279, 728, 3, 0xd8ceb4).setOrigin(0, .5));
    this.expFill = this.add.rectangle(488, 279, 0, 3, 0xa99150).setOrigin(0, .5);
    this.content.add(this.expFill);
    this.updateExperienceGauge(Math.min(Number(currentExp), isSkill ? skillThresholds[skillThresholds.length - 1] : experienceThresholds[MAX_FLOWER_LEVEL - 1]));
    if (this.inventoryStatus === 'loading') {
      this.text(488, 315, '所持している素材を読み込み中…', 18, C.muted);
    } else if (this.inventoryStatus === 'error') {
      this.text(488, 310, this.wrapped(this.inventoryError, 36), 17, '#9b4739');
      this.button(1040, 363, 176, 40, '再読み込み', () => { void this.loadInventory(); });
    } else {
      const owned = materials.filter(item => (this.inventory[String(item.id)] ?? 0) > 0);
      if (!owned.length) this.text(488, 315, isSkill ? '種を所持していません。' : '栄養剤を所持していません。', 19, C.muted);
      owned.forEach((item, index) => {
        const x = 488 + index * 148, quantity = this.selectedMaterials[String(item.id)] ?? 0;
        const count = this.inventory[String(item.id)] ?? 0;
        this.box(x, 293, 136, 99, quantity ? 0xffeac1 : 0xf1e6cf, 6, quantity ? 0xcf943b : 0xd6c29b);
        const image = this.add.image(x + 20, 315, `training-nutrient-${item.id}`);
        image.setScale(30 / Math.max(image.width, image.height)); this.content.add(image);
        this.text(x + 40, 302, item.name, 12);
        this.text(x + 40, 321, `所持 ${count} → ${count - quantity}`, 11, C.muted);
        const unit = materialExperience(flower.id, item.id, isSkill);
        this.text(x + 8, 341, `1個 ${unit} EXP`, 11, C.muted);
        const change = (amount: number): void => {
          const next = Math.max(0, Math.min(count, quantity + amount));
          if (next) this.selectedMaterials[String(item.id)] = next;
          else delete this.selectedMaterials[String(item.id)];
          this.upgradeMessage = ''; this.render();
        };
        this.button(x + 8, 365, 26, 24, '−', () => change(-1), false, quantity > 0 && !this.upgrading);
        this.text(x + 68, 377, String(quantity), 18).setOrigin(.5);
        this.button(x + 102, 365, 26, 24, '＋', () => change(1), false,
          !this.upgrading && quantity < count && currentLevel < maxLevel && preview.discarded === 0 && preview.afterLevel < maxLevel);
      });
    }
    this.text(488, 400, `合計 ${preview.used}個 ／ 獲得EXP +${preview.gain.toLocaleString('ja-JP')}`, 16, C.green);
    if (preview.discarded > 0) this.text(488, 423, `上限超過の ${preview.discarded.toLocaleString('ja-JP')} EXP は加算されません。`, 13, '#9b4739');
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 素材と自動選択計画を解除し、目標を現在の次のレベルへ戻す（上限以内）
     * ================================== */
    this.button(835, 434, 125, 38, '選択解除', () => {
      this.selectedMaterials = {};
      this.targetPlan = undefined;
      this.targetLevel = Math.min(maxLevel, currentLevel + 1);
      this.upgradeMessage = '';
      this.render();
    }, false, !this.upgrading && preview.used > 0);
    const shortage = this.targetPlan?.missingExp ? '目標まで ' + this.targetPlan.missingExp.toLocaleString('ja-JP') + ' EXP不足（到達可能 Lv.' + this.targetPlan.reachableLevel + '）' : '';
    const message = this.upgrading ? '強化しています…' : this.upgradeMessage || shortage || preview.reason;
    this.upgradeStatusText = this.text(488, 447, this.wrapped(message, 27), 13, C.muted).setLineSpacing(3);
    this.upgradeButtonLabel = this.button(986, 430, 200, 46, this.upgrading ? '強化中…' : '強化', () => { void this.upgradeLevel(flower); }, true,
      !this.upgrading && this.inventoryStatus === 'ready' && !preview.reason && preview.used > 0);
    // TODO: プレイヤーレベルが実装されたら、育成上限をmin(50, プレイヤーレベル)にする。
    // 回復力の基本値・成長反映は別途決定する。
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 所持アイテムを取得する
   * ================================== */
  private async loadInventory(silent = false): Promise<void> {
    const request = ++this.inventoryRequest;
    this.inventoryStatus = 'loading';
    if (!silent && this.tab !== 'status') this.render();
    try {
      // ログインユーザーのusers.itemsを読む既存API。購入・消費は行わない。
      const state = await requestShop('state');
      if (request !== this.inventoryRequest || !this.sys.isActive()) return;
      if (!state.items || typeof state.items !== 'object' || Array.isArray(state.items) ||
          Object.values(state.items).some(count => !Number.isSafeInteger(count) || count < 0)) {
        throw new Error('所持品データの形式を確認してください。');
      }
      this.inventory = state.items;
      this.inventoryStatus = 'ready';
      if (this.flowersStatus === 'ready') this.chooseTarget(this.targetLevel, false);
    } catch (error) {
      if (request !== this.inventoryRequest || !this.sys.isActive()) return;
      this.inventoryStatus = 'error';
      this.inventoryError = error instanceof Error ? error.message : '所持品を読み込めませんでした。';
    }
    if (!silent && this.tab !== 'status') this.render();
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 所持花と育成値を取得する
   * ================================== */
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
      const progress = new Map<number, { level: number; exp: string; skillLevel: number; skillExp: string }>();
      for (const row of result.flowers) {
        if (!row || !Number.isSafeInteger(row.flowerId) || row.flowerId < 1 || progress.has(row.flowerId) ||
            !Number.isSafeInteger(row.level) || row.level < 1 || !Number.isSafeInteger(row.skillLevel) || row.skillLevel < 1 ||
            typeof row.skillExp !== 'string' || !/^[0-9]+$/.test(row.skillExp) || typeof row.exp !== 'string' || !/^[0-9]+$/.test(row.exp)) {
          throw new Error('花の育成データが正しくありません。');
        }
        progress.set(row.flowerId, { level: row.level, exp: row.exp, skillLevel: row.skillLevel, skillExp: row.skillExp });
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
      if (this.inventoryStatus === 'ready') this.chooseTarget(this.targetLevel, false);
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
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : レベル・スキル強化を送信して結果を反映する
     * ================================== */
    if (this.upgrading || this.inventoryStatus !== 'ready' || this.flowersStatus !== 'ready') return;
    const isSkill = this.tab === 'skill';
    const preview = this.previewMaterials(flower);
    if (preview.reason || preview.used < 1) return;
    const lifecycle = this.lifecycle;
    const body = { kind: isSkill ? 'skill' : 'level', flowerId: flower.id, materials: this.materials(), expectedLevel: isSkill ? flower.skillLevel : flower.level, expectedExp: isSkill ? flower.skillExp : flower.exp };
    this.upgrading = true;
    this.upgradeMessage = '';
    this.input.enabled = false;
    // 保存中はラベルだけ変更し、画面を消したり読み込み表示へ戻したりしない。
    this.upgradeButtonLabel?.setText('保存中…');
    /* === [ 担当 : 250082 武田優人 ] ===
     * 処理内容 : 強化結果を保存して応答の形式と値を検証する
     * ================================== */
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
          typeof result.skillExp !== 'string' || !/^[0-9]+$/.test(result.skillExp) ||
          (isSkill ? result.skillLevel !== preview.afterLevel || Number(result.skillExp) !== preview.afterExp : result.level !== preview.afterLevel || Number(result.exp) !== preview.afterExp) ||
          this.materials().some(item => result.items?.[String(item.itemId)] !== (this.inventory[String(item.itemId)] ?? 0) - item.quantity) ||
          !result.items || typeof result.items !== 'object' || Array.isArray(result.items) || Object.values(result.items).some(count => !Number.isSafeInteger(count) || Number(count) < 0)) {
        throw new Error('強化結果を確認できませんでした。最新の状態を取得します。');
      }
      // サーバーが保存に成功した結果を受け取ってから、成功演出を開始する。
      /* === [ 担当 : 250082 武田優人 ] ===
       * 処理内容 : 保存後の育成値と素材所持数を更新する
       * ================================== */
      await this.playUpgradeEffect(flower, isSkill ? result.skillLevel : result.level, Number(isSkill ? result.skillExp : result.exp));
      if (lifecycle !== this.lifecycle || !this.sys.isActive()) return;
      const stats = flowerStats(flower.id, result.level);
      this.ownedFlowers = this.ownedFlowers.map(item => item.id === flower.id ? {
        ...item, level: result.level, exp: result.exp, skillLevel: result.skillLevel, skillExp: result.skillExp,
        stats: { ...item.stats, hp: stats?.hp ?? 0, mp: stats?.mp ?? 0, atk: stats?.atk ?? 0, def: stats?.def ?? 0 },
      } : item);
      this.inventory = { ...result.items };
      this.selectedMaterials = {};
      /* === [ 担当 : 250082 武田優人 ] ===
       * 処理内容 : 送信中の状態を解除して入力操作を復元する
       * ================================== */
      this.upgradeMessage = '強化しました。';
    } catch (error) {
      if (lifecycle !== this.lifecycle || !this.sys.isActive()) return;
      this.upgradeMessage = error instanceof Error && error.name !== 'AbortError' ? error.message : '通信結果を確認できませんでした。最新の状態を取得します。';
      // 応答消失で保存済みの可能性もある。成功演出は出さず、裏で最新値を確認する。
      await Promise.all([this.loadOwnedFlowers(true), this.loadInventory(true)]);
    } finally {
      window.clearTimeout(timer);
      if (lifecycle === this.lifecycle && this.sys.isActive()) {
        this.selectedMaterials = {};
        this.chooseTarget(this.targetLevel, false);
        this.upgrading = false;
        this.input.enabled = true;
        this.render();
      }
    }
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 累計経験値からレベルとゲージの長さを更新する
   * ================================== */
  private updateExperienceGauge(exp: number): number {
    const thresholds = this.tab === 'skill' ? skillThresholds : experienceThresholds;
    const maximum = thresholds.length;
    let level = 1;
    while (level < maximum && exp >= thresholds[level]) level++;
    const start = thresholds[level - 1];
    const end = thresholds[level] ?? start;
    const ratio = level === maximum ? 1 : Phaser.Math.Clamp((exp - start) / (end - start), 0, 1);
    this.expFill?.setSize(728 * ratio, 3);
    return level;
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 強化成功の演出を表示する
   * ================================== */
  private playUpgradeEffect(before: TrainingFlower, afterLevel: number, afterExp: number): Promise<void> {
    const isSkill = this.tab === 'skill';
    const beforeLevel = isSkill ? before.skillLevel : before.level;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 300 : 1100;
    this.upgradeButtonLabel?.setText('強化中…');
    this.upgradeStatusText?.setText(afterLevel > beforeLevel ? (isSkill ? 'スキルレベルが上がりました！' : '花のレベルが上がりました！') : '経験値を獲得しました。');
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
    const title = this.add.text(236, 237, afterLevel > beforeLevel ? (isSkill ? 'SKILL UP!' : 'LEVEL UP!') : 'EXP UP!', {
      fontFamily: 'Georgia, serif', fontSize: 30, fontStyle: 'bold', color: '#fff1b8', stroke: '#75502a', strokeThickness: 3, resolution: 2,
    }).setOrigin(.5).setAlpha(0);
    this.effects.add(title);
    this.tweens.add({ targets: title, alpha: 1, y: 221, duration: duration * .25, yoyo: true, hold: duration * .35 });
    const counter = { exp: Number(isSkill ? before.skillExp : before.exp) };
    let levelSoundPlayed = false;
    if (afterExp > counter.exp) playSe(this, 'training-scroll-preview', 0.25);
    return new Promise(resolve => {
      this.finishEffect = resolve;
      this.tweens.add({ targets: counter, exp: afterExp, duration, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const exp = Math.floor(counter.exp);
          const level = this.updateExperienceGauge(exp);
          this.expText?.setText(`累計EXP  ${exp.toLocaleString('ja-JP')}`);
          if (!levelSoundPlayed && level > beforeLevel && afterLevel > beforeLevel) {
            levelSoundPlayed = true;
            this.sound.stopByKey('training-scroll-preview');
            playSe(this, 'training-level-preview', 0.4);
          }
          if (!isSkill) this.portraitLevel?.setText(`Lv.${Math.max(before.level, level)}`);
        },
        onComplete: () => {
          this.sound.stopByKey('training-scroll-preview');
          this.effects.removeAll(true);
          this.finishEffect = undefined;
          resolve();
        },
      });
    });
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : スキル強化の表示を作る
   * ================================== */
  private renderSkill(flower: TrainingFlower): void {
    this.renderLevel(flower);
    // 戦闘開始時にPHPがDBの花レベルから攻撃力を計算し、skill_levelをスキルの倍率・効果へ適用する。
  }
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 所持花一覧とページ操作を表示する
   * ================================== */
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
      hit.on('pointerup', () => { this.selectedId = flower.id; this.resetTargetSelection(); this.render(); });
    });
    // 契約の登録は別の処理で行い、この画面はplayer_flowersの取得結果だけを表示する。
  }
}




