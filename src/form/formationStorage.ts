import rawFormationData from '../../php/flower/formation.json?raw';

type FormationData = {
  characters: Array<{ id: number }>;
  formation: Array<number | null>;
};

const storageKey = 'hanahaku.formation.v1';
const formationData = JSON.parse(rawFormationData) as FormationData;
const availableFlowerIds = new Set(formationData.characters.map(character => character.id));

function normalizeFormation(value: unknown): Array<number | null> {
  const source = Array.isArray(value) ? value : formationData.formation;
  const formation: Array<number | null> = [null, null, null, null];
  const used = new Set<number>();

  source.slice(0, 4).forEach((id: unknown, index: number) => {
    if (typeof id !== 'number' || !availableFlowerIds.has(id) || used.has(id)) return;
    formation[index] = id;
    used.add(id);
  });
  return formation;
}

export function loadFormation(): Array<number | null> {
  try {
    const saved = typeof window === 'undefined' ? null : window.localStorage.getItem(storageKey);
    return saved ? normalizeFormation(JSON.parse(saved)) : normalizeFormation(formationData.formation);
  } catch {
    return normalizeFormation(formationData.formation);
  }
}

export function saveFormation(value: Array<number | null>): void {
  const formation = normalizeFormation(value);
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, JSON.stringify(formation));
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
}
