<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);
$body = requestBody();
$flowerId = filter_var($body['flowerId'] ?? null, FILTER_VALIDATE_INT);
$definitions = flowerSkillDefinitions();
if ($flowerId === false || !isset($definitions[$flowerId])) {
    respond(['ok' => false, 'error' => '選択した花のスキルは使用できません。'], 422);
}

$definition = $definitions[$flowerId];
$skill = $definition['skill'];

try {
    $pdo->beginTransaction();
    initializeSkillStates($pdo, $userId);
    $query = $pdo->prepare(
        'SELECT mp FROM player_skill_states WHERE user_id = ? AND flower_id = ? FOR UPDATE'
    );
    $query->execute([$userId, $flowerId]);
    $currentMp = $query->fetchColumn();
    if ($currentMp === false) {
        throw new RuntimeException('Skill state row was not created.');
    }
    $currentMp = (int)$currentMp;

    if ($currentMp < $skill['mpCost']) {
        $pdo->rollBack();
        respond([
            'ok' => false,
            'error' => 'MPが足りません。',
            'mp' => $currentMp,
        ], 422);
    }

    $remainingMp = $currentMp - $skill['mpCost'];
    $update = $pdo->prepare(
        'UPDATE player_skill_states SET mp = ? WHERE user_id = ? AND flower_id = ?'
    );
    $update->execute([$remainingMp, $userId, $flowerId]);
    $pdo->commit();

    respond([
        'ok' => true,
        'flowerId' => $flowerId,
        'mp' => $remainingMp,
        'skill' => $skill,
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Could not use flower skill: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'スキルを使用できませんでした。'], 500);
}
