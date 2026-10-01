import titleBgm from '../assets/audio/PathOfAdventure/PeriTune_Frosylva.mp3'
import homeBgm from '../assets/audio/PathOfAdventure/PeriTune_Harbor_Morning_loop.mp3'
import stageBgm from '../assets/audio/PathOfAdventure/Peritune_Ancient_Gust_loop.mp3'
import clickSe from '../assets/audio/PathOfAdventure/NoLoop/line.wav'


export const BGM_KEYS = {
  title: 'bgmTitle',
  home: 'bgmHome',
  stage: 'bgmStage'
} as const

const CLICK_SE_KEY = 'seClick'
const STORAGE_KEY = 'hanahakuAudioSettings'

export interface AudioSettings {
  bgmVolume: number
  seVolume: number
  voiceVolume: number
  isMuted: boolean
}

type AdjustableSound = Phaser.Sound.BaseSound & {
  setVolume: (value: number) => Phaser.Sound.BaseSound
}

type AudioState = {
  settings: AudioSettings
  currentKey: string | null
  currentSound: AdjustableSound | null
  pendingKey: string | null
  pendingClick: boolean
  unlockHooked: boolean
  installed: boolean
  voiceDucking: boolean
}

const states = new WeakMap<Phaser.Game, AudioState>()

function validVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Phaser.Math.Clamp(value, 0, 1)
    : fallback
}

function stateFor(scene: Phaser.Scene): AudioState {
  const existing = states.get(scene.game)
  if (existing) return existing

  let saved: Partial<AudioSettings> = {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    saved = parsed && typeof parsed === 'object' ? parsed as Partial<AudioSettings> : {}
  } catch {
    // 保存領域を使えないブラウザでも既定値で続行する。
  }

  const state: AudioState = {
    settings: {
      bgmVolume: validVolume(saved.bgmVolume, 0.5),
      seVolume: validVolume(saved.seVolume, 0.7),
      voiceVolume: validVolume(saved.voiceVolume, 1),
      isMuted: typeof saved.isMuted === 'boolean' ? saved.isMuted : false
    },
    currentKey: null,
    currentSound: null,
    pendingKey: null,
    pendingClick: false,
    unlockHooked: false,
    installed: false,
    voiceDucking: false
  }
  states.set(scene.game, state)
  scene.sound.mute = state.settings.isMuted
  return state
}

export function preloadAudio(scene: Phaser.Scene): void {
  scene.load.audio(BGM_KEYS.title, titleBgm)
  scene.load.audio(BGM_KEYS.home, homeBgm)
  scene.load.audio(BGM_KEYS.stage, stageBgm)
  scene.load.audio(CLICK_SE_KEY, clickSe)
}

function sceneBgmKey(scene: Phaser.Scene): string | null {
  if (scene.scene.key === 'TitleScene') return BGM_KEYS.title
  if (scene.scene.key === 'SettingsScene') return null
  if (scene.scene.key === 'StageScene') return BGM_KEYS.stage
  return BGM_KEYS.home
}

// TitleSceneのcreateから一度だけ呼ぶ。ゲーム処理のSceneには変更を加えない。
export function initializeAudio(scene: Phaser.Scene): void {
  const state = stateFor(scene)
  if (state.installed) return
  state.installed = true

  for (const target of scene.game.scene.scenes) {
    target.events.on(Phaser.Scenes.Events.CREATE, () => {
      const key = sceneBgmKey(target)
      if (key) playBgm(target, key)

      target.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, () => {
        const webAudio = target.sound as Phaser.Sound.WebAudioSoundManager
        const wasSuspended = webAudio.context?.state === 'suspended'
        resumeAudioFromGesture(target)
        if (target.sound.locked || wasSuspended) {
          state.pendingClick = true
          waitForUnlock(target, state)
        } else {
          playSe(target, CLICK_SE_KEY)
        }
      })
    })
  }
}

