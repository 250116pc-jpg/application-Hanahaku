<?php
declare(strict_types=1);

function isAdminLoopbackClient(): bool
{
    $address = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    if (filter_var($address, FILTER_VALIDATE_IP) === false) return false;
    $packed = inet_pton($address);
    if ($packed === false) return false;
    if (strlen($packed) === 4) return ord($packed[0]) === 127;
    if (strlen($packed) !== 16) return false;
    if ($packed === str_repeat("\0", 15) . "\x01") return true;
    return substr($packed, 0, 12) === str_repeat("\0", 10) . "\xff\xff"
        && ord($packed[12]) === 127;
}

function requireLocalAdmin(): void
{
    if (isAdminLoopbackClient()) return;
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => false, 'error' => '管理者ページは同じPCのlocalhostからのみ利用できます。'], JSON_UNESCAPED_UNICODE);
    exit;
}

requireLocalAdmin();
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../flower/training.php';
require_once __DIR__ . '/player-character-config.php';

function adminUserState(PDO $pdo, int $userId): array
{
    $query = $pdo->prepare('SELECT id, name, email, coin, items, stage_data FROM users WHERE id = ?');
    $query->execute([$userId]);
    $user = $query->fetch(PDO::FETCH_ASSOC);
    if (!$user) throw new RuntimeException('対象ユーザーが見つかりません。');

    $items = $user['items'] === null
        ? new stdClass()
        : json_decode((string)$user['items'], false, 512, JSON_THROW_ON_ERROR);
    if ($items === []) $items = new stdClass();
    if (!$items instanceof stdClass) throw new RuntimeException('所持品データの形式を確認してください。');
    foreach ($items as $count) {
        if (!is_int($count) || $count < 0) throw new RuntimeException('所持品データの形式を確認してください。');
    }

    $stageData = is_string($user['stage_data'])
        ? json_decode($user['stage_data'], true, 512, JSON_THROW_ON_ERROR)
        : $user['stage_data'];
    if (!is_array($stageData)) $stageData = [];
    $completedStageIds = isset($stageData['completed']) && is_array($stageData['completed'])
        ? array_values(array_unique(array_map('intval', $stageData['completed']))) : [];

    $query = $pdo->prepare(
        'SELECT flower_id, level, exp, skill_level, skill_exp FROM player_flowers WHERE user_id = ? ORDER BY flower_id'
    );
    $query->execute([$userId]);
    $flowers = array_map(static function (array $flower): array {
        return [
            'flowerId' => (int)$flower['flower_id'],
            'level' => (int)$flower['level'],
            'exp' => (string)$flower['exp'],
            'skillLevel' => (int)$flower['skill_level'],
            'skillExp' => (string)$flower['skill_exp'],
        ];
    }, $query->fetchAll(PDO::FETCH_ASSOC));

    return [
        'user' => [
            'id' => (int)$user['id'],
            'name' => (string)$user['name'],
            'email' => (string)$user['email'],
            'coin' => (int)$user['coin'],
        ],
        'items' => $items,
        'flowers' => $flowers,
        'completedStageIds' => $completedStageIds,
    ];
}

function recordAdminAction(PDO $pdo, int $adminId, int $targetId, string $action, array $details): void
{
    $query = $pdo->prepare(
        'INSERT INTO admin_audit_log (admin_user_id, target_user_id, action, details) VALUES (?, ?, ?, ?)'
    );
    $query->execute([$adminId, $targetId, $action, json_encode($details, JSON_THROW_ON_ERROR)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'POSTで送信してください。'], 405);
}

