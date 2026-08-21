import Phaser from 'phaser';

import { TitleScene } from './Scene/TitleScene';
import { HomeScene } from './Scene/HomeScene';
import { SettingsScene } from './Scene/SettingsScene';
import { TrainingScene } from './Scene/TrainingScene';
import { CharacterDetailScene } from './Scene/CharacterDetailScene';
import { InventoryScene } from './Scene/InventoryScene';
import { TestScene } from './Scene/TestScene';

import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 1280,
  height: 720,

  parent: 'app',

  backgroundColor: '#cfe3f5',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    TitleScene,
    HomeScene,
    SettingsScene,
    TrainingScene,
    CharacterDetailScene,
    InventoryScene,
    TestScene,
  ],
};

new Phaser.Game(config);