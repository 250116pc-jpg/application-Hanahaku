import Phaser from 'phaser';

interface LoginResponse {
  ok: boolean;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor('#cfe3f5');
    this.add.rectangle(width / 2, height / 2, width - 80, height - 60, 0xf8fbff)
      .setStrokeStyle(4, 0xd8aa45);
    this.add.text(width / 2, 75, 'ログイン', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '38px',
      color: '#1f2937',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const formElement = document.createElement('form');
    formElement.className = 'register-form login-form';
    formElement.innerHTML = `
      <label>
        メールアドレス
        <input name="email" type="email" maxlength="255" autocomplete="email" required>
      </label>
      <label>
        パスワード
        <input name="password" type="password" maxlength="72" autocomplete="current-password" required>
      </label>
      <p class="register-message" aria-live="polite"></p>
      <button type="submit">ログイン</button>
    `;

    const dom = this.add.dom(width / 2, height / 2 + 30, formElement);
    const message = formElement.querySelector<HTMLParagraphElement>('.register-message');
    const submitButton = formElement.querySelector<HTMLButtonElement>('button[type="submit"]');

    formElement.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!message || !submitButton) return;

      const data = new FormData(formElement);
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');

      submitButton.disabled = true;
      submitButton.textContent = '確認中…';
      this.setMessage(message, '登録情報を確認しています。', false);

      try {
        const phpBaseUrl = (import.meta.env.VITE_PHP_BASE_URL ?? 'http://localhost/hanahaku/php')
          .replace(/\/$/, '');
        const response = await fetch(`${phpBaseUrl}/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json() as LoginResponse;

        if (!response.ok || !result.ok || !result.user) {
          throw new Error(result.error || 'ログインできませんでした。');
        }

        try {
          localStorage.setItem('hanahakuCurrentUser', JSON.stringify(result.user));
        } catch {
          // 保存できなくても、今回のログインは続行する。
        }

        this.setMessage(message, `${result.user.name}さん、ようこそ！`, false, true);
        submitButton.textContent = 'ログイン成功';
        this.time.delayedCall(900, () => {
          dom.destroy();
          this.scene.start('HomeScene');
        });
      } catch (error) {
        const text = error instanceof Error ? error.message : 'サーバーに接続できませんでした。';
        this.setMessage(message, text, true);
        submitButton.disabled = false;
        submitButton.textContent = 'ログイン';
      }
    });

    const back = this.add.text(78, 58, '← 戻る', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#536878',
      padding: { left: 20, right: 20, top: 12, bottom: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerup', () => {
      dom.destroy();
      this.scene.start('TitleScene');
    });

    const registerLink = this.add.text(width / 2, height - 85, '未登録の方はこちら（新規登録）', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '21px',
      color: '#356cbf',
      backgroundColor: '#ffffff',
      padding: { left: 22, right: 22, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    registerLink.on('pointerup', () => {
      dom.destroy();
      this.scene.start('RegisterScene');
    });
  }

  private setMessage(
    element: HTMLParagraphElement,
    text: string,
    isError: boolean,
    isSuccess = false
  ): void {
    element.textContent = text;
    element.classList.toggle('is-error', isError);
    element.classList.toggle('is-success', isSuccess);
  }
}
