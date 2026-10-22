-- ゲーム用usersの23列に、Googleログイン用google_subを追加。
-- 新規作成と認証列の追加に対応。既存データは削除しない。
CREATE DATABASE IF NOT EXISTS hanahaku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hanahaku;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT 'ユーザーid',
    `name` VARCHAR(255) NOT NULL COMMENT '名前',
    `email` TEXT NOT NULL COMMENT 'メールアドレス',
    `google_sub` VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL COMMENT 'Googleアカウントの識別子',
    `password_hash` TEXT NOT NULL COMMENT 'パスワードハッシュ',
    `coin` INT NOT NULL DEFAULT 0 COMMENT 'コインの所持数',
    `items` JSON NULL COMMENT 'アイテムの所持数',
    `last_login` TIMESTAMP NULL DEFAULT NULL COMMENT '最終ログイン日',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登録日',
    `update_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日',
    `HP` INT NULL COMMENT 'HP',
    `MP` INT NULL COMMENT 'MP',
    `EVA` INT NULL COMMENT '回避率',
    `VIT` INT NULL COMMENT '回復力',
    `DEF` INT NULL COMMENT '防御力',
    `CRT` FLOAT NULL COMMENT 'クリティカル率',
    `CD` INT NULL COMMENT 'クリティカルダメージ',
    `LEVEL` INT NULL COMMENT 'レベル',
    `form_data1` INT NULL COMMENT '編成済みのキャラID。未編成はNULL',
    `form_data2` INT NULL COMMENT '編成済みのキャラID。未編成はNULL',
    `form_data3` INT NULL COMMENT '編成済みのキャラID。未編成はNULL',
    `form_data4` INT NULL COMMENT '編成済みのキャラID。未編成はNULL',
    `chara_data` JSON NULL COMMENT 'キャラのデータ状況',
    `stage_data` JSON NULL COMMENT 'ステージの攻略状況',
    PRIMARY KEY (`id`),
    UNIQUE KEY users_google_sub_unique (`google_sub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- XAMPPのMariaDB用。既存usersにも認証用の列・制約を追加する。
ALTER TABLE users
 ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER email,
 ADD UNIQUE INDEX IF NOT EXISTS users_google_sub_unique (google_sub);