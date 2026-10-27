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

function battleStatusDefinitions(): array
{
    static $definitions = null;
    if ($definitions !== null) {
        return $definitions;
    }

    $path = __DIR__ . '/statuses.json';
    $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    if (!isset($data['statuses']) || !is_array($data['statuses'])) {
        throw new RuntimeException('Status definitions must contain a statuses array.');
    }

    $definitions = [];
    foreach ($data['statuses'] as $definition) {
        if (!is_array($definition) || !isset($definition['id']) || !is_string($definition['id'])) {
            throw new RuntimeException('Each status definition must have a string ID.');
        }
        $definitions[$definition['id']] = $definition;
    }

    return $definitions;
}

function flowerSkillTemplates(): array
{
    static $templates = null;
    if ($templates !== null) {
        return $templates;
    }

    $path = __DIR__ . '/skills.json';
    $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    if (!isset($data['skills']) || !is_array($data['skills'])) {
        throw new RuntimeException('Skill definitions must contain a skills array.');
    }

    $templates = [];
    $statusDefinitions = battleStatusDefinitions();
    foreach ($data['skills'] as $definition) {
        if (!is_array($definition) || !isset($definition['id']) || !is_int($definition['id'])) {
            throw new RuntimeException('Each skill definition must have an integer ID.');
        }
        foreach ($definition['statusIds'] ?? [] as $statusId) {
            if (!is_string($statusId) || !isset($statusDefinitions[$statusId])) {
                throw new RuntimeException('Skill refers to an unknown status ID.');
            }
        }
        $templates[$definition['id']] = $definition;
    }

    return $templates;
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
    $skill = array_merge([
        'name' => $base['name'],
        'description' => $base['description'],
        'type' => $base['type'],
        'element' => $base['element'],
        'category' => $base['category'],
        'level' => $level,
        'attackPower' => $attackPower,
        'mpCost' => $base['mpCost'],
        'cooldownSeconds' => $base['cooldownSeconds'],
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
    ], resolveSkillLevelValues($base['effect'] ?? [], $level));
    $skill['cooldownSeconds'] = max(1, $base['cooldownSeconds'] - ($level - 1));
    $skill['mpCost'] = max(1, $base['mpCost'] - ($level - 1));

    return $skill;
}

function resolveSkillLevelValues(array $values, int $level): array
{
    $resolved = [];
    foreach ($values as $key => $value) {
        if (is_array($value) && isset($value['base'], $value['perLevel'])) {
            $resolved[$key] = $value['base'] + $level * $value['perLevel'];
        } elseif (is_array($value)) {
            $resolved[$key] = resolveSkillLevelValues($value, $level);
        } else {
            $resolved[$key] = $value;
        }
    }
    return $resolved;
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
