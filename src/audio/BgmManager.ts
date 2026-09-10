import Phaser from 'phaser'

export const MAIN_BGM_KEY = 'mainBgm'

export interface AudioSettings {
  bgmVolume: number
  seVolume: number
  isMuted: boolean
}

type AdjustableSound = Phaser.Sound.BaseSound & {
  setVolume: (value: number) => Phaser.Sound.BaseSound
}

const STORAGE_KEY = 'hanahakuAudioSettings'
let bgm: AdjustableSound | null = null

export function loadAudioSettings(scene: Phaser.Scene): AudioSettings {
  let stored: Partial<AudioSettings> = {}
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    stored = {}
  }

  const settings: AudioSettings = {
    bgmVolume: numberOrDefault(scene.registry.get('bgmVolume'), stored.bgmVolume, 0.5),
    seVolume: numberOrDefault(scene.registry.get('seVolume'), stored.seVolume, 0.7),
    isMuted: booleanOrDefault(scene.registry.get('isMuted'), stored.isMuted, false)
  }
  setRegistry(scene, settings)
  return settings
}

export function startBgm(scene: Phaser.Scene): void {
  const settings = loadAudioSettings(scene)
  if (!bgm || bgm.pendingRemove) {
    bgm = scene.sound.add(MAIN_BGM_KEY, {
      loop: true,
      volume: settings.bgmVolume
    }) as AdjustableSound
  }
  applyAudioSettings(scene, settings)
  if (!bgm.isPlaying) bgm.play()
}

export function applyAudioSettings(scene: Phaser.Scene, settings: AudioSettings): void {
  bgm?.setVolume(settings.bgmVolume)
  scene.sound.mute = settings.isMuted
}

export function saveAudioSettings(scene: Phaser.Scene, settings: AudioSettings): void {
  setRegistry(scene, settings)
  applyAudioSettings(scene, settings)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // 保存できない環境でも、現在のゲーム中はRegistryの値を使用する
  }
}

function setRegistry(scene: Phaser.Scene, settings: AudioSettings): void {
  scene.registry.set('bgmVolume', settings.bgmVolume)
  scene.registry.set('seVolume', settings.seVolume)
  scene.registry.set('isMuted', settings.isMuted)
}

function numberOrDefault(
  registryValue: unknown,
  storedValue: unknown,
  fallback: number
): number {
  if (typeof registryValue === 'number') return registryValue
  if (typeof storedValue === 'number') return Phaser.Math.Clamp(storedValue, 0, 1)
  return fallback
}

function booleanOrDefault(
  registryValue: unknown,
  storedValue: unknown,
  fallback: boolean
): boolean {
  if (typeof registryValue === 'boolean') return registryValue
  if (typeof storedValue === 'boolean') return storedValue
  return fallback
}
