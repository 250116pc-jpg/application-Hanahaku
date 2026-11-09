/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜ゲーム初期化と画面登録
import Phaser from 'phaser';
import { isBattlePreview } from './debug';

import { TitleScene } from './Scene/TitleScene';
import { HomeScene } from './Scene/HomeScene';
import { SettingsScene } from './Scene/SettingsScene';
import { TrainingScene } from './Scene/TrainingScene';
import { CharacterDetailScene } from './Scene/CharacterDetailScene';
import { InventoryScene } from './Scene/InventoryScene';
import { StageScene } from './Scene/stage/StageScene';
import { ContractScene } from './Scene/stage/ContractDialog';
import { StageResultScene } from './Scene/stage/StageResultScene';
import { SelectStageScene } from './Scene/SelectStageScene';
import { AreaSelectScene } from './Scene/AreaSelectScene';
import { StoryScene } from './Scene/story/StoryScene';
import { EncyclopediaScene } from './Scene/EncyclopediaScene';
import { FormScene } from './form/form'
import { ShopScene } from './Scene/shop/shop'
import { RegisterScene } from './Scene/RegisterScene';
import { LoginScene } from './Scene/LoginScene';
import './style.css';
import { loadDisplaySettings } from './display/DisplaySettings';
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 起動前に保存済みの描画設定を読み込む。
 * ================================== */
const displaySettings = loadDisplaySettings();



const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 1280,
  height: 720,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  parent: 'app',
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : PhaserのDOMコンテナを有効にしてHTMLベースの画面部品を表示できるようにする。
   * ================================== */
  dom: {
    createContainer: true
  },
  scene: [
    ...(isBattlePreview ? [StageScene] : []),
    ...(import.meta.env.DEV && new URLSearchParams(location.search).get('flower-test') === '1' ? [EncyclopediaScene] : []),
    TitleScene,
    LoginScene,
    RegisterScene,
    HomeScene,
    SettingsScene,
    TrainingScene,
    CharacterDetailScene,
    ...(isBattlePreview ? [] : [StageScene]),
    StageResultScene,
    ContractScene,
    StoryScene,
    InventoryScene,
    AreaSelectScene,
    SelectStageScene,
    ...(import.meta.env.DEV && new URLSearchParams(location.search).get('flower-test') === '1' ? [] : [EncyclopediaScene]),
    FormScene,
    ShopScene,
  ],

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: true
    }
  },

  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 保存した最大FPSと描画品質をPhaserのフレーム制御・ピクセル表示・アンチエイリアスへ反映する。
   * ================================== */
  fps: { target: displaySettings.maxFps, limit: displaySettings.maxFps },
  pixelArt: displaySettings.quality === 'crisp',
  render: { antialias: displaySettings.quality === 'smooth', antialiasGL: displaySettings.quality === 'smooth' },
  backgroundColor: '#000000'
}

const game = new Phaser.Game(config);
if (isBattlePreview) Object.assign(window, { __battlePreviewGame: game });
