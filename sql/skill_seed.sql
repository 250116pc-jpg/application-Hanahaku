USE hanahaku;

INSERT INTO `skill` (id, name, description, upgrade_data) VALUES
  (1, '軽い攻撃スキルを連打', '攻撃力の100+level×20%で3+level回攻撃する。', JSON_OBJECT('type', 'multiHit', 'element', '熱', 'category', '攻撃', 'cooldownSeconds', 20, 'mpCost', 25)),
  (2, 'どっしり固いディフェンス', '15秒間、防御力を15+level×3%上昇させ、5秒ごとに自身のHPの5+level%を回復する。', JSON_OBJECT('type', 'defensiveRecovery', 'element', '無', 'category', '強化・回復', 'cooldownSeconds', 28, 'mpCost', 26)),
  (3, '太陽の光線的な一発どかんタイプ', '3秒間通常攻撃ができなくなり、防御力が-20+level×4%。3秒後、攻撃力の300+level×15%で攻撃する。', JSON_OBJECT('type', 'charge', 'element', '熱', 'category', '攻撃', 'cooldownSeconds', 30, 'mpCost', 28)),
  (4, '扱いやすいバランス型', '15+level秒間、攻撃力を15+level×5%、防御力を10%上げる。3秒ごとに攻撃力の15+level%の追尾弾を放つ。', JSON_OBJECT('type', 'balanced', 'element', '熱', 'category', '攻撃・強化', 'cooldownSeconds', 34, 'mpCost', 30)),
  (5, '絶え間ない連続攻撃スキル', '20秒間、攻撃速度を30+level×2%、攻撃力を10+level×5%上げ、防御力を15%下げる。1秒ごとに攻撃力の150+level×10%で攻撃する。', JSON_OBJECT('type', 'continuous', 'element', '水', 'category', '攻撃・強化', 'cooldownSeconds', 31, 'mpCost', 33)),
  (6, '紅葉', '緑形態では20秒間、防御力が30+スキルLv×3%上昇し、毎秒最大HPのスキルLv×1%を回復する。次の発動で赤形態に切り替わり、攻撃力100+Lv×10%、140+Lv×20%、180+Lv×30%の三段攻撃を行う。三段目は敵を吹き飛ばし、各段に10+スキルLv×2%の確率で衰退を付与する。', JSON_OBJECT('type', 'maple', 'element', '風', 'category', '攻撃・変化・強化・回復', 'cooldownSeconds', 33, 'mpCost', 42)),
  (7, 'トップクラスの耐久力', '35+level×2秒間、最大HPと現在HPを75+level×15%上げ、防御力を10+level×5%上げる。攻撃力は10+level×5%下がる。', JSON_OBJECT('type', 'fortify', 'element', '無', 'category', '強化', 'cooldownSeconds', 60, 'mpCost', 45)),
  (8, 'デバフ（被ダメアップや鈍足）とか', '攻撃力の80+level×10%で攻撃し、12+level秒間、敵全体の攻撃速度を20%下げる。', JSON_OBJECT('type', 'slowAttack', 'element', '光', 'category', '攻撃・弱化', 'cooldownSeconds', 36, 'mpCost', 30)),
  (9, '回復。', '回復力の80+level×15%で回復する。', JSON_OBJECT('type', 'heal', 'element', '無', 'category', '回復', 'cooldownSeconds', 22, 'mpCost', 30)),
  (10, '隠密系', '攻撃力の100+スキルLv×10%で1回攻撃し、15秒間、回避率を30%上げる。通常攻撃時に5+スキルLv×1%の確率で10秒間の毒を付与する設計だが、毒付与処理は未実装。', JSON_OBJECT('type', 'evasion', 'element', '土', 'category', '攻撃・強化・弱化', 'cooldownSeconds', 35, 'mpCost', 31))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  upgrade_data = VALUES(upgrade_data);

INSERT INTO flowers (id, name, Game_image, Real_image, skill_id) VALUES
  (1, 'ジニア', 'src/assets/images/pixel_flowers/zinia.png', 'src/assets/images/real_flowers/zinia.png', 1),
  (2, 'スイレン', 'src/assets/images/pixel_flowers/suiren.png', 'src/assets/images/real_flowers/suiren.png', 2),
  (3, 'ハンゲショウ', 'src/assets/images/pixel_flowers/hangesho.png', 'src/assets/images/real_flowers/hangesyou.png', 10),
  (4, 'ひまわり', 'src/assets/images/pixel_flowers/sunflower.png', 'src/assets/images/real_flowers/himawari.png', 3),
  (5, 'サルスベリ', 'src/assets/images/pixel_flowers/sarusuberi.png', 'src/assets/images/real_flowers/sarusuberi.png', 4),
  (6, 'ムクゲ', 'src/assets/images/pixel_flowers/mukuge.png', 'src/assets/images/real_flowers/mukuge.png', 5),
  (7, 'コキア', 'src/assets/images/pixel_flowers/kochia.png', 'src/assets/images/real_flowers/kokia.png', 6),
  (8, 'ハス', 'src/assets/images/pixel_flowers/hasu.png', 'src/assets/images/real_flowers/hasu.png', 7),
  (9, 'ルリマツリ', 'src/assets/images/pixel_flowers/rurimatsuri.png', 'src/assets/images/real_flowers/rurimaturi.png', 8),
  (10, 'アジサイ', 'src/assets/images/pixel_flowers/ajisai.png', 'src/assets/images/real_flowers/azisai.png', 9)
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
