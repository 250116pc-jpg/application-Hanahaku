# 花博ゲーム（試作品）

## Windows での起動手順

1. XAMPP の `htdocs` にプロジェクトを置きます。標準の配置先は `C:\xampp\htdocs\application-Hanahaku` です。XAMPP Control Panel で **Apache** と **MySQL** を起動します。Node.js は 20.19 以降の 20 系、または 22.12 以降を使います。
2. プロジェクトのルートに `.env.local` を作り、以下を記入します。別のフォルダに置いた場合は、URL のパスを実際の配置に合わせてください。

   ```dotenv
   VITE_PHP_BASE_URL=http://localhost/application-Hanahaku/php
   ```

3. [phpMyAdmin](http://localhost/phpmyadmin/) の「インポート」から、`sql/` 内のファイルを以下の順に適用します。最初のファイルで `hanahaku` データベースが作成されます。

   1. `hanahaku_users.sql`
   2. `auth_sessions.sql`
   3. `hanahaku_flowers.sql`
   4. `player_flower_growth.sql`
   5. `player_skill_states.sql`

4. コマンドプロンプトでプロジェクトのルートに移動し、以下を実行します。

   ```cmd
   npm ci
   npm run dev
   ```

5. [http://localhost:5173/](http://localhost:5173/) を開き、メールアドレスで新規登録してログインします。Vite が別のポートを表示した場合は、そのポートを使ってください。自動ログインや戦闘で認証 Cookie を使うため、ゲームと API のホスト名はどちらも `localhost` に揃えます。
6. 試遊用アカウントを作成したら、プロジェクトルートで `C:\xampp\php\php.exe scripts/seed-player-flowers.php` を実行します。既存アカウントに花ID 1〜10の契約を追加します。繰り返しても既存のレベル・経験値は変更しません。すでに出撃している場合は、ホームへ戻って出撃し直すとスキルを読み込みます。

`.env.local` を変更したら、開発サーバーを再起動してください。

## DBとファイルの役割

固定データはPHPから読み込むJSONを編集します。SQLへの二重登録は不要です。

| 内容 | 管理場所 |
| --- | --- |
| 花の名前・画像・基礎能力・説明 | `php/flower/NNN.json`、`php/flower/path.json` |
| 戦闘スキル・状態異常 | `php/skill/skills.json`、`php/skill/statuses.json` |
| 図鑑用のスキル説明 | `php/flower/catalog-skills.json` |
| ステージ・敵配置 | `php/stage/stage*.json` |
| 敵の基礎能力 | `php/enemy/enemy*.json` |
| 味方・成長ルール | `php/ally/`、`php/flower/training.json` |
| 商品・価格 | `php/shop/items.json` |

DBにはユーザー情報、コイン・所持品、編成・攻略状況、花の契約・育成状況、認証セッション、APIが使うプレイヤー別スキル状態を保存します。`users.items`（所持数）と旧`items`テーブル（商品定義）は別物です。

### 既存DBの移行

1. phpMyAdminで`hanahaku`全体をSQL形式でエクスポートし、プロジェクトの公開フォルダ外に保管します。
2. 旧マスタを独自に編集していた場合は、対応する上記JSONへ反映します。現在のAPIはJSONを参照するため、DBの変更は自動反映されません。
3. `sql/migrations/001_remove_static_masters.sql`をインポートします。旧マスタ6テーブルと契約テーブルからの外部キーを削除し、プレイヤーの保存データを残します。新規構築にはこの移行SQLは不要です。

`sql/skill_seed.sql`は旧手順向けの案内のみです。試遊用の花の付与は上記PHPコマンドを使います。