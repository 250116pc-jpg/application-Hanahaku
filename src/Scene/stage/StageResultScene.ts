/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { transitionWithLoading } from '../../utils/ui/scene-loading';
import Phaser from 'phaser';
import { SCENE_KEYS } from '../sceneKeys';
import { BACK_BUTTON_POSITION, getTextStyle } from '../../utils/ui';
import { showDebugSceneName } from '../../debug';
import { playSe, stopBgm } from '../../audio/BgmManager';
import { navigateToTownMap } from '../HomeScene/townMapNavigation';

/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
interface StageResultData {
  stageId: number;
  stageNumber?: string;
  victory: boolean;
  reward: number;
  coins: number;
  persisted: 'server' | 'device';
  saveError?: string;
  contractMessage?: string;
  fromContract?: boolean;
}

export class StageResultScene extends Phaser.Scene {
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() { super(SCENE_KEYS.RESULT); }

  create(data: StageResultData): void {
    /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
     * 処理内容 : 画面のBGM・効果音と音声設定を準備する
     * ================================== */
    showDebugSceneName(this);
    stopBgm(this);
    if (!data.fromContract) {
      const resultSound = data.victory ? 'stage-clear' : 'game-over';
      playSe(this, resultSound, data.victory ? 0.75 : 0.5);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sound.stopByKey(resultSound));
    }
    const { width, height } = this.scale;
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 画像・文字・パネルを配置する
     * ================================== */
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c1722, 1);
    this.add.rectangle(width / 2, height / 2, width - 70, height - 70, 0x172a39, 1)
      .setStrokeStyle(3, data.victory ? 0xeacb7b : 0x8e9cab);
    this.add.text(width / 2, 145, data.victory ? 'ステージクリア！' : 'ゲームオーバー', getTextStyle(48, {
      color: data.victory ? '#ffe59c' : '#d9e1e8', fontStyle: 'bold', align: 'center',
    })).setOrigin(0.5);
    this.add.text(width / 2, 225, `ステージ ${data.stageNumber ?? `1-${data.stageId}`}`, getTextStyle(26, { color: '#ffffff' })).setOrigin(0.5);

    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 画像・文字・パネルを配置する
     * ================================== */
    const summary = data.victory
      ? `報酬　${data.reward} コイン\n所持コイン　${data.coins}`
      : '今回の報酬はありません';
    this.add.text(width / 2, 330, summary, getTextStyle(30, {
      color: '#ffffff', align: 'center', lineSpacing: 18,
    })).setOrigin(0.5);
    this.add.text(width / 2, 405,
      data.victory
        ? data.persisted === 'server' ? '進行状況を保存しました' : 'この端末に進行状況を保存しました'
        : 'ステージ選択画面から再挑戦できます',
      getTextStyle(18, { color: data.victory ? data.persisted === 'server' ? '#a9e6c1' : '#ffd79a' : '#d9e1e8' })).setOrigin(0.5);
    /* === [ 担当 : 250116 中村伊安 ] ===
     * 処理内容 : 画像・文字・パネルを配置する
     * ================================== */
    if (data.saveError && data.persisted === 'device') {
      this.add.text(width / 2, 438, data.saveError, getTextStyle(15, { color: '#f2c6b8', align: 'center' })).setOrigin(0.5);
    }

    if (data.contractMessage) {
      this.add.text(width / 2, 490, data.contractMessage, getTextStyle(24, {
        color: '#ffe59c', fontStyle: 'bold',
      })).setOrigin(0.5);
    }
    const buttonY = height - 105;
    /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
     * 処理内容 : ボタン操作に応じて画面を切り替える
     * ================================== */
    if (!data.victory) this.createButton(width / 2 - 110, buttonY, 'もう一度', 0x527c63, () => {
      transitionWithLoading(this, SCENE_KEYS.STAGE, { stageId: data.stageId, stageNumber: data.stageNumber });
    });
    this.createButton(BACK_BUTTON_POSITION.x, BACK_BUTTON_POSITION.y, '‹ ステージ選択へ', 0x586f84, () => {
      transitionWithLoading(this, SCENE_KEYS.SELECT_STAGE, { areaId: 1 });
    });
    this.createButton(width / 2 + (data.victory ? 0 : 110), buttonY, '町マップへ', 0x80683e, () => {
      navigateToTownMap(this);
    });
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 結果画面のボタンと選択時の処理を作る
   * ================================== */
  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 190, 58, color, 1).setStrokeStyle(2, 0xf0d891);
    const text = this.add.text(0, 0, label, getTextStyle(20, { color: '#ffffff', fontStyle: 'bold' })).setOrigin(0.5);
    button.add([bg, text]).setSize(190, 58).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerup', onClick);
  }
}
