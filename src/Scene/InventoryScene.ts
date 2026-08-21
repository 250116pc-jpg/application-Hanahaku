import Phaser from 'phaser';

// ==============================
// アイテムカテゴリー
// ==============================

type ItemCategory =
  | 'heal'
  | 'material'
  | 'important';

// ==============================
// アイテム型
// ==============================

interface InventoryItem {
  id: number;

  name: string;

  category:
    ItemCategory;

  effect: string;

  count: number;

  usable: boolean;
}

// ==============================
// インベントリScene
// ==============================

export class InventoryScene extends Phaser.Scene {
  // 戻るScene
  private returnScene =
    'TestScene';

  // 現在カテゴリー
  private selectedCategory:
    | 'all'
    | ItemCategory = 'all';

  // 選択中アイテム
  private selectedItem:
    InventoryItem | null = null;

  // アイテム一覧
  private items:
    InventoryItem[] = [];

  // アイテムカード領域
  private itemArea!:
    Phaser.GameObjects.Container;

  // 詳細
  private selectedNameText!:
    Phaser.GameObjects.Text;

  private selectedCategoryText!:
    Phaser.GameObjects.Text;

  private selectedEffectText!:
    Phaser.GameObjects.Text;

  private selectedCountText!:
    Phaser.GameObjects.Text;

  // 使用ボタン
  private useButton!:
    Phaser.GameObjects.Container;

  private useButtonBackground!:
    Phaser.GameObjects.Rectangle;

  private useButtonText!:
    Phaser.GameObjects.Text;

  // メッセージ
  private messageText!:
    Phaser.GameObjects.Text;

  constructor() {
    super(
      'InventoryScene'
    );
  }

  // ==============================
  // 起動元Scene
  // ==============================

  init(
    data: {
      returnScene?: string;
    }
  ): void {
    if (
      data?.returnScene
    ) {
      this.returnScene =
        data.returnScene;
    } else {
      this.returnScene =
        'TestScene';
    }
  }

  // ==============================
  // create
  // ==============================

  create(): void {
    const width =
      this.scale.width;

    const height =
      this.scale.height;

    // ==============================
    // InventorySceneの背景自体は透明
    // ==============================

    this.cameras.main
      .setBackgroundColor(
        'rgba(0,0,0,0)'
      );

    // ==============================
    // 仮データ
    // ==============================

    this.items =
      this.createMockItems();

    this.selectedCategory =
      'all';

    this.selectedItem =
      null;

    // ==============================
    // Stageを暗くする背景
    // ==============================

    const darkBackground =
      this.add
        .rectangle(
          width / 2,
          height / 2,
          width + 200,
          height + 200,
          0x000000,
          0.55
        )
        .setScrollFactor(
          0
        )
        .setInteractive();

    // 背景クリックでは閉じない
    darkBackground.on(
      'pointerdown',
      () => {
        // 何もしない
      }
    );

    // ==============================
    // インベントリ本体
    // ==============================

    this.add
      .rectangle(
        width / 2,
        height / 2,
        920,
        610,
        0xcfe3f5
      )
      .setStrokeStyle(
        3,
        0x536878
      );

    // ==============================
    // タイトル
    // ==============================

    this.add
      .text(
        width / 2 + 330,
        105,
        'インベントリ',
        this.getTextStyle(
          30
        )
      )
      .setOrigin(
        0.5
      );

    // ==============================
    // 戻る
    // ==============================

    this.createBackButton(
      width / 2 - 370,
      105
    );

    // ==============================
    // カテゴリー
    // ==============================

    this.createCategoryButton(
      width / 2 - 270,
      190,
      'すべて',
      'all'
    );

    this.createCategoryButton(
      width / 2 - 90,
      190,
      '回復',
      'heal'
    );

    this.createCategoryButton(
      width / 2 + 120,
      190,
      '強化素材',
      'material'
    );

    this.createCategoryButton(
      width / 2 + 320,
      190,
      '重要',
      'important'
    );

    // ==============================
    // カード領域
    // ==============================

    this.itemArea =
      this.add.container(
        0,
        0
      );

    // ==============================
    // 詳細欄
    // ==============================

    this.add
      .rectangle(
        width / 2 - 170,
        535,
        500,
        180,
        0xffffff
      )
      .setStrokeStyle(
        2,
        0x536878
      );

    this.add.text(
      width / 2 - 390,
      465,
      '選択中',
      this.getTextStyle(
        20
      )
    );

    this.selectedNameText =
      this.add.text(
        width / 2 - 385,
        500,
        'アイテムを選択してください',
        this.getTextStyle(
          22
        )
      );

    this.selectedCategoryText =
      this.add.text(
        width / 2 - 385,
        535,
        '',
        this.getTextStyle(
          18
        )
      );

    this.selectedEffectText =
      this.add.text(
        width / 2 - 385,
        570,
        '',
        {
          ...this.getTextStyle(
            18
          ),

          wordWrap: {
            width: 430,
          },
        }
      );

    this.selectedCountText =
      this.add.text(
        width / 2 - 385,
        610,
        '',
        this.getTextStyle(
          18
        )
      );

    // ==============================
    // 使用
    // ==============================

    this.createUseButton(
      width / 2 + 300,
      550
    );

    // ==============================
    // メッセージ
    // ==============================

    this.messageText =
      this.add
        .text(
          width / 2 + 300,
          620,
          '',
          {
            ...this.getTextStyle(
              18
            ),

            align:
              'center',
          }
        )
        .setOrigin(
          0.5
        );

    // ==============================
    // 初期表示
    // ==============================

    this.refreshItemList();

    this.updateItemDetail();
  }

