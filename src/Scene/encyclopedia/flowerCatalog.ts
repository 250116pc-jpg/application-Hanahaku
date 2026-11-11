// 仮花カタログの能力・契約条件設定機能で使用予定（再利用候補・未確定。現在の図鑑では未参照）。
/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜図鑑機能・flowerCatalog
import type { CharacterData, Season } from '../test_data'

// Names and seasons are provisional game settings, not botanical identifications.
// IDs are stable and independent of display order; missing assets are not registered.
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 図鑑用に花の画像番号・名前・季節の対応表を定義する。
 * ================================== */
const definitions: Array<[number, string, Season]> = [
  [
    46,
    "モモイロハナ",
    "春"
  ],
  [
    47,
    "シロユリ",
    "夏"
  ],
  [
    48,
    "サクラハナ",
    "春"
  ],
  [
    49,
    "コガネハナ",
    "夏"
  ],
  [
    50,
    "モモイロデイジー",
    "春"
  ],
  [
    51,
    "アカチューリップ",
    "春"
  ],
  [
    52,
    "アオチューリップ",
    "春"
  ],
  [
    53,
    "ムラサキスミレ",
    "春"
  ],
  [
    54,
    "ベニハナ",
    "秋"
  ],
  [
    55,
    "ムラサキホシバナ",
    "秋"
  ],
  [
    56,
    "ツボミソウ",
    "冬"
  ],
  [
    57,
    "コモモバナ",
    "春"
  ],
  [
    60,
    "ヒマワリ",
    "夏"
  ],
  [
    61,
    "シロホシバナ",
    "冬"
  ],
  [
    62,
    "ベニサクラ",
    "春"
  ],
  [
    63,
    "モモイロコスモス",
    "秋"
  ],
  [
    64,
    "アオホシバナ",
    "冬"
  ],
  [
    65,
    "アオアジサイ",
    "夏"
  ],
  [
    69,
    "ムラサキノハナ",
    "秋"
  ]
]
const images = import.meta.glob('../../assets/images/hanahaku_assets_v2/flower/*.png', {
  eager: true, query: '?url', import: 'default'
}) as Record<string, string>

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 花の定義から図鑑表示用のキャラクターデータを組み立てる。
 * ================================== */
export const flowerCatalog: CharacterData[] = definitions.map(([asset, name, season]) => ({
  id: 1000 + asset, name, season,
  textureKey: 'catalog-flower-' + asset,
  species: '花（仮名）', rarity: 1, level: 1, maxLevel: 1,
  element: '未設定', role: '未設定',
  description: '画像をもとに付けた仮名です。季節も仮設定です。能力と契約条件は今後設定します。',
  stats: { hp: 0, mp: 0, atk: 0, def: 0, speed: 0 }, skills: [],
}))

/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 花の画像定義からPhaserで読み込むテクスチャ情報を作る。
 * ================================== */
export const flowerTextures = definitions.map(([asset]) => {
  const file = 'asset_' + String(asset).padStart(3, '0') + '.png'
  const url = images['../../assets/images/hanahaku_assets_v2/flower/' + file]
  if (!url) throw new Error('Missing flower image: ' + file)
  return { key: 'catalog-flower-' + asset, url }
})

// Future contract completion should supply registeredCharacterIds from the player's
// saved contract data. Preview never writes to that data or grants party ownership.
/* === [ 担当 : 250056 斎藤永聖 ] ===
 * 処理内容 : 保存された登録IDを検査し、実在するキャラクターIDだけを重複のない集合にする。
 * ================================== */
export function getRegisteredIds(value: unknown, characters: CharacterData[]): Set<number> {
  const knownIds = new Set(characters.map(character => character.id))
  return new Set(Array.isArray(value) ? value.filter(
    (id): id is number => typeof id === 'number' && knownIds.has(id)
  ) : [])
}
