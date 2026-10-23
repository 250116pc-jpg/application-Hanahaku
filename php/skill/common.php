<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth.php';

function requireSkillUserId(PDO $pdo): int
{
    $hash = authHash();
    if ($hash === null) {
        respond(['ok' => false, 'error' => 'スキルを使うにはログインしてください。'], 401);
    }

    try {
        $query = $pdo->prepare(
            'SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()'
        );
        $query->execute([$hash]);
        $userId = $query->fetchColumn();
    } catch (PDOException $error) {
        error_log('Could not validate skill session: ' . $error->getMessage());
        respond(['ok' => false, 'error' => 'ログイン状態を確認できません。'], 500);
    }
    if ($userId === false) {
        respond(['ok' => false, 'error' => 'ログインの有効期限が切れました。ログインし直してください。'], 401);
    }

    return (int)$userId;
}

function flowerSkillTemplates(): array
{
    return [
        1 => ['name' => '軽い攻撃スキルを連打', 'description' => '前方に連続攻撃する', 'type' => 'multiHit', 'element' => '熱', 'category' => '攻撃', 'maxMp' => 230, 'cooldownSeconds' => 25, 'mpCost' => 20],
        2 => ['name' => 'どっしり固いディフェンス', 'description' => '防御力を上げ、定期的にHPを回復する', 'type' => 'defensiveRecovery', 'element' => '無', 'category' => '強化・回復', 'maxMp' => 180, 'cooldownSeconds' => 26, 'mpCost' => 28],
        3 => ['name' => '太陽の光線的な一発どかんタイプ', 'description' => '3秒ためて強力な一撃を放つ', 'type' => 'charge', 'element' => '熱', 'category' => '攻撃', 'maxMp' => 310, 'cooldownSeconds' => 28, 'mpCost' => 30],
        4 => ['name' => '扱いやすいバランス型', 'description' => '攻防を強化し、追尾弾を放つ', 'type' => 'balanced', 'element' => '熱', 'category' => '攻撃・強化', 'maxMp' => 160, 'cooldownSeconds' => 30, 'mpCost' => 34],
        5 => ['name' => '絶え間ない連続攻撃スキル', 'description' => '攻撃速度を上げ、連続攻撃する', 'type' => 'continuous', 'element' => '水', 'category' => '攻撃・強化', 'maxMp' => 210, 'cooldownSeconds' => 33, 'mpCost' => 31],
        6 => ['name' => '紅葉', 'description' => '緑の強化形態と赤の三段攻撃を切り替える', 'type' => 'maple', 'element' => '風', 'category' => '攻撃・変化・強化・回復', 'maxMp' => 260, 'cooldownSeconds' => 42, 'mpCost' => 33],
        7 => ['name' => 'トップクラスの耐久力', 'description' => '最大HPと防御力を上げる', 'type' => 'fortify', 'element' => '無', 'category' => '強化', 'maxMp' => 240, 'cooldownSeconds' => 45, 'mpCost' => 60],
        8 => ['name' => 'デバフ（被ダメアップや鈍足）とか', 'description' => '敵全体を攻撃し、攻撃速度を下げる', 'type' => 'slowAttack', 'element' => '光', 'category' => '攻撃・弱化', 'maxMp' => 220, 'cooldownSeconds' => 30, 'mpCost' => 36],
        9 => ['name' => '回復。', 'description' => 'HPを回復する', 'type' => 'heal', 'element' => '無', 'category' => '回復', 'maxMp' => 190, 'cooldownSeconds' => 30, 'mpCost' => 22],
        10 => ['name' => '隠密系', 'description' => '攻撃後、一定時間回避率を上げる', 'type' => 'evasion', 'element' => '土', 'category' => '攻撃・強化', 'maxMp' => 240, 'cooldownSeconds' => 31, 'mpCost' => 35],
    ];
}

function flowerSkillDefinitions(): array
{
    $skills = flowerSkillTemplates();
    foreach ($skills as $flowerId => &$definition) {
        $definition['skill'] = buildFlowerSkill($flowerId, 1, 1);
    }
    unset($definition);

    return $skills;
}

