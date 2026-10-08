import {
  mountGoogleSignInButton,
  saveCurrentUser,
  type AuthenticatedUser,
} from '../../auth/GoogleSignIn';

interface LoginResponse {
  ok: boolean;
  error?: string;
  user?: AuthenticatedUser;
}

export interface LoginFormElements {
  element: HTMLFormElement;
  message: HTMLParagraphElement;
  submitButton: HTMLButtonElement;
  googleButton: HTMLDivElement;
}

interface LoginFormCallbacks {
  onAuthenticated(user: AuthenticatedUser): void;
}

export function createLoginForm(): LoginFormElements {
  const element = document.createElement('form');
  element.className = 'register-form login-form';
  element.innerHTML = `
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

  const message = element.querySelector<HTMLParagraphElement>('.register-message');
  const submitButton = element.querySelector<HTMLButtonElement>('button[type="submit"]');
  const googleButton = element.querySelector<HTMLDivElement>('.google-signin-button');
  if (!message || !submitButton || !googleButton) {
    throw new Error('ログインフォームを初期化できませんでした。');
  }

  return { element, message, submitButton, googleButton };
}

export function bindLoginForm(
  form: LoginFormElements,
  callbacks: LoginFormCallbacks
): () => void {
  const completeLogin = (user: AuthenticatedUser): void => {
    saveCurrentUser(user);
    setLoginMessage(form.message, `${user.name}さん、ようこそ！`, false, true);
    form.submitButton.disabled = true;
    form.submitButton.textContent = 'ログイン成功';
    callbacks.onAuthenticated(user);
  };

  const disposeGoogleButton = mountGoogleSignInButton(form.googleButton, {
    onStart: () => {
      setLoginMessage(form.message, 'Googleアカウントを確認しています。', false);
      form.submitButton.disabled = true;
    },
    onSuccess: completeLogin,
    onError: (text) => {
      setLoginMessage(form.message, text, true);
      form.submitButton.disabled = false;
    },
  });

  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const data = new FormData(form.element);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    form.submitButton.disabled = true;
    form.submitButton.textContent = '確認中…';
    setLoginMessage(form.message, '登録情報を確認しています。', false);

    try {
      const phpBaseUrl = (
        import.meta.env.VITE_PHP_BASE_URL ??
        'http://localhost/php/application-Hanahaku-main/php'
      ).replace(/\/$/, '');
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

      completeLogin(result.user);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'サーバーに接続できませんでした。';
      setLoginMessage(form.message, text, true);
      form.submitButton.disabled = false;
      form.submitButton.textContent = 'ログイン';
    }
  };

  form.element.addEventListener('submit', handleSubmit);

  return () => {
    disposeGoogleButton();
    form.element.removeEventListener('submit', handleSubmit);
  };
}

function setLoginMessage(
  element: HTMLParagraphElement,
  text: string,
  isError: boolean,
  isSuccess = false
): void {
  element.textContent = text;
  element.classList.toggle('is-error', isError);
  element.classList.toggle('is-success', isSuccess);
}
