// 担当：たまおちゃん｜音声再生・設定・SettingsVoice
import Phaser from 'phaser'
import { loadAudioSettings, resumeAudioFromGesture, setVoiceDucking } from './BgmManager'

const lines: Record<string, string> = {
  '音量を変更できるよ': 'welcome',
  'BGMを大きくしたよ': 'bgm-up',
  '効果音を大きくしたよ': 'se-up',
  'BGMを小さくしたよ': 'bgm-down',
  '効果音を小さくしたよ': 'se-down',
  '音を消したよ': 'muted',
  '音を戻したよ': 'unmuted',
  '最初の設定に戻したよ': 'reset',
}
const files = import.meta.glob('../assets/audio/zundamon/*.wav', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

export function preloadSettingsVoice(scene: Phaser.Scene): void {
  for (const id of Object.values(lines)) {
    const url = files['../assets/audio/zundamon/' + id + '.wav']
    if (url && !scene.cache.audio.exists('settings-voice-' + id)) {
      scene.load.audio('settings-voice-' + id, url)
    }
  }
}

export class SettingsVoice {
  private sound: Phaser.Sound.BaseSound | null = null
  private pendingUnlock: (() => void) | null = null
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stop())
  }

  stop(): void {
    if (this.pendingUnlock) this.scene.sound.off('unlocked', this.pendingUnlock)
    this.pendingUnlock = null
    this.sound?.destroy()
    this.sound = null
    setVoiceDucking(this.scene, false)
  }

  speak(message: string): void {
    this.stop()
    const id = lines[message]
    const settings = loadAudioSettings(this.scene)
    if (!id || settings.isMuted || settings.voiceVolume === 0) return
    const key = 'settings-voice-' + id
    if (!this.scene.cache.audio.exists(key)) return
    if (this.scene.sound.locked) {
      this.pendingUnlock = () => {
        this.pendingUnlock = null
        if (this.scene.scene.isActive()) this.speak(message)
      }
      this.scene.sound.once('unlocked', this.pendingUnlock)
      return
    }
    resumeAudioFromGesture(this.scene)
    const sound = this.scene.sound.add(key, { volume: settings.voiceVolume })
    this.sound = sound
    sound.once('complete', () => {
      if (this.sound === sound) {
        this.sound = null
        setVoiceDucking(this.scene, false)
      }
      sound.destroy()
    })
    setVoiceDucking(this.scene, true)
    if (!sound.play()) this.stop()
  }
}
