import Phaser from 'phaser';
import { preloadSettingsVoice } from '../audio/SettingsVoice';
import { mountSettingsBook } from '../display/SettingsBook';

export class SettingsScene extends Phaser.Scene {
  private returnScene = 'HomeScene';
  private resumeOnClose = false;
  constructor() { super('SettingsScene'); }
  init(data: { returnScene?: string; resumeOnClose?: boolean } = {}): void {
    this.returnScene = data.returnScene ?? 'HomeScene';
    this.resumeOnClose = data.resumeOnClose ?? false;
  }
  preload(): void { preloadSettingsVoice(this); }
  create(): void {
    this.cameras.main.setBackgroundColor('#20352d');
    mountSettingsBook(this, () => {
      if (this.resumeOnClose) { this.scene.resume(this.returnScene); this.scene.stop(); }
      else this.scene.start(this.returnScene);
    });
  }
}
