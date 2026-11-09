USE hanahaku;

-- XAMPP / MariaDB用。既存の契約・育成データは上書きしない。
-- 新しい契約を登録する際は、省略した育成項目にこの初期値が設定される。
ALTER TABLE player_flowers
 ADD COLUMN IF NOT EXISTS level INT UNSIGNED NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS exp BIGINT UNSIGNED NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS skill_level INT UNSIGNED NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS skill_exp INT UNSIGNED NOT NULL DEFAULT 0;

-- expは花ごとの累計経験値。レベルや能力への換算は今後の成長ルールで実装する。
