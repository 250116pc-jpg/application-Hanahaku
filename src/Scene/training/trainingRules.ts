/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082
 * 氏名：武田優人
 * ================================== */
import rules from '../../../php/flower/training.json';
import upgrades from '../../../php/ally/upgrades.json';

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 成長計算を定義する
 * ================================== */
type Definition = { id: number; enhance_id: number | null; element: number; status_bonus: Record<string, number> };
const definitions = Object.values(import.meta.glob('../../../php/flower/[0-9][0-9][0-9].json', { eager: true, import: 'default' })) as Definition[];
export const MAX_FLOWER_LEVEL = rules.maxLevel;
export const experienceThresholds = [0];
for (let level = 1; level < MAX_FLOWER_LEVEL; level++) {
  experienceThresholds.push(experienceThresholds[level - 1] + Math.ceil(rules.experienceCurve[level - 1] * rules.experienceScale));
}
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 花のレベルに応じた能力値を計算する
 * ================================== */
export function flowerStats(id: number, level: number): Record<string, number> | null {
  const definition = definitions.find(flower => flower.id === id);
  const upgrade = upgrades.upgrades.find(item => item.upgrade_id === definition?.enhance_id);
  if (!rules.enabledFlowerIds.includes(id) || !definition || !upgrade) return null;
  const growth: Record<string, number> = upgrade.growth;
  const keys: Record<string, string> = { hp: 'hp', mp: 'mp', atk: 'physicalAttack', def: 'physicalDefense', cd: 'criticalDamage' };
  const stats = { ...definition.status_bonus };
  for (const [key, target] of Object.entries(keys)) {
    if (Number.isFinite(stats[key])) stats[key] += (growth[target] ?? 0) * (level - 1);
  }
  return stats; // 回復力の基本値は未決定なので推測で追加しない。
}
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : レベル強化前後の値と使用可能数を計算する
 * ================================== */
export function levelPreview(id: number, level: number, exp: string, itemId: number | null, count: number, quantity: number) {
  const perItem = (rules.nutrientExp as Record<string, number>)[String(itemId)] ?? 0;
  const cap = experienceThresholds[MAX_FLOWER_LEVEL - 1];
  const saved = BigInt(exp);
  let reason = '';
  if (!flowerStats(id, level)) reason = 'この花の成長タイプは未設定です。';
  else if (level >= MAX_FLOWER_LEVEL) reason = 'レベル上限に到達しています。';
  else if (level < 1 || saved < BigInt(experienceThresholds[level - 1] ?? 0) || saved >= BigInt(experienceThresholds[level] ?? 0)) reason = '保存レベルと累計EXPが一致しません。';
  else if (!perItem || count < 1) reason = '栄養剤を選択してください。';
  const current = saved <= BigInt(cap) ? Number(saved) : cap;
  const maxQuantity = reason ? 0 : Math.min(count, Math.ceil((cap - current) / perItem));
  const used = Math.min(Math.max(0, quantity), maxQuantity);
  const afterExp = Math.min(cap, current + perItem * used);
  let afterLevel = level;
  while (afterLevel < MAX_FLOWER_LEVEL && afterExp >= experienceThresholds[afterLevel]) afterLevel++;
  return { reason, maxQuantity, used, afterExp, afterLevel, gain: afterExp - current, discarded: Math.max(0, perItem * used - (cap - current)), stats: flowerStats(id, afterLevel) };
}

// スキルEXPは累積値。無属性には一致する種がないので全種類が通常倍率。
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 成長計算を定義する
 * ================================== */
export const skillThresholds = rules.skill.thresholds;
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : スキル強化前後の値と使用可能数を計算する
 * ================================== */
