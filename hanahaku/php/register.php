<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$body = requestBody();
$name = trim((string)($body['name'] ?? ''));
$email = trim((string)($body['email'] ?? ''));
$plainPassword = (string)($body['password'] ?? '');

if ($name === '' || mb_strlen($name) > 50) {
    respond(['ok' => false, 'error' => 'ユーザー名は1〜50文字で入力してください。'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['ok' => false, 'error' => '正しいメールアドレスを入力してください。'], 422);
}
if (strlen($plainPassword) < 6 || strlen($plainPassword) > 72) {
    respond(['ok' => false, 'error' => 'パスワードは6〜72文字で入力してください。'], 422);
}

try {
    $passwordColumn = passwordColumn($pdo);
    $statement = $pdo->prepare(
        "INSERT INTO users (name, email, `{$passwordColumn}`) VALUES (?, ?, ?)"
    );
    $statement->execute([
        $name,
        $email,
        password_hash($plainPassword, PASSWORD_DEFAULT),
    ]);
} catch (PDOException $error) {
    if ((string)$error->getCode() === '23000') {
        respond(['ok' => false, 'error' => 'このメールアドレスは登録済みです。'], 409);
    }
    respond(['ok' => false, 'error' => 'ユーザーを登録できません。'], 500);
}

respond(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
