/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import playerAlly from '../../../php/ally/1001.json';
import allyUpgradeData from '../../../php/ally/upgrades.json';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 主人公の能力値を定義する
 * ================================== */
export interface PlayerStats {
  hp: number;
  mp: number;
  physicalAttack: number;
  magicAttack: number;
  physicalDefense: number;
  magicDefense: number;
  healingPower: number;
  attackIntervalMs: number;
  agility: number;
  criticalRate: number;
  criticalDamage: number;
  contractFlowerId: number;
  moveSpeed: number;
  jumpPower: number;
  fallGravityBonus: number;
}

const levelGrowthKeys: ReadonlyArray<keyof PlayerStats> = [
  'hp', 'mp', 'physicalAttack', 'magicAttack', 'physicalDefense', 'magicDefense', 'healingPower', 'criticalDamage'
];
const upgrade = allyUpgradeData.upgrades.find(item => item.upgrade_id === playerAlly.upgrade_id);
const growthTable = upgrade?.growth as Partial<Record<keyof PlayerStats, number>> | undefined;
const levelOffset = Math.max(0, playerAlly.level - 1);

export const playerStats: PlayerStats = levelGrowthKeys.reduce((stats, key) => {
  const growth = growthTable?.[key] ?? 0;
  stats[key] += growth * levelOffset;
  return stats;
}, { ...playerAlly.stats } as PlayerStats);
