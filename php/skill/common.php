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

function flowerSkillDefinitions(): array
{
    return [
        1 => [
            'maxMp' => 230,
            'skill' => [
                'type' => 'singleAttack',
                'name' => 'フラワースラッシュ',
                'description' => '前方の敵1体に大ダメージ',
                'mpCost' => 30,
                'damage' => 45,
                'healAmount' => 0,
                'defenseDurationMs' => 0,
                'range' => 190,
            ],
        ],
        5 => [
            'maxMp' => 210,
            'skill' => [
                'type' => 'areaAttack',
                'name' => '花嵐',
                'description' => '周囲の敵にダメージ',
                'mpCost' => 30,
                'damage' => 24,
                'healAmount' => 0,
                'defenseDurationMs' => 0,
                'range' => 190,
            ],
        ],
        3 => [
            'maxMp' => 310,
            'skill' => [
                'type' => 'heal',
                'name' => '花癒し',
                'description' => '主人公のHPを回復',
                'mpCost' => 30,
                'damage' => 0,
                'healAmount' => 35,
                'defenseDurationMs' => 0,
                'range' => 72,
            ],
        ],
        4 => [
            'maxMp' => 160,
            'skill' => [
                'type' => 'defense',
                'name' => '花守り',
                'description' => '5秒間、受けるダメージを軽減',
                'mpCost' => 30,
                'damage' => 0,
                'healAmount' => 0,
                'defenseDurationMs' => 5000,
                'range' => 72,
            ],
        ],
    ];
}

function initializeSkillStates(PDO $pdo, int $userId): void
{
    $insert = $pdo->prepare(
        'INSERT IGNORE INTO player_skill_states (user_id, flower_id, mp) VALUES (?, ?, ?)'
    );

    foreach (flowerSkillDefinitions() as $flowerId => $definition) {
        $insert->execute([$userId, $flowerId, $definition['maxMp']]);
    }
}
