<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);
$body = requestBody();
$stageId = filter_var($body['stageId'] ?? null, FILTER_VALIDATE_INT);
if ($stageId !== 2) {
    respond(['ok' => false, 'error' => 'このステージのスキル状態を初期化できません。'], 422);
}

try {
    $pdo->beginTransaction();
    initializeSkillStates($pdo, $userId);

    $update = $pdo->prepare(
        'UPDATE player_skill_states SET mp = ? WHERE user_id = ? AND flower_id = ?'
    );
    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        $update->execute([$definition['maxMp'], $userId, $flowerId]);
    }

    $query = $pdo->prepare('SELECT flower_id, mp FROM player_skill_states WHERE user_id = ?');
    $query->execute([$userId]);
    $storedStates = [];
    foreach ($query->fetchAll() as $row) {
        $storedStates[(int)$row['flower_id']] = (int)$row['mp'];
    }
    $pdo->commit();

    $states = [];
    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        $states[] = [
            'flowerId' => $flowerId,
            'mp' => $storedStates[$flowerId] ?? $definition['maxMp'],
            'maxMp' => $definition['maxMp'],
            'skill' => $definition['skill'],
        ];
    }

    respond(['ok' => true, 'flowers' => $states]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Could not initialize stage skill states: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'ステージ開始時のMPを初期化できませんでした。'], 500);
}
