import Phaser from 'phaser';

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
  dom: {
    createContainer: true
  },
  scene: [
    ...(import.meta.env.DEV && new URLSearchParams(location.search).get('flower-test') === '1' ? [EncyclopediaScene] : []),
    TitleScene,
    LoginScene,
    RegisterScene,
    HomeScene,
    SettingsScene,
    TrainingScene,
    CharacterDetailScene,
    StageScene,
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

  fps: { target: displaySettings.maxFps, limit: displaySettings.maxFps },
  pixelArt: displaySettings.quality === 'crisp',
  render: { antialias: displaySettings.quality === 'smooth', antialiasGL: displaySettings.quality === 'smooth' },
  backgroundColor: '#000000'
}

new Phaser.Game(config)
