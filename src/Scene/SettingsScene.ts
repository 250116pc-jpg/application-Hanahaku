import Phaser from 'phaser';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/AudioDefaults';
import { applyAudioSettings, loadAudioSettings, saveAudioSettings } from '../audio/BgmManager';
import { preloadSettingsVoice, SettingsVoice } from '../audio/SettingsVoice';
import { loadDisplaySettings, saveDisplaySettings, type DisplaySettings } from '../display/DisplaySettings';
import { logout } from '../auth/Session';
import '../display/SettingsScene.css';

const reactions = import.meta.glob('../assets/setting/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

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
    const voice = new SettingsVoice(this);
    const original = { ...loadAudioSettings(this) };
    let audio = { ...original };
    const display = { ...loadDisplaySettings() };
    let displayChanged = false;
    let finished = false;
    const root = document.createElement('section');
    root.className = 'garden-settings';
    root.setAttribute('aria-label', '設定');
    root.innerHTML = `
      <div class="settings-shell">
        <header><button type="button" data-back aria-label="変更を取り消して戻る">←</button><h1>設定</h1><span>花と過ごす、心地よい時間</span></header>
        <div class="settings-body">
          <main>
            <section data-page="sound"><h2>♫ サウンド</h2>
              <div class="sound-layout"><div class="sound-controls">
                ${[['bgmVolume','BGM音量'],['seVolume','SE音量'],['voiceVolume','音声音量']].map(([key,label]) => `<label class="volume-row" for="settings-${key}"><span>${label}</span><input id="settings-${key}" data-volume="${key}" type="range" min="0" max="100" step="1"><output for="settings-${key}"></output></label>`).join('')}
                <label class="mute-row"><input type="checkbox" data-mute role="switch"><span>ミュート</span></label>
              </div><aside class="settings-mascot"><p data-speech aria-live="polite">音量を調整できるよ</p><img alt="ずんだもん" data-reaction><small>音声：VOICEVOX:ずんだもん</small></aside></div>
            </section>
            <section data-page="display" hidden><h2>▣ 画面設定</h2>
              <label class="display-row">最大FPS<select data-fps><option value="30">30 FPS</option><option value="60">60 FPS（標準）</option><option value="120">120 FPS</option></select></label>
              <p>画面更新の上限です。実際のFPSは端末によって異なります。</p>
              <label class="display-row">画質<select data-quality><option value="crisp">標準：くっきり</option><option value="smooth">なめらか</option></select></label>
              <p>画面設定は保存後、次回の再読み込みから反映されます。</p>
            </section>
            <section data-page="guide" hidden><h2>✥ 操作ガイド</h2>
              <h3>音量を調整する</h3><p>つまみを左右に動かすと音量を試せます。「ミュート」で全体の音を切り替えます。音声の再生中はBGMが小さくなります。</p>
              <h3>設定を残す</h3><p>「保存して戻る」で変更を保存します。左上の矢印で戻ると、今回の変更を取り消します。</p>
              <h3>初期値に戻す</h3><p>サウンドはBGM${Math.round(DEFAULT_AUDIO_SETTINGS.bgmVolume * 100)}％・SE${Math.round(DEFAULT_AUDIO_SETTINGS.seVolume * 100)}％・音声${Math.round(DEFAULT_AUDIO_SETTINGS.voiceVolume * 100)}％、ミュート解除に戻ります。画面設定は60 FPS・標準に戻ります。保存すると確定します。</p>
              <h3>アカウントを切り替える</h3><p>「アカウント」のログアウトを押し、確認画面で決定してください。</p>
            </section>
            <section data-page="credits" hidden><h2>▤ クレジット</h2><h3>フラワーリンク -Flower link-</h3><p>制作：Aチーム（中村・武田・斎藤）</p><h3>音声</h3><p>VOICEVOX:ずんだもん</p><h3>BGM</h3><p>PeriTune<br>Frosylva / Harbor Morning / Ancient Gust</p><h3>効果音</h3><p>OtoLogic</p><h3>画像・制作支援</h3><p>ChatGPT / Gemini / 三日月アルペジオ / AutoSprite</p><h3>ゲームエンジン</h3><p>Phaser</p></section>
            <section data-page="account" hidden><h2>♙ アカウント</h2><p data-user></p><p>ログアウトするとログイン画面へ戻ります。</p><button type="button" data-logout>ログアウト…</button></section>
          </main>
          <nav aria-label="設定カテゴリ">${[['sound','♫','サウンド'],['display','▣','画面設定'],['guide','✥','操作ガイド'],['credits','▤','クレジット'],['account','♙','アカウント']].map(([key,icon,label]) => `<button type="button" data-tab="${key}" aria-pressed="${key==='sound'}"><span>${icon}</span> ${label}</button>`).join('')}</nav>
        </div>
        <footer><span data-status role="status"></span><button type="button" data-reset>初期値に戻す</button><button type="button" data-save>保存して戻る</button></footer>
      </div>`;
    const get = <T extends HTMLElement>(selector: string): T => root.querySelector<T>(selector)!;
    const status = get('[data-status]');
    const reaction = (file: string): void => { get<HTMLImageElement>('[data-reaction]').src = reactions[`../assets/setting/${file}.png`] ?? ''; };
    const speech = (message: string): void => { get('[data-speech]').textContent = message; voice.speak(message); };
    const refresh = (): void => {
      root.querySelectorAll<HTMLInputElement>('[data-volume]').forEach(input => {
        const key = input.dataset.volume as 'bgmVolume' | 'seVolume' | 'voiceVolume';
        input.value = String(Math.round(audio[key] * 100));
        input.style.setProperty('--volume', `${input.value}%`);
        input.nextElementSibling!.textContent = `${input.value}%`;
      });
      get<HTMLInputElement>('[data-mute]').checked = audio.isMuted;
      get<HTMLSelectElement>('[data-fps]').value = String(display.maxFps);
      get<HTMLSelectElement>('[data-quality]').value = display.quality;
      applyAudioSettings(this, audio);
    };
    root.querySelectorAll<HTMLInputElement>('[data-volume]').forEach(input => {
      const key = input.dataset.volume as 'bgmVolume' | 'seVolume' | 'voiceVolume';
      let previous = audio[key];
      input.addEventListener('input', () => {
        const next = Number(input.value)/100;
        const up = next >= audio[key];
        reaction(key === 'bgmVolume' ? (up ? 'BGM音量上げずんだ' : 'BGM下げずんだ') : key === 'seVolume' ? (up ? 'SE上げずんだ' : 'SE下げずんだ') : (up ? '音声音量上げずんだ' : '音声音量下げずんだ'));
        audio[key] = next; refresh();
      });
      input.addEventListener('change', () => {
        speech(key === 'voiceVolume' ? '音声の音量を変更したよ' : `${key === 'bgmVolume' ? 'BGM' : '効果音'}を${audio[key] < previous ? '小さく' : '大きく'}したよ`);
        previous = audio[key];
      });
    });
    get<HTMLInputElement>('[data-mute]').addEventListener('change', event => {
      audio.isMuted = (event.target as HTMLInputElement).checked; refresh();
      reaction(audio.isMuted ? 'ミュートずんだ' : 'ミュート解除ずんだ');
      speech(audio.isMuted ? '音を消したよ' : '音を戻したよ');
    });
    get<HTMLSelectElement>('[data-fps]').addEventListener('change', event => { display.maxFps = Number((event.target as HTMLSelectElement).value) as DisplaySettings['maxFps']; displayChanged = true; });
    get<HTMLSelectElement>('[data-quality]').addEventListener('change', event => { display.quality = (event.target as HTMLSelectElement).value as DisplaySettings['quality']; displayChanged = true; });
    let page = 'sound';
    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => button.addEventListener('click', () => {
      page = button.dataset.tab!;
      root.querySelectorAll<HTMLElement>('[data-page]').forEach(section => { section.hidden = section.dataset.page !== page; });
      root.querySelectorAll('[data-tab]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      get('main').scrollTop = 0;
      get<HTMLButtonElement>('[data-reset]').hidden = page !== 'sound' && page !== 'display';
      status.textContent = '';
    }));
    get('[data-reset]').addEventListener('click', () => {
      if (page === 'display') { display.maxFps = 60; display.quality = 'crisp'; displayChanged = true; }
      else { audio = { ...DEFAULT_AUDIO_SETTINGS }; reaction('初期値ずんだ'); }
      refresh(); speech('最初の設定に戻したよ'); status.textContent = '保存すると確定します';
    });
    const close = (save: boolean): void => {
      if (save && displayChanged && !saveDisplaySettings(display)) { status.textContent = '保存できませんでした。ブラウザの保存設定を確認してください。'; return; }
      if (save) saveAudioSettings(this, audio);
      else applyAudioSettings(this, original);
      finished = true;
      voice.stop();
      if (this.resumeOnClose) { this.scene.resume(this.returnScene); this.scene.stop(); }
      else this.scene.start(this.returnScene);
    };
    get('[data-back]').addEventListener('click', () => close(false));
    get('[data-save]').addEventListener('click', () => close(true));
    try {
      const user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null');
      get('[data-user]').textContent = user ? `ログイン中：${user.name}\n${user.email}` : '未ログイン';
    } catch { get('[data-user]').textContent = 'ユーザー情報を取得できませんでした。'; }
    let confirmation: HTMLDialogElement | null = null;
    get('[data-logout]').addEventListener('click', () => {
      if (confirmation) return;
      const dialog = document.createElement('dialog'); confirmation = dialog;
      dialog.className = 'garden-logout-confirm';
      dialog.setAttribute('aria-labelledby','logout-heading');
      dialog.innerHTML = '<h2 id="logout-heading">ログアウトしますか？</h2><p>保存していない設定は取り消されます。</p><p data-error role="alert"></p><div><button type="button" data-cancel autofocus>キャンセル</button><button type="button" data-confirm>ログアウトする</button></div>';
      let busy = false;
      dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
      dialog.addEventListener('close', () => { dialog.remove(); confirmation = null; get('[data-logout]').focus(); });
      dialog.querySelector('[data-cancel]')!.addEventListener('click', () => dialog.close());
      dialog.querySelector('[data-confirm]')!.addEventListener('click', () => {
        if (busy) return; busy = true;
        dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
        void logout().then(() => {
          applyAudioSettings(this, original); finished = true;
          for (const scene of this.scene.manager.getScenes(false)) if (scene !== this) this.scene.stop(scene.scene.key);
          this.scene.start('LoginScene');
        }).catch(() => { dialog.querySelector('[data-error]')!.textContent = 'ログアウトできませんでした。接続を確認して再度お試しください。'; })
          .finally(() => { busy = false; dialog.querySelectorAll('button').forEach(button => { button.disabled = false; }); });
      });
      document.body.append(dialog); dialog.showModal();
    });
    document.body.append(root);
    refresh(); reaction(audio.isMuted ? 'ミュートずんだ' : 'ミュート解除ずんだ'); voice.speak('音量を変更できるよ');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (!finished) applyAudioSettings(this, original);
      confirmation?.remove(); root.remove(); voice.stop();
    });
  }
}
