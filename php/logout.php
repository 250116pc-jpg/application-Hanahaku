<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
declare(strict_types=1);
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 共通処理を読み込み、要求と認証状態を確認する
 * ================================== */
require __DIR__ . '/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false], 405);
try {
    revokeSession($pdo);
    authCookie('', time() - 3600);
    respond(['ok' => true]);
} catch (PDOException $error) {
    respond(['ok' => false, 'error' => 'ログアウトできません。もう一度お試しください。'], 500);
}
