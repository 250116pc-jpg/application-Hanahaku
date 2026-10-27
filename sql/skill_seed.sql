USE hanahaku;

INSERT INTO `skill` (id, name, description, upgrade_data) VALUES
  (1, '軽い攻撃スキルを連打', '前方に連続攻撃する', JSON_OBJECT('type', 'multiHit', 'element', '熱', 'category', '攻撃', 'cooldownSeconds', 25, 'mpCost', 20)),
  (2, 'どっしり固いディフェンス', '防御力を上げ、定期的にHPを回復する', JSON_OBJECT('type', 'defensiveRecovery', 'element', '無', 'category', '強化・回復', 'cooldownSeconds', 26, 'mpCost', 28)),
  (3, '隠密系', '攻撃後、一定時間回避率を上げる', JSON_OBJECT('type', 'evasion', 'element', '土', 'category', '攻撃・強化', 'cooldownSeconds', 31, 'mpCost', 35)),
  (4, '太陽の光線的な一発どかんタイプ', '3秒ためて強力な一撃を放つ', JSON_OBJECT('type', 'charge', 'element', '熱', 'category', '攻撃', 'cooldownSeconds', 28, 'mpCost', 30)),
  (5, '扱いやすいバランス型', '攻防を強化し、追尾弾を放つ', JSON_OBJECT('type', 'balanced', 'element', '熱', 'category', '攻撃・強化', 'cooldownSeconds', 30, 'mpCost', 34)),
  (6, '絶え間ない連続攻撃スキル', '攻撃速度を上げ、連続攻撃する', JSON_OBJECT('type', 'continuous', 'element', '水', 'category', '攻撃・強化', 'cooldownSeconds', 33, 'mpCost', 31)),
  (7, '紅葉', '緑の強化形態と赤の三段攻撃を切り替える', JSON_OBJECT('type', 'maple', 'element', '風', 'category', '攻撃・変化・強化・回復', 'cooldownSeconds', 42, 'mpCost', 33)),
  (8, 'トップクラスの耐久力', '最大HPと防御力を上げる', JSON_OBJECT('type', 'fortify', 'element', '無', 'category', '強化', 'cooldownSeconds', 45, 'mpCost', 60)),
  (9, 'デバフ（被ダメアップや鈍足）とか', '敵全体を攻撃し、攻撃速度を下げる', JSON_OBJECT('type', 'slowAttack', 'element', '光', 'category', '攻撃・弱化', 'cooldownSeconds', 30, 'mpCost', 36)),
  (10, '回復。', 'HPを回復する', JSON_OBJECT('type', 'heal', 'element', '無', 'category', '回復', 'cooldownSeconds', 30, 'mpCost', 22))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  upgrade_data = VALUES(upgrade_data);

INSERT INTO flowers (id, name, Game_image, Real_image, skill_id) VALUES
  (1, 'ジニア', 'src/assets/images/pixel_flowers/zinia.png', 'src/assets/images/real_flowers/zinia.png', 1),
  (2, 'スイレン', 'src/assets/images/pixel_flowers/suiren.png', 'src/assets/images/real_flowers/suiren.png', 2),
  (3, 'ハンゲショウ', 'src/assets/images/pixel_flowers/hangesho.png', 'src/assets/images/real_flowers/hangesyou.png', 3),
  (4, 'ひまわり', 'src/assets/images/pixel_flowers/sunflower.png', 'src/assets/images/real_flowers/himawari.png', 4),
  (5, 'サルスベリ', 'src/assets/images/pixel_flowers/sarusuberi.png', 'src/assets/images/real_flowers/sarusuberi.png', 5),
  (6, 'ムクゲ', 'src/assets/images/pixel_flowers/mukuge.png', 'src/assets/images/real_flowers/mukuge.png', 6),
  (7, 'コキア', 'src/assets/images/pixel_flowers/kochia.png', 'src/assets/images/real_flowers/kokia.png', 7),
  (8, 'ハス', 'src/assets/images/pixel_flowers/hasu.png', 'src/assets/images/real_flowers/hasu.png', 8),
  (9, 'ルリマツリ', 'src/assets/images/pixel_flowers/rurimatsuri.png', 'src/assets/images/real_flowers/rurimaturi.png', 9),
  (10, 'アジサイ', 'src/assets/images/pixel_flowers/ajisai.png', 'src/assets/images/real_flowers/azisai.png', 10)
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
