# 共通UIの使い分け

- `styles.ts`：文字の書体・標準色。既存画面は `getTextStyle()`、画像UIの本文は `getBodyTextStyle()`、見出しは `getHeadingTextStyle()`。
- `back-button.ts`：ログインと同じ画像・文字のPhaser用戻るボタン。`preload()` で `preloadBackButton(this)`、`create()` で `createBackButton(this, 配置設定, 戻る処理)` を呼ぶ。
- `display-quality.ts`：`applySmoothDisplay(this, 画像キー一覧)` で指定画像とCanvas拡大を滑らかにする。文字単体は `smoothText(text)`。画面終了時にはCanvas設定を復元する。
- `buttons.ts`：文字ボタンと既存の画像付きボタン呼び出し窓口。
- `image-button.ts`：画像・文字・クリック範囲・ホバー反応・GUI設定への登録を共通生成する。
- `fit-layout.ts`：基準サイズの縦横比を保ち、画面中央に収める配置計算。
- `scene-frame.ts`：育成・キャラ詳細で使う従来の画面枠。
- 旧 `area-select.ts` は削除済み。エリア選択UIは `src/Scene/AreaSelectScene.ts` を使用する。
- `index.ts`：上記の公開窓口。Sceneからは `../utils/ui` で読み込める。

画面固有の座標・サイズ・素材の切り出し範囲・遷移先はScene側に置く。
エリア別ステージ配置は `src/Scene/stageSelectData.ts` に置く。
ログイン・登録はHTML/CSSなので、文字・配置の指定は `src/auth/auth-layout.css` に残す。
共通UIの既定値を変更すると利用画面に影響するため、画面固有の差は引数で指定する。

## 設定画面から変更するレイアウト

`src/display/UiLayoutSettings.ts` が保存・検証・変更通知を担当する。
設定画面のスライダーなどはここでは追加していない。担当者は次のAPIに値を渡す。

```ts
import { getUiLayoutSettings, updateUiLayoutSettings, resetUiLayoutSettings } from '../utils/ui';

const initial = getUiLayoutSettings(); // フォームの初期値。コピーなので直接変更しても反映されない。
updateUiLayoutSettings({
  gui: { scale: 0.9, offsetX: 0, offsetY: 10 },
  buttons: {
    'StageScene.stage-attack': { scale: 1.2, offsetX: -20, offsetY: 0 },
  },
});
updateUiLayoutSettings({ buttons: { 'StageScene.stage-attack': null } }); // このボタンだけ初期化
resetUiLayoutSettings(); // 全項目を初期化
```

- `gui`：文章・枠・HP/MP・ミニマップ・一覧などに、全シーン共通の倍率と移動量を適用する。
- `buttons`：操作ボタンごとの倍率と移動量。画像・文字・当たり判定・スキルの待機時間表示を同時に変える。GUIの共通倍率・移動量からは独立する。
- `scale` は元のサイズに対する倍率（0.5〜2）、`offsetX` / `offsetY` は1280×720基準の移動量。正の値は右・下。GUIは画面中央、ボタンは元の中心を基準に拡大する。
- 指定を省いた項目は現在の値を保持する。初期値は倍率1・移動量0。初期配置の座標は引き続き各シーンに置く。
- 保存キーは `flowerLinkUiLayoutSettings`。更新は表示中・停止中のシーンにも反映し、次に開くシーンでも引き継ぐ。戻り値 `false` はブラウザへの保存失敗を表す（現在の表示には反映済み）。
- 背景・暗幕・ステージ上の主人公・敵・地形は共通GUIの対象に含めない。

戦闘画面のボタンID：

| ID | 対象 |
| --- | --- |
| `StageScene.stage-attack` | 通常攻撃 |
| `StageScene.stage-jump` | ジャンプ |
| `StageScene.stage-guard` | 防御（文字も含む） |
| `StageScene.stage-bag` | バッグ |
| `StageScene.stage-settings-ui` | 設定 |
| `StageScene.retreat` | 撤退（HTMLボタン） |
| `StageScene.skill-1` 〜 `StageScene.skill-4` | 編成順のスキルボタン |

その他のPhaserボタンは `listSceneUiButtonIds(scene)` で登録済みIDを取得できる。
共通戻るボタンは `シーン名.back`、文字ボタンは原則 `シーン名.ラベル`。
HTMLボタンは `data-ui-layout-id` 属性でIDを確認できる。動的なラベルを使う場合は、生成前に `data-ui-id` へ固定名を設定する。

## 新しい表示・ボタンを追加するとき

- UI専用シーンは `create()` の先頭で `enableSceneUiLayout(this)` を呼ぶ。背景画像と画面幅以上の暗幕は固定する。除外条件は第2引数で指定できる。
- ワールドとHUDが混在するシーンは `registerGui(scene, object)` でHUDだけ登録する。まとまった既存の生成処理は `captureGui(scene, () => createPanel())` でも登録できる。
- 画像・文字・当たり判定を分けて作るボタンは `registerButton(scene, '固定ID', [image, label, hit], { x, y })` とする。全パーツの基準点をそろえる。
- `createTextButton` の `options.layoutId`、`createTextImageButton` の最後の引数で固定IDを指定できる。同じIDのボタンには同じ変更が適用される。
- 共通処理は親Containerで変換するため、既存の座標更新・ゲージ更新・押下Tweenを元のオブジェクトへ行える。`getBounds()` は変換後の座標を返す。親の `list` にはレイアウト用Containerが入るため、操作対象は生成時の参照を保持する。
- HTMLは `bindDomGui(panel, '名前空間')`。背景全体ではなく本文のパネルを渡す。DOM削除時には自動解除する。返された関数でも解除できる。
- GeometryMaskは親変換を参照しないので、元の画面座標で描いたGraphicsに `syncGuiMask(scene, graphics)` を設定する。独自の画面座標判定では `guiPoint(scene, x, y)` でGUIの元座標へ戻す。

確認：`npm run check:ui`（Chrome/Edgeを使った座標・入力・DOM・保存のブラウザテスト）、`npm run build`。
実シーンの起動確認も行う場合は `npm run check:ui -- --smoke`。

## 画像ボタンと画面へのフィット

育成・編成・設定・ショップの画像ボタンは `createImageButton()` を使用する。
画像キー・サイズ・書体・色は各シーンに残し、生成・ホバー・入力・レイアウト登録を共有する。
戻り値の `image`・`label`・`hit` を使って、選択時の画像変更や購入中の文言更新ができる。

```ts
const { image, label, hit } = createImageButton(this, {
  parent: this.content, x: 200, y: 100, width: 180, height: 50,
  texture: 'button-texture', label: '決定', layoutId: 'MyScene.confirm',
  hoverAlpha: 0.8, onClick: () => this.confirm(),
});
this.layout = createFittedContainer(this); // 1280×720を画面内に中央配置
// 異なるデザイン基準：createFittedContainer(this, 1672, 941)
```

`imageWidth/Height` は画像の表示サイズ、`width/height` はクリック範囲。
`hitTarget` は標準が独立したZoneで、画像・文字・親Containerを選ぶこともできる。
`enabled: false` で入力を無効にし、`canActivate` でドラッグ中・画面終了中などの実行条件を確認する。
`getFittedLayout(viewportWidth, viewportHeight, baseWidth?, baseHeight?)` は座標と倍率だけを返す。
画面へのフィットと、設定で指定するGUI倍率は別々に適用する。
