/* ==================================
 * 期末テスト提出プログラム
 * 学籍番号：250082、250056、250116
 * 氏名：武田優人、斎藤永聖、中村伊安
 * ================================== */
import { transitionWithLoading } from '../utils/ui/scene-loading';
import Phaser from 'phaser'
import { preloadCharacterImages, addCharacterImage } from '../utils/characterImage'

import flowerImg from '../assets/flower.png'
import testData from './test_data'
import type { CharacterData } from './test_data'
import { createStandardSceneFrame, getTextStyle, createTextButton } from '../utils/ui'
import rawSkillDefinitions from '../../php/skill/skills.json?raw'
//debug機能
import { showDebugSceneName } from '../debug';
import { SCENE_KEYS } from './sceneKeys';
import { navigateToTownMap } from './HomeScene/townMapNavigation'

//--------------------------------------------------------------


/* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
 * 処理内容 : 花の基本情報・能力・スキル表示を定義する
 * ================================== */
const BORDER_COLOR = 0x536878

type CharacterDetailSceneData = {
  ownedCharacter?: CharacterData
  characterId?: number
  returnScene?: string
  returnLabel?: string
  returnData?: { resumeFormation?: boolean }
}

type SkillDefinition = {
  id: number
  name: string
  description: string
  element: string
  mpCost: number
  cooldownSeconds: number
}

const skillDefinitions = (JSON.parse(rawSkillDefinitions) as { skills: SkillDefinition[] }).skills

// Phaser の日本語自動折り返しに依存せず、表示幅に収まる位置へ改行を入れる。
/* === [ 担当 : 250116 中村伊安 ] ===
 * 処理内容 : 日本語の説明文を指定文字数で改行する
 * ================================== */
function forceWrapJapaneseText(value: string, maxCharacters = 20): string {
  const lines: string[] = []
  let line = ''

  for (const character of value) {
    if (character === '\n') {
      lines.push(line)
      line = ''
      continue
    }

    line += character
    const length = [...line].length
    if (/[。！？]/.test(character) || length >= maxCharacters) {
      lines.push(line)
      line = ''
    }
  }

  if (line) lines.push(line)
  return lines.join('\n')
}

export class CharacterDetailScene extends Phaser.Scene {
  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 状態・能力値・操作対象を保持する
   * ================================== */
  private returnData: { resumeFormation?: boolean } = {}
  private ownedCharacter?: CharacterData
  private characterId = 1
  private returnScene: string = SCENE_KEYS.TRAINING
  private returnLabel = '育成画面へ'

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 初期状態と画面キーを設定する
   * ================================== */
  constructor() {
    super(SCENE_KEYS.CHARACTER_DETAIL)
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 呼び出し元と表示対象を受け取る
   * ================================== */
  init(data: CharacterDetailSceneData): void {
    this.ownedCharacter = data.ownedCharacter
    this.returnData = data.returnData ?? {}
    this.characterId = data.characterId ?? 1
    this.returnScene = data.returnScene ?? SCENE_KEYS.TRAINING
    this.returnLabel = data.returnLabel ?? '育成画面へ'
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 使用する画像・音声を読み込む
   * ================================== */
  preload(): void {
    preloadCharacterImages(this)
    this.load.image('detailFlower', flowerImg)
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 花の基本情報・能力値・スキルと戻る操作を表示する
   * ================================== */
  create(): void {
    showDebugSceneName(this);
    
    const width = this.scale.width
    const height = this.scale.height
    const character = this.findCharacter()

    createStandardSceneFrame(this, 'キャラ詳細', `← ${this.returnLabel}`, () => {
      transitionWithLoading(this, this.returnScene, this.returnData)
    })
    this.createCharacterImage()
    this.createBasicInfo(character)
    this.createStatusInfo(character)
    this.createSkillInfo(character)
    this.createHomeButton(width, height)
  }

  /* === [ 担当 : 250056 斎藤永聖 / 250116 中村伊安 ] ===
   * 処理内容 : 表示に使う画像・アニメーションを用意する
   * ================================== */
  private createCharacterImage(): void {
    this.add.rectangle(310, 285, 360, 360, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    addCharacterImage(this, 310, 285, this.findCharacter().id, 'detailFlower', 0.75, 280)
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 花の名前・属性・役割などの基本情報を表示する
   * ================================== */
  private createBasicInfo(character: CharacterData): void {
    this.add.rectangle(780, 210, 520, 170, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(550, 145, character.name, getTextStyle(32))
    this.add.text(550, 195, [
      `種族: ${character.species}`,
      `レア度: ${'★'.repeat(character.rarity)}`,
      `Lv.${character.level} / ${character.maxLevel}`,
      `属性: ${character.element} / 役割: ${character.role}`
    ].join('\n'), {
      ...getTextStyle(21),
      lineSpacing: 6
    })
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 花のHP・MP・攻撃力・防御力などを表示する
   * ================================== */
  private createStatusInfo(character: CharacterData): void {
    this.add.rectangle(310, 560, 360, 160, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(160, 500, 'ステータス', getTextStyle(26))
    this.add.text(170, 540, [
      `HP    ${character.stats.hp}`,
      `MP    ${character.stats.mp}`,
      `ATK   ${character.stats.atk}`,
      `DEF   ${character.stats.def}`,
      `SPD   ${character.stats.speed}`
    ].join('\n'), {
      ...getTextStyle(21),
      lineSpacing: 5
    })
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 花が持つスキルの名前と効果を表示する
   * ================================== */
  private createSkillInfo(character: CharacterData): void {
    this.add.rectangle(780, 505, 520, 310, 0xffffff)
      .setStrokeStyle(2, BORDER_COLOR)

    this.add.text(550, 365, 'スキル', getTextStyle(26))
    let y = 405
    character.skills.forEach((skillName, index) => {
      const definition = skillDefinitions.find(skill => skill.name === skillName)
        ?? skillDefinitions.find(skill => skill.id === character.id)
      this.add.text(550, y, `スキル${index + 1}: ${definition?.name ?? skillName}`, {
        ...getTextStyle(20),
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        fontStyle: 'bold'
      })
      y += 27

      if (!definition) {
        const fallback = this.add.text(550, y, forceWrapJapaneseText(character.description), {
          ...getTextStyle(17), padding: { top: 0, bottom: 0, left: 0, right: 0 }, lineSpacing: 3
        })
        y += fallback.height + 8
        return
      }

      this.add.text(550, y, `属性 ${definition.element}　消費MP ${definition.mpCost}　CT ${definition.cooldownSeconds}秒`, {
        ...getTextStyle(15),
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        color: '#52616b'
      })
      y += 22
      const description = this.add.text(550, y, forceWrapJapaneseText(definition.description), {
        ...getTextStyle(17),
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        lineSpacing: 3
      })
      y += description.height + 8
    })
  }

  /* === [ 担当 : 250116 中村伊安 ] ===
   * 処理内容 : 町マップへ戻るボタンを配置する
   * ================================== */
  private createHomeButton(width: number, height: number): void {
    createTextButton(this, width - 140, height - 65, '町マップへ', () => {
      navigateToTownMap(this)
    }, { fontSize: 24, padding: { top: 10, bottom: 10, left: 18, right: 18 } })
  }

  /* === [ 担当 : 250082 武田優人 / 250116 中村伊安 ] ===
   * 処理内容 : 対象の花を取得する
   * ================================== */
  private findCharacter(): CharacterData {
    if (this.ownedCharacter?.id === this.characterId) return this.ownedCharacter
    return testData.characters.find((character) => character.id === this.characterId)
      ?? testData.characters[0]
  }

}
