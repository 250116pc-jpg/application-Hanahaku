<?php
declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        respond(['ok' => false, 'error' => '送信内容が正しくありません。'], 400);
    }
    return $body;
}

function passwordColumn(PDO $pdo): string
{
    try {
        $columns = $pdo->query('SHOW COLUMNS FROM users')->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException $error) {
        respond(['ok' => false, 'error' => '先にsql/hanahaku_users.sqlをphpMyAdminで読み込んでください。'], 500);
    }

    if (in_array('password_hash', $columns, true)) {
        return 'password_hash';
    }
    if (in_array('password', $columns, true)) {
        return 'password';
    }

    respond(['ok' => false, 'error' => 'usersテーブルにパスワード列がありません。'], 500);
}

try {
    $host = getenv('HANAHAKU_DB_HOST') ?: '127.0.0.1';
    $database = getenv('HANAHAKU_DB_NAME') ?: 'hanahaku';
    $user = getenv('HANAHAKU_DB_USER') ?: 'root';
    $password = getenv('HANAHAKU_DB_PASSWORD') ?: '';

    $pdo = new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (Throwable $error) {
    respond(['ok' => false, 'error' => 'データベースへ接続できません。'], 500);
}
