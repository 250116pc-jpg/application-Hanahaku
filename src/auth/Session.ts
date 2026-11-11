/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
import { getPhpBaseUrl } from './PhpBaseUrl';
import { saveCurrentUser, type AuthenticatedUser } from './GoogleSignIn';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ブラウザに保持したログインユーザー情報を削除する
 * ================================== */
function clearUser(): void {
  try { localStorage.removeItem('hanahakuCurrentUser'); } catch { /* Storage may be unavailable. */ }
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 認証APIへCookie付きで送信し、応答を取得する
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
 * 処理内容 : 認証セッションを確認してログイン情報を復元する
 * ================================== */
export async function restoreSession(): Promise<boolean> {
  clearUser();
  const result = await request('session');
  if (!result.user) return false;
  saveCurrentUser(result.user);
  return true;
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ログアウトAPIを呼び、ブラウザのログイン情報を消す
 * ================================== */
export async function logout(): Promise<void> {
  await request('logout');
  clearUser();
}
