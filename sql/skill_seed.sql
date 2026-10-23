USE hanahaku;

INSERT INTO `skill` (id, name, description, upgrade_data) VALUES
  (1, '軽い攻撃スキルを連打', '前方に連続攻撃する', JSON_OBJECT('type', 'multiHit', 'element', '熱', 'category', '攻撃', 'cooldownSeconds', 25, 'mpCost', 20)),
  (2, 'どっしり固いディフェンス', '防御力を上げ、定期的にHPを回復する', JSON_OBJECT('type', 'defensiveRecovery', 'element', '無', 'category', '強化・回復', 'cooldownSeconds', 26, 'mpCost', 28)),
  (3, '太陽の光線的な一発どかんタイプ', '3秒ためて強力な一撃を放つ', JSON_OBJECT('type', 'charge', 'element', '熱', 'category', '攻撃', 'cooldownSeconds', 28, 'mpCost', 30)),
  (4, '扱いやすいバランス型', '攻防を強化し、追尾弾を放つ', JSON_OBJECT('type', 'balanced', 'element', '熱', 'category', '攻撃・強化', 'cooldownSeconds', 30, 'mpCost', 34)),
  (5, '絶え間ない連続攻撃スキル', '攻撃速度を上げ、連続攻撃する', JSON_OBJECT('type', 'continuous', 'element', '水', 'category', '攻撃・強化', 'cooldownSeconds', 33, 'mpCost', 31)),
  (6, '紅葉', '緑の強化形態と赤の三段攻撃を切り替える', JSON_OBJECT('type', 'maple', 'element', '風', 'category', '攻撃・変化・強化・回復', 'cooldownSeconds', 42, 'mpCost', 33)),
  (7, 'トップクラスの耐久力', '最大HPと防御力を上げる', JSON_OBJECT('type', 'fortify', 'element', '無', 'category', '強化', 'cooldownSeconds', 45, 'mpCost', 60)),
  (8, 'デバフ（被ダメアップや鈍足）とか', '敵全体を攻撃し、攻撃速度を下げる', JSON_OBJECT('type', 'slowAttack', 'element', '光', 'category', '攻撃・弱化', 'cooldownSeconds', 30, 'mpCost', 36)),
  (9, '回復。', 'HPを回復する', JSON_OBJECT('type', 'heal', 'element', '無', 'category', '回復', 'cooldownSeconds', 30, 'mpCost', 22)),
  (10, '隠密系', '攻撃後、一定時間回避率を上げる', JSON_OBJECT('type', 'evasion', 'element', '土', 'category', '攻撃・強化', 'cooldownSeconds', 31, 'mpCost', 35))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  upgrade_data = VALUES(upgrade_data);

INSERT INTO flowers (id, name, Game_image, Real_image, skill_id) VALUES
  (1, 'ジニア', 'src/assets/flowers/zinia.png', 'src/assets/realflowers/zinia.png', 1),
  (2, 'スイレン', 'src/assets/flowers/suiren.png', 'src/assets/realflowers/suiren.png', 2),
  (3, '桜', 'src/assets/flowers/sakura.png', 'src/assets/realflowers/sakura.png', 3),
  (4, 'ひまわり', 'src/assets/flowers/sunflower.png', 'src/assets/realflowers/himawari.png', 4),
  (5, 'サルスベリ', 'src/assets/flowers/sarusuberi.png', 'src/assets/realflowers/sarusuberi.png', 5),
  (6, 'ムクゲ', 'src/assets/flowers/mukuge.png', 'src/assets/realflowers/mukuge.png', 6),
  (7, 'コキア', 'src/assets/flowers/kochia.png', 'src/assets/realflowers/kokia.png', 7),
  (8, 'ハス', 'src/assets/flowers/hasu.png', 'src/assets/realflowers/hasu.png', 8),
  (9, 'ルリマツリ', 'src/assets/flowers/rurimatsuri.png', 'src/assets/realflowers/rurimaturi.png', 9),
  (10, 'アジサイ', 'src/assets/flowers/ajisai.png', 'src/assets/realflowers/azisai.png', 10)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  Game_image = VALUES(Game_image),
  Real_image = VALUES(Real_image),
  skill_id = VALUES(skill_id);

CREATE TABLE IF NOT EXISTS player_flowers (
  user_id BIGINT UNSIGNED NOT NULL,
  flower_id INT NOT NULL,
  contracted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, flower_id),
  CONSTRAINT player_flowers_flower_fk
    FOREIGN KEY (flower_id) REFERENCES flowers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO player_flowers (user_id, flower_id)
SELECT users.id, flowers.id
FROM users
CROSS JOIN flowers
WHERE flowers.id BETWEEN 1 AND 10;
