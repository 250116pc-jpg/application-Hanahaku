<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
declare(strict_types=1);
require_once __DIR__ . '/db.php';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 認証Cookieの有効期限、送信範囲、HttpOnly・SameSite・HTTPS時のSecure属性を設定する。
 * ================================== */
function authCookie(string $value, int $expires): void {
    $path = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
    $path = implode('/', array_map('rawurlencode', explode('/', rawurldecode($path))));
    setcookie('hanahaku_auth', $value, [
        'expires' => $expires, 'path' => $path,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true, 'samesite' => 'Lax',
    ]);
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : Cookie内のセッショントークンの形式を検査し、DB照合用のSHA-256ハッシュへ変換する。
 * ================================== */
function authHash(): ?string {
    $token = $_COOKIE['hanahaku_auth'] ?? '';
    return is_string($token) && preg_match('/^[a-f0-9]{64}$/D', $token) === 1
        ? hash('sha256', $token) : null;
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 現在のCookieに対応するセッションをDBから削除する。
 * ================================== */
function revokeSession(PDO $pdo): void {
    $hash = authHash();
    if ($hash !== null) {
        $query = $pdo->prepare('DELETE FROM auth_sessions WHERE token_hash = ?');
        $query->execute([$hash]);
    }
}
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : ランダムトークンを発行し、旧セッションと期限切れデータを整理してハッシュをDBに保存し、Cookieを返す。
 * ================================== */
function issueSession(PDO $pdo, int $userId): void {
    try {
        $token = bin2hex(random_bytes(32));
        $expires = time() + 30 * 24 * 60 * 60;
        $pdo->beginTransaction();
        revokeSession($pdo);
        $pdo->exec('DELETE FROM auth_sessions WHERE expires_at <= UTC_TIMESTAMP()');
        $query = $pdo->prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
        $query->execute([hash('sha256', $token), $userId, gmdate('Y-m-d H:i:s', $expires)]);
        $pdo->commit();
        authCookie($token, $expires);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        respond(['ok' => false, 'error' => 'ログインを保存できません。sql/auth_sessions.sqlの適用を確認してください。'], 500);
    }
}
