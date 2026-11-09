/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜スキル状態の取得と使用
import { isBattlePreview } from '../../debug';
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : PHP接続先を共通関数へ統一するためのインポートを追加する。以降のAPI処理本体は共同制作者の担当。
 * ================================== */
import { getPhpBaseUrl } from '../../auth/PhpBaseUrl';
import type { FlowerSkillType } from '../test_data.ts';

export interface FlowerSkillStage {
  damagePercent: number;
  range: number;
  knockback: boolean;
  area: number[][];
}

export interface ServerFlowerSkill {
  type: FlowerSkillType;
  name: string;
  description: string;
  element: string;
  category: string;
  mpCost: number;
  cooldownSeconds: number;
  level: number;
  attackPower: number;
  damagePercent: number;
  hitCount: number;
  range: number;
  durationMs: number;
  attackBonusPercent: number;
  defenseBonusPercent: number;
  healPercent: number;
  healIntervalMs: number;
  maxHealthBonusPercent: number;
  attackSpeedBonusPercent: number;
  slowPercent: number;
  evasionPercent: number;
  repeatIntervalMs: number;
  area: number[][];
  stages: FlowerSkillStage[];
}

export interface FlowerSkillState {
  flowerId: number;
  mp: number;
  maxMp: number;
  cooldownUntil: number;
  skill: ServerFlowerSkill;
}



async function postSkillRequest(
  endpoint: 'state' | 'begin' | 'use',
  body: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await fetch(`${getPhpBaseUrl()}/skill/${endpoint}.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store'
  });
  const result: unknown = await response.json();
  if (!response.ok || typeof result !== 'object' || result === null || !('ok' in result) || result.ok !== true) {
    const error = typeof result === 'object' && result !== null && 'error' in result &&
      typeof result.error === 'string'
      ? result.error
      : 'スキルサーバーに接続できません。';
    throw new Error(error);
  }
  return result;
}

function parseSkill(value: unknown): ServerFlowerSkill {
  if (typeof value !== 'object' || value === null) {
    throw new Error('サーバーから不正なスキル情報が返されました。');
  }
  const record = value as Record<string, unknown>;
  const getNumber = (field: string): number => {
    const fieldValue = record[field];
    if (typeof fieldValue !== 'number') {
      throw new Error('サーバーから不正なスキル情報が返されました。');
    }
    return fieldValue;
  };

  const numericFields = [
    'mpCost', 'cooldownSeconds', 'level', 'attackPower', 'damagePercent', 'hitCount', 'range',
    'durationMs', 'attackBonusPercent', 'defenseBonusPercent', 'healPercent',
    'healIntervalMs', 'maxHealthBonusPercent', 'attackSpeedBonusPercent',
    'slowPercent', 'evasionPercent', 'repeatIntervalMs'
  ] as const;
  if (
    !['multiHit', 'defensiveRecovery', 'charge', 'balanced', 'continuous', 'maple', 'fortify', 'slowAttack', 'heal', 'evasion'].includes(String(record.type)) ||
    typeof record.name !== 'string' ||
    typeof record.description !== 'string' ||
    typeof record.element !== 'string' ||
    typeof record.category !== 'string' ||
    !Array.isArray(record.stages) ||
    numericFields.some(field => typeof record[field] !== 'number')
  ) {
    throw new Error('サーバーから不正なスキル情報が返されました。');
  }

  const stages = record.stages.map(stage => {
    if (
      typeof stage !== 'object' || stage === null ||
      !('damagePercent' in stage) || typeof stage.damagePercent !== 'number' ||
      !('range' in stage) || typeof stage.range !== 'number' ||
      !('knockback' in stage) || typeof stage.knockback !== 'boolean'
      || !('area' in stage) || !isAreaPattern(stage.area)
    ) {
      throw new Error('サーバーから不正なスキル情報が返されました。');
    }
    return { damagePercent: stage.damagePercent, range: stage.range, knockback: stage.knockback, area: stage.area };
  });

  if (!isAreaPattern(record.area)) {
    throw new Error('サーバーから不正なスキル範囲が返されました。');
  }

  return {
    type: record.type as FlowerSkillType,
    name: record.name,
    description: record.description,
    element: record.element,
    category: record.category,
    stages,
    mpCost: getNumber('mpCost'),
    cooldownSeconds: getNumber('cooldownSeconds'),
    level: getNumber('level'),
    attackPower: getNumber('attackPower'),
    damagePercent: getNumber('damagePercent'),
    hitCount: getNumber('hitCount'),
    range: getNumber('range'),
    durationMs: getNumber('durationMs'),
    attackBonusPercent: getNumber('attackBonusPercent'),
    defenseBonusPercent: getNumber('defenseBonusPercent'),
    healPercent: getNumber('healPercent'),
    healIntervalMs: getNumber('healIntervalMs'),
    maxHealthBonusPercent: getNumber('maxHealthBonusPercent'),
    attackSpeedBonusPercent: getNumber('attackSpeedBonusPercent'),
    slowPercent: getNumber('slowPercent'),
    evasionPercent: getNumber('evasionPercent'),
    repeatIntervalMs: getNumber('repeatIntervalMs'),
    area: record.area
  };
}

function isAreaPattern(value: unknown): value is number[][] {
  return Array.isArray(value) && value.length > 0 && value.every(row =>
    Array.isArray(row) && row.length > 0 && row.every(cell => cell === 0 || cell === 1 || cell === 2)
  );
}

export interface StageFlowerStats {
  flowerId: number;
  level: number;
  attackPower: number;
}

export async function beginStageSkillStates(
  stageId: number,
  flowers: readonly StageFlowerStats[]
): Promise<FlowerSkillState[]> {
  if (import.meta.env.DEV && isBattlePreview) return (await import('./SkillPreview')).buildPreviewSkillStates(flowers);
  const result = await postSkillRequest('begin', { stageId, flowers });
  if (typeof result !== 'object' || result === null || !('flowers' in result) || !Array.isArray(result.flowers)) {
    throw new Error('サーバーから不正なスキル状態が返されました。');
  }
  return result.flowers.map(value => {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('flowerId' in value) ||
      typeof value.flowerId !== 'number' ||
      !('mp' in value) ||
      typeof value.mp !== 'number' ||
      !('maxMp' in value) ||
      typeof value.maxMp !== 'number' ||
      !('cooldownUntil' in value) ||
      typeof value.cooldownUntil !== 'number' ||
      !('skill' in value)
    ) {
      throw new Error('サーバーから不正なスキル状態が返されました。');
    }
    return {
      flowerId: value.flowerId,
      mp: value.mp,
      maxMp: value.maxMp,
      cooldownUntil: value.cooldownUntil,
      skill: parseSkill(value.skill)
    };
  });
}
