<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth.php';

function requireStageUserId(PDO $pdo): int
{
    $hash = authHash();
    if ($hash === null) respond(['ok' => false, 'error' => '進行状況を同期するにはログインしてください。'], 401);
    $query = $pdo->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
    $query->execute([$hash]);
    $userId = $query->fetchColumn();
    if ($userId === false) respond(['ok' => false, 'error' => 'ログインの有効期限が切れました。'], 401);
    return (int)$userId;
}
