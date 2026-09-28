<?php
declare(strict_types=1);
require __DIR__ . '/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false], 405);
$hash = authHash();
if ($hash === null) respond(['ok' => true, 'user' => null]);
try {
    $query = $pdo->prepare('SELECT u.id, u.name, u.email FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()');
    $query->execute([$hash]);
    $user = $query->fetch();
    if (!$user) {
        revokeSession($pdo);
        authCookie('', time() - 3600);
        respond(['ok' => true, 'user' => null]);
    }
    $user['id'] = (int)$user['id'];
    respond(['ok' => true, 'user' => $user]);
} catch (PDOException $error) {
    respond(['ok' => false, 'error' => 'ログイン状態を確認できません。'], 500);
}