$body = requestBody();
$action = $body['action'] ?? null;
$adminId = 0;
if ($action === 'adminStatus') respond(['ok' => true]);
if ($action === 'playerCharacter') {
    try {
        respond(['ok' => true, 'character' => readGlobalPlayerCharacter()]);
    } catch (Throwable $error) {
        error_log('Could not read global player character: ' . $error->getMessage());
        respond(['ok' => false, 'error' => '主人公の設定を読み込めませんでした。'], 500);
    }
}
if ($action === 'setPlayerCharacter') {
    $character = $body['character'] ?? null;
    if (!is_string($character) || !in_array($character, ['male', 'female'], true)) {
        respond(['ok' => false, 'error' => '主人公を選択してください。'], 422);
    }
    try {
        writeGlobalPlayerCharacter($character);
        respond(['ok' => true, 'character' => $character]);
    } catch (Throwable $error) {
        error_log('Could not save global player character: ' . $error->getMessage());
        respond(['ok' => false, 'error' => '主人公の設定を保存できませんでした。'], 500);
    }
}

if ($action === 'users') {
    try {
        $query = $pdo->query('SELECT id, name, email, coin FROM users ORDER BY id');
        $users = array_map(static function (array $user): array {
            return [
                'id' => (int)$user['id'],
                'name' => (string)$user['name'],
                'email' => (string)$user['email'],
                'coin' => (int)$user['coin'],
            ];
        }, $query->fetchAll(PDO::FETCH_ASSOC));
        respond(['ok' => true, 'users' => $users]);
    } catch (Throwable $error) {
        error_log('Could not list admin users: ' . $error->getMessage());
        respond(['ok' => false, 'error' => 'ユーザー一覧を読み込めませんでした。'], 500);
    }
}
if ($action === 'resetStage') {
    $stageId = $body['stageId'] ?? null;
    if (!is_int($stageId) || !in_array($stageId, [2, 4, 6, 8, 10], true)) {
        respond(['ok' => false, 'error' => 'リセットするステージを選択してください。'], 422);
    }
}

if ($action === 'history') {
    try {
        $query = $pdo->query(
            "SELECT l.id, l.admin_user_id,
                    CASE WHEN l.admin_user_id = 0 THEN '共通管理者'
                         ELSE COALESCE(a.name, CONCAT('ユーザー #', l.admin_user_id)) END AS admin_name,
                    l.target_user_id, COALESCE(t.name, CONCAT('ユーザー #', l.target_user_id)) AS target_name,
                    l.action, l.details, l.created_at
             FROM admin_audit_log l
             LEFT JOIN users a ON a.id = l.admin_user_id
             LEFT JOIN users t ON t.id = l.target_user_id
             ORDER BY l.id DESC
             LIMIT 100"
        );
        $history = array_map(static function (array $row): array {
            $details = json_decode((string)$row['details'], true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($details)) throw new UnexpectedValueException('Invalid audit detail.');
            return [
                'id' => (string)$row['id'],
                'adminUserId' => (int)$row['admin_user_id'],
                'adminName' => (string)$row['admin_name'],
                'targetUserId' => (int)$row['target_user_id'],
                'targetName' => (string)$row['target_name'],
                'action' => (string)$row['action'],
                'details' => $details,
                'createdAt' => (string)$row['created_at'],
            ];
        }, $query->fetchAll(PDO::FETCH_ASSOC));
        respond(['ok' => true, 'history' => $history]);
    } catch (Throwable $error) {
        error_log('Could not load admin audit history: ' . $error->getMessage());
        respond(['ok' => false, 'error' => '操作履歴を読み込めません。sql/admin_audit_log.sqlを適用してください。'], 500);
    }
}

if ($action === 'state') {
    $userId = filter_var($body['userId'] ?? null, FILTER_VALIDATE_INT);
    if ($userId === false || $userId < 1) respond(['ok' => false, 'error' => '対象ユーザーを選択してください。'], 422);
    try {
        respond(['ok' => true, 'state' => adminUserState($pdo, $userId)]);
    } catch (Throwable $error) {
        error_log('Could not load admin user state: ' . $error->getMessage());
        respond(['ok' => false, 'error' => $error instanceof RuntimeException && !$error instanceof PDOException
            ? $error->getMessage() : 'ユーザー情報を読み込めませんでした。'], 400);
    }
}

