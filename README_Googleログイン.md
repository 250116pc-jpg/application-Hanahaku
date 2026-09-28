# Googleアカウント登録・ログインの設定

既存のメールアドレス＋パスワード認証はそのまま利用できます。Googleボタンでは、初回は `users` テーブルへ自動登録し、2回目以降は同じGoogleアカウントでログインします。

## 1. SQLを更新する

phpMyAdminで `sql/hanahaku_users.sql` をインポートします。すでに `users` テーブルが存在していても、Googleアカウント識別用の `google_sub` 列と一意インデックスが追加されます。

## 2. GoogleのクライアントIDを作る

1. Google Cloud Consoleでプロジェクトを作成または選択します。
2. Google Auth Platformのブランディングと同意画面を設定します。
3. クライアントを作成し、種類は「ウェブ アプリケーション」を選びます。
4. 開発時の「承認済みのJavaScript生成元」に `http://localhost:5173` を追加します。
5. 公開時は、ゲームを置くHTTPSの生成元（例 `https://game.example.com`）も追加します。

この実装はポップアップ方式なので、リダイレクトURIの追加は不要です。

## 3. `.env` を作る

プロジェクト直下の `.env.example` をコピーして、ファイル名を `.env` にします。次の2項目を実際の値へ変更します。

```env
VITE_PHP_BASE_URL=http://localhost/php/application-Hanahaku-main/php
VITE_GOOGLE_CLIENT_ID=Google Cloud Consoleで発行したクライアントID
```

GoogleクライアントIDは公開情報なので、フロント画面でも使用します。クライアントシークレットはこの方式では使用しません。

変更後はViteを停止し、`npm run dev` で再起動してください。

## 4. PHPを配置する

プロジェクトを現在の構成でXAMPPへ置く場合、PHPは次の場所です。

```text
C:\xampp\htdocs\php\application-Hanahaku-main\php
```

対応するURLは次のとおりです。

```text
http://localhost/php/application-Hanahaku-main/php
```

## スマートフォンで使う場合

スマートフォンの `localhost` はスマートフォン自身を指すため、PCのXAMPPには接続できません。実機でGoogleログインを使用する場合は、ゲーム画面とPHPをスマートフォンから到達できるHTTPSのサーバーへ公開してください。

Googleは開発用の `localhost` を除き、GoogleログインをHTTPSで使用することを求めています。LAN内の `http://192.168.x.x` だけでは本番用のGoogleログインには適しません。

公開先がフロント画面とPHPで別ドメインになる場合は、`.env` の `HANAHAKU_ALLOWED_ORIGINS` に画面側のURLを追加します。

```env
HANAHAKU_ALLOWED_ORIGINS=https://game.example.com
```

## 追加・変更ファイル

- `src/auth/GoogleSignIn.ts`
- `src/Scene/LoginScene.ts`
- `src/Scene/RegisterScene.ts`
- `src/style.css`
- `php/google-token.php`
- `php/google-login.php`
- `php/db.php`
- `sql/hanahaku_users.sql`
- `.env.example`
