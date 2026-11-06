export const debug = true;

// true: スタート時のログインを省略。通常のログインを確認するときは false。
// サーバー側の認証は省略しないため、アカウントが必要な機能にはログインが必要。
export const skipLogin = false;

export function shouldSkipLogin(): boolean {
  return debug && skipLogin;
}

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
