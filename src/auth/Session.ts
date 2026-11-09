/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜認証機能・Session
import { getPhpBaseUrl } from './PhpBaseUrl';
import { saveCurrentUser, type AuthenticatedUser } from './GoogleSignIn';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ブラウザに保存された利用者情報を削除する。
 * ================================== */
function clearUser(): void {
  try { localStorage.removeItem('hanahakuCurrentUser'); } catch { /* Storage may be unavailable. */ }
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 認証Cookieを付けてセッションAPIへ送信し、タイムアウトとレスポンスを検査する。
 * ================================== */
async function request(endpoint: string): Promise<{ ok: boolean; user?: AuthenticatedUser | null; error?: string }> {
  const base = getPhpBaseUrl();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${base}/${endpoint}.php`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: '{}', signal: controller.signal, cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error ?? 'サーバーに接続できません。');
    return result;
  } finally { window.clearTimeout(timeout); }
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : サーバーのセッションを照合し、有効なら利用者情報を復元し、無効ならローカル情報を消す。
 * ================================== */
export async function restoreSession(): Promise<boolean> {
  clearUser();
  const result = await request('session');
  if (!result.user) return false;
  saveCurrentUser(result.user);
  return true;
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : サーバーのセッションを終了してブラウザの利用者情報を消す。
 * ================================== */
export async function logout(): Promise<void> {
  await request('logout');
  clearUser();
}
