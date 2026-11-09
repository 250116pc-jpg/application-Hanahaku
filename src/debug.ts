/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜開発・デバッグ用設定
export const debug = true;

// true: スタート時のログインを省略。通常のログインを確認するときは false。
// サーバー側の認証は省略しないため、アカウントが必要な機能にはログインが必要。
export const skipLogin = false;

export function shouldSkipLogin(): boolean {
  return debug && skipLogin;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : デバッグ有効時に現在のシーン名を画面左上へ固定表示する。
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
export const isBattlePreview = import.meta.env.DEV && new URLSearchParams(location.search).get('battle-preview') === '1';
