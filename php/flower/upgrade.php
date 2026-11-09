<?php
declare(strict_types=1);
require_once __DIR__ . '/../stage/common.php';
require_once __DIR__ . '/training.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok'=>false,'error'=>'POSTで送信してください。'],405);
try {
    $userId = requireStageUserId($pdo);
    $body = requestBody();
    respond(upgradeFlowerLevel($pdo, $userId, $body, ($body['kind'] ?? 'level') === 'skill'));
} catch (Throwable $error) {
    $status = (int)$error->getCode();
    if ($error instanceof RuntimeException && !$error instanceof PDOException && in_array($status,[401,403,409,422],true)) respond(['ok'=>false,'error'=>$error->getMessage()],$status);
    error_log('Flower upgrade failed: ' . $error->getMessage());
    respond(['ok'=>false,'error'=>'強化を完了できませんでした。最新の状態を読み直してください。'],500);
}
