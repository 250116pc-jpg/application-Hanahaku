<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
declare(strict_types=1);
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 共通処理を読み込み、要求と認証状態を確認する
 * ================================== */
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
