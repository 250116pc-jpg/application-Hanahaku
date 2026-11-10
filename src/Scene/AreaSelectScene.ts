// 担当：たまおちゃん｜エリア選択画面
import Phaser from 'phaser';
import backgroundImage from '../assets/ui/eria_back.png';
import buttonImage from '../assets/ui/eria_btn.png';
import { preloadBackButton, createBackButton, applySmoothDisplay, smoothText, getHeadingTextStyle, FONT_FAMILY } from '../utils/ui';
import { SCENE_KEYS } from './sceneKeys';
import { navigateToTownMap } from './HomeScene/townMapNavigation'

type AreaInfo = { id: number; name: string; description: string; x: number; y: number; unlocked: boolean; difficulty: string };

// 【素材の切り出し】配列は元画像上の [左端X, 上端Y, 幅, 高さ]。
// openは緑の解放済み、lockedは黒いロック付きの番号ボタン。
const FRAMES: Record<string, [number, number, number, number]> = {
  'open-1': [80, 40, 245, 240], 'open-2': [355, 40, 245, 240],
  'open-3': [630, 40, 245, 240], 'open-4': [905, 40, 245, 240],
  'open-5': [1180, 40, 245, 240], 'open-6': [1450, 40, 245, 240],
  'locked-1': [80, 285, 245, 240], 'locked-2': [355, 285, 245, 240],
  'locked-3': [630, 285, 245, 240], 'locked-4': [905, 285, 245, 240],
  'locked-5': [1180, 285, 245, 240], 'locked-6': [1450, 285, 245, 240],
  location: [480, 530, 820, 180], confirm: [845, 710, 810, 170],
};

export class AreaSelectScene extends Phaser.Scene {
  // 【エリア情報】配置座標は背景の1672×941基準。解放状態は再読み込みでリセット。
  private readonly areas: AreaInfo[] = [
    { id: 1, name: 'Village 1', description: '開けた花畑の入り口。', x: 303, y: 333, unlocked: false, difficulty: 'Easy' },
    { id: 2, name: 'Village 2', description: '小さな広場と整備された道。', x: 575, y: 330, unlocked: false, difficulty: 'Easy' },
    { id: 3, name: 'Village 3', description: '南側の静かなエリア。', x: 451, y: 450, unlocked: false, difficulty: 'Normal' },
    { id: 4, name: 'Village 4', description: '森の中の連戦区域。', x: 735, y: 442, unlocked: false, difficulty: 'Normal' },
    { id: 5, name: 'Village 5', description: '奥地に広がる危険域。', x: 763, y: 714, unlocked: false, difficulty: 'Hard' },
    { id: 6, name: 'Village 6', description: '最終防衛地点。', x: 976, y: 680, unlocked: false, difficulty: 'Hard' },
  ];
  private selectedAreaId = 1;
  private layout!: Phaser.GameObjects.Container;
  private areaNameText!: Phaser.GameObjects.Text;
  private areaDescText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private statusBackground!: Phaser.GameObjects.Rectangle;
  private selectionRing!: Phaser.GameObjects.Arc;
  private markers: Phaser.GameObjects.Image[] = [];
  private confirmButton!: Phaser.GameObjects.Image;

  constructor() { super(SCENE_KEYS.AREA_SELECT); }

  // 【画像の読み込み】元の画像を加工せずフレームとして切り出して使う。
  preload(): void {
    this.load.image('area-background', backgroundImage);
    this.load.image('area-buttons', buttonImage);
    preloadBackButton(this);
  }

