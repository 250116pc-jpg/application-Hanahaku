<?php
declare(strict_types=1);

function flowerTrainingRules(): array {
    static $rules;
    return $rules ??= json_decode(file_get_contents(__DIR__ . '/training.json'), true, 512, JSON_THROW_ON_ERROR);
}
function flowerExperienceThresholds(): array {
    $rules = flowerTrainingRules(); $thresholds = [0];
    for ($level = 1; $level < $rules['maxLevel']; $level++) {
        $thresholds[] = $thresholds[$level - 1] + (int)ceil($rules['experienceCurve'][$level - 1] * $rules['experienceScale']);
    }
    return $thresholds;
}
function flowerTrainingStats(int $id, int $level): array {
    if (!in_array($id, flowerTrainingRules()['enabledFlowerIds'], true)) throw new RuntimeException('この花はまだ育成できません。', 422);
    $path = __DIR__ . '/' . str_pad((string)$id, 3, '0', STR_PAD_LEFT) . '.json';
    $flower = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    $upgrades = json_decode(file_get_contents(__DIR__ . '/../ally/upgrades.json'), true, 512, JSON_THROW_ON_ERROR)['upgrades'];
    $growth = null;
    foreach ($upgrades as $upgrade) if ($upgrade['upgrade_id'] === $flower['enhance_id']) $growth = $upgrade['growth'];
    if ($growth === null) throw new RuntimeException('この花の成長タイプは未設定です。', 422);
    $stats = $flower['status_bonus'];
    foreach (['hp'=>'hp','mp'=>'mp','atk'=>'physicalAttack','def'=>'physicalDefense','cd'=>'criticalDamage'] as $key=>$target) {
        if (isset($stats[$key])) $stats[$key] += ($growth[$target] ?? 0) * ($level - 1);
    }
    return $stats;
}
function upgradeFlowerLevel(PDO $pdo, int $userId, array $body): array {
    foreach (['flowerId','itemId','quantity','expectedLevel'] as $key) {
        if (!isset($body[$key]) || !is_int($body[$key]) || $body[$key] < 1) throw new RuntimeException('強化内容を確認してください。', 422);
    }
    if (!isset($body['expectedExp']) || !is_string($body['expectedExp']) || !preg_match('/^[0-9]+$/D', $body['expectedExp'])) throw new RuntimeException('強化前の経験値が正しくありません。', 422);
    $rules = flowerTrainingRules();
    $perItem = $rules['nutrientExp'][(string)$body['itemId']] ?? 0;
    if ($perItem < 1) throw new RuntimeException('栄養剤を選択してください。', 422);
    flowerTrainingStats($body['flowerId'], 1);
    $thresholds = flowerExperienceThresholds(); $cap = end($thresholds);
    try {
        $pdo->beginTransaction();
        // ショップと同様にusersを先にロック。所持数と育成状況を同時に確定する。
        $query = $pdo->prepare('SELECT items FROM users WHERE id = ? FOR UPDATE');
        $query->execute([$userId]); $user = $query->fetch(PDO::FETCH_ASSOC);
        if (!$user) throw new RuntimeException('ログイン状態を確認してください。', 401);
        $items = $user['items'] === null ? new stdClass() : json_decode($user['items'], false, 512, JSON_THROW_ON_ERROR);
        if ($items === []) $items = new stdClass();
        if (!$items instanceof stdClass) throw new RuntimeException('所持品データの形式を確認してください。', 422);
        foreach ($items as $count) if (!is_int($count) || $count < 0) throw new RuntimeException('所持品データの形式を確認してください。', 422);
        $query = $pdo->prepare('SELECT level, exp, skill_level FROM player_flowers WHERE user_id = ? AND flower_id = ? FOR UPDATE');
        $query->execute([$userId, $body['flowerId']]); $flower = $query->fetch(PDO::FETCH_ASSOC);
        if (!$flower) throw new RuntimeException('契約していない花は強化できません。', 403);
        $level = (int)$flower['level']; $exp = (string)$flower['exp'];
        if ($level !== $body['expectedLevel'] || $exp !== $body['expectedExp']) throw new RuntimeException('育成状況が更新されています。最新の状態を確認してください。', 409);
        if ($level >= $rules['maxLevel']) throw new RuntimeException('レベル上限に到達しています。', 422);
        // BIGINTを整数化する前に、今回の小さな経験値テーブルの範囲内か確認する。
        if ($level < 1 || !preg_match('/^[0-9]+$/D', $exp) || strlen($exp) > strlen((string)$cap) || (int)$exp < $thresholds[$level - 1] || (int)$exp >= $thresholds[$level]) throw new RuntimeException('保存レベルと累計EXPが一致しません。', 422);
        $current = (int)$exp; $key = (string)$body['itemId']; $owned = $items->$key ?? 0;
        $maximum = min($owned, (int)ceil(($cap - $current) / $perItem));
        if ($body['quantity'] > $maximum) throw new RuntimeException('所持数または上限到達に必要な個数を超えています。', 422);
        $newExp = min($cap, $current + $perItem * $body['quantity']);
        $newLevel = $level;
        while ($newLevel < $rules['maxLevel'] && $newExp >= $thresholds[$newLevel]) $newLevel++;
        $items->$key = $owned - $body['quantity'];
        $query = $pdo->prepare('UPDATE users SET items = ? WHERE id = ?');
        $query->execute([json_encode($items, JSON_THROW_ON_ERROR), $userId]);
        $query = $pdo->prepare('UPDATE player_flowers SET level = ?, exp = ? WHERE user_id = ? AND flower_id = ?');
        $query->execute([$newLevel, $newExp, $userId, $body['flowerId']]);
        $pdo->commit();
        return ['ok'=>true, 'flowerId'=>$body['flowerId'], 'level'=>$newLevel, 'exp'=>(string)$newExp, 'skillLevel'=>(int)$flower['skill_level'], 'items'=>$items];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}
