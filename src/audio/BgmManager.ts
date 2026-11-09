import { DEFAULT_AUDIO_SETTINGS } from './AudioDefaults'
import titleBgm from '../assets/audio/PathOfAdventure/PeriTune_Frosylva.mp3'
import homeBgm from '../assets/audio/PathOfAdventure/PeriTune_Harbor_Morning_loop.mp3'
import stageBgm from '../assets/audio/PathOfAdventure/Peritune_Ancient_Gust_loop.mp3'
import shopBgm from '../assets/audio/PathOfAdventure/PerituneMaterial_Harvest6_loop.mp3'
import encyclopediaBgm from '../assets/audio/PathOfAdventure/PerituneMaterial_Glimmering_Woods_loop.mp3'
import clickSe from '../assets/audio/PathOfAdventure/NoLoop/line.wav'
// CC0: artisticdude (Swishes Sound Pack).
import playerSwordSwing from '../assets/audio/player-sword-swing.wav'
import playerSwordHit from '../assets/audio/player-sword-hit.wav'
import playerDamage from '../assets/audio/player-damage.wav'
import gameOverSe from '../assets/audio/game-over.wav'
// CC0: Fupi (Win Jingle, winfretless.ogg).
import stageClearSe from '../assets/audio/stage-clear.ogg'
// CC0: artisticdude (RPG Sound Pack, lighter cloth).
import playerJumpSe from '../assets/audio/player-jump.wav'
// CC0: StarNinjas (10 Impact/Shield Blocks, impact.2.ogg).
import playerGuardHitSe from '../assets/audio/player-guard-hit.ogg'
const seAssets = import.meta.glob('../assets/audio/se-lab/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export type UiSe = 'confirm' | 'select' | 'cancel' | 'open' | 'purchase' | 'error' | 'recover' | 'confirm-wood'
// Use ?se-confirm=wood to compare the wooden confirmation sound.
const lastUiSound = new WeakMap<Phaser.Game, number>()
export function playUiSe(scene: Phaser.Scene, kind: UiSe, volumeScale = 1): void {
  lastUiSound.set(scene.game, performance.now())
  resumeAudioFromGesture(scene)
  const selected = kind === 'confirm' && new URLSearchParams(location.search).get('se-confirm') === 'wood' ? 'confirm-wood' : kind
  playSe(scene, `ui-${selected}`, volumeScale)
}


export const BGM_KEYS = {
  title: 'bgmTitle',
  home: 'bgmHome',
  stage: 'bgmStage',
  shop: 'bgmShop',
  encyclopedia: 'bgmEncyclopedia'
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
      bgmVolume: validVolume(saved.bgmVolume, DEFAULT_AUDIO_SETTINGS.bgmVolume),
      seVolume: validVolume(saved.seVolume, DEFAULT_AUDIO_SETTINGS.seVolume),
      voiceVolume: validVolume(saved.voiceVolume, DEFAULT_AUDIO_SETTINGS.voiceVolume),
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
  scene.load.audio(BGM_KEYS.shop, shopBgm)
  scene.load.audio(BGM_KEYS.encyclopedia, encyclopediaBgm)
  scene.load.audio(CLICK_SE_KEY, clickSe)
  scene.load.audio('player-sword-swing', playerSwordSwing)
  scene.load.audio('player-sword-hit', playerSwordHit)
  scene.load.audio('player-damage', playerDamage)
  scene.load.audio('game-over', gameOverSe)
  scene.load.audio('stage-clear', stageClearSe)
  scene.load.audio('player-jump', playerJumpSe)
  scene.load.audio('player-crouch', playerJumpSe)
  scene.load.audio('player-guard-hit', playerGuardHitSe)
  for (const [path, url] of Object.entries(seAssets)) scene.load.audio(`ui-${path.split('/').pop()!.replace('.mp3', '')}`, url)
}

function sceneBgmKey(scene: Phaser.Scene): string | null {
  if (scene.scene.key === 'TitleScene') return BGM_KEYS.title
  // Overlays keep the BGM of the scene underneath, including paused battles.
  if (scene.scene.key === 'SettingsScene' || scene.scene.key === 'InventoryScene') return null
  // Contract and result scenes manage their own jingles.
  if (scene.scene.key === 'ContractScene' || scene.scene.key === 'StageResultScene') return null
  if (scene.scene.key === 'StageScene') return BGM_KEYS.stage
  if (scene.scene.key === 'ShopScene') return BGM_KEYS.shop
  if (scene.scene.key === 'EncyclopediaScene') return BGM_KEYS.encyclopedia
  return BGM_KEYS.home
}

// TitleSceneのcreateから一度だけ呼ぶ。ゲーム処理のSceneには変更を加えない。
export function initializeAudio(scene: Phaser.Scene): void {
  const state = stateFor(scene)
  if (state.installed) return
  state.installed = true

  // DOM overlays do not emit Phaser input events. Resume inside a real gesture,
  // including the first tap after Safari has interrupted the audio context.
  const resumeOnGesture = (event: Event): void => {
    if (event.isTrusted) resumeAudioFromGesture(scene)
  }
  for (const event of ['pointerup', 'touchend', 'keydown']) {
    document.addEventListener(event, resumeOnGesture, { capture: true, passive: true })
  }
  scene.game.events.once(Phaser.Core.Events.DESTROY, () => {
    for (const event of ['pointerup', 'touchend', 'keydown']) {
      document.removeEventListener(event, resumeOnGesture, true)
    }
  })

  for (const target of scene.game.scene.scenes) {
    target.events.on(Phaser.Scenes.Events.CREATE, () => {
      const key = sceneBgmKey(target)
      if (key) playBgm(target, key)

      target.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
        const webAudio = target.sound as Phaser.Sound.WebAudioSoundManager
        const wasSuspended = !!webAudio.context && webAudio.context.state !== 'running'
        resumeAudioFromGesture(target)
        if (object.name === 'stage-attack' || object.name === 'stage-jump' || object.name === 'stage-guard') return
        if (target.sound.locked || wasSuspended) {
          state.pendingClick = true
          waitForUnlock(target, state)
        } else {
          // Scene handlers may play a more specific sound in this same gesture.
          queueMicrotask(() => {
            if (performance.now() - (lastUiSound.get(target.game) ?? -Infinity) > 50) playSe(target, CLICK_SE_KEY)
          })
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
    bgmVolume: validVolume(next.bgmVolume, DEFAULT_AUDIO_SETTINGS.bgmVolume),
    seVolume: validVolume(next.seVolume, DEFAULT_AUDIO_SETTINGS.seVolume),
    voiceVolume: validVolume(next.voiceVolume, DEFAULT_AUDIO_SETTINGS.voiceVolume),
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
  if (webAudio.context && webAudio.context.state !== 'running' && webAudio.context.state !== 'closed') {
    void webAudio.context.resume().then(() => playPending(scene, state)).catch(() => {
      // 次のタップまたはPhaserのunlockedイベントで再試行する。
    })
  } else {
    playPending(scene, state)
  }
}

export function stopBgm(scene: Phaser.Scene): void {
  const state = stateFor(scene)
  state.pendingKey = null
  state.currentSound?.stop()
  state.currentSound?.destroy()
  state.currentSound = null
  state.currentKey = null
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
  stopBgm(scene)
  state.pendingKey = key

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

export function playSe(scene: Phaser.Scene, key: string, volumeScale = 1): void {
  if (!stateFor(scene).settings.isMuted && scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: stateFor(scene).settings.seVolume * volumeScale })
  }
}
