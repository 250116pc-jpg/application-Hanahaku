USE hanahaku;

CREATE TABLE IF NOT EXISTS `skill` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` TEXT NOT NULL,
    `description` TEXT NULL,
    `upgrade_data` JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS flowers (
 `id` INT NOT NULL AUTO_INCREMENT COMMENT 'ただのID',
 `name` VARCHAR(100) NOT NULL COMMENT '花の名前',
 `level` INT NULL COMMENT '花のレベル',
 `skill_level` INT NULL COMMENT 'スキルのレベル',
 `upgrade_id` INT NULL COMMENT '強化ID（参照先未作成）',
 `Game_image` VARCHAR(255) NULL COMMENT 'ゲームの花画像',
 `Real_image` VARCHAR(255) NULL COMMENT 'リアルな花画像',
 `skill_id` INT NULL COMMENT 'スキルの種類',
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
 CONSTRAINT fk_flowers_skill FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT chk_flower_critical_rate CHECK (CRT IS NULL OR CRT BETWEEN 0 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stages (
    id INT NOT NULL AUTO_INCREMENT,
    name TEXT NOT NULL,
    description TEXT NULL,
    loot_items JSON NULL,
    enemies JSON NULL,
    map_data JSON NULL,
    area_data JSON NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
    id INT NOT NULL AUTO_INCREMENT,
    name TEXT NOT NULL,
    description TEXT NULL,
    drop_stage JSON NULL,
    price INT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ally (
    id INT NOT NULL AUTO_INCREMENT,
    name TEXT NOT NULL,
    upgrade_id INT NULL,
    skill_id INT NULL,
    description TEXT NULL,
    req_items JSON NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ally_skill FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enemy (
    id INT NOT NULL AUTO_INCREMENT,
    name TEXT NOT NULL,
    upgrade_id INT NULL,
    flower_id INT NULL,
    description TEXT NULL,
    stages JSON NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_enemy_flower FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
