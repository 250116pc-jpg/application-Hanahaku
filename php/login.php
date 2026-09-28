<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$body = requestBody();
$email = trim((string)($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    respond(['ok' => false, 'error' => 'メールアドレスとパスワードを入力してください。'], 422);
}

$passwordColumn = passwordColumn($pdo);
$statement = $pdo->prepare(
    "SELECT id, name, email, `{$passwordColumn}` AS password_hash FROM users WHERE email = ? LIMIT 1"
);
$statement->execute([$email]);
$user = $statement->fetch();

if (!$user || !password_verify($password, (string)$user['password_hash'])) {
    respond(['ok' => false, 'error' => 'メールアドレスまたはパスワードが違います。'], 401);
}

$update = $pdo->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
$update->execute([(int)$user['id']]);

issueSession($pdo, (int)$user['id']);

respond([
    'ok' => true,
    'user' => [
        'id' => (int)$user['id'],
        'name' => (string)$user['name'],
        'email' => (string)$user['email'],
    ],
]);
