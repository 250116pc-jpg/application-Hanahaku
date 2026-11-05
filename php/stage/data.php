<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'GETで送信してください。'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stageId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!in_array($stageId, [2, 4], true)) {
    http_response_code(404);
    echo json_encode(['error' => 'ステージが見つかりません。'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stagePath = __DIR__ . '/stage' . $stageId . '.json';
$stageJson = file_get_contents($stagePath);
if ($stageJson === false) {
    http_response_code(500);
    echo json_encode(['error' => 'ステージデータを読み込めません。'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stage = json_decode($stageJson, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($stage) || !isset($stage['enemies']) || !is_array($stage['enemies'])) {
        throw new UnexpectedValueException('Invalid stage enemy list.');
    }

    $upgradePath = __DIR__ . '/../ally/upgrades.json';
    $upgradeJson = is_file($upgradePath) ? file_get_contents($upgradePath) : false;
    if ($upgradeJson === false) throw new RuntimeException('Ally upgrade data not found.');
    $upgradeData = json_decode($upgradeJson, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($upgradeData) || !is_array($upgradeData['upgrades'] ?? null)) {
        throw new UnexpectedValueException('Invalid upgrade data.');
    }
    $upgrades = [];
    foreach ($upgradeData['upgrades'] as $upgrade) {
        if (!is_array($upgrade) || !isset($upgrade['upgrade_id'])) throw new UnexpectedValueException('Invalid upgrade profile.');
        $upgradeId = filter_var($upgrade['upgrade_id'], FILTER_VALIDATE_INT);
        if ($upgradeId === false || $upgradeId < 1) throw new UnexpectedValueException('Invalid upgrade ID.');
        $upgrades[$upgradeId] = $upgrade;
    }

    foreach ($stage['enemies'] as &$enemy) {
        if (!is_array($enemy)) throw new UnexpectedValueException('Invalid enemy spawn record.');
        $enemyId = filter_var($enemy['id'] ?? null, FILTER_VALIDATE_INT);
        if ($enemyId === false || $enemyId < 1) throw new UnexpectedValueException('Invalid enemy ID.');
        $level = filter_var($enemy['level'] ?? 1, FILTER_VALIDATE_INT);
        if ($level === false || $level < 1) throw new UnexpectedValueException('Invalid enemy level.');

        $enemyPath = __DIR__ . '/../enemy/enemy' . $enemyId . '.json';
        $enemyJson = is_file($enemyPath) ? file_get_contents($enemyPath) : false;
        if ($enemyJson === false) throw new RuntimeException('Enemy definition not found.');

        $enemyStats = json_decode($enemyJson, true, 512, JSON_THROW_ON_ERROR);
        if (
            !is_array($enemyStats) ||
            (int)($enemyStats['id'] ?? 0) !== $enemyId ||
            !is_string($enemyStats['name'] ?? null)
        ) {
            throw new UnexpectedValueException('Invalid enemy definition.');
        }
        $statKeys = [
            'hp', 'mp', 'physicalAttack', 'magicAttack', 'physicalDefense', 'magicDefense',
            'healingPower', 'attackIntervalMs', 'agility', 'criticalRate', 'criticalDamage', 'contractFlowerId'
        ];
        foreach ($statKeys as $statKey) {
            if (!is_numeric($enemyStats[$statKey] ?? null)) throw new UnexpectedValueException('Enemy base stat is missing or invalid.');
        }

        $enhancementId = filter_var($enemy['enhancementId'] ?? $enemyStats['enhancementId'] ?? null, FILTER_VALIDATE_INT);
        if ($enhancementId === false || $enhancementId < 1 || !isset($upgrades[$enhancementId])) {
            throw new UnexpectedValueException('Enemy upgrade profile not found.');
        }
        $profile = $upgrades[$enhancementId];
        if (!is_string($profile['job'] ?? null) || !is_string($profile['direction'] ?? null) || !is_array($profile['growth'] ?? null)) {
            throw new UnexpectedValueException('Invalid enemy enhancement profile.');
        }
        $growth = $profile['growth'];
        foreach (['hp', 'mp', 'physicalAttack', 'magicAttack', 'physicalDefense', 'magicDefense', 'healingPower', 'criticalDamage'] as $growthKey) {
            if (!is_numeric($growth[$growthKey] ?? null)) throw new UnexpectedValueException('Enemy enhancement growth is missing or invalid.');
        }

        $levelOffset = $level - 1;
        $enemy['stats'] = [
            'level' => $level,
            'enhancementId' => $enhancementId,
            'job' => $profile['job'],
            'direction' => $profile['direction'],
        ];
        foreach ($statKeys as $statKey) {
            if ($statKey === 'contractFlowerId') {
                $enemy['stats'][$statKey] = (int)$enemyStats[$statKey];
                continue;
            }
            $growthKey = $statKey;
            $value = (float)$enemyStats[$statKey] + (float)($growth[$growthKey] ?? 0) * $levelOffset;
            if ($statKey === 'hp') $value = max(1, $value);
            if ($statKey === 'attackIntervalMs') $value = max(1, $value);
            if (in_array($statKey, ['mp', 'physicalAttack', 'magicAttack', 'physicalDefense', 'magicDefense', 'healingPower', 'criticalDamage'], true)) $value = max(0, $value);
            if ($statKey === 'criticalRate') $value = min(100, max(0, $value));
            $enemy['stats'][$statKey] = round($value, 2);
        }
    }
    unset($enemy);

    echo json_encode($stage, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    error_log('Could not load stage or enemy data: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'ステージまたは敵データを読み込めません。'], JSON_UNESCAPED_UNICODE);
}
