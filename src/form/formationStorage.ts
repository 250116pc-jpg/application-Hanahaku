/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
import rawFormationData from '../../php/flower/formation.json?raw';

/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : 編成のブラウザ保存を定義する
 * ================================== */
type FormationData = {
  characters: Array<{ id: number }>;
  formation: Array<number | null>;
};

const storageKey = 'hanahaku.formation.v2';
const legacyStorageKey = 'hanahaku.formation.v1';
const legacyIds: Record<number, number | null> = {1:1,2:2,3:null,4:3,5:4,6:5,7:6,8:7,9:8,10:9};
const formationData = JSON.parse(rawFormationData) as FormationData;
const availableFlowerIds = new Set(formationData.characters.map(character => character.id));

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 編成の形式と重複を整える
 * ================================== */
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

/* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
 * 処理内容 : 保存済みの編成を読み込む
 * ================================== */
export function loadFormation(): Array<number | null> {
  try {
    const saved = typeof window === 'undefined' ? null : window.localStorage.getItem(storageKey);
    if (saved) return normalizeFormation(JSON.parse(saved));
    const legacy = typeof window === 'undefined' ? null : window.localStorage.getItem(legacyStorageKey);
    if (legacy) {
      const old: unknown = JSON.parse(legacy);
      if (Array.isArray(old)) {
        const migrated = normalizeFormation(old.map(id => typeof id === 'number' ? legacyIds[id] ?? null : null));
        saveFormation(migrated);
        return migrated;
      }
    }
    return normalizeFormation(formationData.formation);
  } catch {
    return normalizeFormation(formationData.formation);
  }
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 編成を検証して保存する
 * ================================== */
export function saveFormation(value: Array<number | null>): boolean {
  const formation = normalizeFormation(value);
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(storageKey, JSON.stringify(formation));
    return true;
  } catch {
    return false;
  }
}
