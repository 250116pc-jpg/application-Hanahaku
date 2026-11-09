<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
declare(strict_types=1);

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 環境変数を優先し、未設定時は読み込み済みの.env設定から値を取得する。
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
 * 処理内容 : 許可された接続元だけにCookie付きCORSを許可し、JSON以外のPOSTを拒否してOPTIONSへ応答する。
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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : HTTPステータスとJSONレスポンスを返し、以降の処理を終了する。
 * ================================== */
function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : リクエスト本文をJSONとして読み取り、配列として扱える入力か検査する。
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
 * 処理内容 : usersの列構成を調べ、新旧のパスワード保存列名を判定する。
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

try {
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 環境変数から接続情報を取得し、例外通知とプリペアド文を使用するPDO接続を作成する。
     * ================================== */
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