if (!in_array($action, ['addCoin', 'addItem', 'addFlower', 'setCoin', 'setItem', 'setFlowerProgress', 'resetStage', 'saveChanges'], true)) {
    respond(['ok' => false, 'error' => '不正な操作です。'], 422);
}

$userId = filter_var($body['userId'] ?? null, FILTER_VALIDATE_INT);
if ($userId === false || $userId < 1) respond(['ok' => false, 'error' => '対象ユーザーを選択してください。'], 422);

$quantity = $body['quantity'] ?? null;
if (in_array($action, ['addCoin', 'addItem'], true)
    && (!is_int($quantity) || $quantity < 1 || $quantity > 1000000)) {
    respond(['ok' => false, 'error' => '追加数は1～1,000,000で指定してください。'], 422);
}
if (in_array($action, ['setCoin', 'setItem'], true)
    && (!is_int($quantity) || $quantity < 0 || $quantity > 2147483647)) {
    respond(['ok' => false, 'error' => '設定数は0～2,147,483,647で指定してください。'], 422);
}

$itemId = $body['itemId'] ?? null;
$flowerId = $body['flowerId'] ?? null;
if (in_array($action, ['addItem', 'setItem'], true)) {
    $catalog = json_decode(file_get_contents(__DIR__ . '/../shop/items.json'), true, 512, JSON_THROW_ON_ERROR);
    $validItemIds = array_column($catalog, 'id');
    if (!is_int($itemId) || !in_array($itemId, $validItemIds, true)) {
        respond(['ok' => false, 'error' => 'アイテムを選択してください。'], 422);
    }
}
if ($action === 'addFlower') {
    $formation = json_decode(file_get_contents(__DIR__ . '/../flower/formation.json'), true, 512, JSON_THROW_ON_ERROR);
    $validFlowerIds = array_column($formation['characters'] ?? [], 'id');
    if (!is_int($flowerId) || !in_array($flowerId, $validFlowerIds, true)) {
        respond(['ok' => false, 'error' => '花を選択してください。'], 422);
    }
}
if ($action === 'setFlowerProgress') {
    $level = $body['level'] ?? null;
    $skillLevel = $body['skillLevel'] ?? null;
    $rules = flowerTrainingRules();
    $skillThresholds = $rules['skill']['thresholds'] ?? [];
    if (!is_int($flowerId) || $flowerId < 1
        || !is_int($level) || $level < 1 || $level > $rules['maxLevel']
        || !is_int($skillLevel) || $skillLevel < 1 || $skillLevel > count($skillThresholds)) {
        respond(['ok' => false, 'error' => '花レベルまたはスキルレベルを確認してください。'], 422);
    }
    $flowerExp = flowerExperienceThresholds()[$level - 1] ?? null;
    $skillExp = $skillThresholds[$skillLevel - 1] ?? null;
    if (!is_int($flowerExp) || !is_int($skillExp)) {
        respond(['ok' => false, 'error' => '育成ルールを読み込めませんでした。'], 500);
    }
}
if ($action === 'saveChanges') {
    $changes = $body['changes'] ?? null;
    if (!is_array($changes)) respond(['ok' => false, 'error' => '変更内容を確認してください。'], 422);
    if (array_diff(array_keys($changes), ['coin', 'items', 'flowers'])) {
        respond(['ok' => false, 'error' => '変更内容に不正な項目があります。'], 422);
    }

    $hasChanges = false;
    if (array_key_exists('coin', $changes)) {
        $hasChanges = true;
        if (!is_int($changes['coin']) || $changes['coin'] < 0 || $changes['coin'] > 2147483647) {
            respond(['ok' => false, 'error' => 'コイン数は0～2,147,483,647で指定してください。'], 422);
        }
    }
    $itemChanges = $changes['items'] ?? [];
    if (!is_array($itemChanges)) respond(['ok' => false, 'error' => 'アイテムの変更内容を確認してください。'], 422);
    if ($itemChanges) {
        $hasChanges = true;
        $catalog = json_decode(file_get_contents(__DIR__ . '/../shop/items.json'), true, 512, JSON_THROW_ON_ERROR);
        $validItemIds = array_column($catalog, 'id');
        $seenItemIds = [];
        foreach ($itemChanges as $itemChange) {
            if (!is_array($itemChange)) respond(['ok' => false, 'error' => 'アイテムの変更内容を確認してください。'], 422);
            $changeItemId = $itemChange['itemId'] ?? null;
            $changeQuantity = $itemChange['quantity'] ?? null;
            if (!is_int($changeItemId) || !in_array($changeItemId, $validItemIds, true)
                || in_array($changeItemId, $seenItemIds, true)
                || !is_int($changeQuantity) || $changeQuantity < 0 || $changeQuantity > 2147483647) {
                respond(['ok' => false, 'error' => 'アイテムの変更内容を確認してください。'], 422);
            }
            $seenItemIds[] = $changeItemId;
        }
    }

    $flowerChanges = $changes['flowers'] ?? [];
    if (!is_array($flowerChanges)) respond(['ok' => false, 'error' => '花の変更内容を確認してください。'], 422);
    if ($flowerChanges) {
        $hasChanges = true;
        $rules = flowerTrainingRules();
        $skillThresholds = $rules['skill']['thresholds'] ?? [];
        $seenFlowerIds = [];
        foreach ($flowerChanges as $flowerChange) {
            if (!is_array($flowerChange)) respond(['ok' => false, 'error' => '花の変更内容を確認してください。'], 422);
            $changeFlowerId = $flowerChange['flowerId'] ?? null;
            $changeLevel = $flowerChange['level'] ?? null;
            $changeSkillLevel = $flowerChange['skillLevel'] ?? null;
            if (!is_int($changeFlowerId) || $changeFlowerId < 1
                || in_array($changeFlowerId, $seenFlowerIds, true)
                || !is_int($changeLevel) || $changeLevel < 1 || $changeLevel > $rules['maxLevel']
                || !is_int($changeSkillLevel) || $changeSkillLevel < 1 || $changeSkillLevel > count($skillThresholds)) {
                respond(['ok' => false, 'error' => '花の変更内容を確認してください。'], 422);
            }
            $seenFlowerIds[] = $changeFlowerId;
        }
    }
    if (!$hasChanges) respond(['ok' => false, 'error' => '変更する内容がありません。'], 422);
}