  // ==============================
  // 仮データ
  // ==============================

  private createMockItems():
    InventoryItem[] {
    return [
      {
        id: 1,

        name:
          '栄養剤',

        category:
          'heal',

        effect:
          'HPを50回復する。',

        count: 3,

        usable: true,
      },

      {
        id: 2,

        name:
          '花のしずく',

        category:
          'heal',

        effect:
          'HPを100回復する。',

        count: 2,

        usable: true,
      },

      {
        id: 3,

        name:
          '太陽の花びら',

        category:
          'material',

        effect:
          'キャラクターの強化に使用する素材。',

        count: 8,

        usable: false,
      },

      {
        id: 4,

        name:
          '謎の種',

        category:
          'important',

        effect:
          '物語に関係する重要なアイテム。',

        count: 1,

        usable: false,
      },
    ];
  }

  // ==============================
  // 戻る
  // ==============================

  private createBackButton(
    x: number,
    y: number
  ): void {
    const button =
      this.add
        .text(
          x,
          y,
          '← 戻る',
          {
            ...this.getTextStyle(
              23
            ),

            backgroundColor:
              '#ffffff',

            padding: {
              top: 10,
              bottom: 10,
              left: 18,
              right: 18,
            },
          }
        )
        .setOrigin(
          0.5
        )
        .setInteractive({
          useHandCursor: true,
        });

    button.on(
      'pointerover',
      () => {
        button
          .setBackgroundColor(
            '#eeeeee'
          );
      }
    );

    button.on(
      'pointerout',
      () => {
        button
          .setBackgroundColor(
            '#ffffff'
          );
      }
    );

    button.on(
      'pointerup',
      () => {
        this.closeInventory();
      }
    );
  }

  // ==============================
  // 閉じる
  // ==============================

  private closeInventory():
    void {
    // Stageを再開
    if (
      this.scene.manager.keys[
        this.returnScene
      ]
    ) {
      this.scene.resume(
        this.returnScene
      );
    }

    // Inventoryだけ終了
    this.scene.stop();
  }

  // ==============================
  // カテゴリー
  // ==============================

