<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
$userId = requireStageUserId($pdo);

try {
    $query = $pdo->prepare('SELECT coin, stage_data FROM users WHERE id = ?');
    $query->execute([$userId]);
    $row = $query->fetch();
    if (!$row) respond(['ok' => false, 'error' => 'ユーザーが見つかりません。'], 404);
    $stageData = is_string($row['stage_data']) ? json_decode($row['stage_data'], true) : $row['stage_data'];
    $completed = is_array($stageData) && isset($stageData['completed']) && is_array($stageData['completed'])
        ? array_values(array_unique(array_map('intval', $stageData['completed']))) : [];
    respond(['ok' => true, 'progress' => ['completedStageIds' => $completed, 'coins' => (int)$row['coin']]]);
} catch (Throwable $error) {
    error_log('Could not load stage progress: ' . $error->getMessage());
    respond(['ok' => false, 'error' => '進行状況を読み込めませんでした。'], 500);
}
