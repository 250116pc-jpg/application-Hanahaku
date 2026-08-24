import Phaser from 'phaser'
import flowerImg from '../assets/flower.png'
import testData from '../test_data'
import type { CharacterData } from '../test_data'

import { FormUI } from './FormUI'
import { FormationManager } from './FormationManager'

export class FormScene extends Phaser.Scene {

  private ui!: FormUI
  private formationManager!: FormationManager

  private selectedCharacterId: number | null = null
  private selectedSlotIndex = 0

  private activeFilter = 'all'
  private sortDescending = true
  private showPartyOnly = false

  private gridContainer!: Phaser.GameObjects.Container
  private topControlsContainer!: Phaser.GameObjects.Container
  private memberContainer!: Phaser.GameObjects.Container
  private totalPowerText!: Phaser.GameObjects.Text


  constructor() {
    super('FormScene')
  }


  preload(): void {
    this.load.image('formFlower', flowerImg)
  }


  create(): void {

    // UI
    this.ui = new FormUI(this)

    // 編成データ
    this.formationManager = new FormationManager(
      testData.characters,
      testData.formation
    )

    // 最初に選択するキャラ
    const formation =
      this.formationManager.getFormation()

    this.selectedCharacterId =
      formation.find(id => id !== null)
      ?? testData.characters[0]?.id
      ?? null


    this.cameras.main.setBackgroundColor('#101828')

    // コンテナ
    this.topControlsContainer =
  this.add.container(0, 0)

this.topControlsContainer.setDepth(100)

this.gridContainer =
  this.add.container(0, 0)

this.gridContainer.setDepth(100)

this.memberContainer =
  this.add.container(0, 0)

this.memberContainer.setDepth(100)


    this.createWindow()
    this.refreshTopControls()
    this.refreshCharacterGrid()
    this.createBottomArea()
    this.refreshMembers()
  }


  // =========================
  // ウィンドウ
  // =========================