  private createCategoryButton(
    x: number,
    y: number,
    label: string,
    category:
      | 'all'
      | ItemCategory
  ): void {
    const button =
      this.add
        .text(
          x,
          y,
          `[ ${label} ]`,
          {
            ...this.getTextStyle(
              20
            ),

            backgroundColor:
              '#ffffff',

            padding: {
              top: 9,
              bottom: 9,
              left: 14,
              right: 14,
            },
          }
        )
        .setOrigin(
          0.5
        )
        .setInteractive({
          useHandCursor: true,
        });

    button.on(
      'pointerover',
      () => {
        button
          .setBackgroundColor(
            '#eaf4fb'
          );
      }
    );

    button.on(
      'pointerout',
      () => {
        button
          .setBackgroundColor(
            '#ffffff'
          );
      }
    );

    button.on(
      'pointerup',
      () => {
        this.selectedCategory =
          category;

        this.selectedItem =
          null;

        this.refreshItemList();

        this.updateItemDetail();
      }
    );
  }

  // ==============================
  // 一覧更新
  // ==============================

  private refreshItemList():
    void {
    this.itemArea
      .removeAll(
        true
      );

    const filteredItems =
      this.selectedCategory ===
      'all'
        ? this.items
        : this.items.filter(
            item =>
              item.category ===
              this.selectedCategory
          );

    filteredItems.forEach(
      (
        item,
        index
      ) => {
        const startX =
          this.scale.width /
          2 -
          300;

        const x =
          startX +
          index * 200;

        const y =
          335;

        const card =
          this.createItemCard(
            x,
            y,
            item
          );

        this.itemArea.add(
          card
        );
      }
    );

    if (
      filteredItems.length ===
      0
    ) {
      const emptyText =
        this.add
          .text(
            this.scale.width /
              2,
            330,
            'このカテゴリーのアイテムはありません',
            this.getTextStyle(
              22
            )
          )
          .setOrigin(
            0.5
          );

      this.itemArea.add(
        emptyText
      );
    }
  }

  // ==============================
  // アイテムカード
  // ==============================

  private createItemCard(
    x: number,
    y: number,
    item: InventoryItem
  ):
    Phaser.GameObjects.Container {
    const background =
      this.add
        .rectangle(
          0,
          0,
          155,
          175,
          0xffffff
        )
        .setStrokeStyle(
          2,
          0x536878
        )
        .setInteractive({
          useHandCursor: true,
        });

    const imageArea =
      this.add
        .rectangle(
          0,
          -30,
          90,
          80,
          0xeaf4fb
        )
        .setStrokeStyle(
          1,
          0x536878
        );

    const imageText =
      this.add
        .text(
          0,
          -30,
          '画像\n×？',
          {
            ...this.getTextStyle(
              18
            ),

            align:
              'center',
          }
        )
        .setOrigin(
          0.5
        );

    const nameText =
      this.add
        .text(
          0,
          40,
          item.name,
          {
            ...this.getTextStyle(
              17
            ),

            align:
              'center',
          }
        )
        .setOrigin(
          0.5
        );

    const countText =
      this.add
        .text(
          0,
          68,
          `×${item.count}`,
          this.getTextStyle(
            16
          )
        )
        .setOrigin(
          0.5
        );

    const container =
      this.add.container(
        x,
        y,
        [
          background,
          imageArea,
          imageText,
          nameText,
          countText,
        ]
      );

    background.on(
      'pointerover',
      () => {
        background
          .setFillStyle(
            0xeaf4fb
          );
      }
    );

    background.on(
      'pointerout',
      () => {
        if (
          this.selectedItem
            ?.id !==
          item.id
        ) {
          background
            .setFillStyle(
              0xffffff
            );
        }
      }
    );

    background.on(
      'pointerup',
      () => {
        this.selectedItem =
          item;

        this.updateItemDetail();

        this.refreshItemList();
      }
    );

    if (
      this.selectedItem?.id ===
      item.id
    ) {
      background
        .setFillStyle(
          0xd5e8f5
        );

      background
        .setStrokeStyle(
          3,
          0x2f6f9f
        );
    }

    return container;
  }

  // ==============================
  // 詳細更新
  // ==============================

