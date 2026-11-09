/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜編成機能・formationStorage
import rawFormationData from '../../php/flower/formation.json?raw';

type FormationData = {
  characters: Array<{ id: number }>;
  formation: Array<number | null>;
};

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 保存形式v2と旧形式v1のキー、および旧花IDから新IDへの変換表を定義する。
 * ================================== */
const storageKey = 'hanahaku.formation.v2';
const legacyStorageKey = 'hanahaku.formation.v1';
const legacyIds: Record<number, number | null> = {1:1,2:2,3:null,4:3,5:4,6:5,7:6,8:7,9:8,10:9};
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
    if (saved) return normalizeFormation(JSON.parse(saved));
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 旧形式の編成がある場合はIDを変換・正規化して新形式で保存し、未保存時は初期編成を使う。
     * ================================== */
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
