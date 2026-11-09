/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜画面表示・設定・SettingsPanel
import Phaser from 'phaser';
import { loadDisplaySettings, saveDisplaySettings, type DisplaySettings } from './DisplaySettings';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 画面設定・操作案内・クレジットのパネルを開き、設定値の変更、保存、初期化を行う。
 * ================================== */
export function openSettingsPanel(scene: Phaser.Scene): void {
  if (document.querySelector('.display-settings-dialog')) return;
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'display-settings-dialog';
  dialog.setAttribute('aria-labelledby', 'display-settings-heading');
  dialog.innerHTML = `
    <h2 id="display-settings-heading">画面設定・クレジット</h2>
    <form>
      <label for="max-fps">最大FPS</label>
      <select id="max-fps"><option value="30">30 FPS</option><option value="60">60 FPS（標準）</option><option value="120">120 FPS</option></select>
      <p>画面更新の上限です。実際のFPSは端末やディスプレイによって異なります。</p>
      <label for="display-quality">画質設定</label>
      <select id="display-quality"><option value="crisp">標準：くっきり</option><option value="smooth">なめらか</option></select>
      <p>画像の拡大・縮小時の見え方を変更します。設定は次回の再読み込みから反映されます。</p>
      <div class="display-settings-actions"><button type="button" data-reset>初期値に戻す</button><button type="submit">画面設定を保存</button></div>
      <p role="status" aria-live="polite" data-status></p>
    </form>
    <details><summary>クレジットを見る</summary>
      <h3>フラワーリンク -Flower link-</h3>
      <p>制作：Aチーム（中村・武田・斎藤）</p>
      <h3>音声</h3><p>VOICEVOX:ずんだもん</p>
      <h3>BGM</h3><p>PeriTune<br>Frosylva / Harbor Morning / Ancient Gust</p>
      <h3>効果音</h3><p>OtoLogic</p>
      <h3>画像・制作支援</h3><p>ChatGPT / Gemini / 三日月アルペジオ / AutoSprite</p>
      <h3>ゲームエンジン</h3><p>Phaser</p>
    </details>
    <button type="button" data-close>閉じる</button>`;
  const fps = dialog.querySelector<HTMLSelectElement>('#max-fps')!;
  const quality = dialog.querySelector<HTMLSelectElement>('#display-quality')!;
  const setFields = (value: DisplaySettings): void => {
    fps.value = String(value.maxFps); quality.value = value.quality;
  };
  setFields(loadDisplaySettings());
  dialog.querySelector('[data-reset]')!.addEventListener('click', () => {
    setFields({ maxFps: 60, quality: 'crisp' });
    dialog.querySelector('[data-status]')!.textContent = '初期値を選択しました。保存すると確定します。';
  });
  dialog.querySelector('form')!.addEventListener('submit', event => {
    event.preventDefault();
    const saved = saveDisplaySettings({ maxFps: Number(fps.value) as DisplaySettings['maxFps'], quality: quality.value as DisplaySettings['quality'] });
    dialog.querySelector('[data-status]')!.textContent = saved
      ? '保存しました。ゲームを再読み込みすると反映されます。'
      : '保存できませんでした。ブラウザの保存設定を確認してください。';
  });
  const wasEnabled = scene.input.enabled;
  scene.input.enabled = false;
  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    dialog.remove();
    scene.input.enabled = wasEnabled;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  };
  dialog.addEventListener('close', cleanup, { once: true });
  dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  document.body.append(dialog);
  dialog.showModal();
}
