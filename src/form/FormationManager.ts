/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号: 250056
 * 氏名: 斎藤永聖
 * 担当範囲: 下記の担当コメントを参照（共同制作）
 * ================================== */
// 担当：たまおちゃん｜編成機能・FormationManager
import type { CharacterData } from '../Scene/test_data'

export class FormationManager {
  private characters: CharacterData[]
  private formation: Array<number | null>

  constructor(characters: CharacterData[], formation: Array<number | null>) {
    this.characters = characters
    this.formation = [null, null, null, null]
    formation.slice(0, 4).forEach((id, index) => {
      if (id !== null && this.findCharacter(id) && !this.formation.includes(id)) this.formation[index] = id
    })
  }

  getFormation(): Array<number | null> { return [...this.formation] }
  findCharacter(id: number | null): CharacterData | undefined { return this.characters.find(c => c.id === id) }
  getPower(c: CharacterData): number { return c.stats.hp + c.stats.mp + c.stats.atk * 8 + c.stats.def * 6 + c.stats.speed * 4 }
  getTotalPower(): number {
    return this.formation.reduce<number>((total, id) => {
      const character = this.findCharacter(id)
      return total + (character ? this.getPower(character) : 0)
    }, 0)
  }

  // 編成済みなら位置を交換し、未編成なら指定した枠に配置する。
  addCharacter(id: number, slot: number): boolean {
    if (!Number.isInteger(slot) || slot < 0 || slot >= 4 || !this.findCharacter(id)) return false
    const previousSlot = this.formation.indexOf(id)
    if (previousSlot === slot) return false
    if (previousSlot >= 0) this.formation[previousSlot] = this.formation[slot]
    this.formation[slot] = id
    return true
  }

  removeCharacter(id: number): boolean {
    const index = this.formation.indexOf(id)
    if (index < 0) return false
    /* === [ 担当 : 250056 斎藤永聖 ] ===
     * 処理内容 : 編成から外す対象の枠を空にし、変更成功を返す。
     * ================================== */
    this.formation[index] = null
    return true
  }
  getEmptySlot(): number { return this.formation.indexOf(null) }
}