// Only the playing level is reduced; the user's stored BGM percentage is unchanged.
function bgmLevel(state: AudioState): number {
  return state.settings.bgmVolume * (state.voiceDucking ? 0.15 : 1)
}

export function setVoiceDucking(scene: Phaser.Scene, active: boolean): void {
  const state = stateFor(scene)
  state.voiceDucking = active
  state.currentSound?.setVolume(bgmLevel(state))
}

export function loadAudioSettings(scene: Phaser.Scene): AudioSettings {
  return { ...stateFor(scene).settings }
}

export function applyAudioSettings(scene: Phaser.Scene, next: AudioSettings): void {
  const state = stateFor(scene)
  state.settings = {
    bgmVolume: validVolume(next.bgmVolume, 0.5),
    seVolume: validVolume(next.seVolume, 0.7),
    voiceVolume: validVolume(next.voiceVolume, 1),
    isMuted: Boolean(next.isMuted)
  }
  scene.sound.mute = state.settings.isMuted
  state.currentSound?.setVolume(bgmLevel(state))
  scene.registry.set('bgmVolume', state.settings.bgmVolume)
  scene.registry.set('seVolume', state.settings.seVolume)
  scene.registry.set('voiceVolume', state.settings.voiceVolume)
  scene.registry.set('isMuted', state.settings.isMuted)
}

export function saveAudioSettings(scene: Phaser.Scene, next: AudioSettings): void {
  applyAudioSettings(scene, next)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateFor(scene).settings))
  } catch {
    // 保存不可でもゲーム中の音量は維持する。
  }
}

function playPending(scene: Phaser.Scene, state: AudioState): void {
  if (scene.sound.locked) return
  if (state.pendingKey) playBgm(scene, state.pendingKey)
  if (state.pendingClick) {
    state.pendingClick = false
    playSe(scene, CLICK_SE_KEY)
  }
}

function waitForUnlock(scene: Phaser.Scene, state: AudioState): void {
  if (state.unlockHooked) return
  state.unlockHooked = true
  scene.sound.once('unlocked', () => {
    state.unlockHooked = false
    playPending(scene, state)
  })
}

export function resumeAudioFromGesture(scene: Phaser.Scene): void {
  const state = stateFor(scene)
  const webAudio = scene.sound as Phaser.Sound.WebAudioSoundManager
  if (webAudio.context?.state === 'suspended') {
    void webAudio.context.resume().then(() => playPending(scene, state)).catch(() => {
      // 次のタップまたはPhaserのunlockedイベントで再試行する。
    })
  } else {
    playPending(scene, state)
  }
}

export function playBgm(scene: Phaser.Scene, key: string): void {
  const state = stateFor(scene)
  state.pendingKey = key
  if (!scene.cache.audio.exists(key)) {
    console.error(`BGMの読み込みに失敗しました: ${key}`)
    return
  }
  if (state.currentKey === key && state.currentSound?.isPlaying) {
    state.pendingKey = null
    return
  }

  // 旧曲を先に止めて、BGMが重ならないようにする。
  state.currentSound?.stop()
  state.currentSound?.destroy()
  state.currentSound = null
  state.currentKey = null

  if (scene.sound.locked) {
    waitForUnlock(scene, state)
    return
  }

  const sound = scene.sound.add(key, {
    loop: true,
    volume: bgmLevel(state)
  }) as AdjustableSound
  if (sound.play()) {
    state.currentSound = sound
    state.currentKey = key
    state.pendingKey = null
  } else {
    sound.destroy()
    waitForUnlock(scene, state)
  }
}

// 既存のスタートボタンからの呼び出しを維持する。
export function startBgm(scene: Phaser.Scene): void {
  playBgm(scene, BGM_KEYS.title)
}

export function playSe(scene: Phaser.Scene, key: string): void {
  if (scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: stateFor(scene).settings.seVolume })
  }
}
