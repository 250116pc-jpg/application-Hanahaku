import { createSceneFade } from '../utils/ui/scene-fade';
import { getPhpBaseUrl } from '../auth/PhpBaseUrl';
import Phaser from 'phaser';
import { mountAuthLayout } from '../auth/AuthLayout';
import {
  mountGoogleSignInButton,
  saveCurrentUser,
  type AuthenticatedUser,
} from '../auth/GoogleSignIn';

interface LoginResponse {
  ok: boolean;
  error?: string;
  user?: AuthenticatedUser;
}

export class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  create(): void {
    this.input.enabled = true;
    const navigate = createSceneFade(this);
    const formElement = document.createElement('form');
    formElement.className = 'flower-auth-form';
    formElement.innerHTML = `
      <div class="google-auth-area">
        <div class="google-signin-button" aria-label="Googleアカウントで続ける"></div>
        <p class="google-auth-hint">初回はGoogleアカウントで自動登録されます</p>
      </div>
      <div class="auth-separator"><span>またはメールアドレスでログイン</span></div>
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

    mountAuthLayout(this, formElement, 'ログイン', 'アカウント作成へ', 'RegisterScene', navigate);
    const message = formElement.querySelector<HTMLParagraphElement>('.register-message');
    const submitButton = formElement.querySelector<HTMLButtonElement>('button[type="submit"]');
    const googleButton = formElement.querySelector<HTMLDivElement>('.google-signin-button');

    const finishLogin = (user: AuthenticatedUser): void => {
      if (!message || !submitButton) return;
      saveCurrentUser(user);
      this.setMessage(message, `${user.name}さん、ようこそ！`, false, true);
      submitButton.disabled = true;
      submitButton.textContent = 'ログイン成功';
      this.time.delayedCall(700, () => {

        navigate('HomeScene');
      });
    };

    const disposeGoogleButton = googleButton
      ? mountGoogleSignInButton(googleButton, {
        onStart: () => {
          if (message) this.setMessage(message, 'Googleアカウントを確認しています。', false);
          if (submitButton) submitButton.disabled = true;
        },
        onSuccess: finishLogin,
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
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');

      submitButton.disabled = true;
      submitButton.textContent = '確認中…';
      this.setMessage(message, '登録情報を確認しています。', false);

      try {
        const phpBaseUrl = getPhpBaseUrl();
        const response = await fetch(`${phpBaseUrl}/login.php`, {
          method: 'POST',
      credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json() as LoginResponse;

        if (!response.ok || !result.ok || !result.user) {
          throw new Error(result.error || 'ログインできませんでした。');
        }

        finishLogin(result.user);
      } catch (error) {
        const text = error instanceof Error ? error.message : 'サーバーに接続できませんでした。';
        this.setMessage(message, text, true);
        submitButton.disabled = false;
        submitButton.textContent = 'ログイン';
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


