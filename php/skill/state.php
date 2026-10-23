<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);

try {
    initializeSkillStates($pdo, $userId);
    $query = $pdo->prepare('SELECT flower_id, mp, cooldown_until FROM player_skill_states WHERE user_id = ?');
    $query->execute([$userId]);
    $storedStates = [];
    foreach ($query->fetchAll() as $row) {
        $storedStates[(int)$row['flower_id']] = [
            'mp' => (int)$row['mp'],
            'cooldownUntil' => (int)$row['cooldown_until'] * 1000,
        ];
    }

    $states = [];
    $contractedIds = contractedFlowerIds($pdo, $userId);
    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        if (!in_array($flowerId, $contractedIds, true)) {
            continue;
        }
        $states[] = [
            'flowerId' => $flowerId,
            'mp' => $storedStates[$flowerId]['mp'] ?? $definition['maxMp'],
            'cooldownUntil' => $storedStates[$flowerId]['cooldownUntil'] ?? 0,
            'maxMp' => $definition['maxMp'],
            'skill' => buildFlowerSkill($flowerId, 1, 1),
        ];
    }

    respond(['ok' => true, 'flowers' => $states]);
} catch (PDOException $error) {
    error_log('Could not load skill states: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'スキル・契約状態のテーブルを読み込めません。sql/skill_seed.sqlとsql/player_skill_states.sqlを適用してください。'], 500);
}
