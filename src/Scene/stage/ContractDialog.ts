// 担当：たまおちゃん｜花との契約画面
import Phaser from 'phaser';
import { playSe, stopBgm } from '../../audio/BgmManager';
import type { PrototypeFlower } from '../encyclopedia/contractPreview';

import { SCENE_KEYS } from '../sceneKeys';
import { requestShop } from '../shop/ShopApi';
import { getShopItemImageUrl } from '../shop/assets';
import { completeStage } from './StageProgress';
import { prepareFlowerContract, readFlowerContracts } from './flowerContracts';

const potionId = 12;
const potionTexture = 'contract-treatment-potion';

interface ContractSceneData {
  flower: PrototypeFlower;
  stageId: number;
  stageNumber?: string;
}

export class ContractScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.CONTRACT); }

  preload(): void {
    if (!this.textures.exists(potionTexture)) this.load.image(potionTexture, getShopItemImageUrl(potionId));
  }

  create(data: ContractSceneData): void {
    const scene = this;
    stopBgm(scene);
    playSe(scene, 'stage-clear', 0.75);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.sound.stopByKey('stage-clear'));
    const { flower, stageId, stageNumber } = data;
    const owned = Boolean(readFlowerContracts()[flower.id]);
    let count: number | undefined;
    let pendingContract: ReturnType<typeof prepareFlowerContract> | undefined;
    let contractMessage: string | undefined;
    const dialog = scene.add.container().setDepth(5000);
    dialog.add(scene.add.rectangle(640, 360, 1280, 720, 0x08111e, 1).setInteractive());

    const panel = (x: number, y: number, width: number, height: number, fill = 0x142235) => {
      const frame = scene.add.graphics({ x, y });
      frame.fillStyle(fill, 0.96).fillRoundedRect(0, 0, width, height, 10);
      frame.lineStyle(2, 0xe0bd7e).strokeRoundedRect(0, 0, width, height, 10);
      frame.lineStyle(1, 0x997947).strokeRoundedRect(5, 5, width - 10, height - 10, 6);
      for (const [cx, cy] of [[8, 8], [width - 8, 8], [8, height - 8], [width - 8, height - 8]]) {
        frame.fillStyle(0xe0bd7e).fillPoints([
          { x: cx, y: cy - 5 }, { x: cx + 5, y: cy },
          { x: cx, y: cy + 5 }, { x: cx - 5, y: cy },
        ], true);
      }
      dialog.add(frame);
    };

    const text = (x: number, y: number, value: string, size: number, wrap?: number) => {
      const label = scene.add.text(x, y, value, {
        fontFamily: '"Yu Mincho", "Meiryo", serif', fontSize: size,
        color: '#fff1d7', wordWrap: wrap ? { width: wrap, useAdvancedWrap: true } : undefined,
      });
      dialog.add(label);
      return label;
    };

    panel(30, 29, 350, 64);
    text(55, 43, '✿  花と契約する', 30);
    const glow = scene.add.graphics({ x: 450, y: 407 });
    glow.fillStyle(0xffce97, 0.12).fillEllipse(0, 0, 240, 38);
    glow.lineStyle(2, 0xffdfac, 0.8).strokeEllipse(0, 0, 174, 26);
    glow.lineStyle(1, 0xffdfac, 0.45).strokeEllipse(0, 0, 216, 34);
    const flowerArt = scene.add.image(450, 394, flower.key).setOrigin(0.5, 1);
    flowerArt.setScale(190 / Math.max(flowerArt.width, flowerArt.height));
    dialog.add([glow, flowerArt]);

    panel(800, 112, 447, 354);
    panel(822, 134, 112, 112, 0x1c3047);
    const portrait = scene.add.image(878, 190, flower.key);
    portrait.setScale(88 / Math.max(portrait.width, portrait.height));
    dialog.add(portrait);
    text(951, 136, flower.name, 28);
    text(951, 181, `${flower.season}の花　${flower.element ?? '属性未設定'}`, 17);
    text(951, 212, owned ? '契約済み' : '新しい出会い', 16).setColor('#d9bb82');
    const divider = scene.add.graphics();
    divider.lineStyle(1, 0xd9bb82).lineBetween(822, 263, 1224, 263);
    dialog.add(divider);
    text(824, 277, '契約で得られる力', 20);
    const skill = flower.skill;
    text(824, 312, skill ? `${skill.name}　〔${skill.category}〕` : 'スキル情報なし', 19, 397);
    if (skill) {
      const description = text(824, 345, skill.descriptionLevel1 ?? skill.description, 16, 397);
      if (description.height > 100) description.setScale(100 / description.height);
    }

    panel(30, 491, 743, 150);
    text(55, 514, 'この花と契約を結びますか？', 28);
    const message = text(55, 575, owned
      ? '治療薬を1つ使い、花片を1つ受け取ります。'
      : '治療薬を1つ使い、花と契約します。', 18, 685);

    const button = (y: number, label: string, primary: boolean, action: () => void) => {
      panel(822, y, 403, 60, primary ? 0x244a76 : 0x142235);
      const hit = scene.add.rectangle(1023.5, y + 30, 403, 60, 0xffffff, 0.01)
        .setInteractive({ useHandCursor: true });
      dialog.add(hit);
      const caption = text(1023.5, y + (primary ? 17 : 30), label, primary ? 18 : 23).setOrigin(0.5);
      hit.on('pointerover', () => hit.setAlpha(0.13));
      hit.on('pointerout', () => hit.setAlpha(0.01));
      hit.on('pointerup', action);
      return { hit, caption };
    };

    let busy = false;
    const finish = async (contracted: boolean) => {
      const completion = await completeStage(stageId);
      if (!contracted) {
        this.scene.start(SCENE_KEYS.SELECT_STAGE, { areaId: 1, clearReward: completion.reward });
        return;
      }
      this.scene.start(SCENE_KEYS.RESULT, {
        ...completion, stageId, stageNumber, victory: true, contractMessage, fromContract: true,
      });
    };
    const yes = button(491, 'はい ・ 治療薬 ×1', true, async () => {
      if (busy || (contractMessage === undefined && !pendingContract && (count ?? 0) < 1)) return;
      busy = true;
      message.setText('契約を確認中…').setColor('#fff1d7');
      try {
        if (!contractMessage) {
          if (!pendingContract) {
            const save = prepareFlowerContract(flower.id);
            const state = await requestShop('consume', potionId);
            pendingContract = save;
            count = state.items[String(potionId)] ?? 0;
            updateCount();
          }
          const outcome = pendingContract();
          pendingContract = undefined;
          contractMessage = outcome === 'new'
            ? `${flower.name}と契約しました`
            : `${flower.name}の花片 ×1 を獲得しました`;
        }
        await finish(true);
      } catch (error) {
        busy = false;
        message.setText(pendingContract ? '治療薬は使用済みです。「はい」で保存を再試行できます。'
          : error instanceof Error ? error.message : '契約できませんでした。').setColor('#ffbeae');
      }
    });
    const icon = scene.add.image(855, 521, potionTexture);
    icon.setScale(36 / Math.max(icon.width, icon.height));
    dialog.add(icon);
    const countLabel = text(1023.5, 533, '所持数を確認中…', 15).setOrigin(0.5);
    const updateCount = () => {
      const canConfirm = (count ?? 0) > 0 || Boolean(pendingContract || contractMessage);
      countLabel.setText(count === undefined ? '所持数を取得できません'
        : pendingContract || contractMessage ? `使用後の所持数　${count}`
        : `所持数　${count} → ${Math.max(0, count - 1)}${count === 0 ? '（不足）' : ''}`);
      yes.caption.setAlpha(canConfirm ? 1 : 0.5);
      if (canConfirm) yes.hit.setInteractive({ useHandCursor: true });
      else yes.hit.disableInteractive();
    };
    yes.hit.disableInteractive();
    yes.caption.setAlpha(0.5);
    void requestShop().then(state => {
      if (!this.sys.isActive()) return;
      count = state.items[String(potionId)] ?? 0;
      updateCount();
    }).catch(() => { if (this.sys.isActive()) updateCount(); });

    button(572, 'いいえ ・ 報酬だけ受け取る', false, async () => {
      if (busy || pendingContract || contractMessage) return;
      busy = true;
      try {
        await finish(false);
      } catch {
        busy = false;
        message.setText('クリア結果を保存できませんでした。もう一度お試しください。').setColor('#ffbeae');
      }
    });
  }
}
