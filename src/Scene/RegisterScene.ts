import Phaser from 'phaser';
import { mountAuthLayout } from '../auth/AuthLayout';
import {
  mountGoogleSignInButton,
  saveCurrentUser,
  type AuthenticatedUser,
} from '../auth/GoogleSignIn';

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
    const formElement = document.createElement('form');
    formElement.className = 'flower-auth-form';
    formElement.innerHTML = `
      <div class="google-auth-area">
        <div class="google-signin-button" aria-label="Googleアカウントで登録する"></div>
        <p class="google-auth-hint">Googleならパスワード入力なしで登録できます</p>
      </div>
      <div class="auth-separator"><span>またはメールアドレスで新規登録</span></div>
      <label>
        プレイヤー名
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
      <button type="submit">作成する</button>
    `;

    const dom = mountAuthLayout(this, formElement, 'アカウント作成', 'ログインへ', 'LoginScene');
    const message = formElement.querySelector<HTMLParagraphElement>('.register-message');
    const submitButton = formElement.querySelector<HTMLButtonElement>('button[type="submit"]');
    const googleButton = formElement.querySelector<HTMLDivElement>('.google-signin-button');

    const finishGoogleRegistration = (user: AuthenticatedUser): void => {
      if (!message || !submitButton) return;
      saveCurrentUser(user);
      this.setMessage(message, `${user.name}さんの登録が完了しました！`, false, true);
      submitButton.disabled = true;
      submitButton.textContent = '登録完了';
      this.time.delayedCall(700, () => {
        dom.destroy();
        this.scene.start('HomeScene');
      });
    };

    const disposeGoogleButton = googleButton
      ? mountGoogleSignInButton(googleButton, {
        onStart: () => {
          if (message) this.setMessage(message, 'Googleアカウントを確認しています。', false);
          if (submitButton) submitButton.disabled = true;
        },
        onSuccess: finishGoogleRegistration,
        onError: (text) => {
          if (message) this.setMessage(message, text, true);
          if (submitButton) submitButton.disabled = false;
        },
      })
      : () => undefined;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeGoogleButton);

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
        const phpBaseUrl = (
          import.meta.env.VITE_PHP_BASE_URL ??
          'http://localhost/php/application-Hanahaku-main/php'
        )
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
