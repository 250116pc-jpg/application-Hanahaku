# スキルエフェクト スプライトシート (Phaser用)
- sheets/*.png : 横1列12フレーム、1フレーム192x192、背景透過
- gifs/*.gif   : 確認用プレビュー
- effects.json : キー名・フレーム数・ループ有無の一覧
- demo.html    : Phaser 3 での再生サンプル (ローカルサーバー経由で開く 例: python -m http.server)

## Phaserでの読み込み
this.load.spritesheet('fire_slash','sheets/01_fire_slash.png',{frameWidth:192,frameHeight:192});
this.anims.create({key:'fire_slash',frames:this.anims.generateFrameNumbers('fire_slash',{start:0,end:11}),frameRate:16,repeat:0});
