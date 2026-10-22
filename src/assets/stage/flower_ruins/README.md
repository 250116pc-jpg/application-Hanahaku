# 花の遺跡タイルセット

`flower_ruins_example.tmj` を Tiled で開くと、ゲームで使用中のマップとタイルセットを編集できます。変更はステージにそのまま反映されます。
`flower_ruins_example.tmx` は外部タイルセット `flower_ruins.tsx` を使う編集用サンプルです。両方のマップが同じ `flower_ruins.png` を参照します。
ステージ背景画像は `flower_ruins_background.svg`（元データ）と `flower_ruins_background.png` です。

- タイルサイズ: 32 × 32 px
- タイル数: 64（PNG シートは 8 × 8）
- 1–8: 苔のある足場の縁
- 9–16: 崖の石肌
- 17–32: 遺跡の石壁
- 33–40: 石の縁石
- 41–48: 苔・蔦のある石
- 49–64: 透明タイル（空き）

石タイルには Tiled のタイルプロパティと矩形コリジョンを設定しています。サンプルマップには `Objects` オブジェクトレイヤーと `player` の配置も含めています。
