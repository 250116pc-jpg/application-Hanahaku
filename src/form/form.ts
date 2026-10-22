import Phaser from 'phaser'
import { preloadCharacterImages } from '../utils/characterImage'
import flowerImg from '../assets/flower.png'
import testData from '../Scene/test_data'
import type { CharacterData } from '../Scene/test_data'

import { FormUI } from './FormUI'
import { FormationManager } from './FormationManager'
//debug機能
import { showDebugSceneName } from '../debug';
import { SCENE_KEYS } from '../Scene/sceneKeys';

//--------------------------------------------------------------

/**
 * パーティ編成画面（FormScene）クラス
 */
export class FormScene extends Phaser.Scene {
  // UI構築用ヘルパー・編成データ管理インスタンス
  private ui!: FormUI
  private formationManager!: FormationManager

  // 現在選択中のキャラクターIDとフォーメーションスロットインデックス
  private selectedCharacterId: number | null = null
  private selectedSlotIndex = 0

  // 絞り込み・ソート状態の管理フラグ
  private activeFilter = 'all' // ロールフィルター ('all' | 'front' | 'middle' | 'back')
  private sortDescending = true // ソート順 (true: 降順 / false: 昇順)
  private showPartyOnly = false // 編成中キャラクターのみ表示フラグ

  // 表示パーツをまとめるコンテナ（描画順の制御用）
  private gridContainer!: Phaser.GameObjects.Container
  private topControlsContainer!: Phaser.GameObjects.Container
  private memberContainer!: Phaser.GameObjects.Container
  private totalPowerText!: Phaser.GameObjects.Text

  constructor() {
    super(SCENE_KEYS.FORM)
  }

  /**
   * アセットの事前ロード
   */
  preload(): void {
    preloadCharacterImages(this)
    this.load.image('formFlower', flowerImg)
  }

  /**
   * シーン生成時の初期化処理
   */
  create(): void {
    showDebugSceneName(this);
    // UIヘルパーと編成マネージャーの初期化
    this.ui = new FormUI(this)
    this.formationManager = new FormationManager(
      testData.characters,
      testData.formation
    )

    // 最初に選択状態にするキャラクターの設定（編成中キャラ、いなければ初期リストの先頭）
    const formation = this.formationManager.getFormation()
    this.selectedCharacterId =
      formation.find(id => id !== null) ?? testData.characters[0]?.id ?? null

    // 背景色設定
    this.cameras.main.setBackgroundColor('#101828')

    // 各コンテナの生成と表示優先度（Depth）の設定
    this.topControlsContainer = this.add.container(0, 0).setDepth(100)
    this.gridContainer = this.add.container(0, 0).setDepth(100)
    this.memberContainer = this.add.container(0, 0).setDepth(100)

    // 各UIエリアの構築と初回描画
    this.createWindow()
    this.refreshTopControls()
    this.refreshCharacterGrid()
    this.createBottomArea()
    this.refreshMembers()
  }

