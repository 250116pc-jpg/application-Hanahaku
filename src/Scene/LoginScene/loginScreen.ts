import Phaser from 'phaser';

export interface LoginScreenElements {
  formX: number;
  formY: number;
  backButton: Phaser.GameObjects.Text;
  registerLink: Phaser.GameObjects.Text;
}

export function createLoginScreen(scene: Phaser.Scene): LoginScreenElements {
  const width = scene.scale.width;
  const height = scene.scale.height;

  scene.cameras.main.setBackgroundColor('#cfe3f5');
  scene.add.rectangle(width / 2, height / 2, width - 80, height - 60, 0xf8fbff)
    .setStrokeStyle(4, 0xd8aa45);
  scene.add.text(width / 2, 75, 'ログイン', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '38px',
    color: '#1f2937',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  const backButton = scene.add.text(78, 58, '← 戻る', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#536878',
    padding: { left: 20, right: 20, top: 12, bottom: 12 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  const registerLink = scene.add.text(width / 2, height - 85, '未登録の方はこちら（新規登録）', {
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: '21px',
    color: '#356cbf',
    backgroundColor: '#ffffff',
    padding: { left: 22, right: 22, top: 10, bottom: 10 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  return {
    formX: width / 2,
    formY: height / 2 + 30,
    backButton,
    registerLink,
  };
}
