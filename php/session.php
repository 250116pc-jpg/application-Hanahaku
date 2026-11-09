<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
declare(strict_types=1);
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : Cookieのハッシュと有効期限をDBで照合し、ログイン中の利用者情報または未ログイン状態を返す。
 * ================================== */
require __DIR__ . '/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false], 405);
$hash = authHash();
if ($hash === null) respond(['ok' => true, 'user' => null]);
try {
    $query = $pdo->prepare('SELECT u.id, u.name, u.email FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()');
    $query->execute([$hash]);
    $user = $query->fetch();
    if (!$user) {
        revokeSession($pdo);
        authCookie('', time() - 3600);
        respond(['ok' => true, 'user' => null]);
    }
    $user['id'] = (int)$user['id'];
    respond(['ok' => true, 'user' => $user]);
} catch (PDOException $error) {
    respond(['ok' => false, 'error' => 'ログイン状態を確認できません。'], 500);
}
