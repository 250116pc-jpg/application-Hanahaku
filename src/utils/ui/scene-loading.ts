/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
import Phaser from 'phaser';
import './scene-loading.css';

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : ロード・遷移共通を定義する
 * ================================== */
type Mode = 'start' | 'launch' | 'resume' | 'wake';
type Request = { source: Phaser.Scene; destination: string; data?: object; mode: Mode; preserve?: 'pause' | 'sleep' };
type Job = { target: Phaser.Scene; next?: Request; follow?: () => void };
const FADE_DURATION = 180;
const INDICATOR_DELAY = 200; // 幕で覆ってから、この時間を超えた場合だけ花と文字を表示する。
const jobs = new WeakMap<Phaser.Game, Job>();
const pending = new WeakMap<Phaser.Scene, Set<Promise<unknown>>>();

/** create()で始める初期データ取得を登録する。失敗時も画面側のエラー表示が完成するまで待つ。 */
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 初期通信や画像準備の完了をロード表示へ登録する
 * ================================== */
export function trackSceneLoading(scene: Phaser.Scene, work: Promise<unknown>): void {
  let tasks = pending.get(scene);
  if (!tasks) {
    tasks = new Set(); pending.set(scene, tasks);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { if (pending.get(scene) === tasks) pending.delete(scene); });
  }
  tasks.add(work);
  const remove = (): void => { tasks!.delete(work); };
  void work.then(remove, remove);
}

/** 画像・演出の準備をコールバックで知らせる画面向け。終了時にも待機を解除する。 */
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 準備完了の通知を待つ処理を作る
 * ================================== */
export function deferSceneLoading(scene: Phaser.Scene): () => void {
  let finish!: () => void;
  const work = new Promise<void>(resolve => { finish = resolve; });
  trackSceneLoading(scene, work);
  const done = (): void => { scene.events.off(Phaser.Scenes.Events.SHUTDOWN, done); finish(); };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, done);
  return done;
}

/** ロードの幕が外れた後に、入場演出を始めたい画面で使う。 */
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : ロード表示が消えるまで待つ
 * ================================== */
export function waitForSceneReveal(scene: Phaser.Scene): Promise<void> {
  if (jobs.get(scene.game)?.target !== scene) return Promise.resolve();
  return new Promise(resolve => {
    const done = (): void => {
      scene.events.off('ui-scene-revealed', done);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, done);
      resolve();
    };
    scene.events.once('ui-scene-revealed', done);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, done);
  });
}

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : ロード表示を挟んで画面を切り替える
 * ================================== */
export function transitionWithLoading(source: Phaser.Scene, destination: string, data?: object): void {
  begin({ source, destination, data, mode: 'start' });
}
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 呼び出し元を保持して別画面を開く
 * ================================== */
export function openSceneWithLoading(source: Phaser.Scene, destination: string, data?: object, preserve: 'pause' | 'sleep' = 'pause'): void {
  begin({ source, destination, data, mode: 'launch', preserve });
}
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 保持していた画面へ戻る
 * ================================== */
export function returnWithLoading(source: Phaser.Scene, destination: string, mode: 'resume' | 'wake' = 'resume'): void {
  begin({ source, destination, mode });
}

