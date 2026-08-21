import Phaser from 'phaser'

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
