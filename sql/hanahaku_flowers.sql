/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
-- 固定データは php/ 配下のJSONで管理する。
-- 旧ファイル名は既存のセットアップ手順との互換性のため残す。
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 花テーブルを作成するデータベースとしてhanahakuを選択する。テーブル本体は共同制作者の担当。
 * ================================== */
USE hanahaku;

CREATE TABLE IF NOT EXISTS player_flowers (
  user_id BIGINT UNSIGNED NOT NULL,
  flower_id INT NOT NULL,
  contracted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, flower_id)
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 花テーブルのストレージエンジンと文字コード・照合順序を指定する。
 * ================================== */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- flower_id は php/flower/NNN.json のID。固定マスタへの外部キーは不要。
