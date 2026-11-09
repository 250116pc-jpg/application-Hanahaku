// 担当：たまおちゃん｜共通UI・styles
import Phaser from 'phaser';

export const HEADING_FONT_FAMILY = '"Yu Mincho", "MS PMincho", serif';
export const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif';

// 共通テキストスタイル
export const getTextStyle = (fontSize: number, extraOptions = {}): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontSize: `${fontSize}px`,
  color: '#000000',
  padding: { top: 8, bottom: 8, left: 8, right: 8 },
  ...extraOptions
});
// 画像UI用の本文スタイル。既存のgetTextStyleは従来の余白・色を維持する。
export const getBodyTextStyle = (fontSize: number, extraOptions: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY, fontSize: fontSize + 'px', color: '#171710', fontStyle: 'bold', align: 'center',
  padding: { top: 0, bottom: 0, left: 0, right: 0 }, ...extraOptions
});

export const getHeadingTextStyle = (fontSize: number, extraOptions: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle =>
  getBodyTextStyle(fontSize, { fontFamily: HEADING_FONT_FAMILY, ...extraOptions });
