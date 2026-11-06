# 外部素材の権利確認

確認日 2026-11-07。Windows で動かす卒業制作の試作品を、非商用で試遊・提出する前提です。ゲームの読み込み箇所、同梱の利用規約、配布元のページを突き合わせました。生成AI素材は判定対象外です。配布元がAI支援を明記した素材と合成音声は、区別できるよう末尾に記録しました。

確認できた素材は、表の条件に従えば非商用ゲームに組み込めます。**現在のリポジトリ全体を素材入りで配布できるかは未確認です。** ゲームに組み込む許可と、素材の原ファイル・未使用差分・編集データを第三者に渡す許可は、配布元ごとに確認してください。

## ゲームで使うことを確認した素材

| 素材と用途 | 利用条件・提出時の扱い | 根拠 |
| --- | --- | --- |
| JumpButton「Red Cape Knight Character Asset」。主人公の待機・移動・攻撃など | 非商用ゲームで利用可。個人利用ではクレジット不要と記載。提出物には作者名を残すのが確実。営利目的の画像の再製・転売やAI用途は禁止。全スプライトを原ファイルで渡す許可は確認できず。 | [配布元](https://jumpbutton.itch.io/red-cape-knight)・[同梱 Read_me](../src/assets/characters/player/Red%20Cape%20Knight%20Character%20Asset/Read_me.txt) |
| Primitive Pixels Games「Hooded Seeker」Lite版。戦闘の敵 | 非商用ゲームや試作品に利用・加工可。クレジット任意。加工版も含め、素材としての共有・再配布は禁止。 | [配布元](https://primitive-pixels-games.itch.io/hooded-seeker)・[同梱 LICENSE](../src/assets/characters/enemy/Seeker_Lite/LICENSE.txt) |
| Cainos「Pixel Art Platformer - Village Props」。地形・樹木など | 非商用ゲームに利用・加工可。クレジット任意。素材パックの再配布・転売は禁止。元のテクスチャ一式を含む公開リポジトリやZIPは、その形での配布可否を作者に確認するか、受領者が公式から取得する形にする。 | [配布元](https://cainos.itch.io/pixel-art-platformer-village-props)・[使用箇所](../src/Scene/stage/StageScene.ts) |
| PeriTune。タイトル、ホーム、戦闘、ショップ、図鑑のBGM | Frosylva、Harbor Morning、Ancient Gust、Harvest6、Glimmering Woods。非商用ゲームに利用可。現行規約では表記は任意で、暗号化できない非営利ゲームへの同梱を認めている。曲単体での再配布は禁止。2026年2月以前の3曲は従来のCC BY 4.0でも利用可。CC BY 4.0で配布する場合は作者、出典、ライセンス、変更した場合はその旨を記載。 | [利用規約](https://peritune.com/about/)・[規約変更案内](https://peritune.com/blog/2026/03/01/terms-update/)・[曲一覧](https://peritune.com/freematerial_list/)・[使用箇所](../src/audio/BgmManager.ts) |
| 効果音ラボ。操作音 `audio/se-lab/*.mp3` の配布元候補 | 効果音ラボの通常配布版であれば、ゲームに組み込む用途は利用可で表記任意。公式FAQはゲームやGitHubでの音源同梱も認めている。ローカル名が `select.mp3` などに変更されており、各音の元の配布ページとの照合は未確認。 | [利用規約](https://soundeffect-lab.info/agreement/)・[公式FAQ](https://soundeffect-lab.info/faq/)・[使用箇所](../src/audio/BgmManager.ts) |
| Robin/LCSkeleton（Robin Norkum）「Pixel Paper Pack」。人物録の紙 | 非商用ゲームに利用・加工可。**Robin/LCSkeleton または LCSkeleton/Robin Norkum の表記が必須。** 素材の転売・生成AIへの利用は禁止。 | [配布元](https://lcskeleton.itch.io/pixelpaper)・[同梱規約](../src/assets/people-journal/paper-license.txt) |

OtoLogicは現在の設定画面に記載されています。公式規約上は **OtoLogic のクレジット付きで利用可**（CC BY 4.0）です。ただし、どの音源がOtoLogicの配布物かはローカルファイルと照合できていません。三日月アルペジオも設定画面に記載され、一般規約ではゲーム利用が可能です。ゲームの一部としての公開は許容されますが、素材そのものの再配布は禁止され、個別ページに追加条件がある場合があります。現状、個々の立ち絵と配布ページの対応は未確認です。[OtoLogic規約](https://otologic.jp/free/license)・[三日月アルペジオ規約](https://roughsketch.en-grey.com/Entry/99/)・[現行設定画面](../src/Scene/SettingsScene.ts)

## 地図と花写真の追加調査

提出版では、図鑑の実写写真35点を既存のゲーム用イラストに切り替え、写真ファイルを現在の作業ツリーから除外した。以下の写真の調査結果は、差し替え前の素材についての記録。

| 素材 | 確認結果と提出時の扱い |
| --- | --- |
| エリア選択の地図 `src/assets/ui/eria_back.png` | **ChatGPTでの生成を示す記録あり。** PNG内のC2PAに `c2pa.created`、`ChatGPT`、`gpt-image`、`trainedAlgorithmicMedia`、`OpenAI Media Service API` の記載を確認。埋め込みデータの読み取りによる判定で、電子署名の検証は未実施。OpenAIと生成者の間では、適用法の範囲内で出力は生成者に帰属する。第三者の地図を生成時の入力に使ったかは記録から判断できない。公式図版を使っていた場合は、その利用許諾を確認する。 [C2PAの解説](https://spec.c2pa.org/specifications/specifications/1.3/guidance/Guidance.html)・[OpenAI利用規約](https://openai.com/policies/terms-of-use/)・[GREEN×EXPO 2027公式サイト規約](https://expo2027yokohama.or.jp/terms/) |
| 図鑑のジニア写真 `src/assets/images/real_flowers/zinia.png` | **出所確認済み・転載許諾未確認。** サカタのタネ公式ショップ「プロフュージョン オレンジ」の商品画像 `31100096_00.jpg` と、デコード後の700×700の全画素が一致。公式FAQではWebサイト画像の無断転載を認めていない。個別許諾がなければ、提出物では利用条件の明確な写真に差し替えるか、掲載を外す。 [商品ページ](https://sakata-netshop.com/shop/g/g31100096/)・[オンラインショップの利用条件](https://sakata-netshop.com/shop/pages/guide_shopping_about.aspx)・[公式FAQ](https://corporate.sakataseed.co.jp/contact/faq.html) |
| 図鑑の残りの花写真34点 `src/assets/images/real_flowers/` | **出所・許諾は未確認。** 全ファイルのメタデータと、写真が追加されたコミット `2631be7` からは、作者・元のURL・ライセンスを確認できなかった。一部は公開画像の候補とも照合したが、同一画像と判断できる根拠は得られなかった。入手時のURLや原本を入手した人に確認する。 |

## その他、出所の確認が残っている素材

| 素材 | 確認した範囲と必要な対応 |
| --- | --- |
| シナリオ等の立ち絵 `src/assets/characters/1001/`、`1002/`、`1003/`、`2000/`、`2001/` | 制作側によると、一部が三日月アルペジオで、残りはAI素材。個々の画像と配布ページの対応は未確認。設定画面では三日月アルペジオを立ち絵の提供元として明記した。 |
| `audio/PathOfAdventure/NoLoop/line.wav` と `audio/encyclopedia/page-turn-firefly.wav` | どちらも使用中。制作側によるとSEはAI制作とフリー素材を使用。個別ファイルと配布元の対応は未確認。 |
| その他の花ドット絵、背景、UI、アイテム・状態・スキル画像 | `src/assets/images/`、`ui/`、`setting/`、`skill/`、`system/skill/` に分散。制作者・配布元・生成の有無を画像単位では確定できなかった。生成と判明している `sanctuary-twilight.png` は対象外。 |

### リポジトリにある未使用・未確認の素材

- cuppar「Free - Elegant UI」は `src/assets/ui/elegant_ui/` にあり、現行画面からの参照は見つからなかった。採用するなら非商用利用可、配布ページへのクレジット必須。素材として配布する場合は配布元の制限を確認する。[配布元](https://cuppar.itch.io/elegant-ui)
- `audio/ますお/ToHeart_style_minigame_BGM.mp3` と `PathOfAdventure` の Loop・NoLoop 楽曲群は、使用中の `line.wav` を除き、現行コードからの参照が見つからなかった。PeriTuneの5曲とは別扱い。ライセンスを確認できるまで提出用の同梱対象から外す。
- 使っていないスプライト差分や素材パックの元ファイルも、Gitで管理されていればリポジトリ提出の対象になる。GitやZIPで渡す場合は、動作に必要なファイルと素材の原本一式を分けて確認する。

## 配布元がAI支援を明記した素材・合成音声

| 素材 | 確認結果 |
| --- | --- |
| Laphkal / Zanyar’s Asset Store「Pixel Fantasy UI Pack」。インベントリ | 配布元がAI支援を明記。非商用ゲームで利用可。**`UI art: Zanyar's Asset Store` または配布ページへのリンクが必須。** パック自体の再配布禁止。[配布元](https://laphkal.itch.io/pixel-fantasy-ui-pack)・[同梱 README](../src/assets/inventory-fantasy/README.txt) |
| heyheythere「Pixel UI Fantasy Free」。人物録のUI | 配布元はAI支援あり、生成画像モデルは不使用と記載。CC BY 4.0。**作者名・配布ページ・ライセンスの表示が必要。** 加工があれば明記する。[配布元](https://heyheythere.itch.io/pixel-ui-fantasy-free)・[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Gridwright「Book & Journal UI」無料サンプル。図鑑の本 | 配布元はAI支援で作ったコードで描画、画像生成器は不使用と記載。試作品への組み込みとゲームとしての配布可。クレジット任意。素材としての再配布は禁止。[配布元](https://gridwrightstudio.itch.io/pixel-art-book-ui-journal-page-turn-animation)・[同梱 LICENSE](../src/assets/settings-book/LICENSE.txt) |
| VOICEVOX ずんだもん。設定画面の合成音声 | 非商用利用可。**`VOICEVOX:ずんだもん` の表記が必要。** 現行の設定画面に記載済み。キャラクター個別規約にも従う。[公式製品ページ・個別規約](https://voicevox.hiroshiba.jp/product/zundamon/)・[公式Q&A](https://voicevox.hiroshiba.jp/qa/) |

## 提出前に対応する箇所

1. 地図の生成時に第三者の図版を入力したか確認する。写真を後日追加する場合は、入手元と利用条件を確認する。
2. ソース一式を提出・公開する場合は、特にCainosなど、素材としての再配布に制限がある原ファイルや未使用分を確認する。配布元が認めるゲームへの同梱範囲と、提出先が求めるファイル構成を照合する。

現行ゲームの[設定のクレジット欄](../src/Scene/SettingsScene.ts)に Robin/LCSkeleton、Zanyar’s Asset Store、heyheythere の表記と配布ページを追加済み。