  private createWindow(): void {

    this.add.rectangle(
      640,
      360,
      1210,
      660,
      0xf8fbff
    ).setStrokeStyle(4, 0xd8aa45)


    this.add.rectangle(
      640,
      42,
      1210,
      38,
      0x356cbf
    ).setStrokeStyle(2, 0xd8aa45)


    this.add.text(
      640,
      42,
      'パーティ編成',
      {
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5)
  }


  // =========================
  // 上のボタン
  // =========================

  private refreshTopControls(): void {

    this.topControlsContainer.removeAll(true)

    const tabs = [
      { label: '全て', filter: 'all' },
      { label: '前衛', filter: 'front' },
      { label: '中衛', filter: 'middle' },
      { label: '後衛', filter: 'back' }
    ]


    tabs.forEach((tab, index) => {

      this.topControlsContainer.add(
        this.ui.createPill(
          80 + index * 118,
          88,
          98,
          tab.label,
          this.activeFilter === tab.filter,

          () => {

            this.activeFilter = tab.filter
            this.showPartyOnly = false

            this.refreshTopControls()
            this.refreshCharacterGrid()
          }
        )
      )
    })


    // 戦力
    this.topControlsContainer.add(
      this.ui.createPill(
        860,
        88,
        160,
        '戦力',
        false,
        () => {

          this.sortDescending = true

          this.refreshTopControls()
          this.refreshCharacterGrid()
        }
      )
    )


    // 昇順・降順
    this.topControlsContainer.add(
      this.ui.createPill(
        1035,
        88,
        130,
        this.sortDescending
          ? '降順'
          : '昇順',
        true,

        () => {

          this.sortDescending =
            !this.sortDescending

          this.refreshTopControls()
          this.refreshCharacterGrid()
        }
      )
    )


    // マイパーティ
    this.topControlsContainer.add(
      this.ui.createPill(
        1160,
        88,
        125,
        'マイパーティ',
        this.showPartyOnly,

        () => {

          this.showPartyOnly =
            !this.showPartyOnly

          this.refreshTopControls()
          this.refreshCharacterGrid()
        }
      )
    )
  }


  // =========================
  // キャラクター一覧
  // =========================

  private refreshCharacterGrid(): void {

  console.log('★ refreshCharacterGrid開始')

  this.gridContainer.removeAll(true)

  const characters = this.getVisibleCharacters()

  console.log('★ 表示キャラ:', characters)

  characters.forEach((character, index) => {

    console.log('★ forEach:', character.name)

    const x = 78 + (index % 8) * 148
    const y = 130 + Math.floor(index / 8) * 112

    const formation =
      this.formationManager.getFormation()

    const inFormation =
      formation.includes(character.id)

    const selected =
      this.selectedCharacterId === character.id

    this.gridContainer.add(
      this.ui.createCharacterCard(
        x,
        y,
        character,
        inFormation,
        selected,
        
        () => {
          this.handleCharacterClick(character)
        }
      )
      
    )
  })
  console.log(
  'gridContainer children:',
  this.gridContainer.length
)
}


  // =========================
  // メンバー表示
  // =========================

  private refreshMembers(): void {

  this.memberContainer.removeAll(true)

  const formation =
    this.formationManager.getFormation()

  formation.forEach((characterId, index) => {

    const character =
      this.formationManager.findCharacter(characterId)

    const x = 58 + index * 126
    const y = 494

    if (!character) {
      this.memberContainer.add(
        this.ui.createEmptySlot(
          x,
          y,
          this.selectedSlotIndex === index,
          () => {
            this.selectedSlotIndex = index
            this.refreshAll()
          }
        )
      )

      return
    }

    this.memberContainer.add(
      this.ui.createCharacterCard(
        x,
        y,
        character,
        true,
        this.selectedSlotIndex === index,
        () => {
          this.selectedSlotIndex = index
          this.selectedCharacterId = character.id
          this.refreshAll()
        },
        0.86
      )
    )
  })

  this.totalPowerText.setText(
    `総戦力 ${this.formationManager.getTotalPower()}`
  )
}


  // =========================
  // キャラクタークリック
  // =========================

  private handleCharacterClick(
    character: CharacterData
  ): void {

    const formation =
      this.formationManager.getFormation()


    // すでに編成されている
    if (formation.includes(character.id)) {

      this.formationManager.removeCharacter(
        character.id
      )

      this.selectedCharacterId = null

      this.refreshAll()

      return
    }


    // 空きスロットを探す
    let slot =
      this.selectedSlotIndex


    if (formation[slot] !== null) {
      slot =
        this.formationManager.getEmptySlot()
    }


    // 空きがない
    if (slot < 0) return


    this.formationManager.addCharacter(
      character.id,
      slot
    )

    this.selectedCharacterId =
      character.id

    this.selectedSlotIndex =
      slot


    this.refreshAll()
  }


  // =========================
  // 下部分
  // =========================

  private createBottomArea(): void {

    this.add.text(
      45,
      456,
      '現在のメンバー',
      {
        fontSize: '20px',
        color: '#1f2937'
      }
    )


    this.add.rectangle(
      640,
      535,
      1180,
      150,
      0xf8fbff
    ).setStrokeStyle(
      2,
      0x8aa4c8
    )


    this.totalPowerText =
      this.add.text(
        625,
        456,
        '',
        {
          fontSize: '20px',
          color: '#1f2937'
        }
      )


    // キャンセル
    this.ui.createActionButton(
      840,
      610,
      145,
      'キャンセル',
      false,

      () => {
        this.scene.start('HomeScene')
      }
    )


    // 詳細
    this.ui.createActionButton(
      995,
      610,
      135,
      '詳細',
      false,

      () => {
        this.openCharacterDetail()
      }
    )


    // 決定
    this.ui.createActionButton(
      1135,
      610,
      145,
      '決定',
      true,

      () => {

        this.saveFormation()

        this.scene.start(
          'HomeScene'
        )
      }
    )
  }


  // =========================
  // キャラクター絞り込み
  // =========================

  private getVisibleCharacters(): CharacterData[] {

    let characters =
      [...testData.characters]


    if (this.showPartyOnly) {

      const formation =
        this.formationManager.getFormation()

      characters =
        characters.filter(
          character =>
            formation.includes(character.id)
        )
    }


    else if (this.activeFilter === 'front') {

      characters =
        characters.filter(
          character =>
            character.role === '攻撃'
            || character.role === '防御'
        )
    }


    else if (this.activeFilter === 'middle') {

      characters =
        characters.filter(
          character =>
            character.role === '補助'
        )
    }


    else if (this.activeFilter === 'back') {

      characters =
        characters.filter(
          character =>
            character.role === '回復'
        )
    }


    // 戦力順
    characters.sort((a, b) => {

      const diff = this.formationManager.getPower(a) -this.formationManager.getPower(b)

      return this.sortDescending ? -diff : diff
    })
    return characters
  }


  // =========================
  // 保存
  // =========================

  private saveFormation(): void {

    testData.formation.splice(
      0,
      testData.formation.length,

      ...this.formationManager.getFormation()
    )
  }


  // =========================
  // 詳細画面
  // =========================

  private openCharacterDetail(): void {

    if (this.selectedCharacterId === null) {
      return
    }


    this.scene.start(
      'CharacterDetailScene',
      {
        characterId:
          this.selectedCharacterId,

        returnScene:
          'FormScene',

        returnLabel:
          '編成画面へ'
      }
    )
  }


  // =========================
  // 全更新
  // =========================

  private refreshAll(): void {

    this.refreshCharacterGrid()
    this.refreshMembers()
  }
}