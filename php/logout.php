<?php
declare(strict_types=1);
require __DIR__ . '/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false], 405);
try {
    revokeSession($pdo);
    authCookie('', time() - 3600);
    respond(['ok' => true]);
} catch (PDOException $error) {
    respond(['ok' => false, 'error' => 'ログアウトできません。もう一度お試しください。'], 500);
}
