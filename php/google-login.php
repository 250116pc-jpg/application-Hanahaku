<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056
 * 氏名：斎藤永聖
 * ================================== */
declare(strict_types=1);
require_once __DIR__ . '/starter-inventory.php';

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 共通処理を読み込み、要求と認証状態を確認する
 * ================================== */
require __DIR__ . '/auth.php';
require __DIR__ . '/google-token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$body = requestBody();
$credential = trim((string)($body['credential'] ?? ''));
$configuredClientId = projectEnv('VITE_GOOGLE_CLIENT_ID');
$clientId = ($configuredClientId === null || str_starts_with($configuredClientId, 'YOUR_GOOGLE_CLIENT_ID'))
    ? '459400588148-ko1ehqsnf6ve6mbu24v72gdg2t01vud4.apps.googleusercontent.com'
    : $configuredClientId;
if ($credential === '') {
    respond(['ok' => false, 'error' => 'Googleログイン情報がありません。'], 422);
}

try {
    $google = verifyGoogleIdToken($credential, $clientId);
} catch (RuntimeException $error) {
    respond(['ok' => false, 'error' => $error->getMessage()], 401);
}

$googleSub = (string)$google['sub'];
$email = trim((string)$google['email']);
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : Google認証を検証してログイン状態を作る
 * ================================== */
$name = trim((string)($google['name'] ?? ''));
if ($name === '') {
    $name = strstr($email, '@', true) ?: 'Googleユーザー';
}
$name = mb_substr($name, 0, 255);

try {
    $columns = $pdo->query('SHOW COLUMNS FROM users')->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('google_sub', $columns, true)) {
        respond(['ok' => false, 'error' => '更新済みのsql/hanahaku_users.sqlをphpMyAdminで読み込んでください。'], 500);
    }

    $statement = $pdo->prepare('SELECT id, name, email, google_sub FROM users WHERE google_sub = ? LIMIT 1');
    $statement->execute([$googleSub]);
    $user = $statement->fetch();

    if (!$user) {
        $statement = $pdo->prepare('SELECT id, name, email, google_sub FROM users WHERE email = ? LIMIT 1');
        $statement->execute([$email]);
        $user = $statement->fetch();

        if ($user) {
            $linkedSub = trim((string)($user['google_sub'] ?? ''));
            if ($linkedSub !== '' && !hash_equals($linkedSub, $googleSub)) {
                respond(['ok' => false, 'error' => 'このメールアドレスは別のGoogleアカウントに登録されています。'], 409);
            }

            $isGoogleAuthoritative = str_ends_with(strtolower($email), '@gmail.com') || isset($google['hd']);
            if (!$isGoogleAuthoritative) {
                respond(['ok' => false, 'error' => '同じメールアドレスの登録があります。最初だけ通常ログインを利用してください。'], 409);
            }

            $update = $pdo->prepare('UPDATE users SET google_sub = ?, name = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?');
            $update->execute([$googleSub, $name, (int)$user['id']]);
            $user['google_sub'] = $googleSub;
            $user['name'] = $name;
        } else {
            $passwordColumn = passwordColumn($pdo);
            $randomPasswordHash = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
            $insert = $pdo->prepare(
                "INSERT INTO users (name, email, google_sub, `{$passwordColumn}`, last_login, coin, items) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)"
            );
            $insert->execute([$name, $email, $googleSub, $randomPasswordHash, STARTER_COINS, STARTER_ITEMS]);
            $user = [
                'id' => (int)$pdo->lastInsertId(),
                'name' => $name,
                'email' => $email,
                'google_sub' => $googleSub,
            ];
        }
    } else {
        $update = $pdo->prepare('UPDATE users SET name = ?, email = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?');
        $update->execute([$name, $email, (int)$user['id']]);
        $user['name'] = $name;
        $user['email'] = $email;
    }
} catch (PDOException $error) {
    if ((string)$error->getCode() === '23000') {
        respond(['ok' => false, 'error' => 'このGoogleアカウントはすでに登録されています。'], 409);
    }
    respond(['ok' => false, 'error' => 'Googleアカウントを登録できませんでした。'], 500);
}

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : Google認証を検証してログイン状態を作る
 * ================================== */
issueSession($pdo, (int)$user['id']);

respond([
    'ok' => true,
    'user' => [
        'id' => (int)$user['id'],
        'name' => (string)$user['name'],
        'email' => (string)$user['email'],
    ],
]);