  private updateItemDetail():
    void {
    if (
      !this.selectedItem
    ) {
      this.selectedNameText
        .setText(
          'アイテムを選択してください'
        );

      this.selectedCategoryText
        .setText(
          ''
        );

      this.selectedEffectText
        .setText(
          ''
        );

      this.selectedCountText
        .setText(
          ''
        );

      this.updateUseButton(
        false
      );

      return;
    }

    const item =
      this.selectedItem;

    this.selectedNameText
      .setText(
        item.name
      );

    this.selectedCategoryText
      .setText(
        `種類：${this.getCategoryName(
          item.category
        )}`
      );

    this.selectedEffectText
      .setText(
        `効果：${item.effect}`
      );

    this.selectedCountText
      .setText(
        `所持数：${item.count}`
      );

    this.updateUseButton(
      item.usable &&
      item.count > 0
    );
  }

  // ==============================
  // 使用ボタン
  // ==============================

  private createUseButton(
    x: number,
    y: number
  ): void {
    this.useButtonBackground =
      this.add
        .rectangle(
          0,
          0,
          210,
          65,
          0xffffff
        )
        .setStrokeStyle(
          2,
          0x333333
        )
        .setInteractive({
          useHandCursor: true,
        });

    this.useButtonText =
      this.add
        .text(
          0,
          0,
          '使用する',
          this.getTextStyle(
            22
          )
        )
        .setOrigin(
          0.5
        );

    this.useButton =
      this.add.container(
        x,
        y,
        [
          this.useButtonBackground,
          this.useButtonText,
        ]
      );

    this.useButtonBackground.on(
      'pointerup',
      () => {
        this.useSelectedItem();
      }
    );
  }

  // ==============================
  // 使用処理
  // ==============================

  private useSelectedItem():
    void {
    if (
      !this.selectedItem
    ) {
      return;
    }

    if (
      !this.selectedItem
        .usable
    ) {
      this.showMessage(
        'このアイテムは使用できません'
      );

      return;
    }

    if (
      this.selectedItem
        .count <= 0
    ) {
      this.showMessage(
        '所持していません'
      );

      return;
    }

    // ==============================
    // 現在は仮処理
    //
    // DB接続後は
    // PHP APIなどへ使用結果を送る
    // ==============================

    this.selectedItem.count--;

    this.showMessage(
      `${this.selectedItem.name}を使用しました`
    );

    this.updateItemDetail();

    this.refreshItemList();
  }

  // ==============================
  // 使用可能状態
  // ==============================

  private updateUseButton(
    enabled: boolean
  ): void {
    if (
      enabled
    ) {
      this.useButtonBackground
        .setFillStyle(
          0xffffff
        );

      this.useButtonText
        .setColor(
          '#000000'
        );

      this.useButton
        .setAlpha(
          1
        );
    } else {
      this.useButtonBackground
        .setFillStyle(
          0xdddddd
        );

      this.useButtonText
        .setColor(
          '#777777'
        );

      this.useButton
        .setAlpha(
          0.7
        );
    }
  }

  // ==============================
  // カテゴリー名
  // ==============================

  private getCategoryName(
    category:
      ItemCategory
  ): string {
    if (
      category ===
      'heal'
    ) {
      return '回復';
    }

    if (
      category ===
      'material'
    ) {
      return '強化素材';
    }

    return '重要';
  }

  // ==============================
  // メッセージ
  // ==============================

  private showMessage(
    message: string
  ): void {
    this.messageText
      .setText(
        message
      );

    this.time.delayedCall(
      1800,
      () => {
        this.messageText
          .setText(
            ''
          );
      }
    );
  }

  // ==============================
  // 共通文字
  // ==============================

  private getTextStyle(
    fontSize: number
  ):
    Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily:
        '"Yu Gothic", "Meiryo", sans-serif',

      fontSize:
        `${fontSize}px`,

      color:
        '#000000',

      padding: {
        top: 7,
        bottom: 7,
        left: 6,
        right: 6,
      },
    };
  }
}