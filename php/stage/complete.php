<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
$userId = requireStageUserId($pdo);
$body = requestBody();
$stageId = filter_var($body['stageId'] ?? null, FILTER_VALIDATE_INT);
if (!in_array($stageId, [2, 4, 6, 8, 10], true)) respond(['ok' => false, 'error' => 'このステージのクリア結果は保存できません。'], 422);

const STAGE_CLEAR_REWARD = 100;
try {
    $pdo->beginTransaction();
    $query = $pdo->prepare('SELECT coin, stage_data FROM users WHERE id = ? FOR UPDATE');
    $query->execute([$userId]);
    $row = $query->fetch();
    if (!$row) {
        $pdo->rollBack();
        respond(['ok' => false, 'error' => 'ユーザーが見つかりません。'], 404);
    }

    $stageData = is_string($row['stage_data']) ? json_decode($row['stage_data'], true) : $row['stage_data'];
    if (!is_array($stageData)) $stageData = [];
    $completed = isset($stageData['completed']) && is_array($stageData['completed'])
        ? array_values(array_unique(array_map('intval', $stageData['completed']))) : [];
    $alreadyCleared = in_array($stageId, $completed, true);
    if (!$alreadyCleared) $completed[] = $stageId;
    $stageData['completed'] = $completed;
    $reward = $alreadyCleared ? 0 : STAGE_CLEAR_REWARD;
    $coins = (int)$row['coin'] + $reward;

    $update = $pdo->prepare('UPDATE users SET coin = ?, stage_data = ? WHERE id = ?');
    $update->execute([$coins, json_encode($stageData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $userId]);
    $pdo->commit();
    respond(['ok' => true, 'reward' => $reward, 'progress' => ['completedStageIds' => $completed, 'coins' => $coins]]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Could not save stage completion: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'ステージのクリア結果を保存できませんでした。'], 500);
}
