USE hanahaku;

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

CREATE TABLE IF NOT EXISTS shop (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    `explain` TEXT NULL,
    price INT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ally (
    id INT NOT NULL AUTO_INCREMENT,
    name TEXT NOT NULL,
    enhance_id INT NULL,
    skill_id INT NULL,
    description TEXT NULL,
    req_items JSON NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enemy (
    id INT NOT NULL AUTO_INCREMENT,
    name TEXT NOT NULL,
    enhance_id INT NULL,
    flower_id INT NULL,
    description TEXT NULL,
    stages JSON NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
