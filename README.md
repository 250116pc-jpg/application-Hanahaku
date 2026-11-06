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
   4. `skill_seed.sql`
   5. `player_flower_growth.sql`
   6. `player_skill_states.sql`

4. コマンドプロンプトでプロジェクトのルートに移動し、以下を実行します。

   ```cmd
   npm ci
   npm run dev
   ```

5. [http://localhost:5173/](http://localhost:5173/) を開き、メールアドレスで新規登録してログインします。Vite が別のポートを表示した場合は、そのポートを使ってください。自動ログインや戦闘で認証 Cookie を使うため、ゲームと API のホスト名はどちらも `localhost` に揃えます。
6. 試遊用アカウントを作成したら、phpMyAdmin で `skill_seed.sql` をもう一度適用します。この SQL は実行時に存在するアカウントに初期の花を登録します。すでに出撃している場合は、ホームへ戻って出撃し直すとスキルを読み込みます。

`.env.local` を変更したら、開発サーバーを再起動してください。
