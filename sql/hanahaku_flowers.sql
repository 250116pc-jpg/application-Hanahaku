-- 固定データは php/ 配下のJSONで管理する。
-- 旧ファイル名は既存のセットアップ手順との互換性のため残す。
USE hanahaku;

CREATE TABLE IF NOT EXISTS player_flowers (
  user_id BIGINT UNSIGNED NOT NULL,
  flower_id INT NOT NULL,
  contracted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, flower_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- flower_id は php/flower/NNN.json のID。固定マスタへの外部キーは不要。
