/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
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
import { LoginScene } from './Scene/LoginScene';
import './style.css';
import { loadDisplaySettings } from './display/DisplaySettings';
import { loadGlobalPlayerCharacter } from './animation/playerCharacter';
/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : 起動処理を定義する
 * ================================== */
const displaySettings = loadDisplaySettings();



const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 1280,
  height: 720,

  scale: {
    // FITはキャンバスの縦横比を1280×720のまま維持し、画面に収まる最大サイズへ拡大する。
    // 画面比率と異なる端末では、上下または左右に水色の余白を残してもよい。
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    // 図鑑などはdocument.body直下のDOMで描画するため、キャンバスだけでなくページ全体をフルスクリーンに含める。
    fullscreenTarget: document.documentElement
  },

  parent: 'app',
  dom: {
    createContainer: true
  },
  scene: [
    ...(isBattlePreview ? [StageScene] : []),
    ...(import.meta.env.DEV && new URLSearchParams(location.search).get('flower-test') === '1' ? [EncyclopediaScene] : []),
    TitleScene,
    LoginScene,
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
      debug: false
    }
  },

  fps: { target: displaySettings.maxFps, limit: displaySettings.maxFps },
  pixelArt: displaySettings.quality === 'crisp',
  render: { antialias: displaySettings.quality === 'smooth', antialiasGL: displaySettings.quality === 'smooth' },
  backgroundColor: '#000000'
}

async function startGame(): Promise<void> {
  await loadGlobalPlayerCharacter();
  document.documentElement.dataset.menuButtonSize = loadDisplaySettings().menuButtonSize;
  const game = new Phaser.Game(config);
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : キーボード開閉・画面回転後の実表示位置でタッチ座標を補正し、終了時に監視を解除する
   * ================================== */
  const syncInputBounds = (): void => {
    if (!game.isBooted || !game.canvas.isConnected) return;
    game.scale.updateBounds();
    const bounds = game.scale.canvasBounds;
    if (bounds.width > 0 && bounds.height > 0) {
      game.scale.displayScale.set(game.scale.baseSize.width / bounds.width, game.scale.baseSize.height / bounds.height);
    }
  };
  const syncBeforeInput = (event: Event): void => {
    if (event.target === game.canvas) syncInputBounds();
  };
  // Safariではキーボードやアドレス欄の伸縮がwindow.resizeだけでは通知されない場合がある。
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', syncInputBounds);
  viewport?.addEventListener('scroll', syncInputBounds);
  window.addEventListener('touchstart', syncBeforeInput, { capture: true, passive: true });
  window.addEventListener('pointerdown', syncBeforeInput, { capture: true, passive: true });
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    viewport?.removeEventListener('resize', syncInputBounds);
    viewport?.removeEventListener('scroll', syncInputBounds);
    window.removeEventListener('touchstart', syncBeforeInput, true);
    window.removeEventListener('pointerdown', syncBeforeInput, true);
  });

  if (displaySettings.borderless) {
    // ブラウザは読み込み直後のFullscreen API呼び出しを拒否するため、最初の実タップ時に要求する。
    const cleanup = (): void => {
      document.removeEventListener('pointerup', onFirstPointerUp);
      game.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, cleanup);
      game.scale.off(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, onFullscreenUnsupported);
      game.scale.off(Phaser.Scale.Events.FULLSCREEN_FAILED, onFullscreenFailed);
      game.events.off(Phaser.Core.Events.DESTROY, cleanup);
    };
    const onFullscreenUnsupported = (): void => {
      console.warn('このブラウザではフルスクリーン表示を利用できません。');
      cleanup();
    };
    const onFullscreenFailed = (error: Error): void => {
      console.warn('フルスクリーン表示を開始できませんでした。', error);
      cleanup();
    };
    const onFirstPointerUp = (event: PointerEvent): void => {
      if (!event.isTrusted) return;
      // 起動後にOFFへ変更された場合は、保存済みの古いON状態で復元しない。
      if (!loadDisplaySettings().borderless) {
        cleanup();
        return;
      }
      if (game.scale.isFullscreen) {
        cleanup();
        return;
      }
      game.scale.startFullscreen();
    };

    game.scale.once(Phaser.Scale.Events.ENTER_FULLSCREEN, cleanup);
    game.scale.once(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, onFullscreenUnsupported);
    game.scale.once(Phaser.Scale.Events.FULLSCREEN_FAILED, onFullscreenFailed);
    game.events.once(Phaser.Core.Events.DESTROY, cleanup);
    document.addEventListener('pointerup', onFirstPointerUp);
  }
  if (isBattlePreview) Object.assign(window, { __battlePreviewGame: game });
}

void startGame();
