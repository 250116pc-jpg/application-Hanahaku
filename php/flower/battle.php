<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
declare(strict_types=1);

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 育成画面と同じ成長計算を読み込む
 * ================================== */
require_once __DIR__ . '/training.php';

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 所持花のDB保存値と育成の成長計算から戦闘用の能力値を作る
 * ================================== */
function buildBattleFlowers(array $rows): array {
    $rules = flowerTrainingRules();
    $roster = json_decode(file_get_contents(__DIR__ . '/formation.json'), true, 512, JSON_THROW_ON_ERROR);
    $available = array_column($roster['characters'], 'id');
    $flowers = [];
    foreach ($rows as $row) {
        $id = (int)$row['flower_id'];
        if (!in_array($id, $available, true)) continue;
        $level = (int)$row['level'];
        $skillLevel = (int)$row['skill_level'];
        if ($level < 1 || $level > $rules['maxLevel'] || $skillLevel < 1 || $skillLevel > count($rules['skill']['thresholds'])) {
            throw new UnexpectedValueException('Invalid saved flower level.');
        }
        $definition = json_decode(file_get_contents(__DIR__ . '/' . sprintf('%03d', $id) . '.json'), true, 512, JSON_THROW_ON_ERROR);
        $stats = in_array($id, $rules['enabledFlowerIds'], true)
            ? flowerTrainingStats($id, $level) : $definition['status_bonus'];
        foreach (['hp', 'mp', 'atk', 'def', 'cd'] as $key) {
            if (!isset($stats[$key]) || !is_numeric($stats[$key]) || !is_finite((float)$stats[$key]) || $stats[$key] < 0) {
                throw new UnexpectedValueException('Invalid flower battle stats.');
            }
        }
        $flowers[] = ['flowerId' => $id, 'level' => $level, 'skillLevel' => $skillLevel,
            'skillId' => $definition['skill_id'], 'stats' => $stats,
            'mpGrowth' => max(0, $stats['mp'] - $definition['status_bonus']['mp'])];
    }
    return $flowers;
}
