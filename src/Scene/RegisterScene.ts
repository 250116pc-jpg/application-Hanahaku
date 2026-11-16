/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { getPhpBaseUrl } from '../auth/PhpBaseUrl';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 受け渡すデータの型と共通設定を定義する
 * ================================== */
interface RegisterResponse {
  ok: boolean;
  id?: number;
  error?: string;
}

export function createRegisterForm(onRegistered: (email: string) => void): HTMLFormElement {
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 新規登録の入力フォームとメッセージ欄を作る
   * ================================== */
  const formElement = document.createElement('form');
  formElement.className = 'flower-auth-form';
  formElement.innerHTML = `
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

  const message = formElement.querySelector<HTMLParagraphElement>('.register-message');
  const submitButton = formElement.querySelector<HTMLButtonElement>('button[type="submit"]');

  /* === [ 担当 : 250082 武田優人 / 250056 斎藤永聖 ] ===
   * 処理内容 : 登録入力を検証して登録APIへ送信し、成功時はログインへ移動、失敗時はエラーを表示する
   * ================================== */
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!message || !submitButton) return;

    const data = new FormData(formElement);
    const username = String(data.get('username') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const passwordConfirm = String(data.get('passwordConfirm') ?? '');

    if (password !== passwordConfirm) {
      setMessage(message, 'パスワードが一致していません。', true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = '登録中…';
    setMessage(message, '登録しています。', false);

    try {
      const phpBaseUrl = getPhpBaseUrl();
      const response = await fetch(`${phpBaseUrl}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, email, password }),
      });
      const result = await response.json() as RegisterResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error || '登録できませんでした。');
      }

      setMessage(message, 'アカウントを作成しました。ログインしてください。', false, true);
      submitButton.textContent = '登録完了';
      onRegistered(email);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'サーバーに接続できませんでした。';
      setMessage(message, text, true);
      submitButton.disabled = false;
      submitButton.textContent = '登録する';
    }
  });

  return formElement;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 認証の結果やエラーを文字色・表示状態へ反映する
 * ================================== */
function setMessage(
  element: HTMLParagraphElement,
  text: string,
  isError: boolean,
  isSuccess = false
): void {
  element.textContent = text;
  element.classList.toggle('is-error', isError);
  element.classList.toggle('is-success', isSuccess);
}
