import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';

// Windowsのインストール済みChrome/Edgeを使う。追加のnpm依存は不要。
const browser = process.env.UI_TEST_BROWSER ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!browser) throw new Error('UI_TEST_BROWSER に Chromium 系ブラウザの実行ファイルを指定してください。');
const profile = mkdtempSync(path.join(os.tmpdir(), 'hanahaku-ui-check-'));
const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false }, logLevel: 'error' });
let chrome, socket;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await server.listen();
  const port = server.httpServer.address().port;
  chrome = spawn(browser, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  chrome.on('error', error => { console.error(error.message); });
  const activePort = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(activePort); i++) await delay(100);
  const debugPort = readFileSync(activePort, 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const pending = new Map();
  let sequence = 0;
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id); pending.delete(message.id);
      if (message.error) task.reject(message.error); else task.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  };
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/tests/ui-layout.html` });
  let output = '';
  for (let i = 0; i < 100; i++) {
    await delay(150);
    const response = await call('Runtime.evaluate', { expression: 'document.querySelector("#result")?.textContent', returnByValue: true });
    output = response.result?.value ?? '';
    if (/^(PASS|FAIL)/.test(output) || errors.length) break;
  }
  if (errors.length) throw new Error(errors.join('\n'));
  if (!output.startsWith('PASS')) throw new Error(output || 'ブラウザテストがタイムアウトしました。');
  console.log(output);
  if (process.argv.includes('--smoke')) {
    await call('Page.navigate', { url: `http://127.0.0.1:${port}/?battle-preview=1` });
    const evaluate = async expression => {
      const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
      return response.result?.value;
    };
    let ready = false;
    for (let i = 0; i < 100; i++) {
      await delay(150);
      if (await evaluate('Boolean(window.__battlePreviewGame?.scene.getScene("StageScene")?.hud?.isReady)')) { ready = true; break; }
      if (errors.length) throw new Error(errors.join('\n'));
    }
    if (!ready) throw new Error('実画面のステージHUDを初期化できませんでした。');
    await evaluate('(async()=>{ const settings = await import("/src/display/UiLayoutSettings.ts"); settings.updateUiLayoutSettings({gui:{scale:.85,offsetX:12,offsetY:8},buttons:{"StageScene.stage-attack":{scale:1.1,offsetX:-20}}}); })()');
    await delay(200);
    console.log('PASS actual StageScene with GUI/button settings');
    const names = await evaluate('window.__battlePreviewGame.scene.scenes.map(scene=>scene.sys.settings.key)');
    for (const key of ['SettingsScene', 'AreaSelectScene', 'TrainingScene', 'FormScene', 'ShopScene', 'StoryScene']) {
      if (!names.includes(key)) continue;
      await evaluate(`(()=>{const game=window.__battlePreviewGame;for(const scene of game.scene.getScenes(true))game.scene.stop(scene.sys.settings.key);game.scene.start(${JSON.stringify(key)}, {chapter:1,stage:1});})()`);
      let active = false;
      for (let i = 0; i < 50; i++) {
        await delay(100);
        active = await evaluate(`window.__battlePreviewGame.scene.isActive(${JSON.stringify(key)})`);
        if (active) break;
      }
      if (errors.length) throw new Error(errors.join('\n'));
      if (!active) throw new Error(`${key}を起動できませんでした。`);
      await delay(200);
      console.log(`PASS actual ${key}`);
    }
  }
} catch (error) {
  console.error(error); process.exitCode = 1;
} finally {
  socket?.close(); chrome?.kill();
  await server.close();
  await delay(500);
  // 自分で作成した一時プロファイルだけを削除する。
  if (path.dirname(path.resolve(profile)) === path.resolve(os.tmpdir()) && path.basename(profile).startsWith('hanahaku-ui-check-')) {
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { /* ブラウザ終了待ちでロック中ならOSの一時領域に残す。 */ }
  }
}
