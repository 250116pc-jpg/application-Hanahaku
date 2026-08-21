import Phaser from 'phaser';

import { TitleScene } from './Scene/TitleScene';
import { HomeScene } from './Scene/HomeScene';
import { SettingsScene } from './Scene/SettingsScene';
import { TrainingScene } from './Scene/TrainingScene';
import { CharacterDetailScene } from './Scene/CharacterDetailScene';
import { InventoryScene } from './Scene/InventoryScene';
import { TestScene } from './Scene/TestScene';
import { ShopScene } from './shop'
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
  scene: [
    TitleScene,
    HomeScene,
    SettingsScene,
    TrainingScene,
    CharacterDetailScene,
    InventoryScene,
    TestScene,
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