try {
    $pdo->beginTransaction();
    $added = true;
    $reset = false;
    $shouldAudit = true;
    $auditDetails = [];
    $query = $pdo->prepare('SELECT coin, items, stage_data FROM users WHERE id = ? FOR UPDATE');
    $query->execute([$userId]);
    $target = $query->fetch(PDO::FETCH_ASSOC);
    if (!$target) throw new RuntimeException('対象ユーザーが見つかりません。');

    if ($action === 'saveChanges') {
        $auditDetails = [];
        if (array_key_exists('coin', $changes)) {
            $before = (int)$target['coin'];
            $after = $changes['coin'];
            if ($before !== $after) {
                $query = $pdo->prepare('UPDATE users SET coin = ? WHERE id = ?');
                $query->execute([$after, $userId]);
                $auditDetails['coin'] = ['before' => $before, 'after' => $after];
            }
        }

        if ($itemChanges) {
            $items = $target['items'] === null
                ? new stdClass()
                : json_decode((string)$target['items'], false, 512, JSON_THROW_ON_ERROR);
            if ($items === []) $items = new stdClass();
            if (!$items instanceof stdClass) throw new RuntimeException('所持品データの形式を確認してください。');
            foreach ($items as $count) {
                if (!is_int($count) || $count < 0) throw new RuntimeException('所持品データの形式を確認してください。');
            }
            $changedItems = [];
            foreach ($itemChanges as $itemChange) {
                $key = (string)$itemChange['itemId'];
                $before = $items->$key ?? 0;
                $after = $itemChange['quantity'];
                if ($before === $after) continue;
                $items->$key = $after;
                $changedItems[] = [
                    'itemId' => $itemChange['itemId'],
                    'before' => $before,
                    'after' => $after,
                ];
            }
            if ($changedItems) {
                $query = $pdo->prepare('UPDATE users SET items = ? WHERE id = ?');
                $query->execute([json_encode($items, JSON_THROW_ON_ERROR), $userId]);
                $auditDetails['items'] = $changedItems;
            }
        }

        if ($flowerChanges) {
            $flowerThresholds = flowerExperienceThresholds();
            $skillThresholds = flowerTrainingRules()['skill']['thresholds'] ?? [];
            $changedFlowers = [];
            foreach ($flowerChanges as $flowerChange) {
                $query = $pdo->prepare(
                    'SELECT flower_id, level, exp, skill_level, skill_exp FROM player_flowers WHERE user_id = ? AND flower_id = ? FOR UPDATE'
                );
                $query->execute([$userId, $flowerChange['flowerId']]);
                $flower = $query->fetch(PDO::FETCH_ASSOC);
                if (!$flower) throw new RuntimeException('所持していない花の育成状況は変更できません。');

                $level = $flowerChange['level'];
                $skillLevel = $flowerChange['skillLevel'];
                $flowerExp = $flowerThresholds[$level - 1] ?? null;
                $skillExp = $skillThresholds[$skillLevel - 1] ?? null;
                if (!is_int($flowerExp) || !is_int($skillExp)) {
                    throw new RuntimeException('育成ルールを読み込めませんでした。');
                }
                if ((int)$flower['level'] === $level && (string)$flower['exp'] === (string)$flowerExp
                    && (int)$flower['skill_level'] === $skillLevel && (string)$flower['skill_exp'] === (string)$skillExp) {
                    continue;
                }
                $query = $pdo->prepare(
                    'UPDATE player_flowers SET level = ?, exp = ?, skill_level = ?, skill_exp = ? WHERE user_id = ? AND flower_id = ?'
                );
                $query->execute([$level, $flowerExp, $skillLevel, $skillExp, $userId, $flowerChange['flowerId']]);
                $changedFlowers[] = [
                    'flowerId' => $flowerChange['flowerId'],
                    'levelBefore' => (int)$flower['level'],
                    'levelAfter' => $level,
                    'expBefore' => (string)$flower['exp'],
                    'expAfter' => (string)$flowerExp,
                    'skillLevelBefore' => (int)$flower['skill_level'],
                    'skillLevelAfter' => $skillLevel,
                    'skillExpBefore' => (string)$flower['skill_exp'],
                    'skillExpAfter' => (string)$skillExp,
                ];
            }
            if ($changedFlowers) $auditDetails['flowers'] = $changedFlowers;
        }
        $shouldAudit = $auditDetails !== [];
    } elseif ($action === 'addCoin' || $action === 'setCoin') {
        $coin = (int)$target['coin'];
        $nextCoin = $action === 'addCoin' ? $coin + $quantity : $quantity;
        if ($action === 'addCoin' && $coin > 2147483647 - $quantity) throw new RuntimeException('コインの上限を超えます。');
        $query = $pdo->prepare('UPDATE users SET coin = ? WHERE id = ?');
        $query->execute([$nextCoin, $userId]);
        $auditDetails = ['before' => $coin, 'after' => $nextCoin];
    } elseif ($action === 'addItem' || $action === 'setItem') {
        $items = $target['items'] === null
            ? new stdClass()
            : json_decode((string)$target['items'], false, 512, JSON_THROW_ON_ERROR);
        if ($items === []) $items = new stdClass();
        if (!$items instanceof stdClass) throw new RuntimeException('所持品データの形式を確認してください。');
        foreach ($items as $count) {
            if (!is_int($count) || $count < 0) throw new RuntimeException('所持品データの形式を確認してください。');
        }
        $key = (string)$itemId;
        $count = $items->$key ?? 0;
        if ($action === 'addItem' && $count > 2147483647 - $quantity) throw new RuntimeException('アイテム所持数の上限を超えます。');
        $items->$key = $action === 'addItem' ? $count + $quantity : $quantity;
        $query = $pdo->prepare('UPDATE users SET items = ? WHERE id = ?');
        $query->execute([json_encode($items, JSON_THROW_ON_ERROR), $userId]);
        $auditDetails = ['itemId' => $itemId, 'before' => $count, 'after' => $items->$key];
    } elseif ($action === 'addFlower') {
        $query = $pdo->prepare('INSERT IGNORE INTO player_flowers (user_id, flower_id) VALUES (?, ?)');
        $query->execute([$userId, $flowerId]);
        $added = $query->rowCount() === 1;
        $auditDetails = ['flowerId' => $flowerId];
    } elseif ($action === 'setFlowerProgress') {
        $query = $pdo->prepare(
            'SELECT flower_id, level, exp, skill_level, skill_exp FROM player_flowers WHERE user_id = ? AND flower_id = ? FOR UPDATE'
        );
        $query->execute([$userId, $flowerId]);
        $flower = $query->fetch(PDO::FETCH_ASSOC);
        if (!$flower) throw new RuntimeException('所持していない花の育成状況は変更できません。');
        $query = $pdo->prepare(
            'UPDATE player_flowers SET level = ?, exp = ?, skill_level = ?, skill_exp = ? WHERE user_id = ? AND flower_id = ?'
        );
        $query->execute([$level, $flowerExp, $skillLevel, $skillExp, $userId, $flowerId]);
        $auditDetails = [
            'flowerId' => $flowerId,
            'levelBefore' => (int)$flower['level'],
            'levelAfter' => $level,
            'expBefore' => (string)$flower['exp'],
            'expAfter' => (string)$flowerExp,
            'skillLevelBefore' => (int)$flower['skill_level'],
            'skillLevelAfter' => $skillLevel,
            'skillExpBefore' => (string)$flower['skill_exp'],
            'skillExpAfter' => (string)$skillExp,
        ];
    } else {
        $stageData = is_string($target['stage_data'])
            ? json_decode($target['stage_data'], true, 512, JSON_THROW_ON_ERROR)
            : $target['stage_data'];
        if (!is_array($stageData)) $stageData = [];
        $completed = isset($stageData['completed']) && is_array($stageData['completed'])
            ? array_values(array_unique(array_map('intval', $stageData['completed']))) : [];
        $reset = in_array($stageId, $completed, true);
        $shouldAudit = $reset;
        if ($reset) {
            $remaining = array_values(array_filter($completed, static fn(int $id): bool => $id !== $stageId));
            $stageData['completed'] = $remaining;
            $query = $pdo->prepare('UPDATE users SET stage_data = ? WHERE id = ?');
            $query->execute([json_encode($stageData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), $userId]);
            $auditDetails = [
                'stageId' => $stageId,
                'completedBefore' => $completed,
                'completedAfter' => $remaining,
            ];
        }
    }

    if ($shouldAudit && ($action !== 'addFlower' || $added)) {
        recordAdminAction($pdo, $adminId, $userId, $action, $auditDetails);
    }
    $state = adminUserState($pdo, $userId);
    $pdo->commit();
    respond([
        'ok' => true,
        'state' => $state,
        'added' => $added,
        'reset' => $reset,
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Admin update failed for admin ' . $adminId . ': ' . $error->getMessage());
    respond(['ok' => false, 'error' => $error instanceof RuntimeException && !$error instanceof PDOException
        ? $error->getMessage() : 'データを更新できませんでした。'], 400);
}
