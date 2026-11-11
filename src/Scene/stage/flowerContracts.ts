/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250116
 * 氏名：中村伊安
 * ================================== */
import roster from '../../../php/flower/formation.json';
import { prototypeFlowers } from '../encyclopedia/contractPreview';

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : ユーザーごとの花契約データの保存キーを作る
 * ================================== */
function storageKey(): string {
  let userId: string | number = 'guest';
  try {
    const user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null');
    userId = user?.id ?? 'guest';
  } catch { /* Fall back to the guest slot if the saved profile is unreadable. */ }
  return `hanahaku.flower-contracts.v1:${userId}`;
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 契約候補の抽選・ローカル保存を定義する
 * ================================== */
const candidates = roster.characters.flatMap(character => {
  const flower = prototypeFlowers.find(entry => entry.code === character.code);
  return flower ? [{ flower, rarity: character.rarity }] : [];
});

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : ステージとレア度に応じた契約候補・抽選確率を作る
 * ================================== */
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

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 契約候補から花を抽選する
 * ================================== */
export function drawContractFlower(stageNumber?: string) {
  const pool = getContractPool(stageNumber);
  let roll = Math.random() * 100;
  for (const entry of pool) {
    roll -= entry.chance;
    if (roll < 0) return entry.flower;
  }
  return pool.at(-1)?.flower;
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 端末に保存された花ごとの契約数を読み込む
 * ================================== */
export function readFlowerContracts(): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 契約結果を用意し、確定時に端末の契約数を更新する
 * ================================== */
export function prepareFlowerContract(id: number): () => 'new' | 'duplicate' {
  const saved = readFlowerContracts();
  const key = storageKey();
  // Check storage access before using a potion.
  localStorage.setItem(key, JSON.stringify(saved));
  return () => {
    const current = readFlowerContracts();
    const count = current[id] ?? 0;
    localStorage.setItem(key, JSON.stringify({ ...current, [id]: count + 1 }));
    return count > 0 ? 'duplicate' : 'new';
  };
}
