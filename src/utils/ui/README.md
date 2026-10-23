# 共通UIの使い分け

- `styles.ts`：文字の書体・標準色。既存画面は `getTextStyle()`、画像UIの本文は `getBodyTextStyle()`、見出しは `getHeadingTextStyle()`。
- `back-button.ts`：ログインと同じ画像・文字のPhaser用戻るボタン。`preload()` で `preloadBackButton(this)`、`create()` で `createBackButton(this, 配置設定, 戻る処理)` を呼ぶ。
- `display-quality.ts`：`applySmoothDisplay(this, 画像キー一覧)` で指定画像とCanvas拡大を滑らかにする。文字単体は `smoothText(text)`。画面終了時にはCanvas設定を復元する。
- `buttons.ts`：従来の文字・矩形・画像付きボタン。
- `dialogs.ts`：撤退確認。
- `scene-frame.ts`：育成・キャラ詳細で使う従来の画面枠。
- `area-select.ts`：旧エリア選択用の円形ボタン・詳細パネル。現在の画像版では未使用。
- `index.ts`：上記の公開窓口。Sceneからは `../utils/ui` で読み込める。

画面固有の座標・サイズ・素材の切り出し範囲・遷移先はScene側に置く。
エリア別ステージ配置は `src/Scene/stageSelectData.ts` に置く。
ログイン・登録はHTML/CSSなので、文字・配置の指定は `src/auth/auth-layout.css` に残す。
共通UIの既定値を変更すると利用画面に影響するため、画面固有の差は引数で指定する。
