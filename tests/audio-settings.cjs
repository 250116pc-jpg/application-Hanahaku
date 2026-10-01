const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const root = process.argv[2] || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const Phaser = { Math: { Clamp: (v,a,b) => Math.max(a,Math.min(b,v)) }, Scenes: { Events: { SHUTDOWN: 'shutdown', CREATE: 'create' } }, Input: { Events: { GAMEOBJECT_DOWN: 'down' } } };
let saved = JSON.stringify({ bgmVolume: 1, seVolume: 0, isMuted: false });
const storage = { getItem: () => saved, setItem: (_,v) => { saved=v; } };
function load(file, deps = {}) {
  let source=fs.readFileSync(path.join(root,file),'utf8');
  source=source.replace(/import\.meta\.glob\([\s\S]*?\) as Record<string, string>/, '{}');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,Phaser,localStorage:storage,console,require:n=>n==='phaser'?Phaser:deps[n]??n},{filename:file});
  return exports;
}
const bgm=load('src/audio/BgmManager.ts');
const {SettingsVoice}=load('src/audio/SettingsVoice.ts',{'./BgmManager':bgm});
class Sound extends EventEmitter {
  constructor(config, manager){super();this.volume=config.volume;this.manager=manager;}
  setVolume(v){this.volume=v;return this;}
  play(){this.isPlaying=!this.manager.fail;return this.isPlaying;}
  stop(){this.isPlaying=false;}
  destroy(){this.stop();this.removeAllListeners();}
}
function scene(){
 const manager=new EventEmitter();manager.locked=false;manager.created=[];manager.add=(_,config)=>{const s=new Sound(config,manager);manager.created.push(s);return s;};
 return {game:{},sound:manager,events:new EventEmitter(),cache:{audio:{exists:()=>true}},registry:{set(){}},scene:{isActive:()=>true}};
}
const s=scene();
assert.equal(bgm.loadAudioSettings(s).voiceVolume,1,'old settings migrate to voice 100%');
bgm.playBgm(s,'home');const music=s.sound.created[0];const voice=new SettingsVoice(s);
voice.speak('BGMを大きくしたよ');assert.equal(music.volume,.15);assert.equal(s.sound.created.at(-1).volume,1,'SE zero does not silence voice');
const first=s.sound.created.at(-1);voice.speak('効果音を小さくしたよ');assert.equal(first.isPlaying,false,'rapid clicks replace previous voice');
bgm.applyAudioSettings(s,{bgmVolume:.6,seVolume:0,voiceVolume:.8,isMuted:false});assert.equal(music.volume,.09,'BGM changes retain ducking');
s.sound.created.at(-1).emit('complete');assert.equal(music.volume,.6,'completion restores latest BGM setting');
voice.speak('音量を変更できるよ');s.events.emit('shutdown');assert.equal(music.volume,.6,'exit restores BGM');
bgm.applyAudioSettings(s,{bgmVolume:.6,seVolume:1,voiceVolume:0,isMuted:false});let count=s.sound.created.length;voice.speak('音量を変更できるよ');assert.equal(s.sound.created.length,count,'voice zero is silent');
bgm.applyAudioSettings(s,{bgmVolume:.6,seVolume:1,voiceVolume:1,isMuted:true});voice.speak('音を消したよ');assert.equal(s.sound.created.length,count,'mute is silent');
bgm.applyAudioSettings(s,{bgmVolume:.6,seVolume:1,voiceVolume:1,isMuted:false});s.sound.fail=true;voice.speak('音を戻したよ');assert.equal(music.volume,.6,'failed playback restores BGM');s.sound.fail=false;
s.sound.locked=true;voice.speak('音量を変更できるよ');assert.equal(s.sound.listenerCount('unlocked'),1);voice.stop();assert.equal(s.sound.listenerCount('unlocked'),0,'exit cancels deferred voice');
bgm.saveAudioSettings(s,{bgmVolume:.4,seVolume:.3,voiceVolume:.8,isMuted:false});assert.equal(bgm.loadAudioSettings(scene()).voiceVolume,.8,'voice setting persists');
saved='null';assert.equal(bgm.loadAudioSettings(scene()).voiceVolume,1,'invalid saved data falls back');
console.log('PASS: old settings, independent volume, duck/restore, rapid clicks, exit, mute, zero, playback failure, unlock cleanup, persistence');