  /**
   * ウィンドウの背景やヘッダー枠を描画
   */
  private createWindow(): void {
    // 外枠背景パネル
    this.add.rectangle(640, 360, 1210, 660, 0xf8fbff).setStrokeStyle(4, 0xd8aa45)
    // タイトル用ヘッダーバー
    this.add.rectangle(640, 42, 1210, 38, 0x356cbf).setStrokeStyle(2, 0xd8aa45)
    // タイトルテキスト
    this.add.text(640, 42, 'パーティ編成', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
  }

  /**
   * 画面上部のフィルター・ソートボタンの描画更新
   */
  private refreshTopControls(): void {
    this.topControlsContainer.removeAll(true)

    // 役割（配置）絞り込みタブの設定
    const tabs = [
      { label: '全て', filter: 'all' },
      { label: '前衛', filter: 'front' },
      { label: '中衛', filter: 'middle' },
      { label: '後衛', filter: 'back' }
    ]

    // 絞り込みタブボタン生成
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

    // 戦力ソートボタン
    this.topControlsContainer.add(
      this.ui.createPill(860, 88, 160, '戦力', false, () => {
        this.sortDescending = true
        this.refreshTopControls()
        this.refreshCharacterGrid()
      })
    )

    // 昇順/降順切り替えボタン
    this.topControlsContainer.add(
      this.ui.createPill(
        1035,
        88,
        130,
        this.sortDescending ? '降順' : '昇順',
        true,
        () => {
          this.sortDescending = !this.sortDescending
          this.refreshTopControls()
          this.refreshCharacterGrid()
        }
      )
    )

    // マイパーティ（編成中のみ）表示切替ボタン
    this.topControlsContainer.add(
      this.ui.createPill(
        1160,
        88,
        125,
        'マイパーティ',
        this.showPartyOnly,
        () => {
          this.showPartyOnly = !this.showPartyOnly
          this.refreshTopControls()
          this.refreshCharacterGrid()
        }
      )
    )
  }

  /**
   * キャラクター一覧グリッド（所持キャラ）の描画更新
   */
  private refreshCharacterGrid(): void {
    this.gridContainer.removeAll(true)

    const characters = this.getVisibleCharacters()
    const formation = this.formationManager.getFormation()

    // 1行あたり8体配置でXY座標を計算して配置
    characters.forEach((character, index) => {
      const x = 78 + (index % 8) * 148
      const y = 130 + Math.floor(index / 8) * 112

      const inFormation = formation.includes(character.id)
      const selected = this.selectedCharacterId === character.id

      this.gridContainer.add(
        this.ui.createCharacterCard(x, y, character, inFormation, selected, () => {
          this.handleCharacterClick(character)
        })
      )
    })
  }

  /**
   * 画面下部の編成済みメンバー（パーティ枠）の描画更新
   */
  private refreshMembers(): void {
    this.memberContainer.removeAll(true)

    const formation = this.formationManager.getFormation()

    formation.forEach((characterId, index) => {
      const character = this.formationManager.findCharacter(characterId)
      const x = 58 + index * 126
      const y = 494

      // 空スロットの場合
      if (!character) {
        this.memberContainer.add(
          this.ui.createEmptySlot(x, y, this.selectedSlotIndex === index, () => {
            this.selectedSlotIndex = index
            this.refreshAll()
          })
        )
        return
      }

      // キャラクター配置済みスロットの場合
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

    // 合計戦力表示のテキスト更新
    this.totalPowerText.setText(`総戦力 ${this.formationManager.getTotalPower()}`)
  }

  /**
   * キャラクターがクリックされた時の処理（追加・外す判定）
   */
  private handleCharacterClick(character: CharacterData): void {
    const formation = this.formationManager.getFormation()

    // 既にパーティに居る場合は編成から外す
    if (formation.includes(character.id)) {
      this.formationManager.removeCharacter(character.id)
      this.selectedCharacterId = null
      this.refreshAll()
      return
    }

    // 選択中スロットが埋まっている場合は空きスロットを探す
    let slot = this.selectedSlotIndex
    if (formation[slot] !== null) {
      slot = this.formationManager.getEmptySlot()
    }

    // 空きスロットが無い場合は何もしない
    if (slot < 0) return

    // 編成に追加
    this.formationManager.addCharacter(character.id, slot)
    this.selectedCharacterId = character.id
    this.selectedSlotIndex = slot

    this.refreshAll()
  }

  /**
   * 画面下部エリア（決定・詳細・キャンセル等のUI）の構築
   */
  private createBottomArea(): void {
    // セクションラベルと枠線
    this.add.text(45, 456, '現在のメンバー', { fontSize: '20px', color: '#1f2937' })
    this.add.rectangle(640, 535, 1180, 150, 0xf8fbff).setStrokeStyle(2, 0x8aa4c8)

    // 総戦力表示用テキストオブジェクト作成
    this.totalPowerText = this.add.text(625, 456, '', { fontSize: '20px', color: '#1f2937' })

    // キャンセルボタン
    this.ui.createActionButton(840, 610, 145, 'キャンセル', false, () => {
      this.scene.start(SCENE_KEYS.HOME)
    })

    // 詳細ボタン
    this.ui.createActionButton(995, 610, 135, '詳細', false, () => {
      this.openCharacterDetail()
    })

    // 決定ボタン
    this.ui.createActionButton(1135, 610, 145, '決定', true, () => {
      this.saveFormation()
      this.scene.start(SCENE_KEYS.HOME)
    })
  }

  /**
   * 現在のフィルター・ソート条件に適合するキャラクター配列を取得
   */
  private getVisibleCharacters(): CharacterData[] {
    let characters = [...testData.characters]

    // 絞り込み条件の適用
    if (this.showPartyOnly) {
      const formation = this.formationManager.getFormation()
      characters = characters.filter(character => formation.includes(character.id))
    } else if (this.activeFilter === 'front') {
      characters = characters.filter(
        character => character.role === '攻撃' || character.role === '防御'
      )
    } else if (this.activeFilter === 'middle') {
      characters = characters.filter(character => character.role === '補助')
    } else if (this.activeFilter === 'back') {
      characters = characters.filter(character => character.role === '回復')
    }

    // 戦力によるソート処理
    characters.sort((a, b) => {
      const diff = this.formationManager.getPower(a) - this.formationManager.getPower(b)
      return this.sortDescending ? -diff : diff
    })

    return characters
  }

  /**
   * 確定した編成情報をデータに保存
   */
  private saveFormation(): void {
    testData.formation.splice(
      0,
      testData.formation.length,
      ...this.formationManager.getFormation()
    )
  }

  /**
   * キャラクター詳細画面への遷移処理
   */
  private openCharacterDetail(): void {
    if (this.selectedCharacterId === null) {
      return
    }

    this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, {
      characterId: this.selectedCharacterId,
      returnScene: SCENE_KEYS.FORM,
      returnLabel: '編成画面へ'
    })
  }

  /**
   * キャラクター一覧と編成枠の両方の表示をリフレッシュ
   */
  private refreshAll(): void {
    this.refreshCharacterGrid()
    this.refreshMembers()
  }
}