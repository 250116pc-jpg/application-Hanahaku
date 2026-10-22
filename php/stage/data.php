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
if ($stageId !== 2) {
    http_response_code(404);
    echo json_encode(['error' => 'ステージが見つかりません。'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stagePath = __DIR__ . '/stage2.json';
$stageJson = file_get_contents($stagePath);
if ($stageJson === false || json_decode($stageJson) === null) {
    http_response_code(500);
    echo json_encode(['error' => 'ステージデータを読み込めません。'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo $stageJson;
