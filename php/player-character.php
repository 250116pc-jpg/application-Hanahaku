<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'GETで送信してください。'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/admin/player-character-config.php';
try {
    echo json_encode(['ok' => true, 'character' => readGlobalPlayerCharacter()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Could not read global player character: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => '主人公の設定を読み込めませんでした。'], JSON_UNESCAPED_UNICODE);
}
