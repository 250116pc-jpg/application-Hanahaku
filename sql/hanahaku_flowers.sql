USE hanahaku;

CREATE TABLE IF NOT EXISTS flowers (
 `id` INT NOT NULL AUTO_INCREMENT COMMENT 'ただのID',
 `name` VARCHAR(100) NOT NULL COMMENT '花の名前',
 `level` INT NULL COMMENT '花のレベル',
 `skill_level` INT NULL COMMENT 'スキルのレベル',
 `enhance_id` INT NULL COMMENT '強化ID（参照先未作成）',
 `Game_image` VARCHAR(255) NULL COMMENT 'ゲームの花画像',
 `Real_image` VARCHAR(255) NULL COMMENT 'リアルな花画像',
 `skill_id` INT NULL COMMENT 'スキルの種類（参照先未作成）',
 `MP` INT NULL COMMENT '花の精神力',
 `ATK` INT NULL COMMENT '攻撃力',
 `CRT` FLOAT NULL COMMENT 'クリティカル率（0～1）',
 `CD` INT NULL COMMENT 'クリティカルダメージ',
 `RES_Fire` INT NULL COMMENT '熱耐性',
 `RES_Water` INT NULL COMMENT '水耐性',
 `RES_Wind` INT NULL COMMENT '風耐性',
 `RES_Light` INT NULL COMMENT '光耐性',
 `RES_Ground` INT NULL COMMENT '土耐性',
 `explain` TEXT NULL COMMENT '説明',
 PRIMARY KEY (id),
 CONSTRAINT chk_flower_critical_rate CHECK (CRT IS NULL OR CRT BETWEEN 0 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
