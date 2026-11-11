/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
/** Use the PC host when a phone opens the local development server. */
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : PHP APIの接続先を解決し、環境に応じたURLを返す
 * ================================== */
export function resolvePhpBaseUrl(configured: string | undefined, pageUrl: string, development: boolean): string {
  const page = new URL(pageUrl);
  const base = new URL(configured?.trim() || '/php/アプリケーション開発/application-Hanahaku/php', page);
  const loopback = (host: string) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
  const privateV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
  if (development && loopback(base.hostname) && privateV4.test(page.hostname)) {
    base.hostname = page.hostname;
  }
  return base.href.replace(/\/$/, '');
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 環境設定に対応するPHP APIの接続先URLを返す
 * ================================== */
export function getPhpBaseUrl(): string {
  return resolvePhpBaseUrl(import.meta.env.VITE_PHP_BASE_URL, window.location.href, import.meta.env.DEV);
}
