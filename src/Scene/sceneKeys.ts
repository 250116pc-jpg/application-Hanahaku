/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 識別子を定義する
 * ================================== */
export const SCENE_KEYS = {
  TITLE: 'TitleScene',
  LOGIN: 'LoginScene',
  REGISTER: 'RegisterScene',
  HOME: 'HomeScene',
  SETTINGS: 'SettingsScene',
  TRAINING: 'TrainingScene',
  CHARACTER_DETAIL: 'CharacterDetailScene',
  INVENTORY: 'InventoryScene',
  STAGE: 'StageScene',
  RESULT: 'StageResultScene',
  CONTRACT: 'ContractScene',
  STORY: 'StoryScene',
  AREA_SELECT: 'AreaSelectScene',
  SELECT_STAGE: 'SelectStageScene',
  ENCYCLOPEDIA: 'EncyclopediaScene',
  FORM: 'FormScene',
  SHOP: 'ShopScene',
  // 旧テスト画面用の未使用キー。TestScene本体は削除済みで、現在は起動・遷移に使用しない。
  TEST: 'TestScene',
} as const;