function begin(request: Request): void {
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 画面遷移の重複を制御し、ロード表示の状態を作る
   * ================================== */
  const game = request.source.game;
  const previous = jobs.get(game);
  if (previous) {
    // create()内のリダイレクトも同じ幕の下で連続して処理する。
    if (previous.target === request.source && request.destination !== previous.target.sys.settings.key) { previous.next = request; previous.follow?.(); }
    return;
  }
  const job: Job = { target: request.source.scene.get(request.destination) }; jobs.set(game, job);
  let disposed = false, started = false, finishing = false, assetFailed = false, version = 0;
  let startTimer: number | undefined, watchdog: number | undefined, closeTimer: number | undefined, indicatorTimer: number | undefined;
  let detach = (): void => {};
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : ロード表示の背景と表示枠をDOMへ作る
   * ================================== */
  const root = document.createElement('section'); root.className = 'scene-loading'; root.tabIndex = -1;
  root.setAttribute('role', 'status'); root.setAttribute('aria-live', 'polite'); root.setAttribute('aria-busy', 'true');
  root.innerHTML = '<div class="scene-loading-content"><div class="scene-loading-flower" aria-hidden="true">' +
    Array.from({ length: 6 }, (_, index) => `<i class="scene-loading-petal" style="--petal:${index}"></i>`).join('') +
    '</div><p class="scene-loading-label">読み込み中…</p><button type="button" class="scene-loading-back" hidden>ホームに戻る</button></div>';
  const content = root.querySelector<HTMLDivElement>('.scene-loading-content')!;
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : ロード内容と入力制御・解除処理を準備する
   * ================================== */
  content.setAttribute('aria-hidden', 'true');
  const showIndicator = (): void => {
    if (disposed) return;
    root.classList.add('show-loading'); content.removeAttribute('aria-hidden');
  };
  const cancelIndicator = (): void => { clearTimeout(indicatorTimer); indicatorTimer = undefined; };
  const label = root.querySelector<HTMLParagraphElement>('p')!;
  const back = root.querySelector<HTMLButtonElement>('button')!;
  const position = (): void => {
    const rect = game.canvas.getBoundingClientRect();
    Object.assign(root.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  };
  const blockKeyboard = (event: KeyboardEvent): void => { if (event.target !== back) { event.preventDefault(); event.stopImmediatePropagation(); } };
  const cleanup = (): void => {
    if (disposed) return;
    disposed = true; version++; detach(); jobs.delete(game);
    clearTimeout(startTimer); clearTimeout(watchdog); clearTimeout(closeTimer); cancelIndicator();
    request.source.events.off(Phaser.Scenes.Events.SHUTDOWN, sourceStopped);
    game.events.off(Phaser.Core.Events.DESTROY, cleanup);
    window.removeEventListener('resize', position);
    window.removeEventListener('keydown', blockKeyboard, true); window.removeEventListener('keyup', blockKeyboard, true);
    root.remove();
  };
  const sourceStopped = (): void => { if (!started) cleanup(); };
  const error = (message: string): void => { cancelIndicator(); showIndicator(); label.textContent = message; root.setAttribute('aria-busy', 'false'); back.hidden = false; };
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
   * ================================== */
  const commit = (route: Request): void => {
    if (disposed) return;
    detach(); clearTimeout(watchdog);
    assetFailed = false; finishing = false; back.hidden = true; root.setAttribute('aria-busy', 'true');
    const target = route.source.scene.get(route.destination); job.target = target;
    if (!root.classList.contains('show-loading') && indicatorTimer === undefined) {
      indicatorTimer = window.setTimeout(() => { indicatorTimer = undefined; if (!finishing) showIndicator(); }, INDICATOR_DELAY);
    }
    const token = ++version;
    const ready = async (): Promise<void> => {
      // create完了後に登録済みの初期通信を待つ。処理の中で追加された待機も拾う。
      while (!disposed && token === version && pending.get(target)?.size) await Promise.allSettled([...pending.get(target)!]);
      if (disposed || token !== version || finishing) return;
      if (job.next) { const next = job.next; job.next = undefined; commit(next); return; }
      finishing = true; clearTimeout(watchdog); cancelIndicator();
      if (assetFailed) { error('画像を読み込めませんでした。通信状態を確認してください。'); return; }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (disposed || token !== version) return;
        if (job.next) { const next = job.next; job.next = undefined; commit(next); return; }
        root.classList.remove('is-visible'); root.setAttribute('aria-busy', 'false');
        closeTimer = window.setTimeout(() => { cleanup(); target.events.emit('ui-scene-revealed'); }, FADE_DURATION);
      }));
    };
    let releaseSimulation = (): void => {};
    let suspended = false;
    let destinationCreated = false;
    const onReady = (): void => {
      destinationCreated = true;
      if (!suspended) {
        suspended = true;
        // 初期通信を待つ間に敵やタイマーだけが進まないようにする。Scene自体は稼働させてデータ取得を完了できる状態に保つ。
        const world = target.physics?.world;
        const physicsPaused = world?.isPaused;
        const timePaused = target.time.paused;
        target.time.paused = true;
        if (world && !physicsPaused) world.pause();
        releaseSimulation = () => {
          if (target.sys.isActive()) {
            target.time.paused = timePaused;
            if (world && !physicsPaused) world.resume();
          }
        };
      }
      void ready();
    };
    const onAssetError = (): void => { assetFailed = true; };
    const onStop = (): void => { if (!job.next && (route.source !== target || destinationCreated)) cleanup(); };
    const event = route.mode === 'resume' ? Phaser.Scenes.Events.RESUME : route.mode === 'wake' ? Phaser.Scenes.Events.WAKE : Phaser.Scenes.Events.CREATE;
    target.events.once(event, onReady); target.events.on(Phaser.Scenes.Events.SHUTDOWN, onStop); target.load.on('loaderror', onAssetError);
    detach = () => { releaseSimulation(); target.events.off(event, onReady); target.events.off(Phaser.Scenes.Events.SHUTDOWN, onStop); target.load.off('loaderror', onAssetError); };
    watchdog = window.setTimeout(() => { if (!disposed) error('読み込みに時間がかかっています。'); }, 20000);
    started = true;
    route.source.input.keyboard?.resetKeys();
    if (route.mode === 'launch') {
      route.source.scene.launch(route.destination, route.data);
      route.source.scene.bringToTop(route.destination);
      if (route.preserve === 'sleep') route.source.scene.sleep(); else route.source.scene.pause();
    } else if (route.mode === 'resume' || route.mode === 'wake') {
      if (route.mode === 'resume') route.source.scene.resume(route.destination); else route.source.scene.wake(route.destination);
      if (route.source !== target) route.source.scene.stop();
      // 既に再開済みでも表示を残し続けない。
      if (target.sys.isActive()) onReady();
    } else route.source.scene.start(route.destination, route.data);
  };
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : 連続した画面遷移があれば次のロード処理へ引き継ぐ
   * ================================== */
  job.follow = () => {
    if (!finishing || !job.next || disposed) return;
    clearTimeout(closeTimer); root.classList.add('is-visible');
    const next = job.next; job.next = undefined; commit(next);
  };
  back.onclick = () => {
    const target = job.target;
    cleanup();
    const source = target.sys.settings.status >= Phaser.Scenes.SHUTDOWN ? request.source : target;
    transitionWithLoading(source, 'HomeScene');
  };
  document.body.append(root); position(); root.focus({ preventScroll: true });
  /* === [ 担当 : 250082 武田優人 ] ===
   * 処理内容 : クリック・キー操作と終了時の後片付けを設定する
   * ================================== */
  window.addEventListener('resize', position);
  window.addEventListener('keydown', blockKeyboard, true); window.addEventListener('keyup', blockKeyboard, true);
  request.source.events.once(Phaser.Scenes.Events.SHUTDOWN, sourceStopped);
  game.events.once(Phaser.Core.Events.DESTROY, cleanup);
  requestAnimationFrame(() => { if (!disposed) root.classList.add('is-visible'); });
  startTimer = window.setTimeout(() => { if (!disposed) commit(request); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : FADE_DURATION);
}
