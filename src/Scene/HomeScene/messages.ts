/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜ホーム画面・messages
import Phaser from 'phaser'

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 指定の案内文を一時表示し、一定時間後に破棄する。
 * ================================== */
export function showTemporaryMessage(
  scene: Phaser.Scene,
  messageText: Phaser.GameObjects.Text,
  message: string
) {
  messageText.setText(message)

  scene.time.delayedCall(2000, () => {
    messageText.setText('')
  })
}
