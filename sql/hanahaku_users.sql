CREATE DATABASE IF NOT EXISTS hanahaku
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hanahaku;

-- ユーザー情報だけを保存するテーブルです。
-- パスワードの平文は保存せず、PHPの password_hash() の結果を保存します。
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  google_sub VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  coin INT UNSIGNED NOT NULL DEFAULT 0,
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  UNIQUE KEY users_google_sub_unique (google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- すでにusersテーブルが存在する場合のGoogleログイン用更新です。
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) NULL AFTER email,
  ADD UNIQUE INDEX IF NOT EXISTS users_google_sub_unique (google_sub);
