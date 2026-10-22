-- Run once against the application's database. Existing users are preserved.
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 user_id INT NOT NULL,
 expires_at DATETIME NOT NULL,
 INDEX (user_id), INDEX (expires_at)
) ENGINE=InnoDB;

ALTER TABLE auth_sessions MODIFY COLUMN user_id INT NOT NULL;
