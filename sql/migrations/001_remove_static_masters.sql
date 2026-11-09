-- 既存環境専用。必ずDB全体をエクスポートしてから適用すること。
-- 旧マスタに独自の編集がある場合はphp/配下の対応JSONへ反映してから実行。
-- ユーザー情報・所持品・契約・育成・認証・スキル状態は削除しない。
USE hanahaku;

-- XAMPP / MariaDB用。外部キー検査を無効にせず、既知の依存だけ外す。
ALTER TABLE player_flowers DROP FOREIGN KEY IF EXISTS player_flowers_flower_fk;
DROP TABLE IF EXISTS enemy;
DROP TABLE IF EXISTS ally;
DROP TABLE IF EXISTS flowers;
DROP TABLE IF EXISTS skill;
DROP TABLE IF EXISTS stages;
DROP TABLE IF EXISTS items;
