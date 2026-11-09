// 担当：たまおちゃん｜音声再生・設定・AudioDefaults
// 保存データがない場合と「初期値に戻す」で使う音量（0～1）。ここで変えられるようにする
//ちなみに、DBは使っておらず、
//直接記入する感じ　→TypeScriptで保存はjsonで保存する形式で行っている。
export const DEFAULT_AUDIO_SETTINGS = {
  bgmVolume: 0.2,
  seVolume: 0.4,
  voiceVolume: 1,
  isMuted: false,
}
