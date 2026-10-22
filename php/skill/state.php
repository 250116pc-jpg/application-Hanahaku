<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);

try {
    initializeSkillStates($pdo, $userId);
    $query = $pdo->prepare('SELECT flower_id, mp FROM player_skill_states WHERE user_id = ?');
    $query->execute([$userId]);
    $storedStates = [];
    foreach ($query->fetchAll() as $row) {
        $storedStates[(int)$row['flower_id']] = (int)$row['mp'];
    }

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
} catch (PDOException $error) {
    error_log('Could not load skill states: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'スキル状態を読み込めません。sql/player_skill_states.sqlを適用してください。'], 500);
}