export function skillPreview(id: number, level: number, exp: string, itemId: number | null, count: number, quantity: number) {
  const element = definitions.find(flower => flower.id === id)?.element;
  const seed = (rules.skill.seedElements as Record<string, number>)[String(itemId)];
  const perItem = seed ? (seed === element ? rules.skill.matchingExp : rules.skill.otherExp) : 0;
  const cap = skillThresholds[skillThresholds.length - 1];
  const saved = BigInt(exp), current = Number(saved > BigInt(cap) ? BigInt(cap) : saved);
  let reason = '';
  if (!rules.enabledFlowerIds.includes(id)) reason = 'この花はまだ育成できません。';
  else if (level >= skillThresholds.length) reason = 'スキルレベル上限に到達しています。';
  else if (level < 1 || saved < BigInt(skillThresholds[level - 1] ?? 0) || saved >= BigInt(skillThresholds[level] ?? 0)) reason = '保存スキルレベルと累計EXPが一致しません。';
  else if (!perItem || count < 1) reason = '種を選択してください。';
  const maxQuantity = reason ? 0 : Math.min(count, Math.ceil((cap - current) / perItem));
  const used = Math.min(Math.max(0, quantity), maxQuantity);
  const afterExp = Math.min(cap, current + perItem * used);
  let afterLevel = level;
  while (afterLevel < skillThresholds.length && afterExp >= skillThresholds[afterLevel]) afterLevel++;
  return { reason, maxQuantity, used, afterExp, afterLevel, gain: afterExp - current, discarded: Math.max(0, current + perItem * used - cap), stats: null, perItem };
}

export type TrainingMaterial = { itemId: number; quantity: number };
/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 複数素材の所持数・用途・上限を確認し、合計経験値と成長結果を計算する
 * ================================== */
export function batchPreview(id: number, level: number, exp: string, materials: TrainingMaterial[], inventory: Record<string, number>, skill = false) {
  const thresholds = skill ? skillThresholds : experienceThresholds;
  const cap = thresholds[thresholds.length - 1];
  const calculate = skill ? skillPreview : levelPreview;
  const allowed = skill ? rules.skill.seedElements : rules.nutrientExp;
  const firstId = Number(Object.keys(allowed)[0]);
  const base = calculate(id, level, exp, firstId, 1, 0);
  let reason = base.reason, totalExp = 0, used = 0, smallest = Infinity;
  const ids = new Set<number>();
  for (const material of materials) {
    const { itemId, quantity } = material;
    const unit = materialExperience(id, itemId, skill);
    if (!Number.isSafeInteger(itemId) || !Number.isSafeInteger(quantity) || quantity < 1 || !unit || ids.has(itemId)) {
      reason ||= '強化素材と個数を確認してください。'; break;
    }
    ids.add(itemId);
    if (quantity > (inventory[String(itemId)] ?? 0)) reason ||= '素材の所持数が足りません。';
    totalExp += unit * quantity; used += quantity; smallest = Math.min(smallest, unit);
    if (!Number.isSafeInteger(totalExp) || !Number.isSafeInteger(used)) reason ||= '素材の個数が多すぎます。';
  }
  if (!materials.length) reason ||= '使用する素材の個数を選んでください。';
  const current = Number(BigInt(exp) > BigInt(cap) ? BigInt(cap) : BigInt(exp));
  if (used && totalExp - smallest >= cap - current) reason ||= '上限に必要な個数を超えています。素材を減らしてください。';
  const afterExp = Math.min(cap, current + totalExp);
  let afterLevel = level;
  while (afterLevel < thresholds.length && afterExp >= thresholds[afterLevel]) afterLevel++;
  return { reason, used, afterExp, afterLevel, gain: afterExp - current, discarded: Math.max(0, current + totalExp - cap), stats: skill ? null : flowerStats(id, afterLevel) };
}

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 素材1個の経験値を、種の属性一致ボーナスも含めて返す
 * ================================== */
export function materialExperience(id: number, itemId: number, skill: boolean): number {
  if (!skill) return (rules.nutrientExp as Record<string, number>)[String(itemId)] ?? 0;
  const seed = (rules.skill.seedElements as Record<string, number>)[String(itemId)];
  return seed ? (seed === definitions.find(flower => flower.id === id)?.element ? rules.skill.matchingExp : rules.skill.otherExp) : 0;
}

