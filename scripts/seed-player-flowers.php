<?php
declare(strict_types=1);

// 試遊用。既存ユーザーに花1～10を付与し、育成済みの値は変更しない。
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$_SERVER['REQUEST_METHOD'] = 'CLI';
require_once __DIR__ . '/../php/db.php';

$flowerIds = [];
for ($id = 1; $id <= 10; $id++) {
    $path = __DIR__ . '/../php/flower/' . sprintf('%03d', $id) . '.json';
    $flower = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    if (($flower['id'] ?? null) !== $id) {
        throw new RuntimeException('Invalid flower definition: ' . $path);
    }
    $flowerIds[] = $id;
}
try {
    $pdo->beginTransaction();
    $insert = $pdo->prepare(
        'INSERT INTO player_flowers (user_id, flower_id) SELECT id, ? FROM users '
        . 'ON DUPLICATE KEY UPDATE flower_id = VALUES(flower_id)'
    );
    foreach ($flowerIds as $id) {
        $insert->execute([$id]);
    }
    $pdo->commit();
    echo "Trial flower contracts initialized.\n";
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $error;
}
