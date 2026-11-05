import Phaser from 'phaser';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/AudioDefaults';
import { applyAudioSettings, loadAudioSettings, saveAudioSettings, playUiSe } from '../audio/BgmManager';
import { SettingsVoice } from '../audio/SettingsVoice';
import { loadDisplaySettings, saveDisplaySettings, type DisplaySettings } from './DisplaySettings';
import { logout } from '../auth/Session';
import './SettingsBook.css';
const assets = import.meta.glob('../assets/settings-book/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string,string>;
const asset = (name: string): string => assets['../assets/settings-book/'+name]!;
export function mountSettingsBook(scene: Phaser.Scene, onClose: () => void): void {
 const original = loadAudioSettings(scene), audio = {...original};
 let display = {...loadDisplaySettings()}, active = 0, busy = true, disposed = false, loggingOut = false;
 const voice = new SettingsVoice(scene);
 const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
 const oldInput = scene.input.enabled; scene.input.enabled = false;
 const root = document.createElement('section'); root.className = 'settings-book-screen';
 root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','設定');
 root.innerHTML = `<div class="settings-book"><img class="settings-journal-art" alt="設定の本"><nav class="settings-journal-tabs" aria-label="設定カテゴリー" hidden></nav><div class="settings-journal-content" hidden><section class="settings-journal-left"></section><section class="settings-journal-right"></section></div><footer class="settings-journal-footer" hidden><button data-guide>操作ガイド</button><button data-reset>初期値に戻す</button><button data-cancel>変更を戻して閉じる</button><button data-save>保存して戻る</button></footer><p class="settings-journal-status" role="status" aria-live="polite"></p></div>`;
 for (const state of ['normal','hover','pressed','disabled']) root.style.setProperty('--settings-ink-'+state, `url("${asset('button_ink_'+state+'.png')}")`);
 document.body.append(root);
 const art = root.querySelector<HTMLImageElement>('.settings-journal-art')!, tabs = root.querySelector<HTMLElement>('nav')!, content = root.querySelector<HTMLElement>('.settings-journal-content')!, footer = root.querySelector<HTMLElement>('footer')!;
 const left = root.querySelector<HTMLElement>('.settings-journal-left')!, right = root.querySelector<HTMLElement>('.settings-journal-right')!, status = root.querySelector<HTMLElement>('.settings-journal-status')!;
 let timer: ReturnType<typeof setTimeout> | undefined;
 const preload = ['open.png',...Array.from({length:8},(_,i)=>`opening_${String(i).padStart(2,'0')}.png`)].map(name=>{const image=new Image();image.src=asset(name);return image.decode().catch(()=>undefined)});
 const clean = (): void => { disposed=true; clearTimeout(timer); voice.stop(); root.remove(); scene.input.enabled=oldInput; scene.events.off(Phaser.Scenes.Events.SHUTDOWN,shutdown); previousFocus?.focus(); };
 const shutdown = (): void => { applyAudioSettings(scene,original); clean(); };
 scene.events.once(Phaser.Scenes.Events.SHUTDOWN,shutdown);
 const animate = (reverse: boolean, done: () => void): void => {
  busy=true; tabs.hidden=true; content.hidden=true; footer.hidden=true;
  let n=reverse?7:0;
  const step = (): void => { if(disposed)return; art.src=asset(`opening_${String(n).padStart(2,'0')}.png`); if(n===(reverse?0:7)){if(!reverse)art.src=asset('open.png');busy=false;done();return;} n+=reverse?-1:1;timer=setTimeout(step,65); }; step();
 };
 const close = (save: boolean): void => {
  if(busy||loggingOut)return;
  if(save){if(!saveDisplaySettings(display)){status.textContent='画面設定を保存できません。ブラウザの保存設定を確認してください。';return;}saveAudioSettings(scene,audio);Object.assign(original,audio);}
  else applyAudioSettings(scene,original);
  playUiSe(scene, save ? 'confirm' : 'cancel');
  voice.stop(); animate(true,()=>{clean();onClose();});
 };
 const button = (parent: HTMLElement, label: string, action: () => void): HTMLButtonElement => {const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;parent.append(b);return b;};
 const show = (index: number): void => {
  if(busy||loggingOut)return; active=index;
  [...tabs.children].forEach((tab,i)=>tab.setAttribute('aria-selected',String(i===index)));
  left.replaceChildren();right.replaceChildren();
  const heading=(parent:HTMLElement,text:string):void=>{const h=document.createElement('h2');h.textContent=text;parent.append(h);};
  if(index===0){
   heading(left,'音の設定');
   for(const [key,label] of [['bgmVolume','BGM音量'],['seVolume','SE音量'],['voiceVolume','音声音量']] as const){
    const row=document.createElement('label'),range=document.createElement('input'),value=document.createElement('output');row.textContent=label;range.type='range';range.min='0';range.max='100';range.value=String(Math.round(audio[key]*100));range.setAttribute('aria-label',label);value.value=range.value+'%';
    let before=audio[key];range.onpointerdown=()=>{before=audio[key];if(key==='voiceVolume')voice.stop();};
    range.oninput=()=>{audio[key]=Number(range.value)/100;value.value=range.value+'%';applyAudioSettings(scene,audio);};
    range.onchange=()=>voice.speak(key==='voiceVolume'?'音量を変更できるよ':key==='bgmVolume'?(audio[key]<before?'BGMを小さくしたよ':'BGMを大きくしたよ'):(audio[key]<before?'効果音を小さくしたよ':'効果音を大きくしたよ'));
    row.append(range,value);left.append(row);
   }
   heading(right,'音の操作');const label=document.createElement('label'),mute=document.createElement('input');mute.type='checkbox';mute.checked=audio.isMuted;mute.onchange=()=>{audio.isMuted=mute.checked;applyAudioSettings(scene,audio);voice.speak(audio.isMuted?'音を消したよ':'音を戻したよ');};label.className='settings-ink-mute';mute.className='settings-ink-checkbox';const mark=document.createElement('span');mark.className='settings-check-art';mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 12 L10 18 L21 5"/></svg>';label.append(mute,mark,' ミュート');right.append(label);
   const note=document.createElement('p');note.textContent='音声：VOICEVOX:ずんだもん';right.append(note);
  }else if(index===1){
   heading(left,'ユーザー情報');let user:{name?:unknown;email?:unknown}|null=null;try{user=JSON.parse(localStorage.getItem('hanahakuCurrentUser')??'null');}catch{/* unavailable */}
   for(const text of [typeof user?.name==='string'?user.name:'未ログイン',typeof user?.email==='string'?user.email:'']){const p=document.createElement('p');p.textContent=text;left.append(p);}
   heading(right,'アカウント');button(right,'ログアウト',()=>{
    if(loggingOut)return;loggingOut=true; root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
    void logout().then(()=>{applyAudioSettings(scene,original);clean();for(const other of scene.scene.manager.getScenes(false)){if(other!==scene)scene.scene.stop(other.scene.key);}scene.scene.start('LoginScene');}).catch(()=>{if(disposed)return;loggingOut=false;root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false);status.textContent='ログアウトできません。接続を確認してください。';});
   });
  }else{
   heading(left,'画面設定');
   for(const [label,key,options] of [['最大FPS','maxFps',[['30','30 FPS'],['60','60 FPS（標準）'],['120','120 FPS']]],['画質','quality',[['crisp','標準：くっきり'],['smooth','なめらか']]]] as const){const row=document.createElement('label'),select=document.createElement('select');row.textContent=label;for(const [value,text] of options){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=String(display[key]);select.onchange=()=>{display=key==='maxFps'?{...display,maxFps:Number(select.value) as DisplaySettings['maxFps']}:{...display,quality:select.value as DisplaySettings['quality']};};row.append(select);left.append(row);}
   const note=document.createElement('p');note.textContent='保存後、ゲームを再読み込みすると反映されます。';left.append(note);
   heading(right,'クレジット');const p=document.createElement('p');p.textContent='制作：Aチーム（中村・武田・斎藤）\n音声：VOICEVOX:ずんだもん\nBGM：PeriTune（Frosylva / Harbor Morning / Ancient Gust）\n効果音：OtoLogic / 効果音ラボ\n画像・制作支援：ChatGPT / Gemini / 三日月アルペジオ / AutoSprite\n本：Art by Gridwright\nインベントリUI：Zanyar’s Asset Store（Laphkal / itch.io）\nゲームエンジン：Phaser';p.style.whiteSpace='pre-line';right.append(p);
  }
 };
 [['Sound.png','音の設定'],['user.png','ユーザー情報'],['display.png','画面設定・クレジット']].forEach(([name,label],index)=>{const b=button(tabs,'',()=>{if(!busy&&!loggingOut&&active!==index){playUiSe(scene,'select');show(index);}});b.className='settings-journal-tab';b.title=label!;b.setAttribute('aria-label',label!);const image=document.createElement('img');image.src=asset(name!);image.alt='';b.append(image);});
 root.querySelector<HTMLButtonElement>('[data-cancel]')!.onclick=()=>close(false);
 root.querySelector<HTMLButtonElement>('[data-save]')!.onclick=()=>close(true);
 root.querySelector<HTMLButtonElement>('[data-reset]')!.onclick=()=>{playUiSe(scene,'confirm');if(active===2)display={maxFps:60,quality:'crisp'};else{Object.assign(audio,DEFAULT_AUDIO_SETTINGS);applyAudioSettings(scene,audio);voice.speak('最初の設定に戻したよ');}show(active);status.textContent='初期値に戻しました。「保存して戻る」で確定します。';};
 root.querySelector<HTMLButtonElement>('[data-guide]')!.onclick=()=>{
  if(root.querySelector('dialog'))return;
  playUiSe(scene,'confirm');
  const dialog=document.createElement('dialog');dialog.className='settings-guide-dialog';dialog.setAttribute('aria-labelledby','settings-guide-title');
  dialog.innerHTML='<h2 id="settings-guide-title">操作ガイド</h2><p>右の付箋で「音」「ユーザー」「画面・クレジット」を切り替えます。</p><p>音量はスライダーを動かすとすぐ試せます。ミュートで音を消せます。</p><p>「保存して戻る」で変更を保存します。「変更を戻して閉じる」では保存せず元に戻します。</p>';
  const closeGuide=button(dialog,'本に戻る',()=>{playUiSe(scene,'cancel');dialog.close();});dialog.addEventListener('close',()=>{dialog.remove();root.querySelector<HTMLButtonElement>('[data-guide]')?.focus();},{once:true});dialog.addEventListener('keydown',event=>{if(event.key==='Escape'||event.key==='Tab')event.stopPropagation();});root.append(dialog);dialog.showModal();closeGuide.focus();
 };
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close(false);}if(event.key==='Tab'){const list=[...root.querySelectorAll<HTMLElement>('button:not(:disabled), input, select')].filter(el=>el.getClientRects().length);const first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 art.src=asset('opening_00.png');
 void Promise.all(preload).then(()=>{if(disposed)return;animate(false,()=>{tabs.hidden=false;content.hidden=false;footer.hidden=false;show(0);tabs.querySelector('button')?.focus();voice.speak('音量を変更できるよ');});});
}