  create(): void {
    this.prepareTextures();
    // 【画面全体の配置】背景とUIの縦横比を保ち、ゲーム画面に収める。
    const scale = Math.min(this.scale.width / 1672, this.scale.height / 941);
    this.layout = this.add.container((this.scale.width - 1672 * scale) / 2, (this.scale.height - 941 * scale) / 2).setScale(scale);
    this.layout.add(this.add.image(0, 0, 'area-background').setOrigin(0));
    this.selectionRing = this.add.circle(0, 0, 41, 0xffdb70, 0).setStrokeStyle(5, 0xffdf7c);
    this.layout.add(this.selectionRing);

    // 【数字ボタン】ロック状態でも選択できる。選択と解放は別々に扱う。
    this.markers = this.areas.map(area => {
      const marker = this.add.image(area.x, area.y, 'area-buttons', `locked-${area.id}`)
        .setDisplaySize(82, 80).setInteractive({ useHandCursor: true });
      marker.on('pointerdown', () => this.selectArea(area.id));
      this.layout.add(marker);
      return marker;
    });

    // 【右側の詳細】引数は中心X・中心Y・文字・文字サイズ・色・折り返し幅。
    this.areaNameText = this.addLabel(1355, 330, '', 58);
    this.statusBackground = this.add.rectangle(1355, 392, 184, 40, 0x555555).setStrokeStyle(3, 0xc7a25b);
    this.layout.add(this.statusBackground);
    this.statusText = this.addLabel(1355, 392, '', 27, '#fff8df');
    this.areaDescText = this.addLabel(1355, 520, '', 29, '#241c13', 390).setFontFamily(FONT_FAMILY);
    this.difficultyText = this.addLabel(1430, 620, '', 30).setFontFamily(FONT_FAMILY);
    this.addLabel(1238, 620, '❀ 難易度', 27).setFontFamily(FONT_FAMILY);

    this.addImageButton('location', 1340, 105, 380, 97, () => this.checkCurrentLocation());
    // 共通の高さを使い、背景に描かれた見出しの右に置く。
    createBackButton(this,
      { width: 180, height: 55, fontSize: 23 },
      () => navigateToTownMap(this)
    ).setX(560);
    this.confirmButton = this.addImageButton('confirm', 1355, 714, 455, 96, () => {
      const area = this.areas.find(item => item.id === this.selectedAreaId);
      if (area?.unlocked) this.scene.start(SCENE_KEYS.SELECT_STAGE, { areaId: area.id, areaName: area.name });
    });
    this.selectArea(this.selectedAreaId);
  }

  // 【画像と画質】各部品の切り出し範囲を登録。Canvasは退出時に元の設定へ戻す。
  private prepareTextures(): void {
    const texture = this.textures.get('area-buttons');
    Object.entries(FRAMES).forEach(([name, [x, y, width, height]]) => {
      if (!texture.has(name)) texture.add(name, 0, x, y, width, height);
    });
    applySmoothDisplay(this, ['area-buttons', 'area-background']);
  }
 
  // 【文字の配置】書体・色の基本設定はutils/ui/styles.tsを使用する。
  private addLabel(x: number, y: number, text: string, size: number, color = '#171710', wrapWidth?: number): Phaser.GameObjects.Text {
    const label = smoothText(this.add.text(x, y, text, getHeadingTextStyle(size, {
      color, wordWrap: wrapWidth ? { width: wrapWidth } : undefined
    })).setOrigin(0.5));
    this.layout.add(label);
    return label;
  }

  private addImageButton(frame: string, x: number, y: number, width: number, height: number, onClick: () => void): Phaser.GameObjects.Image {
    const button = this.add.image(x, y, 'area-buttons', frame).setDisplaySize(width, height).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setTint(0xffe6ba));
    button.on('pointerout', () => button.clearTint());
    button.on('pointerdown', onClick);
    this.layout.add(button);
    return button;
  }

  // 【現在地確認】位置情報判定を追加する入口。
  private checkCurrentLocation(): void {
    const area = this.areas.find(item => item.id === this.selectedAreaId);
    if (!area) return;
    // TODO: ここで位置情報を取得し、選択中エリアの座標・許容距離と照合する。
    // 現地にいると判定できた場合だけ以下を実行する。現在は確認用の仮解放。
    area.unlocked = true;
    this.selectArea(area.id);
  }

  // 【選択表示の更新】詳細・解放状態・遷移可否・番号画像をまとめて更新。
  private selectArea(id: number): void {
    const area = this.areas.find(item => item.id === id);
    if (!area) return;
    this.selectedAreaId = id;
    this.areaNameText.setText(`エリア ${id}`);
    this.areaDescText.setText(area.description);
    this.difficultyText.setText(area.difficulty);
    this.statusText.setText(area.unlocked ? '解放済み' : '未解放');
    this.statusBackground.setFillStyle(area.unlocked ? 0x087e86 : 0x555555);
    this.confirmButton.clearTint().setAlpha(area.unlocked ? 1 : 0.45);
    if (area.unlocked) this.confirmButton.setInteractive({ useHandCursor: true });
    else this.confirmButton.disableInteractive();
    this.selectionRing.setPosition(area.x, area.y);
    this.markers.forEach((marker, index) => {
      const item = this.areas[index];
      marker.setFrame(`${item.unlocked ? 'open' : 'locked'}-${item.id}`).setAlpha(item.id !== id ? 0.85 : 1);
    });
  }
}
