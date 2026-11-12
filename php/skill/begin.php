<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250116
 * 氏名：武田優人、中村伊安
 * ================================== */
declare(strict_types=1);

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 共通処理を読み込み、要求と認証状態を確認する
 * ================================== */
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../flower/battle.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$userId = requireSkillUserId($pdo);
$body = requestBody();
$stageId = filter_var($body['stageId'] ?? null, FILTER_VALIDATE_INT);
if (!in_array($stageId, [2, 4, 6, 8, 10], true)) {
    respond(['ok' => false, 'error' => 'このステージのスキル状態を初期化できません。'], 422);
}
$formation = $body['formation'] ?? [];
if (!is_array($formation) || !array_is_list($formation) || count($formation) > 4) {
    respond(['ok' => false, 'error' => '編成データが正しくありません。'], 422);
}
foreach ($formation as $id) {
    if ($id !== null && (!is_int($id) || $id < 1)) {
        respond(['ok' => false, 'error' => '編成データが正しくありません。'], 422);
    }
}

/* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
 * 処理内容 : 編成中の所持花だけをDBから取得・検証し、重複を除いて戦闘開始時の状態を返す
 * ================================== */
try {
    $pdo->beginTransaction();
    $requestedIds = array_values(array_unique(array_filter($formation, static fn($id) => $id !== null)));
    $rows = [];
    if ($requestedIds !== []) {
        $placeholders = implode(',', array_fill(0, count($requestedIds), '?'));
        $query = $pdo->prepare('SELECT flower_id, level, skill_level FROM player_flowers WHERE user_id = ? AND flower_id IN (' . $placeholders . ') FOR UPDATE');
        $query->execute([$userId, ...$requestedIds]);
        $rows = $query->fetchAll(PDO::FETCH_ASSOC);
    }
    $battleFlowers = buildBattleFlowers($rows);
    $ownedIds = array_column($battleFlowers, 'flowerId');
    $formation = array_map(static fn($id) => in_array($id, $ownedIds, true) ? $id : null, $formation);
    $seen = [];
    foreach ($formation as &$id) {
        if ($id !== null && in_array($id, $seen, true)) $id = null;
        if ($id !== null) $seen[] = $id;
    }
    unset($id);
    $templates = flowerSkillTemplates();
    $save = $pdo->prepare('INSERT INTO player_skill_states (user_id, flower_id, mp, cooldown_until) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE mp = VALUES(mp), cooldown_until = 0');
    $states = [];
    foreach ($battleFlowers as $flower) {
        $skillId = $flower['skillId'];
        if ($skillId === null || !isset($templates[$skillId])) continue;
        // 初期最大MPは既存スキル定義を維持し、花レベルによるMP増加分を100%足す。
        $maximumMp = (int)round($templates[$skillId]['maxMp'] + $flower['mpGrowth']);
        $save->execute([$userId, $flower['flowerId'], $maximumMp]);
        $states[] = ['flowerId' => $flower['flowerId'], 'mp' => $maximumMp, 'maxMp' => $maximumMp,
            'cooldownUntil' => 0, 'skill' => buildFlowerSkill($skillId, $flower['skillLevel'], (int)round($flower['stats']['atk']))];
    }
    $pdo->commit();

    respond(['ok' => true, 'flowers' => $states, 'ownedFlowers' => $battleFlowers, 'formation' => $formation]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Could not initialize stage skill states: ' . $error->getMessage());
    respond(['ok' => false, 'error' => 'ステージ開始時のMPを初期化できませんでした。'], 500);
}
