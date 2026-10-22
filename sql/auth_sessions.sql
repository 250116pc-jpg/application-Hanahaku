USE hanahaku;

-- 30日間のログイン保持用。ゲームデータとは別の認証テーブル。
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 user_id INT NOT NULL,
 expires_at DATETIME NOT NULL,
 PRIMARY KEY (token_hash),
 INDEX auth_sessions_user_id (user_id),
 INDEX auth_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE auth_sessions MODIFY COLUMN user_id INT NOT NULL;
