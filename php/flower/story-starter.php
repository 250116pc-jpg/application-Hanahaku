<?php
declare(strict_types=1);

require_once __DIR__ . '/../stage/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireStageUserId($pdo);
$ziniaId = 1;
try {
    // 冒頭ストーリーを読み直しても、既存の契約日時・育成データを保つ。
    $query = $pdo->prepare(
        'INSERT INTO player_flowers (user_id, flower_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE flower_id = flower_id'
    );
    $query->execute([$userId, $ziniaId]);
    respond(['ok' => true]);
} catch (Throwable $error) {
    error_log('Could not save story starter: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'ジニアとの花契を保存できませんでした。'], 500);
}
