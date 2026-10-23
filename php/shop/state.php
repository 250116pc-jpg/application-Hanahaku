<?php
declare(strict_types=1);
require_once __DIR__ . '/../stage/common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok'=>false,'error'=>'POSTで送信してください。'],405);
$userId = requireStageUserId($pdo);
$body = requestBody();
$action = $body['action'] ?? 'state';
if (!in_array($action, ['state', 'buy'], true)) respond(['ok'=>false,'error'=>'不正な操作です。'],422);
$catalog = json_decode(file_get_contents(__DIR__.'/items.json'), true, 512, JSON_THROW_ON_ERROR);
try {
 $pdo->beginTransaction();
 $q=$pdo->prepare('SELECT coin, items FROM users WHERE id = ? FOR UPDATE');
 $q->execute([$userId]); $user=$q->fetch();
 if (!$user) throw new RuntimeException('ユーザーが見つかりません。');
 $items=$user['items']===null ? new stdClass() : json_decode($user['items'], false, 512, JSON_THROW_ON_ERROR);
 if ($items === []) $items=new stdClass();
 if (!$items instanceof stdClass) throw new RuntimeException('所持品データの形式を確認してください。');
 foreach ($items as $count) if (!is_int($count) || $count<0) throw new RuntimeException('所持品データの形式を確認してください。');
 $coin=(int)$user['coin'];
 if ($action==='buy') {
  $id=$body['itemId'] ?? null;
  $product=null;
  foreach ($catalog as $entry) if (is_int($id) && $entry['id']===$id) $product=$entry;
  if (!$product) throw new RuntimeException('商品が見つかりません。');
  if ($coin<$product['price']) throw new RuntimeException('コインが足りません。');
  $key=(string)$id;
  $count=$items->$key ?? 0;
  if ($count>=2147483647) throw new RuntimeException('所持数の上限です。');
  $items->$key=$count+1; $coin-=$product['price'];
  $q=$pdo->prepare('UPDATE users SET coin = ?, items = ? WHERE id = ?');
  $q->execute([$coin,json_encode($items,JSON_THROW_ON_ERROR),$userId]);
 }
 $pdo->commit();
 respond(['ok'=>true,'coin'=>$coin,'items'=>$items]);
} catch (Throwable $e) {
 if ($pdo->inTransaction()) $pdo->rollBack();
 error_log('Shop operation failed: '.$e->getMessage());
 respond(['ok'=>false,'error'=>$e instanceof RuntimeException && !$e instanceof PDOException ? $e->getMessage() : '所持品を保存できませんでした。'],400);
}
