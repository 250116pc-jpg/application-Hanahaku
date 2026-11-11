/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : デバッグ設定・起動モードを定義する
 * ================================== */
export const debug = true;

// true: スタート時のログインを省略。通常のログインを確認するときは false。
// サーバー側の認証は省略しないため、アカウントが必要な機能にはログインが必要。
export const skipLogin = false;

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : デバッグ設定に従ってログイン省略の有無を返す
 * ================================== */
export function shouldSkipLogin(): boolean {
  return debug && skipLogin;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 開発確認用に現在の画面名を左上へ表示する
 * ================================== */
export function showDebugSceneName(scene: Phaser.Scene): void {
  if (!debug) return;

  scene.add.text(0, 0, scene.scene.key, {
    fontSize: '20px',
    color: '#ff0000',
    backgroundColor: '#ffffff',
    padding: {
      x: 0,
      y: 0
    }
  })
  .setScrollFactor(0)
  .setDepth(9999);
}
// 開発サーバーの ?battle-preview=1 で、保存を行わないスキル確認を開始。
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : デバッグ設定・起動モードを定義する
 * ================================== */
export const isBattlePreview = import.meta.env.DEV && new URLSearchParams(location.search).get('battle-preview') === '1';
