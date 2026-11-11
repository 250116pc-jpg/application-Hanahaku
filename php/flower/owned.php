<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
declare(strict_types=1);

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 共通処理を読み込み、要求と認証状態を確認する
 * ================================== */
require_once __DIR__ . '/../stage/common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}
try {
    // ユーザーIDはリクエストの値ではなく、ログインCookieから確定する。
    $userId = requireStageUserId($pdo);
    $query = $pdo->prepare('SELECT flower_id, level, exp, skill_level, skill_exp, contracted_at FROM player_flowers WHERE user_id = ? ORDER BY flower_id');
    $query->execute([$userId]);
    $flowers = array_map(static function (array $row): array {
        if ((int)$row['level'] < 1 || (int)$row['skill_level'] < 1 || !preg_match('/^[0-9]+$/D', (string)$row['exp'])) {
            throw new UnexpectedValueException('Invalid saved flower progress.');
        }
        return [
            'flowerId' => (int)$row['flower_id'],
            'acquiredAt' => (string)$row['contracted_at'],
            'level' => (int)$row['level'],
            // BIGINT UNSIGNEDはJavaScriptの安全な整数範囲を超えるので文字列で返す。
            'exp' => (string)$row['exp'],
            'skillLevel' => (int)$row['skill_level'],
            'skillExp' => (string)$row['skill_exp'],
        ];
    }, $query->fetchAll(PDO::FETCH_ASSOC));
    // 既存の花IDだけを使う呼び出し元との互換性も維持する。
    respond(['ok' => true, 'flowerIds' => array_column($flowers, 'flowerId'), 'flowers' => $flowers]);
} catch (Throwable $error) {
    error_log('Could not load owned flowers: ' . $error->getMessage());
    respond(['ok' => false, 'error' => '契約済みの花を読み込めませんでした。'], 500);
}