function buildFlowerSkill(int $flowerId, int $level, int $attackPower): array
{
    $templates = flowerSkillTemplates();
    if (!isset($templates[$flowerId])) {
        throw new InvalidArgumentException('Unknown flower skill.');
    }

    $base = $templates[$flowerId];
    $skill = $base + [
        'level' => $level,
        'attackPower' => $attackPower,
        'damagePercent' => 0,
        'hitCount' => 1,
        'range' => 190,
        'durationMs' => 0,
        'attackBonusPercent' => 0,
        'defenseBonusPercent' => 0,
        'healPercent' => 0,
        'healIntervalMs' => 0,
        'maxHealthBonusPercent' => 0,
        'attackSpeedBonusPercent' => 0,
        'slowPercent' => 0,
        'evasionPercent' => 0,
        'repeatIntervalMs' => 0,
        'stages' => [],
    ];
    unset($skill['maxMp']);
    $skill['level'] = $level;
    $skill['attackPower'] = $attackPower;
    $skill['cooldownSeconds'] = max(1, $base['cooldownSeconds'] - $level + 1);
    $skill['mpCost'] = max(1, $base['mpCost'] - $level + 1);

    switch ($flowerId) {
        case 1:
            $skill['damagePercent'] = 100 + $level * 20;
            $skill['hitCount'] = 3 + $level;
            break;
        case 2:
            $skill['durationMs'] = 15000;
            $skill['defenseBonusPercent'] = 15 + $level * 3;
            $skill['healPercent'] = 5 + $level;
            $skill['healIntervalMs'] = 5000;
            break;
        case 3:
            $skill['durationMs'] = 3000;
            $skill['defenseBonusPercent'] = -(20 + $level * 4);
            $skill['damagePercent'] = 300 + $level * 15;
            break;
        case 4:
            $skill['durationMs'] = (15 + $level) * 1000;
            $skill['attackBonusPercent'] = 15 + $level * 5;
            $skill['defenseBonusPercent'] = 10;
            $skill['damagePercent'] = 15 + $level;
            $skill['repeatIntervalMs'] = 3000;
            break;
        case 5:
            $skill['durationMs'] = 20000;
            $skill['attackBonusPercent'] = 10 + $level * 5;
            $skill['defenseBonusPercent'] = -15;
            $skill['attackSpeedBonusPercent'] = 30 + $level * 2;
            $skill['damagePercent'] = 150 + $level * 10;
            $skill['repeatIntervalMs'] = 1000;
            break;
        case 6:
            $skill['durationMs'] = 20000;
            $skill['defenseBonusPercent'] = 30 + $level * 3;
            $skill['healPercent'] = $level;
            $skill['healIntervalMs'] = 1000;
            $skill['stages'] = [
                ['damagePercent' => 100 + $level * 10, 'range' => 120, 'knockback' => false],
                ['damagePercent' => 140 + $level * 20, 'range' => 160, 'knockback' => false],
                ['damagePercent' => 180 + $level * 30, 'range' => 200, 'knockback' => true],
            ];
            break;
        case 7:
            $skill['durationMs'] = (35 + $level * 2) * 1000;
            $skill['maxHealthBonusPercent'] = 75 + $level * 15;
            $skill['healPercent'] = 75 + $level * 15;
            $skill['defenseBonusPercent'] = 10 + $level * 5;
            $skill['attackBonusPercent'] = -(10 + $level * 5);
            break;
        case 8:
            $skill['damagePercent'] = 80 + $level * 10;
            $skill['durationMs'] = (12 + $level) * 1000;
            $skill['slowPercent'] = 20;
            $skill['range'] = 10000;
            break;
        case 9:
            $skill['healPercent'] = 80 + $level * 15;
            break;
        case 10:
            $skill['damagePercent'] = 100 + $level * 10;
            $skill['durationMs'] = 15000;
            $skill['evasionPercent'] = 30;
            break;
    }

    return $skill;
}

function contractedFlowerIds(PDO $pdo, int $userId): array
{
    $query = $pdo->prepare('SELECT flower_id FROM player_flowers WHERE user_id = ?');
    $query->execute([$userId]);
    return array_map('intval', $query->fetchAll(PDO::FETCH_COLUMN));
}

function initializeSkillStates(PDO $pdo, int $userId): void
{
    $insert = $pdo->prepare(
        'INSERT IGNORE INTO player_skill_states (user_id, flower_id, mp, cooldown_until) VALUES (?, ?, ?, 0)'
    );

    $contractedIds = contractedFlowerIds($pdo, $userId);
    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        if (!in_array($flowerId, $contractedIds, true)) {
            continue;
        }
        $insert->execute([$userId, $flowerId, $definition['maxMp']]);
    }
}
