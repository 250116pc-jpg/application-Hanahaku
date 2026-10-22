import type { FlowerSkillType } from '../test_data.ts';

export interface ServerFlowerSkill {
  type: FlowerSkillType;
  name: string;
  description: string;
  mpCost: number;
  damage: number;
  healAmount: number;
  defenseDurationMs: number;
  range: number;
}

export interface FlowerSkillState {
  flowerId: number;
  mp: number;
  maxMp: number;
  skill: ServerFlowerSkill;
}

function getPhpBaseUrl(): string {
  return (
    import.meta.env.VITE_PHP_BASE_URL ??
    'http://localhost/php/application-Hanahaku-main/php'
  ).replace(/\/$/, '');
}

async function postSkillRequest(
  endpoint: 'state' | 'begin' | 'use',
  body: Record<string, number> = {}
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
  if (
    typeof value !== 'object' ||
    value === null ||
    !('type' in value) ||
    !['singleAttack', 'areaAttack', 'heal', 'defense'].includes(String(value.type)) ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('description' in value) ||
    typeof value.description !== 'string' ||
    !('mpCost' in value) ||
    typeof value.mpCost !== 'number' ||
    !('damage' in value) ||
    typeof value.damage !== 'number' ||
    !('healAmount' in value) ||
    typeof value.healAmount !== 'number' ||
    !('defenseDurationMs' in value) ||
    typeof value.defenseDurationMs !== 'number' ||
    !('range' in value) ||
    typeof value.range !== 'number'
  ) {
    throw new Error('サーバーから不正なスキル情報が返されました。');
  }
  return {
    type: value.type as FlowerSkillType,
    name: value.name,
    description: value.description,
    mpCost: value.mpCost,
    damage: value.damage,
    healAmount: value.healAmount,
    defenseDurationMs: value.defenseDurationMs,
    range: value.range
  };
}

export async function beginStageSkillStates(stageId: number): Promise<FlowerSkillState[]> {
  const result = await postSkillRequest('begin', { stageId });
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
      !('skill' in value)
    ) {
      throw new Error('サーバーから不正なスキル状態が返されました。');
    }
    return {
      flowerId: value.flowerId,
      mp: value.mp,
      maxMp: value.maxMp,
      skill: parseSkill(value.skill)
    };
  });
}

export async function requestFlowerSkill(flowerId: number): Promise<{
  flowerId: number;
  mp: number;
  skill: ServerFlowerSkill;
}> {
  const result = await postSkillRequest('use', { flowerId });
  if (
    typeof result !== 'object' ||
    result === null ||
    !('flowerId' in result) ||
    typeof result.flowerId !== 'number' ||
    !('mp' in result) ||
    typeof result.mp !== 'number' ||
    !('skill' in result)
  ) {
    throw new Error('サーバーから不正なスキル結果が返されました。');
  }
  return {
    flowerId: result.flowerId,
    mp: result.mp,
    skill: parseSkill(result.skill)
  };
}