/* === [ 担当 : 250082 武田優人 ] ===
 * 処理内容 : 所持素材から余剰EXPが最少、同条件なら個数が最少の目標レベル用素材を選ぶ
 * ================================== */
export function targetMaterials(id: number, level: number, exp: string, target: number, inventory: Record<string, number>, skill = false) {
  const thresholds = skill ? skillThresholds : experienceThresholds;
  const maximum = thresholds.length;
  const allowed = skill ? rules.skill.seedElements : rules.nutrientExp;
  const base = (skill ? skillPreview : levelPreview)(id, level, exp, Number(Object.keys(allowed)[0]), 1, 0);
  const empty = { materials: [] as TrainingMaterial[], missingExp: 0, reachableLevel: level, targetLevel: target, reason: base.reason };
  if (base.reason) return empty;
  if (!Number.isInteger(target) || target <= level || target > maximum) return { ...empty, reason: '現在より上のレベルを指定してください。' };
  const needed = thresholds[target - 1] - Number(BigInt(exp));
  const options = Object.keys(allowed).map(Number).sort((a, b) => a - b).map(itemId => ({
    itemId, unit: materialExperience(id, itemId, skill), quantity: inventory[String(itemId)] ?? 0,
  })).filter(item => item.unit > 0 && Number.isSafeInteger(item.quantity) && item.quantity > 0);
  // 必要EXPを大きく超える在庫数を先に切り詰め、整数の範囲と計算量を制限する。
  const available = options.reduce((sum, item) => sum + item.unit * Math.min(item.quantity, Math.ceil(needed / item.unit)), 0);
  if (available < needed) {
    const materials = options.map(({ itemId, quantity }) => ({ itemId, quantity }));
    const preview = batchPreview(id, level, exp, materials, inventory, skill);
    return { materials, missingExp: needed - available, reachableLevel: preview.afterLevel, targetLevel: target, reason: '' };
  }
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = options.reduce((n, item) => gcd(n, item.unit), 0);
  const required = Math.ceil(needed / divisor);
  // 最適解の余剰は、使用可能な最大素材1個のEXP未満に収まる。
  const limit = required + Math.max(...options.map(item => item.unit / divisor)) - 1;
  const counts = new Int32Array(limit + 1).fill(0x3fffffff); counts[0] = 0;
  const groups: Array<{ itemId: number; quantity: number; weight: number; taken: Uint8Array }> = [];
  for (const item of options) {
    const weight = item.unit / divisor;
    let remaining = Math.min(item.quantity, Math.floor(limit / weight));
    // 在庫を1・2・4…個のグループに分け、各グループを一度だけ使う制限付きDP。
    for (let size = 1; remaining > 0; size *= 2) {
      const quantity = Math.min(size, remaining), total = weight * quantity;
      const taken = new Uint8Array(limit + 1);
      for (let sum = limit; sum >= total; sum--) {
        const candidate = counts[sum - total] + quantity;
        if (candidate < counts[sum]) { counts[sum] = candidate; taken[sum] = 1; }
      }
      groups.push({ itemId: item.itemId, quantity, weight: total, taken }); remaining -= quantity;
    }
  }
  let best = required;
  while (best <= limit && counts[best] === 0x3fffffff) best++;
  const selected: Record<string, number> = {};
  for (let index = groups.length - 1, sum = best; index >= 0; index--) {
    const group = groups[index];
    if (group.taken[sum]) { selected[String(group.itemId)] = (selected[String(group.itemId)] ?? 0) + group.quantity; sum -= group.weight; }
  }
  const materials = Object.entries(selected).map(([itemId, quantity]) => ({ itemId: Number(itemId), quantity }));
  return { materials, missingExp: 0, reachableLevel: batchPreview(id, level, exp, materials, inventory, skill).afterLevel, targetLevel: target, reason: '' };
}
