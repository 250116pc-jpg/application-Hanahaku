/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250056、250116
 * 氏名：斎藤永聖、中村伊安
 * ================================== */
import type { CharacterData } from '../Scene/test_data'

export class FormationManager {
  /* === [ 担当 : 250056 斎藤永聖 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private characters: CharacterData[]
  private formation: Array<number | null>

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 所持花を受け取り、重複を除いて4枠の編成を初期化する
   * ================================== */
  constructor(characters: CharacterData[], formation: Array<number | null>) {
    this.characters = characters
    this.formation = [null, null, null, null]
    formation.slice(0, 4).forEach((id, index) => {
      if (id !== null && this.findCharacter(id) && !this.formation.includes(id)) this.formation[index] = id
    })
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 現在の編成を返す
   * ================================== */
  getFormation(): Array<number | null> { return [...this.formation] }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 対象の花を取得する
   * ================================== */
  findCharacter(id: number | null): CharacterData | undefined { return this.characters.find(c => c.id === id) }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 花の戦力を計算する
   * ================================== */
  getPower(c: CharacterData): number { return c.stats.hp + c.stats.mp + c.stats.atk * 8 + c.stats.def * 6 + c.stats.speed * 4 }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 編成全体の戦力を計算する
   * ================================== */
  getTotalPower(): number {
    return this.formation.reduce<number>((total, id) => {
      const character = this.findCharacter(id)
      return total + (character ? this.getPower(character) : 0)
    }, 0)
  }

  // 編成済みなら位置を交換し、未編成なら指定した枠に配置する。
  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 編成枠へ配置・交換する
   * ================================== */
  addCharacter(id: number, slot: number): boolean {
    if (!Number.isInteger(slot) || slot < 0 || slot >= 4 || !this.findCharacter(id)) return false
    const previousSlot = this.formation.indexOf(id)
    if (previousSlot === slot) return false
    if (previousSlot >= 0) this.formation[previousSlot] = this.formation[slot]
    this.formation[slot] = id
    return true
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 編成枠から花を外す
   * ================================== */
  removeCharacter(id: number): boolean {
    const index = this.formation.indexOf(id)
    if (index < 0) return false
    this.formation[index] = null
    return true
  }
  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 編成の空き枠の位置を返す
   * ================================== */
  getEmptySlot(): number { return this.formation.indexOf(null) }
}
