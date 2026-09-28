import Phaser from 'phaser';

export const FONT_FAMILY = '"Yu Gothic", "Meiryo", sans-serif';

// 共通テキストスタイル
export const getTextStyle = (fontSize: number, extraOptions = {}): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontSize: `${fontSize}px`,
  color: '#000000',
  padding: { top: 8, bottom: 8, left: 8, right: 8 },
  ...extraOptions
});