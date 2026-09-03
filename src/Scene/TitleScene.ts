import Phaser from 'phaser';
import titleBackground from '../assets/background.png';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload(): void {
    this.load.image('title_bg', titleBackground);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1. 背景画像を配置
    const bg = this.add.image(width / 2, height / 2, 'title_bg');
    bg.setDisplaySize(width, height);

    // 2. ボタンのサイズとスタイル設定
    const btnWidth = 240;
    const btnHeight = 60;
    const btnRadius = 30;
    
    const btnGraphics = this.add.graphics();
    const btnText = this.add.text(0, 0, 'スタート', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 3. 状態に合わせて立体ボタンを描画する関数
    const drawButton = (state: 'normal' | 'hover' | 'down') => {
      btnGraphics.clear();
      
      // 状態による色の変化
      const faceColor = state === 'hover' ? 0xabdbf5 : (state === 'down' ? 0x7aa9d5 : 0x8ab9e5);
      const edgeColor = 0x5c8ec4; // 側面の暗い色
      
      // ★ここがポイント！状態によるY座標のズレ（押し込み具合・浮き具合）
      let yOffset = 0;
      if (state === 'hover') yOffset = -2; // ホバーで表面が少し上に浮く
      if (state === 'down') yOffset = 4;   // クリックで表面が下に押し込まれる

      // ① ドロップシャドウ（一番下の薄い影）
      btnGraphics.fillStyle(0x000000, state === 'down' ? 0.15 : 0.25);
      btnGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + 8, btnWidth, btnHeight, btnRadius);

      // ② ボタンの側面（立体感のベース）
      // 常にY座標+4の位置に描画。クリック時(yOffset=4)は表面と重なって側面が隠れる＝沈み込んだように見える！
      btnGraphics.fillStyle(edgeColor, 1);
      btnGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + 4, btnWidth, btnHeight, btnRadius);

      // ③ ボタンの表面
      btnGraphics.fillStyle(faceColor, 1);
      btnGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + yOffset, btnWidth, btnHeight, btnRadius);
      
      // ④ 文字の位置も表面に合わせて上下させる
      btnText.setY(yOffset);
    };

    // 初期状態を描画
    drawButton('normal');

    // 4. Containerにまとめてインタラクティブ化
    const startButton = this.add.container(width / 2, height / 2 + 170, [btnGraphics, btnText]);
    startButton.setSize(btnWidth, btnHeight);
    startButton.setInteractive({ useHandCursor: true });

    // 5. アニメーション（Tween）付きのイベント設定
    startButton.on('pointerover', () => {
      drawButton('hover');
      // ボタン全体を少し拡大して「浮き上がる」リッチなアニメーション
      this.tweens.add({
        targets: startButton,
        scale: 1.05,
        duration: 100, // 0.1秒で滑らかに
        ease: 'Sine.easeOut'
      });
    });
    
    startButton.on('pointerout', () => {
      drawButton('normal');
      // 元のサイズに戻す
      this.tweens.add({
        targets: startButton,
        scale: 1,
        duration: 100,
        ease: 'Sine.easeOut'
      });
    });
    
    startButton.on('pointerdown', () => {
      drawButton('down');
      // 押した時に少し縮ませることで「グッ」と押し込んだ感を強調
      this.tweens.add({
        targets: startButton,
        scale: 0.95,
        duration: 50,
        ease: 'Sine.easeOut'
      });
    });
    
    startButton.on('pointerup', () => {
      drawButton('normal');
      this.tweens.add({
        targets: startButton,
        scale: 1,
        duration: 100,
        ease: 'Sine.easeOut',
        onComplete: () => {
          // アニメーションが終わってからシーン遷移
          this.scene.start('HomeScene');
        }
      });
    });
  }
}