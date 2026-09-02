import type { CharacterData } from '../Scene/test_data'

export class FormationManager {

  private characters: CharacterData[]
  private formation: Array<number | null>

  constructor(
    characters: CharacterData[],
    formation: Array<number | null>
  ) {
    this.characters = characters
    this.formation = this.normalizeFormation(formation)
  }


  // 現在の編成
  getFormation(): Array<number | null> {
    return this.formation
  }


  // キャラクターを取得
  findCharacter(
    characterId: number | null
  ): CharacterData | undefined {

    if (characterId === null) {
      return undefined
    }

    return this.characters.find(
      character => character.id === characterId
    )
  }


  // 戦力を計算
  getPower(character: CharacterData): number {

    return (
      character.stats.hp +
      character.stats.mp +
      character.stats.atk * 8 +
      character.stats.def * 6 +
      character.stats.speed * 4
    )
  }


  // パーティ全体の戦力
  getTotalPower(): number {

    let total = 0

    this.formation.forEach(characterId => {

      const character =
        this.findCharacter(characterId)

      if (character) {
        total += this.getPower(character)
      }
    })

    return total
  }


  // キャラクターを編成に追加
  addCharacter(
    characterId: number,
    slotIndex: number
  ): boolean {

    // すでに編成されている
    if (this.formation.includes(characterId)) {
      return false
    }

    // 4人まで
    if (slotIndex < 0 || slotIndex >= 4) {
      return false
    }

    this.formation[slotIndex] = characterId

    return true
  }


  // キャラクターを編成から外す
  removeCharacter(characterId: number): boolean {

    const index =
      this.formation.indexOf(characterId)

    if (index < 0) {
      return false
    }

    this.formation[index] = null

    return true
  }


  // 空いているスロットを探す
  getEmptySlot(): number {

    return this.formation.findIndex(
      characterId => characterId === null
    )
  }


  // 編成を確定
  save(): void {
    // 必要ならここで保存処理
  }


  // 編成データを4枠に整える
  private normalizeFormation(
    formation: Array<number | null>
  ): Array<number | null> {

    const result: Array<number | null> = []

    formation.forEach(characterId => {

      if (result.length >= 4) return

      if (characterId === null) return

      if (result.includes(characterId)) return

      result.push(characterId)
    })

    while (result.length < 4) {
      result.push(null)
    }

    return result
  }
}