<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
$userId = requireStageUserId($pdo);
$body = requestBody();
$chapter = filter_var($body['chapter'] ?? null, FILTER_VALIDATE_INT);
$stage = filter_var($body['stage'] ?? null, FILTER_VALIDATE_INT);
if ($chapter === false || $chapter < 1 || $stage === false || $stage < 1) {
    respond(['ok' => false, 'error' => 'シナリオの指定が正しくありません。'], 422);
}

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
    $completedStories = isset($stageData['completedStories']) && is_array($stageData['completedStories'])
        ? array_values(array_unique(array_filter($stageData['completedStories'], static fn($id) => is_string($id) && preg_match('/^\d+:\d+$/', $id) === 1)))
        : [];
    $sceneId = $chapter . ':' . $stage;
    if (!in_array($sceneId, $completedStories, true)) $completedStories[] = $sceneId;
    $stageData['completedStories'] = $completedStories;

    $update = $pdo->prepare('UPDATE users SET stage_data = ? WHERE id = ?');
    $update->execute([json_encode($stageData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $userId]);
    $pdo->commit();
    respond(['ok' => true, 'progress' => [
        'completedStageIds' => $completed,
        'completedStorySceneIds' => $completedStories,
        'coins' => (int)$row['coin'],
    ]]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Could not save story completion: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'シナリオの進行状況を保存できませんでした。'], 500);
}
