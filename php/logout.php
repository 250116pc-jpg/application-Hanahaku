<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
declare(strict_types=1);
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 現在のサーバー側セッションを失効させ、認証Cookieを削除してログアウトする。
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
