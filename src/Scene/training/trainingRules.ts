import rules from '../../../php/flower/training.json';
import upgrades from '../../../php/ally/upgrades.json';

type Definition = { id: number; enhance_id: number | null; element: number; status_bonus: Record<string, number> };
const definitions = Object.values(import.meta.glob('../../../php/flower/[0-9][0-9][0-9].json', { eager: true, import: 'default' })) as Definition[];
export const MAX_FLOWER_LEVEL = rules.maxLevel;
export const experienceThresholds = [0];
for (let level = 1; level < MAX_FLOWER_LEVEL; level++) {
  experienceThresholds.push(experienceThresholds[level - 1] + Math.ceil(rules.experienceCurve[level - 1] * rules.experienceScale));
}
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
export const skillThresholds = rules.skill.thresholds;
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
