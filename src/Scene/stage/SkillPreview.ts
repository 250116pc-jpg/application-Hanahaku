import { transitionWithLoading } from '../../utils/ui/scene-loading';
// 担当：たまおちゃん｜開発用スキルプレビュー
import definitions from '../../../php/skill/skills.json';
import type { FlowerSkillState, ServerFlowerSkill, StageFlowerStats } from './SkillApi';

/** Only used by the explicit development preview, never by an authenticated battle. */
export function buildPreviewSkillStates(flowers: readonly StageFlowerStats[]): FlowerSkillState[] {
  const resolve = (value: unknown, level: number): unknown => {
    if (Array.isArray(value)) return value.map(item => resolve(item, level));
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.base === 'number' && typeof record.perLevel === 'number') return record.base + level * record.perLevel;
      return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, resolve(item, level)]));
    }
    return value;
  };
  return flowers.flatMap(flower => {
    const base = definitions.skills.find(skill => skill.id === flower.flowerId);
    if (!base) return [];
    const skill = {
      type: base.type, name: base.name, description: base.description, element: base.element, category: base.category,
      level: flower.level, attackPower: flower.attackPower,
      mpCost: Math.max(1, base.mpCost - (flower.level - 1)), cooldownSeconds: Math.max(1, base.cooldownSeconds - (flower.level - 1)),
      damagePercent: 0, hitCount: 1, range: 190, durationMs: 0, attackBonusPercent: 0, defenseBonusPercent: 0,
      healPercent: 0, healIntervalMs: 0, maxHealthBonusPercent: 0, attackSpeedBonusPercent: 0, slowPercent: 0,
      evasionPercent: 0, repeatIntervalMs: 0, stages: [], area: [[1]], ...resolve(base.effect, flower.level) as object,
    } as ServerFlowerSkill;
    return [{ flowerId: flower.flowerId, mp: base.maxMp, maxMp: base.maxMp, cooldownUntil: 0, skill }];
  });
}

export function attachPreviewControls(
  scene: import('phaser').Scene,
  player: import('./Player').Player,
  skills: ReadonlyMap<number, ServerFlowerSkill>,
  targets: readonly import('./Player').CombatTarget[]
): void {
  const labels = ['炎', '守護', '光線', '追尾', '水', '紅葉', '強化', '弱化', '回復', '回避'];
  const cast = (id: number): void => {
    const skill = skills.get(id);
    if (skill && player.reserveSkill()) player.useFlowerSkill(skill, targets);
  };
  labels.forEach((label, index) => {
    scene.add.text(360 + index * 60, 170, `${(index + 1) % 10} ${label}`, {
      fontSize: '13px', color: '#ffebbb', backgroundColor: '#152333', padding: { x: 6, y: 8 },
    }).setScrollFactor(0).setDepth(2010).setInteractive({ useHandCursor: true }).on('pointerdown', () => cast(index + 1));
  });
  scene.add.text(360, 207, '数字キー / クリックで試す · Rでリセット（上の試用ボタンはMP消費なし）', {
    fontSize: '12px', color: '#dfd3b8', backgroundColor: '#152333', padding: { x: 6, y: 5 },
  }).setScrollFactor(0).setDepth(2010);
  const onKey = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (/^[0-9]$/.test(event.key)) cast(event.key === '0' ? 10 : Number(event.key));
    if (event.key.toLowerCase() === 'r') transitionWithLoading(scene, scene.scene.key);
  };
  scene.input.keyboard?.on('keydown', onKey);
  scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown', onKey));
}
