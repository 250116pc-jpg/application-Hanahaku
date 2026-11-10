/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜戦闘結果画面
import Phaser from 'phaser';
import { SCENE_KEYS } from '../sceneKeys';
import { BACK_BUTTON_POSITION, getTextStyle } from '../../utils/ui';
import { showDebugSceneName } from '../../debug';
import { playSe, stopBgm } from '../../audio/BgmManager';
import { navigateToTownMap } from '../HomeScene/townMapNavigation';

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
  constructor() { super(SCENE_KEYS.RESULT); }

  create(data: StageResultData): void {
    showDebugSceneName(this);
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 結果画面ではBGMを止め、契約画面からの遷移でない場合のみ勝敗に応じた効果音を再生する。
     * ================================== */
    stopBgm(this);
    if (!data.fromContract) {
      const resultSound = data.victory ? 'stage-clear' : 'game-over';
      playSe(this, resultSound, data.victory ? 0.75 : 0.5);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sound.stopByKey(resultSound));
    }
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c1722, 1);
    this.add.rectangle(width / 2, height / 2, width - 70, height - 70, 0x172a39, 1)
      .setStrokeStyle(3, data.victory ? 0xeacb7b : 0x8e9cab);
    this.add.text(width / 2, 145, data.victory ? 'ステージクリア！' : 'ゲームオーバー', getTextStyle(48, {
      color: data.victory ? '#ffe59c' : '#d9e1e8', fontStyle: 'bold', align: 'center',
    })).setOrigin(0.5);
    this.add.text(width / 2, 225, `ステージ ${data.stageNumber ?? `1-${data.stageId}`}`, getTextStyle(26, { color: '#ffffff' })).setOrigin(0.5);

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
    if (data.saveError && data.persisted === 'device') {
      this.add.text(width / 2, 438, data.saveError, getTextStyle(15, { color: '#f2c6b8', align: 'center' })).setOrigin(0.5);
    }

    if (data.contractMessage) {
      this.add.text(width / 2, 490, data.contractMessage, getTextStyle(24, {
        color: '#ffe59c', fontStyle: 'bold',
      })).setOrigin(0.5);
    }
    const buttonY = height - 105;
    if (!data.victory) this.createButton(width / 2 - 110, buttonY, 'もう一度', 0x527c63, () => {
      this.scene.start(SCENE_KEYS.STAGE, { stageId: data.stageId, stageNumber: data.stageNumber });
    });
    this.createButton(BACK_BUTTON_POSITION.x, BACK_BUTTON_POSITION.y, '‹ ステージ選択へ', 0x586f84, () => {
      this.scene.start(SCENE_KEYS.SELECT_STAGE, { areaId: 1 });
    });
    this.createButton(width / 2 + (data.victory ? 0 : 110), buttonY, '町マップへ', 0x80683e, () => {
      navigateToTownMap(this);
    });
  }

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
