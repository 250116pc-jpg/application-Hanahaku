CREATE DATABASE IF NOT EXISTS hanahaku
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hanahaku;

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email TEXT NOT NULL,
    google_sub VARCHAR(255) NULL,
    password_hash TEXT NOT NULL,
    coin INT NOT NULL DEFAULT 0,
    items JSON NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `HP` INT NULL,
    `MP` INT NULL,
    `EVA` FLOAT NULL,
    `VIT` INT NULL,
    `DEF` INT NULL,
    `CRT` FLOAT NULL,
    `CD` INT NULL,
    `LEVEL` INT NULL,
    form_data1 INT NULL,
    form_data2 INT NULL,
    form_data3 INT NULL,
    form_data4 INT NULL,
    chara_data JSON NULL,
    stage_data JSON NULL,
    PRIMARY KEY (id),
    UNIQUE KEY users_email_unique (email),
    UNIQUE KEY users_google_sub_unique (google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
