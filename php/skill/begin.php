<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);
$body = requestBody();
$stageId = filter_var($body['stageId'] ?? null, FILTER_VALIDATE_INT);
if (!in_array($stageId, [2, 4], true)) {
    respond(['ok' => false, 'error' => 'このステージのスキル状態を初期化できません。'], 422);
}
$flowerStats = [];
if (isset($body['flowers'])) {
    if (!is_array($body['flowers']) || count($body['flowers']) > 16) {
        respond(['ok' => false, 'error' => '花の戦闘データが正しくありません。'], 422);
    }
    foreach ($body['flowers'] as $flower) {
        if (
            !is_array($flower) ||
            !isset($flower['flowerId'], $flower['level'], $flower['attackPower']) ||
            !is_int($flower['flowerId']) ||
            !is_int($flower['level']) ||
            !is_int($flower['attackPower']) ||
            $flower['level'] < 1 || $flower['level'] > 100 ||
            $flower['attackPower'] < 1 || $flower['attackPower'] > 100000
        ) {
            respond(['ok' => false, 'error' => '花の戦闘データが正しくありません。'], 422);
        }
        $flowerStats[$flower['flowerId']] = [
            'level' => $flower['level'],
            'attackPower' => $flower['attackPower'],
        ];
    }
}

try {
    $pdo->beginTransaction();
    initializeSkillStates($pdo, $userId);

    $update = $pdo->prepare(
        'UPDATE player_skill_states SET mp = ?, cooldown_until = 0 WHERE user_id = ? AND flower_id = ?'
    );
    $contractedIds = contractedFlowerIds($pdo, $userId);
    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        if (!in_array($flowerId, $contractedIds, true)) {
            continue;
        }
        $update->execute([$definition['maxMp'], $userId, $flowerId]);
    }

    $query = $pdo->prepare('SELECT flower_id, mp, cooldown_until FROM player_skill_states WHERE user_id = ?');
    $query->execute([$userId]);
    $storedStates = [];
    foreach ($query->fetchAll() as $row) {
        $storedStates[(int)$row['flower_id']] = [
            'mp' => (int)$row['mp'],
            'cooldownUntil' => (int)$row['cooldown_until'] * 1000,
        ];
    }
    $pdo->commit();

    $states = [];
    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        if (!in_array($flowerId, $contractedIds, true)) {
            continue;
        }
        $states[] = [
            'flowerId' => $flowerId,
            'mp' => $storedStates[$flowerId]['mp'] ?? $definition['maxMp'],
            'cooldownUntil' => $storedStates[$flowerId]['cooldownUntil'] ?? 0,
            'maxMp' => $definition['maxMp'],
            'skill' => buildFlowerSkill(
                $flowerId,
                $flowerStats[$flowerId]['level'] ?? 1,
                $flowerStats[$flowerId]['attackPower'] ?? 1
            ),
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
