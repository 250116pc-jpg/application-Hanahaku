import Phaser from 'phaser';

interface RegisterResponse {
  ok: boolean;
  id?: number;
  error?: string;
}

export class RegisterScene extends Phaser.Scene {
  constructor() {
    super('RegisterScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor('#cfe3f5');
    this.add.rectangle(width / 2, height / 2, width - 80, height - 60, 0xf8fbff)
      .setStrokeStyle(4, 0xd8aa45);
    this.add.text(width / 2, 58, 'ユーザー登録', {
      fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
      fontSize: '36px',
      color: '#1f2937',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const formElement = document.createElement('form');
    formElement.className = 'register-form';
    formElement.innerHTML = `
      <label>
        ユーザー名
        <input name="username" type="text" maxlength="255" autocomplete="username" required>
      </label>
      <label>
        メールアドレス
        <input name="email" type="email" maxlength="255" autocomplete="email" required>
      </label>
      <label>
        パスワード（6文字以上）
        <input name="password" type="password" minlength="6" maxlength="72" autocomplete="new-password" required>
      </label>
      <label>
        パスワード確認
        <input name="passwordConfirm" type="password" minlength="6" maxlength="72" autocomplete="new-password" required>
      </label>
      <p class="register-message" aria-live="polite"></p>
      <button type="submit">登録する</button>
    `;

    const dom = this.add.dom(width / 2, height / 2 + 35, formElement);
    const message = formElement.querySelector<HTMLParagraphElement>('.register-message');
    const submitButton = formElement.querySelector<HTMLButtonElement>('button[type="submit"]');

    formElement.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!message || !submitButton) return;

      const data = new FormData(formElement);
      const username = String(data.get('username') ?? '').trim();
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');
      const passwordConfirm = String(data.get('passwordConfirm') ?? '');

      if (password !== passwordConfirm) {
        this.setMessage(message, 'パスワードが一致していません。', true);
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = '登録中…';
      this.setMessage(message, '登録しています。', false);

      try {
        const phpBaseUrl = (import.meta.env.VITE_PHP_BASE_URL ?? 'http://localhost/php2')
          .replace(/\/$/, '');
        const response = await fetch(`${phpBaseUrl}/register.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: username, email, password }),
        });
        const result = await response.json() as RegisterResponse;

        if (!response.ok || !result.ok) {
          throw new Error(result.error || '登録できませんでした。');
        }

        this.setMessage(message, `ユーザー登録が完了しました。（ID: ${result.id ?? '-'}）`, false, true);
        submitButton.textContent = '登録完了';
        this.time.delayedCall(1200, () => {
          dom.destroy();
          this.scene.start('LoginScene');
        });
      } catch (error) {
        const text = error instanceof Error ? error.message : 'サーバーに接続できませんでした。';
        this.setMessage(message, text, true);
        submitButton.disabled = false;
        submitButton.textContent = '登録する';
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
