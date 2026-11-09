/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
USE hanahaku;

-- 30日間のログイン保持用。ゲームデータとは別の認証テーブル。
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : トークンのハッシュ、利用者ID、有効期限を保存する認証セッションテーブルを定義する。
 * ================================== */
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 user_id INT NOT NULL,
 expires_at DATETIME NOT NULL,
 PRIMARY KEY (token_hash),
 INDEX auth_sessions_user_id (user_id),
 INDEX auth_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE auth_sessions MODIFY COLUMN user_id INT NOT NULL;
