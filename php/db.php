<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
declare(strict_types=1);

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 接続設定を環境変数などから取得する
 * ================================== */
function projectEnv(string $name): ?string
{
    $environmentValue = getenv($name);
    if ($environmentValue !== false && trim($environmentValue) !== '') {
        return trim($environmentValue);
    }

    static $values = null;
    if ($values === null) {
        $values = [];
        $envPath = dirname(__DIR__) . '/.env';
        if (is_file($envPath)) {
            foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$key, $value] = array_map('trim', explode('=', $line, 2));
                $values[$key] = trim($value, "\"'");
            }
        }
    }

    return isset($values[$name]) && $values[$name] !== '' ? $values[$name] : null;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 送信方法が許可されているか確認する
 * ================================== */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$configuredOrigins = array_filter(array_map(
    'trim',
    explode(',', projectEnv('HANAHAKU_ALLOWED_ORIGINS') ?? '')
));
$isLocalOrigin = preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) === 1;
if ($isLocalOrigin || in_array($origin, $configuredOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
// Reject browser requests from untrusted origins before any mutation.
$sameOrigin = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
if ($origin !== '' && !$isLocalOrigin && $origin !== $sameOrigin && !in_array($origin, $configuredOrigins, true)) {
    respond(['ok' => false, 'error' => '許可されていない接続元です。'], 403);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    respond(['ok' => false, 'error' => 'JSONで送信してください。'], 415);
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 送信方法が許可されているか確認する
 * ================================== */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : HTTPステータスとJSON応答を返す
 * ================================== */
function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 送信されたJSONを読み取る
 * ================================== */
function requestBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        respond(['ok' => false, 'error' => '送信内容が正しくありません。'], 400);
    }
    return $body;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : usersの列構成からパスワード保存列を判定する
 * ================================== */
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

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 接続設定・入力検証・JSON応答を用意する
 * ================================== */
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
