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

    foreach ($stage['enemies'] as &$enemy) {
        if (!is_array($enemy)) throw new UnexpectedValueException('Invalid enemy spawn record.');
        $enemyId = filter_var($enemy['id'] ?? null, FILTER_VALIDATE_INT);
        if ($enemyId === false || $enemyId < 1) throw new UnexpectedValueException('Invalid enemy ID.');

        $enemyPath = __DIR__ . '/enemy' . $enemyId . '.json';
        $enemyJson = is_file($enemyPath) ? file_get_contents($enemyPath) : false;
        if ($enemyJson === false) throw new RuntimeException('Enemy definition not found.');

        $enemyStats = json_decode($enemyJson, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($enemyStats) || (int)($enemyStats['id'] ?? 0) !== $enemyId) {
            throw new UnexpectedValueException('Invalid enemy definition.');
        }
        $enemy['stats'] = $enemyStats;
    }
    unset($enemy);

    echo json_encode($stage, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    error_log('Could not load stage or enemy data: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'ステージまたは敵データを読み込めません。'], JSON_UNESCAPED_UNICODE);
}
