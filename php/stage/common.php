<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
declare(strict_types=1);

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 認証・DBなどの共通処理を読み込む
 * ================================== */
require_once __DIR__ . '/../auth.php';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 認証CookieとDBセッションからユーザーIDを確定する
 * ================================== */
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
