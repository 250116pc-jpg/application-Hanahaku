/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import Phaser from 'phaser';
import { loadAudioSettings } from '../../audio/BgmManager';
import type { SkillVisualPhase } from './Player';

/** Short original synthesized accents, using the game's existing SE volume and mute. */
export class SkillSound {
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private readonly scene: Phaser.Scene;
  private readonly sources = new Set<AudioScheduledSourceNode>();
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 再生元を保持し、画面終了時に効果音を停止する
   * ================================== */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sources.forEach(source => { try { source.stop(); } catch { /* already ended */ } });
      this.sources.clear();
    });
  }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 音声の再生状態と音量を管理する
   * ================================== */
  play(phase: SkillVisualPhase, heavy: boolean): void {
    const manager = this.scene.sound;
    if (!(manager instanceof Phaser.Sound.WebAudioSoundManager)) return;
    const settings = loadAudioSettings(this.scene);
    if (settings.isMuted || manager.mute || settings.seVolume <= 0 || manager.context.state !== 'running') return;
    const ctx = manager.context;
    const now = ctx.currentTime;
    const heal = phase === 'heal' || phase === 'buff';
    const duration = heavy ? .32 : heal ? .22 : .1;
    const source = ctx.createOscillator();
    const gain = ctx.createGain();
    source.type = heal || phase === 'cast' ? 'sine' : 'triangle';
    const initial = heal ? 660 : phase === 'cast' ? 330 : heavy ? 170 : 440;
    source.frequency.setValueAtTime(initial, now);
    source.frequency.exponentialRampToValueAtTime(heal || phase === 'cast' ? initial * 1.5 : 65, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(settings.seVolume * .075, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    source.connect(gain); gain.connect(manager.destination);
    this.sources.add(source);
    source.onended = () => { source.disconnect(); gain.disconnect(); this.sources.delete(source); };
    source.start(now); source.stop(now + duration + .01);
  }
}
