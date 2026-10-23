<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);
$body = requestBody();
$flowerId = filter_var($body['flowerId'] ?? null, FILTER_VALIDATE_INT);
$level = filter_var($body['level'] ?? 1, FILTER_VALIDATE_INT);
$attackPower = filter_var($body['attackPower'] ?? 1, FILTER_VALIDATE_INT);
$definitions = flowerSkillDefinitions();
if (
    $flowerId === false || !isset($definitions[$flowerId]) ||
    $level === false || $level < 1 || $level > 100 ||
    $attackPower === false || $attackPower < 1 || $attackPower > 100000
) {
    respond(['ok' => false, 'error' => '選択した花のスキルは使用できません。'], 422);
}

$skill = buildFlowerSkill($flowerId, $level, $attackPower);

try {
    if (!in_array($flowerId, contractedFlowerIds($pdo, $userId), true)) {
        respond(['ok' => false, 'error' => '契約していない花のスキルは使用できません。'], 403);
    }

    $pdo->beginTransaction();
    initializeSkillStates($pdo, $userId);
    $query = $pdo->prepare(
        'SELECT mp, cooldown_until FROM player_skill_states WHERE user_id = ? AND flower_id = ? FOR UPDATE'
    );
    $query->execute([$userId, $flowerId]);
    $currentState = $query->fetch();
    if ($currentState === false) {
        throw new RuntimeException('Skill state row was not created.');
    }
    $currentMp = (int)$currentState['mp'];
    $cooldownUntil = (int)$currentState['cooldown_until'];
    if ($cooldownUntil > time()) {
        $pdo->rollBack();
        respond([
            'ok' => false,
            'error' => 'スキルはクールダウン中です。',
            'cooldownUntil' => $cooldownUntil * 1000,
        ], 429);
    }

    if ($currentMp < $skill['mpCost']) {
        $pdo->rollBack();
        respond([
            'ok' => false,
            'error' => 'MPが足りません。',
            'mp' => $currentMp,
        ], 422);
    }

    $remainingMp = $currentMp - $skill['mpCost'];
    $nextCooldown = time() + $skill['cooldownSeconds'];
    $update = $pdo->prepare(
        'UPDATE player_skill_states SET mp = ?, cooldown_until = ? WHERE user_id = ? AND flower_id = ?'
    );
    $update->execute([$remainingMp, $nextCooldown, $userId, $flowerId]);
    $pdo->commit();

    respond([
        'ok' => true,
        'flowerId' => $flowerId,
        'mp' => $remainingMp,
        'cooldownUntil' => $nextCooldown * 1000,
        'skill' => $skill,
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Could not use flower skill: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'スキルを使用できませんでした。'], 500);
}
