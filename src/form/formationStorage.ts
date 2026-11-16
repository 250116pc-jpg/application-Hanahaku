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
};

const formationData = JSON.parse(rawFormationData) as FormationData;
const availableFlowerIds = new Set(formationData.characters.map(character => character.id));

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 編成の形式と重複を整える
 * ================================== */
function normalizeFormation(value: unknown): Array<number | null> {
  const source = Array.isArray(value) ? value : [];
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
export function loadFormation(ownedFlowerIds?: ReadonlySet<number>): Array<number | null> {
  try {
    const key = getFormationStorageKey();
    if (!key) return normalizeFormation(null);
    const saved = localStorage.getItem(key);
    if (saved !== null) return normalizeFormation(JSON.parse(saved));

    // DBで所持を確認できた場合だけ旧編成を引き継ぐ。旧データの持ち主は断定しない。
    // 保存済みの空編成も尊重し、アカウントごとの設定を上書きしない。
    if (!ownedFlowerIds) return normalizeFormation(null);
    const v2 = localStorage.getItem('hanahaku.formation.v2');
    const legacy = v2 ?? localStorage.getItem('hanahaku.formation.v1');
    let value: unknown = JSON.parse(legacy ?? 'null');
    if (v2 === null && Array.isArray(value)) {
      const ids: Record<number, number | null> = {1:1,2:2,3:null,4:3,5:4,6:5,7:6,8:7,9:8,10:9};
      value = value.map(id => typeof id === 'number' ? ids[id] ?? null : null);
    }
    const recovered = normalizeFormation(value).map(id => id !== null && ownedFlowerIds.has(id) ? id : null);
    localStorage.setItem(key, JSON.stringify(recovered));
    return recovered;
  } catch {
    return normalizeFormation(null);
  }
}

/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 編成を検証して保存する
 * ================================== */
export function saveFormation(value: Array<number | null>): boolean {
  const formation = normalizeFormation(value);
  try {
    const key = getFormationStorageKey();
    if (!key) return false;
    localStorage.setItem(key, JSON.stringify(formation));
    return true;
  } catch {
    return false;
  }
}

function getFormationStorageKey(): string | null {
  const user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null');
  return Number.isSafeInteger(user?.id) && user.id > 0 ? 'hanahaku.formation.v3:' + user.id : null;
}
