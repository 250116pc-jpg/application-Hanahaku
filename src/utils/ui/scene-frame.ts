/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import Phaser from 'phaser';
import { createTextButton } from './buttons';
import { getTextStyle } from './styles';
import { BACK_BUTTON_POSITION } from './back-button';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 共通の枠を定義する
 * ================================== */
const BACKGROUND_COLOR = '#cfe3f5';
const FRAME_COLOR = 0xcfe3f5;
const FRAME_BORDER_COLOR = 0x536878;

export const createStandardSceneFrame = (
  scene: Phaser.Scene,
  title: string,
  backLabel: string,
  onBack: () => void
): void => {
  const width = scene.scale.width;
  const height = scene.scale.height;

  scene.cameras.main.setScroll(0, 0);
  scene.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

  scene.add.rectangle(width / 2, height / 2, 1180, 650, FRAME_COLOR)
    .setStrokeStyle(3, FRAME_BORDER_COLOR);
  scene.add.text(width / 2, 55, title, getTextStyle(34)).setOrigin(0.5);
  createTextButton(scene, BACK_BUTTON_POSITION.x, BACK_BUTTON_POSITION.y, backLabel, onBack, {
    fontSize: 24,
    padding: { top: 10, bottom: 10, left: 18, right: 18 }
  });
};
