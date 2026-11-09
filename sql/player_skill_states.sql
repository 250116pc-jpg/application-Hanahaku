/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
USE hanahaku;

CREATE TABLE IF NOT EXISTS player_skill_states (
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : スキル状態を利用者に紐付けるuser_id列を定義する。
   * ================================== */
  user_id INT NOT NULL,
  flower_id INT UNSIGNED NOT NULL,
  mp INT UNSIGNED NOT NULL,
  cooldown_until BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, flower_id),
  CONSTRAINT player_skill_states_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE player_skill_states
  ADD COLUMN IF NOT EXISTS cooldown_until BIGINT UNSIGNED NOT NULL DEFAULT 0;
