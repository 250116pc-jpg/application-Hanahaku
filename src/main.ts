import Phaser from 'phaser';

import { TitleScene } from './Scene/TitleScene';
import { HomeScene } from './Scene/HomeScene';
import { SettingsScene } from './Scene/SettingsScene';
import { TrainingScene } from './Scene/TrainingScene';
import { CharacterDetailScene } from './Scene/CharacterDetailScene';
import { InventoryScene } from './Scene/InventoryScene';
import { StageScene } from './Scene/stage/StageScene';
import { SelectStageScene } from './Scene/SelectStageScene';
import { AreaSelectScene } from './Scene/AreaSelectScene';
import { StoryScene } from './Scene/story/StoryScene';
import { EncyclopediaScene } from './Scene/EncyclopediaScene';
import { FormScene } from './form/form'
import { ShopScene } from './Scene/shop/shop'
import { RegisterScene } from './Scene/RegisterScene';
import { LoginScene } from './Scene/LoginScene';
import './style.css';



const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 1280,
  height: 720,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  parent: 'app',
  dom: {
    createContainer: true
  },
  scene: [
    TitleScene,
    LoginScene,
    RegisterScene,
    HomeScene,
    SettingsScene,
    TrainingScene,
    CharacterDetailScene,
    StageScene,
    StoryScene,
    InventoryScene,
    AreaSelectScene,
    SelectStageScene,
    EncyclopediaScene,
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

  pixelArt: true,
  backgroundColor: '#000000'
}

new Phaser.Game(config)
