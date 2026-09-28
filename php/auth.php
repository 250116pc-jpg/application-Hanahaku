<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function authCookie(string $value, int $expires): void {
    $path = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
    $path = implode('/', array_map('rawurlencode', explode('/', rawurldecode($path))));
    setcookie('hanahaku_auth', $value, [
        'expires' => $expires, 'path' => $path,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true, 'samesite' => 'Lax',
    ]);
}
function authHash(): ?string {
    $token = $_COOKIE['hanahaku_auth'] ?? '';
    return is_string($token) && preg_match('/^[a-f0-9]{64}$/D', $token) === 1
        ? hash('sha256', $token) : null;
}
function revokeSession(PDO $pdo): void {
    $hash = authHash();
    if ($hash !== null) {
        $query = $pdo->prepare('DELETE FROM auth_sessions WHERE token_hash = ?');
        $query->execute([$hash]);
    }
}
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
