# Cainos ステージ素材

`cainos_stage.tmj` はゲームで読み込むTiledマップです。Tiledでこの `.tmj` を直接開いて編集・保存すると、地形と装飾の配置がゲームに反映されます。

- タイルサイズ: 32 × 32 px
- マップ: 64 × 23 タイル
- `地形`: Cainosの地面タイル。solidプロパティのタイルはゲーム内で衝突します。
- `Objects`: プレイヤーの出現位置。`player` オブジェクトを移動してください。
- `装飾`: 木・茂み・石壁を画像付きタイルオブジェクトで配置しています。Tiled上で絵柄を差し替えたり、位置を動かしたりできます。
- 地形画像: `Pixel Art Platformer - Village Props/Texture/TX Tileset Ground.png`
- 装飾タイルセット: `CainosProps.tsx`

地形タイルセットはマップに埋め込まれているため、Tiledでマップを直接開いて保存できます。装飾画像は `TiledProps` フォルダにあります。