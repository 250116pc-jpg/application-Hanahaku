import roster from '../../../php/flower/formation.json';
import { prototypeFlowers } from '../encyclopedia/contractPreview';

function storageKey(): string {
  let userId: string | number = 'guest';
  try {
    const user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null');
    userId = user?.id ?? 'guest';
  } catch { /* Fall back to the guest slot if the saved profile is unreadable. */ }
  return `hanahaku.flower-contracts.v1:${userId}`;
}

const candidates = roster.characters.flatMap(character => {
  const flower = prototypeFlowers.find(entry => entry.code === character.code);
  return flower ? [{ flower, rarity: character.rarity }] : [];
});

export function getContractPool(stageNumber?: string) {
  const match = /^1-([1-5])$/.exec(stageNumber ?? '');
  if (!match) return [];
  const depth = Number(match[1]) - 1;
  const rates = [80 - depth * 3, 17 + depth * 2, 3 + depth];
  return candidates.map(({ flower, rarity }) => ({
    flower,
    chance: rates[rarity - 1] / candidates.filter(candidate => candidate.rarity === rarity).length,
  }));
}

export function drawContractFlower(stageNumber?: string) {
  const pool = getContractPool(stageNumber);
  let roll = Math.random() * 100;
  for (const entry of pool) {
    roll -= entry.chance;
    if (roll < 0) return entry.flower;
  }
  return pool.at(-1)?.flower;
}

export function readFlowerContracts(): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

export function saveFlowerContract(id: number): 'new' | 'duplicate' {
  const saved = readFlowerContracts();
  const previous = saved[id] ?? 0;
  localStorage.setItem(storageKey(), JSON.stringify({ ...saved, [id]: previous + 1 }));
  return previous > 0 ? 'duplicate' : 'new';
}
