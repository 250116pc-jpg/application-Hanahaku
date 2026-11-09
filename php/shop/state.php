<?php
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
declare(strict_types=1);
require_once __DIR__ . '/../stage/common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok'=>false,'error'=>'POSTで送信してください。'],405);
$userId = requireStageUserId($pdo);
$body = requestBody();
$action = $body['action'] ?? 'state';
if (!in_array($action, ['state', 'buy', 'consume'], true)) respond(['ok'=>false,'error'=>'不正な操作です。'],422);
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 購入個数と使用要求を検査する。共同編集により使用対象アイテムの判定も含む。
 * ================================== */
$quantity = array_key_exists('quantity', $body) ? $body['quantity'] : 1;
if ($action === 'buy' && (!is_int($quantity) || $quantity < 1 || $quantity > 99)) {
 respond(['ok'=>false,'error'=>'購入数は1～99個で指定してください。'],422);
}
if ($action === 'consume' && (!is_int($body['itemId'] ?? null) || !in_array($body['itemId'], [12, 13, 14, 15], true) || $quantity !== 1)) {
 respond(['ok'=>false,'error'=>'使用できないアイテムです。'],422);
}
$catalog = json_decode(file_get_contents(__DIR__.'/items.json'), true, 512, JSON_THROW_ON_ERROR);
try {
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : ユーザー行をロックして所持金・所持品を取得し、所持品データの形式を検査する。
  * ================================== */
 $pdo->beginTransaction();
 $q=$pdo->prepare('SELECT coin, items FROM users WHERE id = ? FOR UPDATE');
 $q->execute([$userId]); $user=$q->fetch();
 if (!$user) throw new RuntimeException('ユーザーが見つかりません。');
 $items=$user['items']===null ? new stdClass() : json_decode($user['items'], false, 512, JSON_THROW_ON_ERROR);
 if ($items === []) $items=new stdClass();
 if (!$items instanceof stdClass) throw new RuntimeException('所持品データの形式を確認してください。');
 foreach ($items as $count) if (!is_int($count) || $count<0) throw new RuntimeException('所持品データの形式を確認してください。');
 $coin=(int)$user['coin'];
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 商品と個数、残金、所持数上限を検査して購入数を加算し、合計価格を所持金から減算する。
  * ================================== */
 if ($action==='buy') {
  $id=$body['itemId'] ?? null;
  $product=null;
  foreach ($catalog as $entry) if (is_int($id) && $entry['id']===$id) $product=$entry;
  if (!$product) throw new RuntimeException('商品が見つかりません。');
  $total = $product['price'] * $quantity;
  if ($coin<$total) throw new RuntimeException('コインが足りません。');
  $key=(string)$id;
  $count=$items->$key ?? 0;
  if ($count>2147483647-$quantity) throw new RuntimeException('所持数の上限です。');
  $items->$key=$count+$quantity; $coin-=$total;
 }
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 対象アイテムの所持数を確認し、1個消費する（対象追加を含む共同編集）。
  * ================================== */
 if ($action === 'consume') {
  $id = $body['itemId'];
  $key = (string)$id;
  $count = $items->$key ?? 0;
  if ($count < 1) throw new RuntimeException($id === 12 ? '治療薬が足りません。' : 'アイテムを所持していません。');
  $items->$key = $count - 1;
 }
 /* === [ 担当 : 250056 斎藤永聖 ] ===
  * 処理内容 : 購入・消費の更新をDBに保存し、トランザクション確定後に最新の所持状態を返す。
  * ================================== */
 if ($action !== 'state') {
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
